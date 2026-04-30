#!/usr/bin/env node

import { pullLinkedinPosts } from './pull-linkedin-posts.mjs';
import { processWinningPosts } from './process-winning-posts.mjs';
import { generateDraftQueue } from './generate-draft-queue.mjs';

async function main() {
  const pulls = await pullLinkedinPosts({});
  const processingResults = [];

  for (const pull of pulls) {
    const processed = await processWinningPosts({
      input: pull.outputPath,
      creator: pull.creator,
      maxIdeas: 3,
    });

    processingResults.push({
      creator: pull.creator,
      ...processed,
    });
  }

  const draftResult = await generateDraftQueue({});

  console.log(JSON.stringify({
    pulls,
    processingResults,
    draftResult,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});