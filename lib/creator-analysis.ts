import type { WinningPost } from "./winning-posts";

export function slugifyCreator(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export type HookType =
  | "question"
  | "stat"
  | "story"
  | "bold"
  | "list"
  | "other";

export type LengthBucket = "short" | "medium" | "long";

export type CtaType =
  | "question"
  | "comment"
  | "dm"
  | "link"
  | "none";

export type PatternRow<T extends string> = {
  type: T;
  label: string;
  count: number;
  avgLikes: number;
  avgComments: number;
  bestPost: WinningPost | null;
};

export type FormatStats = {
  lengths: PatternRow<LengthBucket>[];
  withImage: { count: number; avgLikes: number };
  textOnly: { count: number; avgLikes: number };
};

export type KeywordRow = {
  keyword: string;
  count: number;
  avgLikes: number;
  avgComments: number;
};

export type HookLength = "punchy" | "short" | "medium" | "long";
export type WordBucket = "micro" | "short" | "medium" | "long" | "essay" | "thread";
export type LineBucket = "tight" | "compact" | "standard" | "sprawling";

export type FirstWordRow = {
  word: string;
  count: number;
  avgLikes: number;
  share: number; // percent of all posts
};

export type HookEntry = {
  id: string;
  firstLine: string;
  likes: number;
  comments: number;
  link: string;
  type: HookType;
  length: HookLength;
};

export type HookDetail = {
  byLength: PatternRow<HookLength>[];
  topFirstWords: FirstWordRow[];
  hooksWithEmoji: { count: number; avgLikes: number };
  hooksWithoutEmoji: { count: number; avgLikes: number };
  allHooks: HookEntry[];
};

export type SimpleStat = { count: number; avgLikes: number; avgComments: number };

export type FormatDetail = {
  wordHistogram: PatternRow<WordBucket>[];
  lineBuckets: PatternRow<LineBucket>[];
  listVsProse: { list: SimpleStat; prose: SimpleStat };
  emojiVsPlain: { emoji: SimpleStat; plain: SimpleStat };
  avgWordsPerPost: number;
  avgLinesPerPost: number;
  avgWordsPerSentence: number;
};

export type StructuralFormat =
  | "contrarian_permission"
  | "incremental_playbook"
  | "vulnerable_story"
  | "decision_story"
  | "exit_as_win"
  | "proof_on_self"
  | "viral_giveaway"
  | "data_findings"
  | "industry_shift"
  | "reintroduction"
  | "framework_breakdown"
  | "hot_take"
  | "other";

export type PostBeat =
  | "hook_story"
  | "hook_contrarian"
  | "hook_stat"
  | "hook_milestone"
  | "hook_question"
  | "vulnerable_admission"
  | "lesson_block"
  | "actionable_block"
  | "you_block"
  | "framework_named"
  | "giveaway_cta"
  | "data_claim"
  | "timeline_marker"
  | "numbered_list"
  | "bullet_list"
  | "metrics_present"
  | "rule_of_three"
  | "warm_signoff";

export type SlayComponents = {
  story: boolean;
  lesson: boolean;
  actionable: boolean;
  you: boolean;
};

export type PostStructure = {
  id: string;
  format: StructuralFormat;
  beats: PostBeat[];
  slay: SlayComponents;
  slayScore: number; // 0–4
};

export type BeatStat = {
  beat: PostBeat;
  label: string;
  count: number;
  share: number;
  avgLikesWith: number;
  avgLikesWithout: number;
};

export type SlayBucket = {
  score: number; // 0–4
  label: string;
  count: number;
  avgLikes: number;
  avgComments: number;
};

export type StructuralAnalysis = {
  formats: PatternRow<StructuralFormat>[];
  beats: BeatStat[];
  slayBuckets: SlayBucket[];
  perPost: Map<string, PostStructure>;
};

export type CreatorStats = {
  totalPosts: number;
  avgLikes: number;
  avgComments: number;
  bestPost: WinningPost | null;
  dateRange: { from: string; to: string };
  hooks: PatternRow<HookType>[];
  formats: FormatStats;
  ctas: PatternRow<CtaType>[];
  keywords: KeywordRow[];
  insights: string[];
  hookDetail: HookDetail;
  formatDetail: FormatDetail;
  structural: StructuralAnalysis;
};

const HOOK_LABELS: Record<HookType, string> = {
  question: "Question",
  stat: "Stat / number",
  story: "Personal story",
  bold: "Bold claim",
  list: "List tease",
  other: "Other",
};

const LENGTH_LABELS: Record<LengthBucket, string> = {
  short: "Short (<100 words)",
  medium: "Medium (100–250 words)",
  long: "Long (250+ words)",
};

const CTA_LABELS: Record<CtaType, string> = {
  question: "Question mark ending",
  comment: "Ask for comment",
  dm: "Ask for DM",
  link: "Link in comments",
  none: "No CTA",
};

function firstLine(content: string): string {
  return (content || "").split("\n").map((s) => s.trim()).find((s) => s.length > 0) || "";
}

function lastNonEmptyBlock(content: string): string {
  const parts = (content || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts[parts.length - 1] || "";
}

function wordCount(content: string): number {
  return (content || "").trim().split(/\s+/).filter(Boolean).length;
}

export function classifyHook(content: string): HookType {
  const line = firstLine(content);
  if (!line) return "other";
  const lower = line.toLowerCase();

  if (line.endsWith("?")) return "question";
  if (/^\d+[.)]?\s|^\$?\d+(k|m|%)?\b/.test(line)) return "stat";
  if (/^(i\s|my\s|yesterday|last week|last month|today i|when i|as a)/i.test(line)) return "story";
  if (/^(here are|here's|\d+\s+(ways?|things?|reasons?|tips?|lessons?|mistakes?|rules?|truths?))\b/i.test(line)) return "list";
  if (
    line.length <= 120 &&
    /\b(broken|dead|overrated|underrated|wrong|nobody|everyone|most people|stop|never|always|fastest|biggest|worst|best)\b/.test(lower)
  ) {
    return "bold";
  }
  return "other";
}

export function bucketLength(content: string): LengthBucket {
  const w = wordCount(content);
  if (w < 100) return "short";
  if (w <= 250) return "medium";
  return "long";
}

export function classifyCta(content: string): CtaType {
  const last = lastNonEmptyBlock(content).toLowerCase();
  if (!last) return "none";
  if (/(link in the comments|link below|link in comments|👇)/i.test(last)) return "link";
  if (/(dm me|send me a dm|message me|slide into my dms|pm me)/i.test(last)) return "dm";
  if (/(comment below|comment "|comment '|what do you think|thoughts\??|agree\??|which one|share your|drop a|tell me)/i.test(last)) return "comment";
  if (last.endsWith("?")) return "question";
  return "none";
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","so","of","to","in","on","at","by","for","with","from","as","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","can","may","might","must","shall","that","this","these","those","it","its","they","them","their","there","here","what","which","who","whom","whose","when","where","why","how","all","any","each","every","some","most","more","less","no","not","only","own","same","too","very","just","about","into","than","him","her","he","she","we","us","our","you","your","i","me","my","mine","yours","hers","his","theirs","ours","also","ll","ve","re","d","s","t","m","one","two","three","get","got","getting","make","made","making","take","took","taking","go","went","going","come","came","coming","see","saw","seen","know","knew","known","think","thought","thinking","say","said","like","liked","liking","use","used","using","want","wanted","need","needed","good","new","first","last","long","great","little","old","right","big","high","different","small","large","next","early","young","important","few","public","bad","same","able","still","while","many","even","really","now","look","looked","people","way","time","day","year","things","thing","work","worked","working"
]);

function tokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const HOOK_LENGTH_LABELS: Record<HookLength, string> = {
  punchy: "Punchy (≤5 words)",
  short: "Short (6–10 words)",
  medium: "Medium (11–20 words)",
  long: "Long (21+ words)",
};

const WORD_LABELS: Record<WordBucket, string> = {
  micro: "Micro (<50 words)",
  short: "Short (50–100)",
  medium: "Medium (100–175)",
  long: "Long (175–300)",
  essay: "Essay (300–500)",
  thread: "Thread (500+)",
};

const LINE_LABELS: Record<LineBucket, string> = {
  tight: "Tight (≤5 lines)",
  compact: "Compact (6–12 lines)",
  standard: "Standard (13–25 lines)",
  sprawling: "Sprawling (26+ lines)",
};

function hookLengthBucket(text: string): HookLength {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 5) return "punchy";
  if (words <= 10) return "short";
  if (words <= 20) return "medium";
  return "long";
}

function wordBucket(wordCount: number): WordBucket {
  if (wordCount < 50) return "micro";
  if (wordCount < 100) return "short";
  if (wordCount < 175) return "medium";
  if (wordCount < 300) return "long";
  if (wordCount < 500) return "essay";
  return "thread";
}

function lineBucket(content: string): LineBucket {
  const lines = (content || "").split("\n").filter((l) => l.trim().length > 0).length;
  if (lines <= 5) return "tight";
  if (lines <= 12) return "compact";
  if (lines <= 25) return "standard";
  return "sprawling";
}

function hasListStructure(content: string): boolean {
  const lines = (content || "").split("\n").map((l) => l.trim());
  let bulletCount = 0;
  for (const line of lines) {
    if (/^[-*•▪✓✔→▶▲▸]\s/.test(line) || /^\d+[.)]\s/.test(line)) {
      bulletCount += 1;
    }
  }
  return bulletCount >= 3;
}

function hasEmoji(text: string): boolean {
  return EMOJI_REGEX.test(text || "");
}

function sentenceCount(content: string): number {
  // Very approximate: splits on ., !, ? that are followed by whitespace or end.
  const count = (content || "").split(/[.!?]+(?=\s|$)/).filter((s) => s.trim().length > 0).length;
  return Math.max(1, count);
}

function normalizedFirstWord(line: string): string {
  const raw = line.trim().split(/\s+/)[0] || "";
  return raw
    .replace(/^["'""'`]|["'""'`:,.!?;]+$/g, "")
    .toLowerCase();
}

function buildSimpleStat(posts: WinningPost[]): SimpleStat {
  return {
    count: posts.length,
    avgLikes: avg(posts.map((p) => p.likes)),
    avgComments: avg(posts.map((p) => p.comments)),
  };
}

function analyzeHookDetail(posts: WinningPost[]): HookDetail {
  const lengthBuckets: Record<HookLength, WinningPost[]> = {
    punchy: [], short: [], medium: [], long: [],
  };

  const firstWordPosts = new Map<string, WinningPost[]>();
  const withEmoji: WinningPost[] = [];
  const withoutEmoji: WinningPost[] = [];
  const allHooks: HookEntry[] = [];

  for (const p of posts) {
    const line = (p.content || "").split("\n").map((s) => s.trim()).find((s) => s.length > 0) || "";
    if (!line) continue;

    const lenBucket = hookLengthBucket(line);
    lengthBuckets[lenBucket].push(p);

    const fw = normalizedFirstWord(line);
    if (fw && fw.length >= 2) {
      if (!firstWordPosts.has(fw)) firstWordPosts.set(fw, []);
      firstWordPosts.get(fw)!.push(p);
    }

    if (hasEmoji(line)) withEmoji.push(p);
    else withoutEmoji.push(p);

    allHooks.push({
      id: p.id,
      firstLine: line,
      likes: p.likes,
      comments: p.comments,
      link: p.link,
      type: classifyHook(p.content),
      length: lenBucket,
    });
  }

  const byLength: PatternRow<HookLength>[] = (Object.keys(lengthBuckets) as HookLength[])
    .map((k) => buildRow(k, HOOK_LENGTH_LABELS[k], lengthBuckets[k]))
    .filter((r) => r.count > 0);

  const topFirstWords: FirstWordRow[] = Array.from(firstWordPosts.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([word, items]) => ({
      word,
      count: items.length,
      avgLikes: avg(items.map((p) => p.likes)),
      share: Math.round((items.length / posts.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  allHooks.sort((a, b) => b.likes - a.likes);

  return {
    byLength,
    topFirstWords,
    hooksWithEmoji: { count: withEmoji.length, avgLikes: avg(withEmoji.map((p) => p.likes)) },
    hooksWithoutEmoji: {
      count: withoutEmoji.length,
      avgLikes: avg(withoutEmoji.map((p) => p.likes)),
    },
    allHooks,
  };
}

function analyzeFormatDetail(posts: WinningPost[]): FormatDetail {
  const wordBucketPosts: Record<WordBucket, WinningPost[]> = {
    micro: [], short: [], medium: [], long: [], essay: [], thread: [],
  };
  const lineBucketPosts: Record<LineBucket, WinningPost[]> = {
    tight: [], compact: [], standard: [], sprawling: [],
  };
  const listPosts: WinningPost[] = [];
  const prosePosts: WinningPost[] = [];
  const emojiPosts: WinningPost[] = [];
  const plainPosts: WinningPost[] = [];

  let totalWords = 0;
  let totalLines = 0;
  let totalSentences = 0;

  for (const p of posts) {
    const wc = wordCount(p.content);
    wordBucketPosts[wordBucket(wc)].push(p);
    lineBucketPosts[lineBucket(p.content)].push(p);

    if (hasListStructure(p.content)) listPosts.push(p);
    else prosePosts.push(p);

    if (hasEmoji(p.content)) emojiPosts.push(p);
    else plainPosts.push(p);

    totalWords += wc;
    totalLines += (p.content || "").split("\n").filter((l) => l.trim().length > 0).length;
    totalSentences += sentenceCount(p.content);
  }

  const wordHistogram: PatternRow<WordBucket>[] = (Object.keys(wordBucketPosts) as WordBucket[])
    .map((k) => buildRow(k, WORD_LABELS[k], wordBucketPosts[k]))
    .filter((r) => r.count > 0);

  const lineBuckets: PatternRow<LineBucket>[] = (Object.keys(lineBucketPosts) as LineBucket[])
    .map((k) => buildRow(k, LINE_LABELS[k], lineBucketPosts[k]))
    .filter((r) => r.count > 0);

  const totalCount = posts.length || 1;

  return {
    wordHistogram,
    lineBuckets,
    listVsProse: {
      list: buildSimpleStat(listPosts),
      prose: buildSimpleStat(prosePosts),
    },
    emojiVsPlain: {
      emoji: buildSimpleStat(emojiPosts),
      plain: buildSimpleStat(plainPosts),
    },
    avgWordsPerPost: Math.round(totalWords / totalCount),
    avgLinesPerPost: Math.round(totalLines / totalCount),
    avgWordsPerSentence: Math.round(totalWords / Math.max(1, totalSentences)),
  };
}

/* ── Structural format classifier (based on Kleo playbook + SLAY + Ayesha frameworks) ── */

const STRUCTURAL_FORMAT_LABELS: Record<StructuralFormat, string> = {
  contrarian_permission: "Contrarian permission",
  incremental_playbook: "Incremental playbook",
  vulnerable_story: "Vulnerable story",
  decision_story: "Decision story",
  exit_as_win: "Exit as the win",
  proof_on_self: "Proof on yourself",
  viral_giveaway: "Viral giveaway",
  data_findings: "Data findings",
  industry_shift: "Industry shift",
  reintroduction: "Re-introduction",
  framework_breakdown: "Framework breakdown",
  hot_take: "Hot take",
  other: "Other",
};

const BEAT_LABELS: Record<PostBeat, string> = {
  hook_story: "Story hook",
  hook_contrarian: "Contrarian hook",
  hook_stat: "Stat / number hook",
  hook_milestone: "Milestone hook",
  hook_question: "Question hook",
  vulnerable_admission: "Vulnerable admission",
  lesson_block: "Lesson / takeaway block",
  actionable_block: "Actionable steps",
  you_block: "You-address (reader CTA)",
  framework_named: "Named framework",
  giveaway_cta: "Giveaway CTA",
  data_claim: "Data / analysis claim",
  timeline_marker: "Timeline marker",
  numbered_list: "Numbered list",
  bullet_list: "Bullet list",
  metrics_present: "Metrics / numbers",
  rule_of_three: "Rule of three",
  warm_signoff: "Warm sign-off",
};

function detectBeats(content: string): Set<PostBeat> {
  const beats = new Set<PostBeat>();
  if (!content) return beats;

  const text = content;
  const lower = text.toLowerCase();
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  const firstLine = lines[0] || "";
  const firstLower = firstLine.toLowerCase();
  const lastThird = lines.slice(Math.floor(lines.length * 0.66)).join(" ").toLowerCase();

  // ── Hook beats ──
  if (/\?$/.test(firstLine)) beats.add("hook_question");
  if (/^(i\s|my\s|yesterday|last (week|month|year)|today i|when i|a (year|month|week|few days) ago|\d+\s*(years?|months?|weeks?|days?)\s+ago)/i.test(firstLine)) {
    beats.add("hook_story");
  }
  if (/^\$?\d[\d,.]*(k|m|%|\s|\b)/.test(firstLine) || /^\d+[.)]/.test(firstLine)) {
    beats.add("hook_stat");
  }
  if (/\b(just\s+(hit|launched|closed|crossed|raised|shipped)|brand new|i (just|finally)|we (just|hit|closed|launched|crossed))\b/i.test(firstLower)) {
    beats.add("hook_milestone");
  }
  if (
    /^(it['']?s (ok|okay|fine|time to)|stop |nobody (tells|talks|tells you)|everyone (thinks|says|is)|most (people|founders|creators)|here['']?s the (truth|thing)|the (truth|problem|real reason)|let['']?s be (real|honest)|unpopular opinion|hot take)/i.test(firstLower) ||
    /\b(is (broken|dead|overrated|underrated|wrong|a lie)|nobody talks about|most people|everyone thinks)\b/.test(firstLower)
  ) {
    beats.add("hook_contrarian");
  }

  // ── Body beats ──
  if (/\b(honestly|not gonna lie|i['']?ll be honest|i was (scared|nervous|terrified|wrong|doubting)|truth is|i doubted|i almost (didn['']?t|quit)|i failed)\b/.test(lower)) {
    beats.add("vulnerable_admission");
  }
  if (
    /\b(lesson|takeaway|the (lesson|point|real reason|truth|thing)|what i learned|here['']?s (why|what i learned)|it turns out|turns out|the real reason|tl;dr|in short|the reason)\b/.test(lower)
  ) {
    beats.add("lesson_block");
  }

  // Actionable block: 3+ bullet/numbered lines OR "step N" pattern OR "here's how: 1..."
  let bulletLineCount = 0;
  let numberedLineCount = 0;
  for (const line of lines) {
    if (/^[-*•▪✓✔→▶▲▸]\s/.test(line)) bulletLineCount += 1;
    if (/^(\d+[.)]|step\s*\d+[:.\-)])\s/i.test(line)) numberedLineCount += 1;
  }
  if (bulletLineCount >= 3) beats.add("bullet_list");
  if (numberedLineCount >= 3) beats.add("numbered_list");
  if (bulletLineCount >= 3 || numberedLineCount >= 3 || /\bhere['']?s how\b|\bhere['']?s what i did\b|\bhere['']?s what\b/.test(lower)) {
    beats.add("actionable_block");
  }

  // You-address: direct call-out to reader in the final third
  if (
    /\b(if you['']?re|try this|your next|you can|comment (below|")|drop a |tag someone|what['']?s your|what about you|your turn|dm me|message me|send me)\b/.test(lastThird)
  ) {
    beats.add("you_block");
  }

  // Framework named
  if (/\b(i call (it|this)|the (\w+\s+){0,3}(framework|method|system|playbook|formula|rule|blueprint)|my (\w+\s+){0,3}(framework|method|system))\b/i.test(lower)) {
    beats.add("framework_named");
  }

  // Giveaway CTA
  if (/\bcomment\s*["'"][^"']{1,30}["'"]|\blink in (the )?comments\b|\bdm (me|"\w+")\b|\bsend me (a )?dm\b|\bwant (the|free) (access|resource|pdf|doc|deck|vault)\b/i.test(lower)) {
    beats.add("giveaway_cta");
  }

  // Data claim
  if (/\b(i (looked|analyzed|studied|tracked|reviewed|read|scraped|collected)|i ran|i scanned|the data (shows|says)|\d+(\s|,\s)*(posts?|ads?|accounts?|campaigns?|emails?|drafts?|pages?)|\bN\s*=\s*\d+)\b/.test(lower)) {
    beats.add("data_claim");
  }

  // Timeline marker
  if (/\b(\d+\s*(years?|months?)\s*ago|a few (years?|months?) ago|today[,\s]|now[,\s]|recently[,\s]|back in \d{4}|in \d{4})\b/.test(lower)) {
    beats.add("timeline_marker");
  }

  // Metrics present (dollar, percent, K/M suffix)
  if (/\$[\d,.]+|\b\d[\d,.]*\s*(k|m|%)\b|\b\d{2,}[\d,.]*\s*(followers|subscribers|views|impressions|likes|comments|revenue|mrr|arr|views)\b/i.test(lower)) {
    beats.add("metrics_present");
  }

  // Rule of three — three consecutive very-short lines each ≤4 words ending in . or !
  for (let i = 0; i + 2 < lines.length; i += 1) {
    const trio = [lines[i], lines[i + 1], lines[i + 2]];
    if (trio.every((l) => {
      const words = l.split(/\s+/).filter(Boolean);
      return words.length >= 1 && words.length <= 4 && /[.!]$/.test(l);
    })) {
      beats.add("rule_of_three");
      break;
    }
  }

  // Warm sign-off
  if (/\n\s*[—–-]\s*[A-Z][a-z]+\s*$|\bps[.:]|\bcheers\s*[,.]?|\bwarm(ly)?\b/i.test(text)) {
    beats.add("warm_signoff");
  }

  return beats;
}

function classifyStructure(beats: Set<PostBeat>, content: string): StructuralFormat {
  const has = (b: PostBeat) => beats.has(b);
  const lower = content.toLowerCase();

  // Order matters — check most specific formats first.

  if (has("giveaway_cta") && (has("bullet_list") || has("numbered_list"))) {
    return "viral_giveaway";
  }

  if (
    has("data_claim") &&
    (has("bullet_list") || has("numbered_list") || has("lesson_block"))
  ) {
    return "data_findings";
  }

  if (
    has("hook_milestone") &&
    (has("metrics_present") || has("data_claim"))
  ) {
    return "proof_on_self";
  }

  if (
    has("hook_contrarian") &&
    (has("actionable_block") || has("rule_of_three") || has("lesson_block"))
  ) {
    return "contrarian_permission";
  }

  if (has("framework_named") && (has("numbered_list") || has("bullet_list"))) {
    return "framework_breakdown";
  }

  if (
    has("timeline_marker") &&
    (has("hook_contrarian") || /\b(game has changed|no longer|used to|back then|in \d{4})\b/.test(lower))
  ) {
    return "industry_shift";
  }

  if (
    has("hook_story") &&
    (has("vulnerable_admission") || has("lesson_block"))
  ) {
    // Decision story — contains a pivotal decision
    if (/\b(decision|i (chose|decided|said no|walked away|declined|turned down|quit|left)|\bno\b.*(was|became|felt).*right|i had to choose|pivot)\b/.test(lower)) {
      return "decision_story";
    }
    // Exit-as-win — contains injustice + earned flex
    if (/\b(boss|manager|coworker|colleague|promotion|fired|unfair|rigged|politics|climb|ladder)\b/.test(lower) && has("metrics_present")) {
      return "exit_as_win";
    }
    return "vulnerable_story";
  }

  if (
    has("hook_story") ||
    /\b(i['']?m\s+\d+|\bi['']?ve been|\bi started|\bi grew up)\b/.test(lower)
  ) {
    return "vulnerable_story";
  }

  // Re-introduction — "I'm X, [stat]. Here's what we do:"
  if (
    /^i['']?m\s+\w+/.test(lower.split("\n")[0] || "") &&
    (has("bullet_list") || has("metrics_present")) &&
    has("warm_signoff")
  ) {
    return "reintroduction";
  }

  if (has("hook_contrarian")) return "hot_take";

  return "other";
}

function computeSlay(beats: Set<PostBeat>): SlayComponents {
  return {
    story: beats.has("hook_story") || beats.has("vulnerable_admission"),
    lesson: beats.has("lesson_block"),
    actionable: beats.has("actionable_block"),
    you: beats.has("you_block"),
  };
}

function analyzeStructure(posts: WinningPost[]): StructuralAnalysis {
  const formatBuckets = new Map<StructuralFormat, WinningPost[]>();
  const beatPosts = new Map<PostBeat, WinningPost[]>();
  const slayCounts: Record<number, WinningPost[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  const perPost = new Map<string, PostStructure>();

  for (const p of posts) {
    const beats = detectBeats(p.content);
    const format = classifyStructure(beats, p.content);
    const slay = computeSlay(beats);
    const slayScore = Number(slay.story) + Number(slay.lesson) + Number(slay.actionable) + Number(slay.you);

    perPost.set(p.id, {
      id: p.id,
      format,
      beats: Array.from(beats),
      slay,
      slayScore,
    });

    if (!formatBuckets.has(format)) formatBuckets.set(format, []);
    formatBuckets.get(format)!.push(p);

    for (const b of beats) {
      if (!beatPosts.has(b)) beatPosts.set(b, []);
      beatPosts.get(b)!.push(p);
    }

    slayCounts[slayScore].push(p);
  }

  const formats: PatternRow<StructuralFormat>[] = Array.from(formatBuckets.entries())
    .map(([f, items]) => buildRow(f, STRUCTURAL_FORMAT_LABELS[f], items))
    .sort((a, b) => b.avgLikes - a.avgLikes);

  const beatsRows: BeatStat[] = (Object.keys(BEAT_LABELS) as PostBeat[])
    .map((b) => {
      const withBeat = beatPosts.get(b) || [];
      const withoutBeat = posts.filter((p) => {
        const s = perPost.get(p.id);
        return s ? !s.beats.includes(b) : true;
      });
      return {
        beat: b,
        label: BEAT_LABELS[b],
        count: withBeat.length,
        share: posts.length > 0 ? Math.round((withBeat.length / posts.length) * 100) : 0,
        avgLikesWith: avg(withBeat.map((p) => p.likes)),
        avgLikesWithout: avg(withoutBeat.map((p) => p.likes)),
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avgLikesWith - a.avgLikesWith);

  const slayBuckets: SlayBucket[] = [0, 1, 2, 3, 4].map((score) => ({
    score,
    label: `${score} / 4 beats`,
    count: slayCounts[score].length,
    avgLikes: avg(slayCounts[score].map((p) => p.likes)),
    avgComments: avg(slayCounts[score].map((p) => p.comments)),
  }));

  return { formats, beats: beatsRows, slayBuckets, perPost };
}

function extractKeywords(posts: WinningPost[]): KeywordRow[] {
  const unigramPosts = new Map<string, WinningPost[]>();
  const bigramPosts = new Map<string, WinningPost[]>();

  for (const p of posts) {
    const tokens = tokenize(p.content);
    const seenU = new Set<string>();
    for (const t of tokens) {
      if (seenU.has(t)) continue;
      seenU.add(t);
      if (!unigramPosts.has(t)) unigramPosts.set(t, []);
      unigramPosts.get(t)!.push(p);
    }
    const seenB = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i += 1) {
      const bg = `${tokens[i]} ${tokens[i + 1]}`;
      if (seenB.has(bg)) continue;
      seenB.add(bg);
      if (!bigramPosts.has(bg)) bigramPosts.set(bg, []);
      bigramPosts.get(bg)!.push(p);
    }
  }

  const minPosts = Math.max(2, Math.ceil(posts.length * 0.05));

  function toRows(map: Map<string, WinningPost[]>): KeywordRow[] {
    const rows: KeywordRow[] = [];
    for (const [keyword, items] of map) {
      if (items.length < minPosts) continue;
      rows.push({
        keyword,
        count: items.length,
        avgLikes: avg(items.map((p) => p.likes)),
        avgComments: avg(items.map((p) => p.comments)),
      });
    }
    return rows;
  }

  const allRows = [...toRows(unigramPosts), ...toRows(bigramPosts)];
  // Rank by avg likes × log(count), which rewards keywords that are both frequent and tied to high engagement.
  allRows.sort(
    (a, b) => b.avgLikes * Math.log(b.count + 1) - a.avgLikes * Math.log(a.count + 1),
  );
  return allRows.slice(0, 20);
}

function buildRow<T extends string>(
  type: T,
  label: string,
  posts: WinningPost[],
): PatternRow<T> {
  const best = posts.reduce<WinningPost | null>(
    (a, b) => (a == null || b.likes > a.likes ? b : a),
    null,
  );
  return {
    type,
    label,
    count: posts.length,
    avgLikes: avg(posts.map((p) => p.likes)),
    avgComments: avg(posts.map((p) => p.comments)),
    bestPost: best,
  };
}

export function analyzeCreator(posts: WinningPost[]): CreatorStats {
  const total = posts.length;
  const avgLikes = avg(posts.map((p) => p.likes));
  const avgComments = avg(posts.map((p) => p.comments));
  const bestPost = posts.reduce<WinningPost | null>(
    (a, b) => (a == null || b.likes > a.likes ? b : a),
    null,
  );
  const dates = posts.map((p) => p.date).filter(Boolean).sort();
  const dateRange = { from: dates[0] || "", to: dates[dates.length - 1] || "" };

  // Hooks
  const hookBuckets: Record<HookType, WinningPost[]> = {
    question: [], stat: [], story: [], bold: [], list: [], other: [],
  };
  for (const p of posts) hookBuckets[classifyHook(p.content)].push(p);
  const hooks: PatternRow<HookType>[] = (Object.keys(hookBuckets) as HookType[])
    .map((k) => buildRow(k, HOOK_LABELS[k], hookBuckets[k]))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avgLikes - a.avgLikes);

  // Formats
  const lenBuckets: Record<LengthBucket, WinningPost[]> = { short: [], medium: [], long: [] };
  for (const p of posts) lenBuckets[bucketLength(p.content)].push(p);
  const lengths: PatternRow<LengthBucket>[] = (Object.keys(lenBuckets) as LengthBucket[])
    .map((k) => buildRow(k, LENGTH_LABELS[k], lenBuckets[k]))
    .filter((r) => r.count > 0);

  const withImagePosts = posts.filter((p) => !!p.imageUrl);
  const textOnlyPosts = posts.filter((p) => !p.imageUrl);

  const formats: FormatStats = {
    lengths,
    withImage: { count: withImagePosts.length, avgLikes: avg(withImagePosts.map((p) => p.likes)) },
    textOnly: { count: textOnlyPosts.length, avgLikes: avg(textOnlyPosts.map((p) => p.likes)) },
  };

  // CTAs
  const ctaBuckets: Record<CtaType, WinningPost[]> = {
    question: [], comment: [], dm: [], link: [], none: [],
  };
  for (const p of posts) ctaBuckets[classifyCta(p.content)].push(p);
  const ctas: PatternRow<CtaType>[] = (Object.keys(ctaBuckets) as CtaType[])
    .map((k) => buildRow(k, CTA_LABELS[k], ctaBuckets[k]))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avgLikes - a.avgLikes);

  // Insights — three template sentences from the tables above.
  const insights: string[] = [];
  if (hooks.length > 0 && avgLikes > 0) {
    const top = hooks[0];
    const ratio = (top.avgLikes / avgLikes).toFixed(1);
    insights.push(
      `Top hook pattern is **${top.label}** (${top.count} posts) — averages ${top.avgLikes.toLocaleString()} likes, ${ratio}× the creator's overall average.`,
    );
  }
  if (withImagePosts.length > 0 && textOnlyPosts.length > 0) {
    const imgAvg = formats.withImage.avgLikes;
    const txtAvg = formats.textOnly.avgLikes;
    if (imgAvg > txtAvg) {
      const ratio = (imgAvg / Math.max(1, txtAvg)).toFixed(1);
      insights.push(`Posts **with an image** average ${imgAvg.toLocaleString()} likes vs ${txtAvg.toLocaleString()} for text-only — ${ratio}× more engagement.`);
    } else if (txtAvg > imgAvg) {
      const ratio = (txtAvg / Math.max(1, imgAvg)).toFixed(1);
      insights.push(`**Text-only** posts average ${txtAvg.toLocaleString()} likes vs ${imgAvg.toLocaleString()} with images — ${ratio}× more engagement.`);
    }
  }
  if (ctas.length > 0 && ctas[0].type !== "none") {
    const top = ctas[0];
    insights.push(`Best-performing CTA is **${top.label}** — ${top.count} posts averaging ${top.avgLikes.toLocaleString()} likes.`);
  }

  const keywords = extractKeywords(posts);
  const hookDetail = analyzeHookDetail(posts);
  const formatDetail = analyzeFormatDetail(posts);
  const structural = analyzeStructure(posts);

  return {
    totalPosts: total,
    avgLikes,
    avgComments,
    bestPost,
    dateRange,
    hooks,
    formats,
    ctas,
    keywords,
    insights,
    hookDetail,
    formatDetail,
    structural,
  };
}
