export type QuestionType = "long-text" | "short-text" | "single" | "multi-text";

export type VoiceQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
};

export type Answer = string | string[];

export type VoiceDraft = {
  answers: Record<string, Answer>;
};

export const VOICE_QUESTIONS: VoiceQuestion[] = [
  {
    id: "identity",
    type: "long-text",
    question: "What do you actually do day-to-day?",
  },
  {
    id: "core-belief",
    type: "long-text",
    question: "What does most people in your space get wrong?",
  },
  {
    id: "origin-moment",
    type: "long-text",
    question:
      "Tell me the story of one specific moment that shaped how you work today.",
  },
  {
    id: "rhythm",
    type: "single",
    question: "When you write, what feels right to you?",
    options: [
      "Short, punchy sentences. One idea per line.",
      "Flowing paragraphs that build momentum.",
      "A mix — short hooks, then longer explanations.",
      "I don't think about it, I just write.",
    ],
  },
  {
    id: "register",
    type: "single",
    question: "Which version of this sounds most like you?",
    options: [
      "We help companies scale their outbound pipeline.",
      "We build the machine that gets you meetings.",
      "We fix your broken sales process so leads actually convert.",
      "We do the outbound stuff most founders hate doing.",
    ],
  },
  {
    id: "swearing",
    type: "single",
    question: "Where do you sit on swearing in posts?",
    options: [
      "Never — keep it professional.",
      "Rarely — only when it really lands.",
      "Sometimes — it adds personality.",
      "Often — it's how I actually talk.",
    ],
  },
  {
    id: "hard-nos",
    type: "multi-text",
    question: "Which of these phrases would you NEVER write?",
    options: [
      "Let's dive in",
      "Game-changer",
      "Unlock your potential",
      "Synergy",
      "Circle back",
      "Move the needle",
      "At the end of the day",
      "It's not rocket science",
      "Low-hanging fruit",
      "Thought leader",
      "Disruptive",
      "Value-add",
      "Leverage",
    ],
  },
  {
    id: "ideal-reader",
    type: "short-text",
    question: "Who is the ideal reader of your posts?",
  },
  {
    id: "right-to-talk",
    type: "short-text",
    question: "What gives you the right to talk about this?",
  },
  {
    id: "humor",
    type: "single",
    question: "When do you go for humor in a post?",
    options: [
      "Almost never — I keep things serious.",
      "Only in the hook to grab attention.",
      "Throughout — humor is part of my voice.",
      "When I'm making fun of bad practices in the industry.",
    ],
  },
  {
    id: "endings",
    type: "single",
    question: "Your favorite way to end a post is:",
    options: [
      "A clear takeaway or lesson.",
      "A question that sparks comments.",
      "A bold, controversial statement.",
      "A call to action (DM me, link in comments, etc.).",
      "Just stop. No wrap-up needed.",
    ],
  },
  {
    id: "coffee-baseline",
    type: "long-text",
    question:
      "You're at a coffee with someone who gets your world. They ask what you've been working on. Answer the way you'd actually say it — not how you'd pitch it.",
  },
];
