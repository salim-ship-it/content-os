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
    question_ar: "ما الذي تفعله فعليًا يوميًا في عملك؟",
  },
  {
    id: "core-belief",
    type: "long-text",
    question: "What does most people in your space get wrong?",
    question_ar: "ما الذي يخطئ فيه معظم الناس في مجالك؟",
  },
  {
    id: "origin-moment",
    type: "long-text",
    question:
      "Tell me the story of one specific moment that shaped how you work today.",
    question_ar:
      "احكِ لي قصة لحظة معيّنة شكّلت طريقة عملك اليوم.",
  },
  {
    id: "rhythm",
    type: "single",
    question: "When you write, what feels right to you?",
    question_ar: "حين تكتب، ما الذي يبدو طبيعيًا لك؟",
    options: [
      "Short, punchy sentences. One idea per line.",
      "Flowing paragraphs that build momentum.",
      "A mix — short hooks, then longer explanations.",
      "I don't think about it, I just write.",
    ],
    options_ar: [
      "جمل قصيرة وقوية. فكرة واحدة في كل سطر.",
      "فقرات متدفقة تبني الزخم.",
      "مزيج — افتتاحيات قصيرة ثم شروحات أطول.",
      "لا أفكر في الأمر، أكتب فحسب.",
    ],
  },
  {
    id: "register",
    type: "single",
    question: "Which version of this sounds most like you?",
    question_ar: "أي صياغة من هذه تشبهك أكثر؟",
    options: [
      "We help companies scale their outbound pipeline.",
      "We build the machine that gets you meetings.",
      "We fix your broken sales process so leads actually convert.",
      "We do the outbound stuff most founders hate doing.",
    ],
    options_ar: [
      "نساعد الشركات على توسيع قنوات التواصل الخارجي.",
      "نبني الآلة التي تحصل لك على اجتماعات.",
      "نصلح عملية البيع المعطّلة لديك حتى يتحول العملاء فعلًا.",
      "نقوم بأعمال التواصل الخارجي التي يكره أغلب المؤسسين القيام بها.",
    ],
  },
  {
    id: "swearing",
    type: "single",
    question: "Where do you sit on swearing in posts?",
    question_ar: "ما موقفك من استخدام كلمات نابية في المنشورات؟",
    options: [
      "Never — keep it professional.",
      "Rarely — only when it really lands.",
      "Sometimes — it adds personality.",
      "Often — it's how I actually talk.",
    ],
    options_ar: [
      "أبدًا — أحافظ على الطابع المهني.",
      "نادرًا — فقط حين يكون لها أثر حقيقي.",
      "أحيانًا — تضيف شخصية.",
      "كثيرًا — هكذا أتحدث فعلًا.",
    ],
  },
  {
    id: "hard-nos",
    type: "multi-text",
    question: "Which of these phrases would you NEVER write?",
    question_ar: "أيٌّ من هذه العبارات لن تكتبها أبدًا؟",
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
      "لنتعمّق",
      "نقطة تحوّل",
      "أطلق إمكاناتك",
      "تكامل وتآزر",
      "نعاود التواصل",
      "نُحدث فرقًا",
      "في نهاية المطاف",
      "ليس بالأمر المعقد",
      "ثمار قريبة المنال",
      "قائد فكري",
      "مُغيِّر للمجال",
      "قيمة مضافة",
      "الاستفادة من",
    ],
  },
  {
    id: "ideal-reader",
    type: "short-text",
    question: "Who is the ideal reader of your posts?",
    question_ar: "من هو القارئ المثالي لمنشوراتك؟",
  },
  {
    id: "right-to-talk",
    type: "short-text",
    question: "What gives you the right to talk about this?",
    question_ar: "ما الذي يمنحك الحق في الحديث عن هذا؟",
  },
  {
    id: "humor",
    type: "single",
    question: "When do you go for humor in a post?",
    question_ar: "متى تلجأ إلى الفكاهة في منشور؟",
    options: [
      "Almost never — I keep things serious.",
      "Only in the hook to grab attention.",
      "Throughout — humor is part of my voice.",
      "When I'm making fun of bad practices in the industry.",
    ],
    options_ar: [
      "تقريبًا أبدًا — أُبقي الأمور جدية.",
      "فقط في الافتتاحية لجذب الانتباه.",
      "طوال المنشور — الفكاهة جزء من صوتي.",
      "حين أسخر من ممارسات سيئة في المجال.",
    ],
  },
  {
    id: "endings",
    type: "single",
    question: "Your favorite way to end a post is:",
    question_ar: "طريقتك المفضلة لإنهاء المنشور هي:",
    options: [
      "A clear takeaway or lesson.",
      "A question that sparks comments.",
      "A bold, controversial statement.",
      "A call to action (DM me, link in comments, etc.).",
      "Just stop. No wrap-up needed.",
    ],
    options_ar: [
      "خلاصة أو درس واضح.",
      "سؤال يُشعل التعليقات.",
      "جملة جريئة ومثيرة للجدل.",
      "دعوة لاتخاذ إجراء (راسلني، الرابط في التعليقات، إلخ).",
      "أتوقف فحسب. لا داعي للختام.",
    ],
  },
  {
    id: "coffee-baseline",
    type: "long-text",
    question:
      "You're at a coffee with someone who gets your world. They ask what you've been working on. Answer the way you'd actually say it — not how you'd pitch it.",
    question_ar:
      "أنت في مقهى مع شخص يفهم عالمك. يسألك عمّا تعمل عليه. أجب كما تتحدث فعلًا — لا كما تُقدم عرضًا تجاريًا.",
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
