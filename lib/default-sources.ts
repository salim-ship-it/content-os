import type { Source } from "./sources";

// Salim's original watchlist from content-os/idea-engine/watchlist.json.
// Used to restore sources after a DB wipe or for new users who want the default set.
export const DEFAULT_SOURCES: Source[] = [
  // LinkedIn
  { kind: "linkedin", name: "Michel Lieben", url: "https://www.linkedin.com/in/michel-lieben/", enabled: true, maxPosts: 50, note: "Founder ColdIQ — Clay, cold email, AI outbound at scale" },
  { kind: "linkedin", name: "Alex Vacca", url: "https://www.linkedin.com/in/alex-vacca/", enabled: true, maxPosts: 50, note: "Co-founder ColdIQ — sales automation, AI tools, outbound ops" },
  { kind: "linkedin", name: "Shawn Tenam", url: "https://www.linkedin.com/in/shawntenam/", enabled: true, maxPosts: 50, note: "GTM engineering, Claude Code, building in public daily" },
  { kind: "linkedin", name: "Matteo Tittarelli", url: "https://www.linkedin.com/in/matteo-titta/", enabled: true, maxPosts: 50, note: "GTM Engineer Pulse — weekly roundup of GTM + AI + Clay" },
  { kind: "linkedin", name: "Varun Anand", url: "https://www.linkedin.com/in/vaanand/", enabled: true, maxPosts: 50, note: "Clay co-founder — GTM strategy, Clay use cases" },
  { kind: "linkedin", name: "Othmane Khadri", url: "https://www.linkedin.com/in/othmane-khadri-b48162236/", enabled: true, maxPosts: 50, note: "Claude Code for GTM, built-in-public experiments, agentic workflows" },
  { kind: "linkedin", name: "Charles Tenot", url: "https://www.linkedin.com/in/charlestenot/", enabled: true, maxPosts: 50, note: "GTM, lemlist CEO, M&A, contrarian takes" },
  { kind: "linkedin", name: "Bryn Foweather", url: "https://www.linkedin.com/in/brynfoweather/", enabled: true, maxPosts: 50, note: "MD @ Hike, AI-native agencies angle" },
  { kind: "linkedin", name: "Lara Acosta", url: "https://www.linkedin.com/in/laraacostar/", enabled: true, maxPosts: 30, note: "" },
  { kind: "linkedin", name: "Adam Robinson", url: "https://www.linkedin.com/in/retentionadam/", enabled: true, maxPosts: 50, note: "CEO of Retention.com & RB2B, outbound/retention, builds in public" },
  { kind: "linkedin", name: "Jacob Pegs", url: "https://www.linkedin.com/in/jacob-pegs/", enabled: true, maxPosts: 50, note: "Modern Maker — digital leverage, low-ticket offers" },

  // Reddit
  { kind: "reddit", name: "r/sales", url: "https://www.reddit.com/r/sales/", enabled: true, maxPosts: 25, note: "Cold email tactics, outbound, buyer psychology" },
  { kind: "reddit", name: "r/marketing", url: "https://www.reddit.com/r/marketing/", enabled: true, maxPosts: 25, note: "Content strategy, GTM, growth" },
  { kind: "reddit", name: "r/revops", url: "https://www.reddit.com/r/revops/", enabled: true, maxPosts: 25, note: "RevOps, automation, GTM engineering" },
  { kind: "reddit", name: "r/startups", url: "https://www.reddit.com/r/startups/", enabled: true, maxPosts: 25, note: "Founder conversations, buying signals, pain points" },
  { kind: "reddit", name: "r/entrepreneur", url: "https://www.reddit.com/r/entrepreneur/", enabled: true, maxPosts: 25, note: "Agency growth, business ideas" },
  { kind: "reddit", name: "r/ClaudeAI", url: "https://www.reddit.com/r/ClaudeAI/", enabled: true, maxPosts: 25, note: "Claude Code updates, community builds, new use cases" },
  { kind: "reddit", name: "r/gtmengineering", url: "https://www.reddit.com/r/gtmengineering/", enabled: true, maxPosts: 25, note: "GTM engineering tactics, tools, real workflows, Claude Code (niche, all posts)" },
  { kind: "reddit", name: "r/saas", url: "https://www.reddit.com/r/saas/", enabled: true, maxPosts: 25, note: "SaaS founder discussions, growth, churn, pricing, sales" },
  { kind: "reddit", name: "r/startup", url: "https://www.reddit.com/r/startup/", enabled: true, maxPosts: 25, note: "Startup discussions, founder pain points" },
  { kind: "reddit", name: "r/GTMbuilders", url: "https://www.reddit.com/r/GTMbuilders/", enabled: true, maxPosts: 25, note: "GTM builders, signal-based outbound, AI sales tooling (niche, all posts)" },

  // Instagram
  { kind: "instagram", name: "alexhormozi", url: "https://www.instagram.com/alexhormozi/", enabled: true, maxPosts: 20, note: "Business, sales funnels, GTM strategies, short-form educational content" },
  { kind: "instagram", name: "garyvee", url: "https://www.instagram.com/garyvee/", enabled: true, maxPosts: 20, note: "Marketing, business advice, daily motivational content" },
  { kind: "instagram", name: "naval", url: "https://www.instagram.com/naval/", enabled: true, maxPosts: 20, note: "Startup wisdom, business insights, philosophy" },
  { kind: "instagram", name: "tferriss", url: "https://www.instagram.com/tferriss/", enabled: true, maxPosts: 15, note: "Tools, business growth, lifestyle optimization" },
  { kind: "instagram", name: "ankipaul", url: "https://www.instagram.com/ankipaul/", enabled: true, maxPosts: 20, note: "Marketing, sales, B2B growth strategies" },
  { kind: "instagram", name: "thealexbanay", url: "https://www.instagram.com/thealexbanay/", enabled: true, maxPosts: 20, note: "Startup insights, business lessons, personal growth" },
  { kind: "instagram", name: "sarahtalib", url: "https://www.instagram.com/sarahtalib/", enabled: true, maxPosts: 15, note: "SaaS marketing, growth strategies, founder advice" },
  { kind: "instagram", name: "davidbeckham", url: "https://www.instagram.com/davidbeckham/", enabled: false, maxPosts: 10, note: "Personal brand, lifestyle, engagement strategies" },
  { kind: "instagram", name: "thejpg", url: "https://www.instagram.com/thejpg/", enabled: true, maxPosts: 20, note: "Growth marketing, conversion tactics, analytics" },
  { kind: "instagram", name: "eladgil", url: "https://www.instagram.com/eladgil/", enabled: true, maxPosts: 15, note: "Startup strategy, GTM, founder wisdom" },

  // YouTube
  { kind: "youtube", name: "Lenny's Podcast", url: "https://www.youtube.com/@LennysPodcast", enabled: true, maxPosts: 10, note: "Product, growth, GTM interviews from top operators" },
  { kind: "youtube", name: "Liam Ottley", url: "https://www.youtube.com/@LiamOttley", enabled: true, maxPosts: 10, note: "AI agents, AI agency builds, automation" },
  { kind: "youtube", name: "Greg Isenberg", url: "https://www.youtube.com/@GregIsenberg", enabled: true, maxPosts: 10, note: "Startup ideas, indie SaaS, agency builds" },
  { kind: "youtube", name: "Y Combinator", url: "https://www.youtube.com/@ycombinator", enabled: true, maxPosts: 10, note: "Founder talks, GTM strategy, startup advice from YC" },
];
