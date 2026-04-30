#!/usr/bin/env node

import {
  DRAFT_QUEUE_PATH,
  parseQueueEntries,
  readText,
  writeText,
} from './lib/content-automation.mjs';

const VALID_ACTIONS = new Set(['approved', 'rejected', 'posted', 'pending approval']);

export async function reviewDraftQueue(action, draftId) {
  if (!VALID_ACTIONS.has(action)) {
    throw new Error(`Invalid action: ${action}. Use approved, rejected, posted, or "pending approval".`);
  }

  if (!draftId) {
    throw new Error('Missing draft id.');
  }

  const queueContent = await readText(DRAFT_QUEUE_PATH);
  const entry = parseQueueEntries(queueContent).find((candidate) => candidate.draftId === draftId);

  if (!entry) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  const updatedBlock = entry.block.replace(/- \*\*Status:\*\* .+/, `- **Status:** ${action}`);
  const updatedQueue = queueContent.replace(entry.block, updatedBlock);
  await writeText(DRAFT_QUEUE_PATH, updatedQueue);

  return {
    draftId,
    status: action,
  };
}

async function main() {
  const action = process.argv[2];
  const draftId = process.argv[3];
  const result = await reviewDraftQueue(action, draftId);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}