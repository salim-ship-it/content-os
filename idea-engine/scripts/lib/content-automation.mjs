#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = resolve(LIB_DIR, '../../../../');
export const IDEA_ENGINE_DIR = resolve(REPO_ROOT, 'content-os/idea-engine');
export const WINNING_POSTS_DIR = resolve(REPO_ROOT, 'content-os/post-database/winning-posts');
export const TMP_DIR = resolve(REPO_ROOT, '.tmp/content-automation');
export const RAW_DIR = resolve(TMP_DIR, 'raw');
export const STATE_PATH = resolve(TMP_DIR, 'state.json');
export const WATCHLIST_PATH = resolve(IDEA_ENGINE_DIR, 'watchlist.json');
export const IDEA_CAPTURE_PATH = resolve(IDEA_ENGINE_DIR, 'idea-capture.md');
export const DRAFT_QUEUE_PATH = resolve(IDEA_ENGINE_DIR, 'draft-queue.md');
export const MEMORY_PATH = resolve(WINNING_POSTS_DIR, 'memory.md');

const CATEGORY_FILE_MAP = {
  'hot take': 'hot-takes.md',
  story: 'stories.md',
  'case study': 'case-studies.md',
  educational: 'educational.md',
  insightful: 'insightful.md',
  transparency: 'transparency.md',
  announcement: 'announcements.md',
  engagement: 'engagement.md',
};

const PRIORITY_SCORE = {
  '🔴 Post within 48h': 3,
  '🟡 This week': 2,
  '🟢 Evergreen': 1,
};

const FORMAT_SCORE = {
  'hot take': 5,
  educational: 4,
  story: 4,
  insightful: 3,
  transparency: 2,
  'case study': 2,
  announcement: 1,
  engagement: 1,
};

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};

  const normalizeKey = (value) => value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = normalizeKey(token.slice(2));
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureAutomationDirs() {
  await mkdir(RAW_DIR, { recursive: true });
}

export async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

export async function writeText(filePath, content) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

export async function readJson(filePath, fallback = null) {
  if (!(await fileExists(filePath))) {
    return fallback;
  }

  const raw = await readText(filePath);
  return JSON.parse(raw);
}

export async function writeJson(filePath, value) {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function loadEnv() {
  const envPaths = [resolve(REPO_ROOT, '.env.local'), resolve(REPO_ROOT, '.env')];

  for (const envPath of envPaths) {
    if (!(await fileExists(envPath))) {
      continue;
    }

    const raw = await readText(envPath);
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Load the watchlist. Accepts both the legacy schema ({creator, profileUrl, maxPosts})
 * and the new multi-source schema ({kind, name, url, maxPosts}).
 *
 * @param {object} options
 * @param {"linkedin"|"reddit"|"newsletter"} [options.kind] — filter by source kind
 * @returns {Promise<Array<{creator: string, profileUrl: string, maxPosts: number, kind: string}>>}
 */
export async function loadWatchlist(options = {}) {
  const watchlist = await readJson(WATCHLIST_PATH, []);

  return watchlist
    .filter((entry) => entry.enabled !== false)
    .map((entry) => ({
      // New schema fields (canonical)
      kind: entry.kind || 'linkedin',
      name: entry.name || entry.creator || 'Unknown',
      url: entry.url || entry.profileUrl || '',
      maxPosts: Number(entry.maxPosts || 50),
      note: entry.note || '',
      winnerThreshold: entry.winnerThreshold || null,
      // Legacy aliases for backward compatibility with old scripts
      creator: entry.name || entry.creator || 'Unknown',
      profileUrl: entry.url || entry.profileUrl || '',
    }))
    .filter((entry) => {
      if (options.kind) return entry.kind === options.kind;
      return true;
    });
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function todayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function normalizeWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function trimSmart(value, maxLength = 160) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function extractFirstLine(content) {
  return trimSmart((content || '').split(/\r?\n/).find((line) => line.trim()) || 'Untitled post');
}

function extractImageUrl(rawPost) {
  const candidates = [];
  const push = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'string') candidates.push(item);
        else if (item && typeof item === 'object') {
          if (item.url) candidates.push(item.url);
          else if (item.imageUrl) candidates.push(item.imageUrl);
          else if (item.src) candidates.push(item.src);
        }
      }
    } else if (typeof val === 'string') {
      candidates.push(val);
    } else if (val && typeof val === 'object') {
      if (val.url) candidates.push(val.url);
      else if (val.imageUrl) candidates.push(val.imageUrl);
    }
  };
  push(rawPost.postImages);
  push(rawPost.images);
  push(rawPost.imageUrls);
  push(rawPost.image);
  push(rawPost.imageUrl);
  push(rawPost.media);
  push(rawPost.thumbnail);
  push(rawPost.thumbnails);
  push(rawPost.attachments);
  push(rawPost.postVideos);
  push(rawPost.videos);
  if (rawPost.post && typeof rawPost.post === 'object') push(rawPost.post.images);
  return candidates.find((u) => typeof u === 'string' && /^https?:\/\//.test(u)) || '';
}

export function normalizePost(rawPost, overrides = {}) {
  const engagement = rawPost.engagement || {};
  const creator = overrides.creator || rawPost.author?.fullName || rawPost.author?.name || 'Unknown creator';
  const rawDate = rawPost.postedAt?.date || todayString();

  return {
    creator,
    content: rawPost.content || '',
    firstLine: extractFirstLine(rawPost.content || ''),
    date: String(rawDate).slice(0, 10),
    likes: Number(engagement.likes || 0),
    comments: Number(engagement.comments || 0),
    shares: Number(engagement.shares || 0),
    linkedinUrl: rawPost.linkedinUrl || rawPost.url || '',
    imageUrl: extractImageUrl(rawPost),
  };
}

export function isWinningPost(post) {
  return post.likes >= 100 || post.comments >= 70;
}

export function classifyPost(post) {
  const text = normalizeWhitespace(post.content).toLowerCase();
  const firstLine = post.firstLine.toLowerCase();

  if (/when i was|my mom|my dad|i was \d+|years ago|as a kid|i remember|mom /i.test(text)) {
    return 'story';
  }

  if (/case study|teardown|here's exactly|we did|campaign|cold email|screenshots|audit|breakdown/i.test(text)) {
    return 'case study';
  }

  if (/clay pro costs|that's \$[\d,]+\/year|sales industry is broken|\bis broken\b|\bdead\b|\boverrated\b|\bwrong\b|\bnobody\b|\bmost people\b|\beveryone\b|\bred flag\b/i.test(firstLine) || /broken|dead|overrated|underpriced|wrong|nobody|most people|everyone|fastest way to kill|red flag/i.test(text)) {
    return 'hot take';
  }

  if (/i built a free claude code skill|\bhow to\b|\bplaybook\b|\bframework\b|\bskills\b|\bsteps\b|\bmistakes\b|^\d+\b|\bresources\b/i.test(text) || /^\d+/.test(firstLine)) {
    return 'educational';
  }

  if (/^just in:|\braised\b|\blaunched\b|\bannounce\b|i just built the playbook/i.test(firstLine) || /raised|launch|launched|announce|announcing|just built the playbook|just in/i.test(text)) {
    return 'announcement';
  }

  if (/day\s*\d+\/\d+|building in public|build in public|mrr|arr|revenue|subscription in public|publicly/i.test(text)) {
    return 'transparency';
  }

  if (/leader|future|trend|industry|shift|category|what changed|the next era/i.test(text)) {
    return 'insightful';
  }

  return 'engagement';
}

export function categoryFilePath(category) {
  return resolve(WINNING_POSTS_DIR, CATEGORY_FILE_MAP[category] || CATEGORY_FILE_MAP.engagement);
}

export function inferTopic(post, category) {
  const text = normalizeWhitespace(post.content).toLowerCase();

  if (/clay/i.test(text)) {
    return 'Clay, GTM tooling, AI workflow design';
  }

  if (/claude code|agentic/i.test(text)) {
    return 'Claude Code, GTM engineering, automation workflows';
  }

  if (category === 'hot take') {
    return 'GTM systems, process failure, contrarian operating view';
  }

  if (category === 'story') {
    return 'Personal backstory, identity, professional lesson';
  }

  if (category === 'educational') {
    return 'Playbooks, workflows, practical GTM steps';
  }

  if (category === 'transparency') {
    return 'Build in public, business progress, metrics';
  }

  if (category === 'announcement') {
    return 'Launch, industry news, market positioning';
  }

  return 'GTM, AI, and execution strategy';
}

export function inferWhyItWorked(post, category) {
  if (category === 'hot take') {
    return 'Sharp stance in the first line makes readers choose a side immediately. The tension drives comments because people want to agree, qualify, or argue.';
  }

  if (category === 'story') {
    return 'Personal setup makes the post feel real instead of polished. Emotional specificity raises read-through and reshares.';
  }

  if (category === 'educational') {
    return 'Clear utility plus a concrete structure makes the post saveable. The hook promises a usable takeaway instead of vague inspiration.';
  }

  if (category === 'transparency') {
    return 'Build-in-public framing creates curiosity because readers want the numbers, constraints, and tradeoffs. Honesty makes the update credible.';
  }

  if (category === 'announcement') {
    return 'The post ties a piece of news to a broader category shift, so it reads as signal rather than self-promotion.';
  }

  if (category === 'case study') {
    return 'Specific example makes the lesson tangible. Readers can compare it to their own work and jump into the comments with their version.';
  }

  return 'It combines a strong first-line claim with a topic the audience already feels tension around, which increases both dwell time and replies.';
}

export function buildWinningPostBlock(post, category) {
  const lines = [
    `### ${post.firstLine}`,
    `- **Creator:** ${post.creator}`,
    `- **Date:** ${post.date}`,
    `- **Likes:** ${post.likes} | **Comments:** ${post.comments} | **Reposts:** ${post.shares}`,
    `- **Topic:** ${inferTopic(post, category)}`,
    `- **Why it worked:** ${inferWhyItWorked(post, category)}`,
    `- **Link:** ${post.linkedinUrl || 'N/A'}`,
  ];

  return lines.join('\n');
}

export function prependAfterDivider(content, block) {
  if (content.includes(`\n---\n`)) {
    return content.replace(`\n---\n`, `\n---\n\n${block}\n\n`);
  }

  return `${content.trimEnd()}\n\n${block}\n`;
}

export function parseKeyValueBlock(block) {
  const values = {};

  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    values[match[1].trim()] = match[2].trim();
  }

  return values;
}

export function parseIdeaEntries(content) {
  const entries = [];
  const pattern = /(^|\n)---\n(Date:[\s\S]*?)(?=(\n---\nDate:|$))/g;

  for (const match of content.matchAll(pattern)) {
    const body = match[2].trimEnd();
    const fullBlock = `---\n${body}`;
    const values = parseKeyValueBlock(body);
    entries.push({
      fullBlock,
      values,
    });
  }

  return entries;
}

export function appendIdeaBlocks(content, blocks) {
  const marker = '<!-- Add new ideas below. Most recent at the top. -->';
  const payload = blocks.join('\n\n');

  if (content.includes(marker)) {
    return content.replace(marker, `${marker}\n\n${payload}`);
  }

  return `${content.trimEnd()}\n\n${payload}\n`;
}

export function replaceExactBlock(content, oldBlock, newBlock) {
  return content.replace(oldBlock, newBlock);
}

export function buildIdeaAngle(post, category) {
  const text = normalizeWhitespace(post.content).toLowerCase();

  if (category === 'hot take') {
    if (/tool|stack|clay/i.test(text)) {
      return 'Most SaaS teams do not have a tooling problem. They have a broken GTM system, and adding software to it only hides the failure.';
    }

    return 'The issue is usually not the people doing outbound. The issue is the system they were dropped into.';
  }

  if (category === 'educational') {
    if (/claude code|skill|workflow/i.test(text)) {
      return 'The real unlock is not another AI tool list. It is the small set of Claude Code workflows that remove manual GTM busywork end to end.';
    }

    return 'Turn the lesson into a short playbook your audience can actually copy this week.';
  }

  if (category === 'transparency') {
    return 'AI made it cheaper to build software, but the hard part is still distribution, taste, and owning the GTM result.';
  }

  if (category === 'announcement') {
    return 'Use the news to explain where GTM engineering is going next, not just what launched.';
  }

  if (category === 'story') {
    return 'Use a personal moment to show why most GTM advice misses the real constraint in execution.';
  }

  if (category === 'case study') {
    return 'Break down one real workflow and show what changed once the system handled the handoffs automatically.';
  }

  return 'Pull out the underlying shift and make it specific to lean SaaS teams running GTM without a bloated stack.';
}

export function buildIdeaBlock(post, category) {
  const priority = post.likes >= 500 || post.comments >= 100 ? '🔴 Post within 48h' : '🟡 This week';
  const format = category === 'hot take' ? 'hot take' : category;
  const original = `"${post.firstLine}"${post.linkedinUrl ? ` — ${post.linkedinUrl}` : ''}`;
  const lines = [
    '---',
    `Date: ${todayString()}`,
    `Source: ${post.creator} LinkedIn via Apify`,
    `Original: ${original}`,
    `My angle: ${buildIdeaAngle(post, category)}`,
    `Format: ${format}`,
    'Status: idea',
    `Priority: ${priority}`,
  ];

  return lines.join('\n');
}

export function priorityValue(priority) {
  return PRIORITY_SCORE[priority] || 0;
}

export function buildDraftHook(idea) {
  const angle = idea.values['My angle'] || '';
  const format = (idea.values.Format || '').toLowerCase();

  if (format === 'hot take' && /tool|stack|system/i.test(angle)) {
    return 'The fastest way to kill pipeline is to keep adding tools to a broken system.';
  }

  if (format === 'hot take' && /people doing outbound|system/i.test(angle)) {
    return 'Your pipeline problem is probably not your reps.';
  }

  if (format === 'educational' && /claude code/i.test(angle)) {
    return '5 Claude Code workflows that remove GTM busywork.';
  }

  if (format === 'transparency') {
    return 'AI made building cheaper. It did not make GTM easier.';
  }

  if (format === 'story') {
    return 'Most GTM advice sounds smart until you have to run it yourself.';
  }

  return trimSmart(angle.replace(/^The real unlock is /i, '').replace(/^Use /i, ''), 70);
}

export function draftTemplateForIdea(idea) {
  const format = (idea.values.Format || '').toLowerCase();
  const angle = idea.values['My angle'] || '';
  const hook = buildDraftHook(idea);

  if (format === 'hot take') {
    return [
      hook,
      '',
      'Most teams think the fix is another tool.',
      '',
      'It is not.',
      '',
      'The real problem is the handoff between targeting, signal detection, messaging, and execution.',
      '',
      'When that system is broken, adding more software just makes the mess faster.',
      '',
      'You end up with:',
      '- more enrichment',
      '- more dashboards',
      '- more prompts',
      '- the same weak pipeline',
      '',
      'Good GTM engineering does the opposite.',
      '',
      'It removes steps.',
      'It encodes judgment.',
      'It makes the system carry the work.',
      '',
      'That is why the teams winning right now are not the ones with the biggest stack.',
      '',
      'They are the ones with the cleanest operating system.',
      '',
      'Agree or disagree?',
    ].join('\n');
  }

  if (format === 'educational') {
    return [
      hook,
      '',
      'If I had to rebuild a lean GTM motion today, I would start here:',
      '',
      '1. Pull account and people data automatically.',
      '2. Score signal strength before touching copy.',
      '3. Generate the angle from the signal, not from a blank page.',
      '4. Push the draft into a review queue, not a doc graveyard.',
      '5. Track what got approved, ignored, and published.',
      '',
      'Most teams automate steps.',
      'Very few automate the handoffs between steps.',
      '',
      'That is where time disappears.',
      'That is also where Claude Code becomes useful.',
      '',
      'Not as a toy.',
      'As operating leverage.',
      '',
      'Save this if you are rebuilding your GTM stack this quarter.',
    ].join('\n');
  }

  if (format === 'transparency') {
    return [
      hook,
      '',
      'A lot of people saw AI drop the cost of building and assumed distribution would get easier too.',
      '',
      'It did not.',
      '',
      'Code is cheaper.',
      'Execution is faster.',
      'But taste, positioning, and GTM judgment are still scarce.',
      '',
      'You can build more now.',
      'You still need to decide what is worth shipping, who it is for, and how it reaches them.',
      '',
      'That is the part I think most founders still underestimate.',
      '',
      'The moat moved.',
      'It did not disappear.',
      '',
      'What part of GTM still feels stubbornly manual for you?',
    ].join('\n');
  }

  if (format === 'story') {
    return [
      hook,
      '',
      'The older I get, the less I trust polished GTM advice.',
      '',
      'The advice usually sounds great in a deck.',
      'Then you try to run it inside a real team with messy data, half-finished systems, and too many tools.',
      '',
      'That is when you find out what is real.',
      '',
      'Most of the breakthrough is not another tactic.',
      'It is reducing friction so the team can actually execute.',
      '',
      'That is the lens I use now.',
      '',
      'Less theory.',
      'More operating truth.',
      '',
      'What is one piece of advice you stopped believing after running GTM yourself?',
    ].join('\n');
  }

  return [
    buildDraftHook(idea),
    '',
    trimSmart(angle, 180),
    '',
    'The interesting part is not the headline.',
    'It is what this changes in day-to-day execution.',
    '',
    'That is where the leverage is.',
  ].join('\n');
}

export function buildDraftEntry(idea) {
  const createdAt = todayString();
  const reviewOn = todayString(addDays(new Date(), 3));
  const draftId = `draft-${createdAt.replace(/-/g, '')}-${slugify(idea.values['My angle'] || idea.values.Original || 'idea').slice(0, 24)}`;
  const hook = buildDraftHook(idea);
  const draft = draftTemplateForIdea(idea);

  const lines = [
    `### ${draftId}`,
    `- **Created:** ${createdAt}`,
    `- **Review On:** ${reviewOn}`,
    '- **Status:** pending approval',
    `- **Format:** ${idea.values.Format || 'insightful'}`,
    `- **Source:** ${idea.values.Source || 'Unknown source'}`,
    `- **Source idea:** ${idea.values['My angle'] || idea.values.Original || ''}`,
    `- **Hook:** ${hook}`,
    '- **Action:** Approve or reject this draft.',
    '- **Post:**',
    '',
    draft,
  ];

  return {
    draftId,
    markdown: lines.join('\n'),
  };
}

export function parseQueueEntries(content) {
  const entries = [];
  const pattern = /(^|\n)### (draft-[^\n]+)\n([\s\S]*?)(?=(\n### draft-|$))/g;

  for (const match of content.matchAll(pattern)) {
    const block = `### ${match[2]}\n${match[3].trimEnd()}`;
    const statusMatch = block.match(/- \*\*Status:\*\* (.+)/);
    entries.push({
      draftId: match[2],
      block,
      status: statusMatch ? statusMatch[1].trim() : 'unknown',
    });
  }

  return entries;
}

export function appendDraftEntry(content, entry) {
  const marker = '<!-- New drafts are inserted below. Most recent at the top. -->';

  if (content.includes(marker)) {
    return content.replace(marker, `${marker}\n\n${entry}`);
  }

  return `${content.trimEnd()}\n\n${entry}\n`;
}

export function isDueEveryThreeDays(state, force = false) {
  if (force) {
    return true;
  }

  const lastGeneratedAt = state?.lastDraftGeneratedAt;
  if (!lastGeneratedAt) {
    return true;
  }

  const lastDate = new Date(lastGeneratedAt);
  const nextDate = addDays(lastDate, 3);
  return new Date() >= nextDate;
}

export function sortIdeasForDrafts(entries) {
  return [...entries].sort((left, right) => {
    const priorityGap = priorityValue(right.values.Priority) - priorityValue(left.values.Priority);
    if (priorityGap !== 0) {
      return priorityGap;
    }

    const leftFormatScore = FORMAT_SCORE[(left.values.Format || '').toLowerCase()] || 0;
    const rightFormatScore = FORMAT_SCORE[(right.values.Format || '').toLowerCase()] || 0;
    const formatGap = rightFormatScore - leftFormatScore;
    if (formatGap !== 0) {
      return formatGap;
    }

    return String(right.values.Date || '').localeCompare(String(left.values.Date || ''));
  });
}