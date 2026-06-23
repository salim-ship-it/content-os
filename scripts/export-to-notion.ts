/**
 * Export posts from posts-export.json to Notion database
 * Usage: npx ts-node scripts/export-to-notion.ts
 *
 * Make sure you have:
 * - NOTION_API_KEY in .env.local
 * - NOTION_DATABASE_ID in .env.local (create empty database in Notion first)
 */

import * as fs from "fs";
import * as path from "path";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
  console.error("❌ Missing NOTION_API_KEY or NOTION_DATABASE_ID in .env.local");
  console.error("Get your API key at: https://www.notion.so/my-integrations");
  process.exit(1);
}

interface Post {
  id?: string;
  title?: string;
  content?: string;
  creator?: string;
  source?: string;
  type?: string;
  likes?: number;
  comments?: number;
  reposts?: number;
  saves?: number;
  impressions?: number;
  link?: string;
  published_date?: string;
}

async function exportToNotion() {
  try {
    console.log("📖 Reading posts export...");

    const exportPath = path.join(process.cwd(), "posts-export.json");
    if (!fs.existsSync(exportPath)) {
      console.error("❌ posts-export.json not found");
      console.error("Run: npx ts-node scripts/export-posts.ts");
      process.exit(1);
    }

    const fileContent = fs.readFileSync(exportPath, "utf-8");
    const exportData = JSON.parse(fileContent);
    const posts: Post[] = exportData.posts || [];

    console.log(`📤 Found ${posts.length} posts. Uploading to Notion...`);
    console.log("⏳ This may take a minute...\n");

    let uploaded = 0;
    let failed = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      try {
        const response = await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parent: {
              database_id: NOTION_DATABASE_ID,
            },
            properties: {
              Title: {
                title: [
                  {
                    text: {
                      content: (post.title || "Untitled").slice(0, 200),
                    },
                  },
                ],
              },
              Creator: {
                rich_text: [
                  {
                    text: {
                      content: (post.creator || "Unknown").slice(0, 100),
                    },
                  },
                ],
              },
              Source: {
                select: {
                  name: (post.source || "other").toLowerCase(),
                },
              },
              Type: {
                select: {
                  name: (post.type || "other").toLowerCase(),
                },
              },
              Likes: {
                number: post.likes || 0,
              },
              Comments: {
                number: post.comments || 0,
              },
              Link: {
                url: post.link || null,
              },
              Published: {
                date: {
                  start: post.published_date || new Date().toISOString(),
                },
              },
            },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ Post ${i + 1} failed:`, error.slice(0, 100));
          failed++;
        } else {
          uploaded++;
          if ((i + 1) % 50 === 0) {
            console.log(`✅ Uploaded ${i + 1}/${posts.length}...`);
          }
        }
      } catch (error) {
        console.error(`❌ Post ${i + 1} error:`, error);
        failed++;
      }

      // Rate limiting (Notion API limit is ~3 requests per second)
      if ((i + 1) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log("\n✅ Upload complete!");
    console.log(`📊 Uploaded: ${uploaded}/${posts.length}`);
    if (failed > 0) {
      console.log(`⚠️  Failed: ${failed}`);
    }
    console.log(`\n🔗 View your Notion database: https://notion.so/${NOTION_DATABASE_ID}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

exportToNotion();
