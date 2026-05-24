export type QuestionType = "long-text" | "short-text" | "single" | "multi-text";

export type VoiceQuestion = {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
};

export type LocalizedVoiceQuestion = VoiceQuestion & {
  question_ar: string;
  options_ar?: string[];
};

export type Answer = string | string[];

export type VoiceDraft = {
  answers: Record<string, Answer>;
};

export const VOICE_QUESTIONS: LocalizedVoiceQuestion[] = [
  {
    id: "identity",
    type: "long-text",
    question: "What do you actually do day-to-day?",
    question_ar: "شو بتعمل فعلًا يوم بيوم بشغلك؟",
  },
  {
    id: "core-belief",
    type: "long-text",
    question: "What does most people in your space get wrong?",
    question_ar: "بشو معظم الناس بمجالك غلطانين؟",
  },
  {
    id: "origin-moment",
    type: "long-text",
    question:
      "Tell me the story of one specific moment that shaped how you work today.",
    question_ar:
      "احكيلي قصة لحظة معيّنة رسمت طريقة شغلك اليوم.",
  },
  {
    id: "rhythm",
    type: "single",
    question: "When you write, what feels right to you?",
    question_ar: "لما تكتب، شو اللي بحس طبيعي إلك؟",
    options: [
      "Short, punchy sentences. One idea per line.",
      "Flowing paragraphs that build momentum.",
      "A mix — short hooks, then longer explanations.",
      "I don't think about it, I just write.",
    ],
    options_ar: [
      "جمل قصيرة وقوية. فكرة وحدة بكل سطر.",
      "فقرات بتتدفق وبتبني زخم.",
      "مزيج — افتتاحيات قصيرة، بعدها شرح أطول.",
      "ما بفكر فيها، بكتب وبس.",
    ],
  },
  {
    id: "register",
    type: "single",
    question: "Which version of this sounds most like you?",
    question_ar: "أي صياغة منهم بتشبهك أكتر؟",
    options: [
      "We help companies scale their outbound pipeline.",
      "We build the machine that gets you meetings.",
      "We fix your broken sales process so leads actually convert.",
      "We do the outbound stuff most founders hate doing.",
    ],
    options_ar: [
      "بنساعد الشركات تكبّر قنوات الـ outbound تبعها.",
      "بنبني الآلة اللي بتجيبلك اجتماعات.",
      "بنصلّح عملية المبيعات المعطّلة عندك ليصير العملاء يحوّلوا فعلًا.",
      "بنعمل شغل الـ outbound اللي معظم المؤسسين بكرهوه.",
    ],
  },
  {
    id: "swearing",
    type: "single",
    question: "Where do you sit on swearing in posts?",
    question_ar: "شو موقفك من الشتائم بالمنشورات؟",
    options: [
      "Never — keep it professional.",
      "Rarely — only when it really lands.",
      "Sometimes — it adds personality.",
      "Often — it's how I actually talk.",
    ],
    options_ar: [
      "أبدًا — بحب أبقى محترف.",
      "نادرًا — بس لما يكون إلها وقع حقيقي.",
      "أحيانًا — بتعطي شخصية.",
      "كتير — هيك بحكي فعلًا.",
    ],
  },
  {
    id: "hard-nos",
    type: "multi-text",
    question: "Which of these phrases would you NEVER write?",
    question_ar: "أي وحدة من هاي العبارات ما رح تكتبها أبدًا؟",
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
    options_ar: [
      "خلّينا نتعمق",
      "نقطة تحوّل",
      "أطلق إمكاناتك",
      "تكامل وتآزر",
      "منرجع نحكي",
      "نعمل فرق",
      "بآخر المطاف",
      "مش علم صواريخ",
      "ثمار سهلة",
      "قائد فكري",
      "مغيّر للمجال",
      "قيمة مضافة",
      "نستفيد من",
    ],
  },
  {
    id: "ideal-reader",
    type: "short-text",
    question: "Who is the ideal reader of your posts?",
    question_ar: "مين القارئ المثالي لمنشوراتك؟",
  },
  {
    id: "right-to-talk",
    type: "short-text",
    question: "What gives you the right to talk about this?",
    question_ar: "شو اللي بيعطيك الحق تحكي عن هاد الموضوع؟",
  },
  {
    id: "humor",
    type: "single",
    question: "When do you go for humor in a post?",
    question_ar: "إيمتى بتستعمل الفكاهة بالمنشور؟",
    options: [
      "Almost never — I keep things serious.",
      "Only in the hook to grab attention.",
      "Throughout — humor is part of my voice.",
      "When I'm making fun of bad practices in the industry.",
    ],
    options_ar: [
      "تقريبًا أبدًا — بحب أبقى جدي.",
      "بس بالافتتاحية لشد الانتباه.",
      "طوال المنشور — الفكاهة جزء من صوتي.",
      "لما بسخر من ممارسات سيئة بالمجال.",
    ],
  },
  {
    id: "endings",
    type: "single",
    question: "Your favorite way to end a post is:",
    question_ar: "كيف بتحب تخلّص منشورك؟",
    options: [
      "A clear takeaway or lesson.",
      "A question that sparks comments.",
      "A bold, controversial statement.",
      "A call to action (DM me, link in comments, etc.).",
      "Just stop. No wrap-up needed.",
    ],
    options_ar: [
      "بخلاصة أو درس واضح.",
      "بسؤال بيشعل التعليقات.",
      "بجملة جريئة بتثير جدل.",
      "بدعوة لتصرّف (راسلني، الرابط بالتعليقات، إلخ.)",
      "بوقف وبس. مش لازم ختام.",
    ],
  },
  {
    id: "coffee-baseline",
    type: "long-text",
    question:
      "You're at a coffee with someone who gets your world. They ask what you've been working on. Answer the way you'd actually say it — not how you'd pitch it.",
    question_ar:
      "إنت ع القهوة مع شخص فاهم عالمك. سألك شو عم تشتغل عليه. جاوبه زي ما بتحكي فعلًا — مش زي عرض مبيعات.",
  },
];

export function localizeQuestion(
  q: LocalizedVoiceQuestion,
  lang: "en" | "ar"
): { question: string; options?: string[] } {
  if (lang === "ar") {
    return { question: q.question_ar, options: q.options_ar ?? q.options };
  }
  return { question: q.question, options: q.options };
}
