#!/usr/bin/env node

import {
  IDEA_CAPTURE_PATH,
  slugify,
  categoryFilePath,
  classifyPost,
  buildIdeaBlock,
  buildWinningPostBlock,
  appendIdeaBlocks,
  ensureAutomationDirs,
  isWinningPost,
  loadWatchlist,
  normalizePost,
  parseArgs,
  prependAfterDivider,
  readJson,
  readText,
  todayString,
  writeText,
} from './lib/content-automation.mjs';

function inferCreatorFromInputPath(inputPath, watchlist) {
  const normalizedInput = String(inputPath || '').toLowerCase();
  const matched = watchlist.find((entry) => normalizedInput.includes(slugify(entry.creator)));
  return matched?.creator || null;
}

export async function processWinningPosts(options = {}) {
  await ensureAutomationDirs();

  const watchlist = await loadWatchlist();
  const creatorLookup = new Map(watchlist.map((entry) => [entry.profileUrl, entry.creator]));
  const inferredCreator = options.creator || inferCreatorFromInputPath(options.input, watchlist);

  if (!options.input) {
    throw new Error('Missing --input path for the raw Apify JSON file.');
  }

  const rawPosts = await readJson(options.input, []);
  const ideaCapture = await readText(IDEA_CAPTURE_PATH);
  let nextIdeaCapture = ideaCapture;

  const newIdeaBlocks = [];
  const categoryUpdates = new Map();
  const stats = {
    scanned: 0,
    winningPosts: 0,
    insertedPosts: 0,
    insertedIdeas: 0,
  };

  for (const rawPost of rawPosts) {
    const creator = inferredCreator || creatorLookup.get(rawPost.profileUrl) || rawPost.author?.fullName || rawPost.author?.name || 'Unknown creator';
    const post = normalizePost(rawPost, { creator });
    stats.scanned += 1;

    if (!isWinningPost(post) || !post.linkedinUrl) {
      continue;
    }

    stats.winningPosts += 1;
    const category = classifyPost(post);
    const filePath = categoryFilePath(category);
    const existingCategoryContent = categoryUpdates.get(filePath) || (await readText(filePath));

    const alreadyExists = existingCategoryContent.includes(post.linkedinUrl) || existingCategoryContent.includes(`### ${post.firstLine}`);

    if (!alreadyExists) {
      const updatedCategoryContent = prependAfterDivider(existingCategoryContent, buildWinningPostBlock(post, category));
      categoryUpdates.set(filePath, updatedCategoryContent);
      stats.insertedPosts += 1;

      const alreadyLoggedIdea = nextIdeaCapture.includes(post.linkedinUrl);
      if (!alreadyLoggedIdea && newIdeaBlocks.length < Number(options.maxIdeas || 3)) {
        newIdeaBlocks.push(buildIdeaBlock(post, category));
      }
    }
  }

  if (newIdeaBlocks.length > 0) {
    nextIdeaCapture = appendIdeaBlocks(nextIdeaCapture, newIdeaBlocks);
    stats.insertedIdeas = newIdeaBlocks.length;
  }

  for (const [filePath, content] of categoryUpdates.entries()) {
    await writeText(filePath, content);
  }

  if (nextIdeaCapture !== ideaCapture) {
    await writeText(IDEA_CAPTURE_PATH, nextIdeaCapture);
  }

  return {
    ...stats,
    processedAt: todayString(),
  };
}

async function main() {
  const args = parseArgs();
  const result = await processWinningPosts(args);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}