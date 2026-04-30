#!/usr/bin/env node

import {
  DRAFT_QUEUE_PATH,
  IDEA_CAPTURE_PATH,
  STATE_PATH,
  appendDraftEntry,
  buildDraftEntry,
  ensureAutomationDirs,
  isDueEveryThreeDays,
  parseArgs,
  parseIdeaEntries,
  parseQueueEntries,
  readJson,
  readText,
  replaceExactBlock,
  sortIdeasForDrafts,
  todayString,
  writeJson,
  writeText,
} from './lib/content-automation.mjs';

function isEligibleIdea(entry, queueContent) {
  const status = (entry.values.Status || '').toLowerCase();
  if (!['idea', 'drafting'].includes(status)) {
    return false;
  }

  const sourceIdea = entry.values['My angle'] || entry.values.Original || '';
  return !queueContent.includes(sourceIdea);
}

export async function generateDraftQueue(options = {}) {
  await ensureAutomationDirs();

  const force = Boolean(options.force);
  const state = await readJson(STATE_PATH, {});
  if (!isDueEveryThreeDays(state, force)) {
    return {
      created: false,
      reason: 'Draft generation is not due yet.',
      nextEligibleDate: state.lastDraftGeneratedAt,
    };
  }

  const ideaCapture = await readText(IDEA_CAPTURE_PATH);
  const queueContent = await readText(DRAFT_QUEUE_PATH);
  const ideas = sortIdeasForDrafts(parseIdeaEntries(ideaCapture));
  const selectedIdea = ideas.find((entry) => isEligibleIdea(entry, queueContent));

  if (!selectedIdea) {
    return {
      created: false,
      reason: 'No eligible ideas available for drafting.',
    };
  }

  const draftEntry = buildDraftEntry(selectedIdea);
  const updatedQueue = appendDraftEntry(queueContent, draftEntry.markdown);
  await writeText(DRAFT_QUEUE_PATH, updatedQueue);

  const currentStatus = selectedIdea.values.Status || 'idea';
  const updatedIdeaBlock = selectedIdea.fullBlock.replace(`Status: ${currentStatus}`, 'Status: drafting');
  const updatedIdeaCapture = replaceExactBlock(ideaCapture, selectedIdea.fullBlock, updatedIdeaBlock);
  await writeText(IDEA_CAPTURE_PATH, updatedIdeaCapture);

  const nextState = {
    ...state,
    lastDraftGeneratedAt: new Date().toISOString(),
    lastDraftId: draftEntry.draftId,
    lastRunAt: new Date().toISOString(),
  };
  await writeJson(STATE_PATH, nextState);

  return {
    created: true,
    draftId: draftEntry.draftId,
    createdAt: todayString(),
  };
}

async function main() {
  const args = parseArgs();
  const result = await generateDraftQueue(args);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}