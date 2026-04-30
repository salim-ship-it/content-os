#!/usr/bin/env node

/**
 * voice-hook.mjs — Claude Code Stop hook for voice signal capture
 *
 * Runs after every assistant turn in this repo. Reads the conversation
 * transcript via stdin (Claude Code passes a JSON payload), scans the
 * recent turns for voice signals using regex, and appends matches to:
 *   content-os/foundation/learning-log.md
 *
 * Detection uses 8 categories:
 *   - vocabulary    (don't say X, never write Y)
 *   - rhythm        (more punchy, longer breath, shorter sentences)
 *   - hard-no       (banned phrases the user explicitly rejects)
 *   - belief        (assertions starting with "I believe", "the truth is")
 *   - hook-pattern  (corrections about how posts open)
 *   - ending-pattern (corrections about how posts end)
 *   - tone          (more humor, less formal, etc.)
 *   - audience-detail (specifics about ICP / who you're writing for)
 *
 * SAFETY:
 *   - Times out after 4 seconds (Claude Code has a 5s default)
 *   - Never blocks the parent process (writes asynchronously)
 *   - Errors are silent (logged to .tmp/voice-hook-errors.log)
 *   - Self-disables after 5 consecutive failures
 *
 * To debug: VOICE_HOOK_DEBUG=1 node voice-hook.mjs < test-input.json
 */

import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../../../');
const LOG_FILE = resolve(REPO_ROOT, 'content-os/foundation/learning-log.md');
const ERROR_LOG = resolve(REPO_ROOT, '.tmp/voice-hook-errors.log');
const STATE_FILE = resolve(REPO_ROOT, '.tmp/voice-hook-state.json');
const DEBUG = process.env.VOICE_HOOK_DEBUG === '1';
const MAX_FAILURES = 5;
const TIMEOUT_MS = 4000;

// ---------- Detection patterns ----------

// Each pattern: regex with one capture group for the "signal", or null if the
// whole match is the signal. The category is the key.
const PATTERNS = {
  vocabulary: [
    // "don't say X" / "never say X" / "never write X"
    /(?:don'?t|never|do not)\s+(?:say|write|use|type)\s+["'`]?([^"'`\n.,!?]{2,80})["'`]?/gi,
    // "stop saying X" / "stop writing X"
    /stop\s+(?:saying|writing|using)\s+["'`]?([^"'`\n.,!?]{2,80})["'`]?/gi,
    // "no X" / "no more X" — only if very specific
    /\bno\s+more\s+["'`]([^"'`\n]{2,80})["'`]/gi,
    // "I'd never say X" / "I would never say X"
    /(?:I'?d|I\s+would)\s+never\s+(?:say|write|use)\s+["'`]?([^"'`\n.,!?]{2,80})["'`]?/gi,
  ],
  'hard-no': [
    // "banned" or "ban X" or "kill X"
    /(?:banned?|kill|drop|cut)\s+["'`]([^"'`\n]{2,80})["'`]/gi,
    // "I'd never write that" — full sentence captured
    /(?:I'?d|I\s+would)\s+never\s+write\s+(?:that|this)/gi,
    // "this sounds like AI" / "too AI" / "AI slop"
    /(?:sounds?\s+like\s+ai|too\s+ai|ai\s+slop)/gi,
  ],
  rhythm: [
    // "more punchy" / "make it punchier"
    /(?:more|make\s+it)\s+(?:punchier?|tight(?:er)?|short(?:er)?)/gi,
    // "shorter sentences" / "longer breath"
    /(?:shorter|longer|more)\s+(?:sentences?|paragraphs?|breath)/gi,
    // "let it breathe"
    /let\s+it\s+breathe/gi,
    // "break it up"
    /break\s+(?:it|this)\s+up/gi,
  ],
  belief: [
    // "I believe X" — full clause
    /\bI\s+believe\s+(?:that\s+)?([^.\n]{10,200})/gi,
    // "the truth is X"
    /\bthe\s+truth\s+is\s+(?:that\s+)?([^.\n]{10,200})/gi,
    // "what I'm saying is X"
    /what\s+I'?m\s+(?:saying|getting\s+at)\s+is\s+(?:that\s+)?([^.\n]{10,200})/gi,
    // "my point is X"
    /my\s+(?:point|whole\s+point)\s+is\s+(?:that\s+)?([^.\n]{10,200})/gi,
  ],
  'hook-pattern': [
    // "the hook should X"
    /(?:the\s+)?hooks?\s+(?:should|needs?\s+to|must|has\s+to)\s+([^.\n]{5,150})/gi,
    // "open with X" / "start with X"
    /(?:open|start)\s+with\s+(?:a\s+)?([a-z][^.\n]{5,150})/gi,
    // "the first line"
    /the\s+first\s+line\s+(?:should|must|needs?\s+to|has\s+to)\s+([^.\n]{5,150})/gi,
  ],
  'ending-pattern': [
    // "end with X" / "ending should X"
    /(?:end|ending)\s+(?:with|should)\s+([^.\n]{5,150})/gi,
    // "the last line"
    /the\s+last\s+line\s+(?:should|must|needs?\s+to)\s+([^.\n]{5,150})/gi,
    // "close with X"
    /close\s+with\s+(?:a\s+)?([a-z][^.\n]{5,150})/gi,
  ],
  tone: [
    // "more X tone" / "less X tone" where X is funny/serious/casual/etc
    /(?:more|less)\s+(funny|serious|casual|formal|humble|aggressive|direct|soft|hard)/gi,
    // "drop the X tone"
    /drop\s+the\s+(formal|corporate|polished|fake)\s+tone/gi,
    // "humor" mentions
    /\b(?:add|more|less)\s+humor/gi,
  ],
  'audience-detail': [
    // "my audience X" / "the reader X"
    /(?:my\s+audience|the\s+reader|my\s+ICP|the\s+ICP)\s+(?:is|are|wants?|needs?)\s+([^.\n]{10,200})/gi,
    // "I write for X"
    /\bI\s+write\s+for\s+([^.\n]{5,150})/gi,
    // "the people I'm targeting X"
    /the\s+people\s+I'?m\s+(?:targeting|writing\s+for|reaching)\s+([^.\n]{5,150})/gi,
  ],
};

// ---------- Helpers ----------

function debug(...args) {
  if (DEBUG) console.error('[voice-hook]', ...args);
}

async function ensureDir(filePath) {
  await fs.mkdir(dirname(filePath), { recursive: true });
}

async function readState() {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { failures: 0, disabled: false, lastError: null };
  }
}

async function writeState(state) {
  await ensureDir(STATE_FILE);
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

async function logError(error) {
  try {
    await ensureDir(ERROR_LOG);
    const line = `${new Date().toISOString()} ${error.stack || error.message || error}\n`;
    await fs.appendFile(ERROR_LOG, line);
  } catch {
    // give up
  }
}

async function ensureLogFile() {
  try {
    await fs.access(LOG_FILE);
  } catch {
    await ensureDir(LOG_FILE);
    const header = [
      '# Voice Learning Log',
      '',
      'Auto-captured signals from Claude Code sessions in this repo.',
      'Each entry is something the user said that suggests how their voice should sound.',
      '',
      'Categories:',
      '- **vocabulary**: words/phrases to use or avoid',
      '- **hard-no**: explicit rejections',
      '- **rhythm**: sentence and paragraph pacing',
      '- **belief**: assertions about how things work',
      '- **hook-pattern**: how posts should open',
      '- **ending-pattern**: how posts should end',
      '- **tone**: humor, formality, edge',
      '- **audience-detail**: who the writing is for',
      '',
      'Run `/refresh-voice` (when built) to merge new signals into voice-profile.md.',
      '',
      '---',
      '',
    ].join('\n');
    await fs.writeFile(LOG_FILE, header);
  }
}

// ---------- Detection ----------

// Stopwords that are nearly always noise when captured by themselves.
// If a vocabulary or hard-no signal IS one of these, skip it.
const STOPWORDS = new Set([
  'that', 'this', 'it', 'them', 'those', 'these', 'these things', 'that one',
  'x', 'y', 'something', 'anything', 'stuff', 'things', 'thing',
  'the same', 'that too', 'this one', 'all of them', 'any of it',
]);

function extractSignals(text) {
  const signals = [];
  for (const [category, patterns] of Object.entries(PATTERNS)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0; // reset stateful regex
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const captured = (match[1] || match[0]).trim();
        // Length filter
        if (captured.length < 3) continue;
        if (captured.length > 220) continue;
        // Stopword filter (only for vocabulary / hard-no — other categories
        // legitimately use phrases like "that the truth is X")
        if (
          (category === 'vocabulary' || category === 'hard-no') &&
          STOPWORDS.has(captured.toLowerCase())
        ) {
          continue;
        }
        signals.push({
          category,
          signal: captured,
          context: match[0].slice(0, 200),
        });
      }
    }
  }
  return signals;
}

// ---------- Transcript reading ----------

/**
 * Claude Code passes a JSON payload via stdin on Stop hook.
 * Shape (as of 2026): { session_id, transcript_path, ... }
 *
 * The transcript is a JSONL file with one event per line. We read the
 * last ~10 user turns and scan them.
 */
async function readUserTurns(stdinPayload) {
  const data = JSON.parse(stdinPayload);
  const transcriptPath = data.transcript_path;
  if (!transcriptPath) {
    debug('no transcript_path in stdin payload');
    return [];
  }

  const raw = await fs.readFile(transcriptPath, 'utf8');
  const lines = raw.split('\n').filter(Boolean);
  const userTexts = [];

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      // Look for user messages — Claude Code uses different shapes across versions
      // Check both legacy and current event structures
      if (event.type === 'user' || event.role === 'user') {
        const content = event.message?.content || event.content || '';
        if (typeof content === 'string') {
          userTexts.push(content);
        } else if (Array.isArray(content)) {
          for (const part of content) {
            if (part.type === 'text' && part.text) userTexts.push(part.text);
          }
        }
      }
    } catch {
      // skip malformed lines
    }
  }

  // Only the most recent user turn — we don't want to re-scan history every time
  return userTexts.slice(-1);
}

// ---------- Append entry ----------

function buildEntry(signals, sessionId) {
  const ts = new Date().toISOString();
  const lines = [`### ${ts}`];
  if (sessionId) lines.push(`*session: ${sessionId.slice(0, 8)}*`);
  lines.push('');
  for (const s of signals) {
    lines.push(`- **${s.category}**: ${s.signal}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function appendEntry(entry) {
  await ensureLogFile();
  await fs.appendFile(LOG_FILE, entry);
}

// ---------- Main ----------

async function main() {
  // Check disabled state
  const state = await readState();
  if (state.disabled) {
    debug('hook is self-disabled after repeated failures');
    return;
  }

  // Read stdin (with timeout)
  const stdinPromise = new Promise((resolveStdin) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolveStdin(data));
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('hook timed out')), TIMEOUT_MS),
  );

  let stdinPayload;
  try {
    stdinPayload = await Promise.race([stdinPromise, timeoutPromise]);
  } catch (error) {
    await logError(error);
    return;
  }

  if (!stdinPayload?.trim()) {
    debug('empty stdin');
    return;
  }

  // Parse session id for logging
  let sessionId = null;
  try {
    sessionId = JSON.parse(stdinPayload).session_id;
  } catch {
    // ignore
  }

  // Get the most recent user turn
  let userTurns;
  try {
    userTurns = await readUserTurns(stdinPayload);
  } catch (error) {
    await logError(error);
    state.failures += 1;
    if (state.failures >= MAX_FAILURES) {
      state.disabled = true;
      state.lastError = error.message;
    }
    await writeState(state);
    return;
  }

  if (userTurns.length === 0) {
    debug('no user turns found');
    return;
  }

  // Extract signals from the most recent turn
  const allSignals = [];
  for (const turn of userTurns) {
    allSignals.push(...extractSignals(turn));
  }

  if (allSignals.length === 0) {
    debug('no signals detected');
    return;
  }

  // Dedupe signals within this turn
  const seen = new Set();
  const uniqueSignals = allSignals.filter((s) => {
    const key = `${s.category}:${s.signal.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  debug(`captured ${uniqueSignals.length} signals`);
  await appendEntry(buildEntry(uniqueSignals, sessionId));

  // Reset failure counter on success
  if (state.failures > 0) {
    state.failures = 0;
    await writeState(state);
  }
}

main().catch(async (error) => {
  await logError(error);
  // Always exit 0 — never break the parent session
  process.exit(0);
});
