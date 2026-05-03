// One-shot script to run the post-image archiver locally.
// Use: npx tsx scripts/run-archiver.ts
import { archivePendingPosts } from "../lib/post-image-archive";

async function main() {
  let total = { scanned: 0, archived: 0, expired: 0, failed: 0 };
  for (let i = 0; i < 20; i++) {
    const r = await archivePendingPosts({ batchSize: 50 });
    console.log(`batch ${i + 1}: ${JSON.stringify(r)}`);
    total.scanned += r.scanned;
    total.archived += r.archived;
    total.expired += r.expired;
    total.failed += r.failed;
    if (r.scanned === 0) break;
  }
  console.log("TOTAL:", total);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
