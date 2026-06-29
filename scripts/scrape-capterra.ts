/**
 * Scraper: Spendesk reviews from Capterra
 * Usage: npx ts-node scripts/scrape-capterra.ts
 */

import { chromium } from "playwright";
import type { Browser } from "playwright";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

interface Review {
  reviewer_name: string;
  reviewer_role: string;
  reviewer_company: string;
  rating: number;
  review_date: string;
  review_title: string;
  review_body: string;
  pros: string;
  cons: string;
  problems_solved: string;
}

async function scrapeSinglePage(browser: Browser, url: string): Promise<{ reviews: Review[]; hasNext: boolean }> {
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });

  await context.route("**/(analytics|ads|doubleclick|facebook|googletagmanager)/**", (r) =>
    r.abort().catch(() => null)
  );

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    return await page.evaluate((pageUrl) => {
      const results: Review[] = [];
      const container = document.querySelector('[data-test-id="review-cards-container"]');
      if (!container) return { reviews: [], hasNext: false };

      const cards = Array.from(container.querySelectorAll("div.c1ofrhif"));

      for (const card of cards) {
        // Reviewer info
        const infoDiv = card.querySelector(".typo-10.text-neutral-90, .typo-10");
        let reviewerName = "";
        let reviewerRole = "";
        let reviewerCompany = "";

        if (infoDiv) {
          reviewerName = infoDiv.querySelector("span.font-semibold")?.textContent?.trim() || "";
          const html = infoDiv.innerHTML;
          const lines = html
            .split(/<br\s*\/?>/i)
            .map((s) => s.replace(/<[^>]+>/g, "").trim())
            .filter((l) => l && l !== reviewerName);
          reviewerRole = lines[0] || "";
          reviewerCompany = lines[1] || "";
        }

        // Rating: count filled stars in first [data-testid="rating"] block
        const ratingEl = card.querySelector('[data-testid="rating"]');
        let rating = 0;
        if (ratingEl) {
          rating =
            ratingEl.querySelectorAll(".icon-star-full").length +
            ratingEl.querySelectorAll(".icon-star-half").length * 0.5;
        }

        // Date and title
        const titleEl = card.querySelector("h3.typo-20");
        const reviewTitle = titleEl?.textContent?.replace(/['"]/g, "").trim() || "";
        const dateEl = titleEl?.closest(".space-y-1")?.querySelector(".typo-0");
        const reviewDate = dateEl?.textContent?.trim() || "";

        // Pros / Cons via label text
        let pros = "";
        let cons = "";
        for (const labelSpan of Array.from(card.querySelectorAll("span.font-semibold"))) {
          const innerText = labelSpan.querySelector("span")?.textContent?.trim();
          const parentDiv = labelSpan.closest(".space-y-2");
          const text = parentDiv?.querySelector("p")?.textContent?.trim() || "";
          if (innerText === "Pros") pros = text;
          else if (innerText === "Cons") cons = text;
        }

        // Body: first substantial paragraph that isn't pros/cons
        const allP = Array.from(card.querySelectorAll("p"));
        const bodyP = allP.find(
          (p) => p.textContent && p.textContent.length > 40 && p.textContent.trim() !== pros && p.textContent.trim() !== cons
        );
        const reviewBody = bodyP?.textContent?.trim() || "";

        if (reviewerName || reviewTitle || rating > 0) {
          results.push({
            reviewer_name: reviewerName,
            reviewer_role: reviewerRole,
            reviewer_company: reviewerCompany,
            rating,
            review_date: reviewDate,
            review_title: reviewTitle,
            review_body: reviewBody,
            pros,
            cons,
            problems_solved: "",
          });
        }
      }

      // Check for next page
      const currentPage = parseInt(new URL(pageUrl).searchParams.get("page") || "1");
      const links = Array.from(document.querySelectorAll("a[href*='page=']"));
      const hasNext = links.some((l) => l.getAttribute("href")?.includes(`page=${currentPage + 1}`));

      return { reviews: results, hasNext };
    }, url);
  } finally {
    await context.close();
  }
}

async function scrapeAllReviews(): Promise<Review[]> {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const reviews: Review[] = [];

  try {
    let pageNum = 1;
    while (true) {
      const url =
        pageNum === 1
          ? "https://www.capterra.com/p/157515/Spendesk/reviews/"
          : `https://www.capterra.com/p/157515/Spendesk/reviews/?page=${pageNum}`;

      console.log(`Scraping page ${pageNum}...`);
      const { reviews: pageReviews, hasNext } = await scrapeSinglePage(browser, url);

      if (pageReviews.length === 0) {
        console.log(`No reviews on page ${pageNum}. Done.`);
        break;
      }

      reviews.push(...pageReviews);
      console.log(`  → ${pageReviews.length} reviews (total: ${reviews.length})`);

      if (!hasNext || pageNum >= 30) break;
      pageNum++;
      await new Promise((r) => setTimeout(r, 800));
    }
  } finally {
    await browser.close();
  }

  return reviews;
}

async function saveToFile(reviews: Review[]) {
  const outPath = path.resolve(process.cwd(), "data", "capterra-reviews.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(reviews, null, 2));
  console.log(`Saved to ${outPath}`);
}

async function saveToSupabase(reviews: Review[]) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_JWT;

  if (!url || !key) {
    console.warn("No Supabase credentials — skipping DB insert.");
    return;
  }

  const supabase = createClient(url, key);

  for (let i = 0; i < reviews.length; i += 50) {
    const chunk = reviews.slice(i, i + 50);
    const { error } = await supabase.from("capterra_reviews").upsert(chunk, {
      onConflict: "reviewer_name,review_date",
      ignoreDuplicates: true,
    });
    if (error) console.error("Insert error:", error.message);
  }

  console.log(`Inserted ${reviews.length} reviews into Supabase.`);
}

async function main() {
  console.log("Capterra scraper — Spendesk\n");
  const reviews = await scrapeAllReviews();

  if (!reviews.length) {
    console.log("No reviews scraped.");
    process.exit(1);
  }

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  console.log(`\nTotal: ${reviews.length} reviews | Avg: ${avgRating.toFixed(1)}/5`);

  await saveToFile(reviews);
  await saveToSupabase(reviews);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
