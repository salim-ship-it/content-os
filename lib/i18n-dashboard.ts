import type { ContentLanguage } from "@/lib/recommended-creators";

export type ChatCommand = {
  key: "suggestIdeas" | "writeInCreatorStyle" | "scoreMyPost" | "iteratePost" | "changeHook" | "createLeadMagnet";
  label: string;
  icon: string;
  prompt: string;
  partial?: boolean;
};

export type DashboardDict = {
  // sidebar nav
  navHome: string;
  navVoiceProfile: string;
  navIdeas: string;
  navSources: string;
  navSwipeFile: string;
  navLeadMagnets: string;
  navImage: string;
  navPreview: string;
  navLearn: string;
  signOut: string;
  showSidebar: string;
  hideSidebar: string;
  pendingBadge: string;
  // home / chat
  brandTagline: string;
  homeTitle: string;
  homeSubtitle: string;
  newChat: string;
  currentChat: string;
  hideHistory: string;
  historyCount: (n: number) => string;
  messagesCount: (n: number) => string;
  deleteChat: string;
  inputPlaceholder: string;
  modelLabel: string;
  errorPrefix: string;
  errorGeneric: string;
  commands: ChatCommand[];
};

const enCommands: ChatCommand[] = [
  {
    key: "suggestIdeas",
    label: "Suggest ideas",
    icon: "💡",
    prompt: "Suggest me 5 content ideas I can write about this week. Pick from the top-performing posts in my database and give me a unique angle for each one.",
  },
  {
    key: "writeInCreatorStyle",
    label: "Write in creator style",
    icon: "✍️",
    prompt: "Write a LinkedIn post in the style of ",
    partial: true,
  },
  {
    key: "scoreMyPost",
    label: "Score my post",
    icon: "📊",
    prompt: "Score this post using the 6-dimension rubric (AI Smell, Hook, CTA, Format, Structure, Storytelling). Give me the score out of 60 and one fix per dimension:\n\n",
    partial: true,
  },
  {
    key: "iteratePost",
    label: "Iterate post",
    icon: "🔄",
    prompt: "Take this post and improve it based on my voice profile. Keep what works, fix what doesn't:\n\n",
    partial: true,
  },
  {
    key: "changeHook",
    label: "Change the hook",
    icon: "🎣",
    prompt: "Give me 10 hook variations for this post idea. Mix emotional triggers (Desire, Curiosity, Fear). Each hook should be under 10 words:\n\n",
    partial: true,
  },
  {
    key: "createLeadMagnet",
    label: "Create a lead magnet",
    icon: "🧲",
    prompt:
      "I want to create a lead magnet LinkedIn post. First, fetch my saved lead magnet posts from /api/lead-magnets to see what's been working in my swipe file. Then help me create a new lead magnet post by:\n\n1. Ask me what topic/resource I want to offer (playbook, template, checklist, vault, etc.)\n2. Show me 3 post structures inspired by the highest-engagement lead magnet posts in my swipe file\n3. Write the full post draft using the winning patterns: strong hook, clear value stack, social proof if I have it, and a comment-trigger CTA\n4. Score it against the best lead magnets in my database\n\nStart by pulling my lead magnet swipe file and telling me what patterns are winning.",
  },
];

const arCommands: ChatCommand[] = [
  {
    key: "suggestIdeas",
    label: "اقترح أفكارًا",
    icon: "💡",
    prompt: "اقترح عليّ 5 أفكار محتوى يمكنني الكتابة عنها هذا الأسبوع. اختر من المنشورات الأعلى أداءً في قاعدة بياناتي وأعطني زاوية فريدة لكل فكرة. أجب باللغة العربية.",
  },
  {
    key: "writeInCreatorStyle",
    label: "اكتب بأسلوب صانع محتوى",
    icon: "✍️",
    prompt: "اكتب منشور لينكدإن باللغة العربية بأسلوب ",
    partial: true,
  },
  {
    key: "scoreMyPost",
    label: "قيّم منشوري",
    icon: "📊",
    prompt: "قيّم هذا المنشور باستخدام معايير الأبعاد الستة (الرائحة الذكية، الجاذبية، الدعوة للتفاعل، التنسيق، البنية، الحكاية). أعطني الدرجة من 60 وإصلاحًا واحدًا لكل بُعد. أجب باللغة العربية:\n\n",
    partial: true,
  },
  {
    key: "iteratePost",
    label: "حسّن المنشور",
    icon: "🔄",
    prompt: "خذ هذا المنشور وحسّنه بناءً على ملف صوتي. احتفظ بما يعمل وأصلح ما لا يعمل. أجب باللغة العربية:\n\n",
    partial: true,
  },
  {
    key: "changeHook",
    label: "غيّر الجاذب",
    icon: "🎣",
    prompt: "أعطني 10 صياغات بديلة للجاذب (الجملة الأولى) لفكرة هذا المنشور. اخلط بين المحفزات العاطفية (الرغبة، الفضول، الخوف). كل جاذب يجب أن يكون أقل من 10 كلمات. أجب باللغة العربية:\n\n",
    partial: true,
  },
  {
    key: "createLeadMagnet",
    label: "أنشئ مغناطيس عملاء",
    icon: "🧲",
    prompt:
      "أريد إنشاء منشور مغناطيس عملاء على لينكدإن. أولًا، اجلب منشورات مغناطيس العملاء المحفوظة من /api/lead-magnets لمعرفة ما الذي ينجح في ملف الإلهام. ثم ساعدني على إنشاء منشور جديد عبر:\n\n1. اسألني عن الموضوع/المورد الذي أريد تقديمه (كتاب، قالب، قائمة تحقق، خزينة، إلخ).\n2. اعرض لي 3 بنى للمنشور مستوحاة من أعلى منشورات المغناطيس تفاعلًا.\n3. اكتب المسودة الكاملة باستخدام الأنماط الرابحة: جاذب قوي، قيمة واضحة، دليل اجتماعي إن وُجد، ودعوة للتفاعل في التعليقات.\n4. قيّمه مقابل أفضل المغناطيسات في قاعدة بياناتي.\n\nابدأ بسحب ملف إلهام المغناطيسات وأخبرني بالأنماط الرابحة. أجب باللغة العربية.",
  },
];

const en: DashboardDict = {
  navHome: "Home",
  navVoiceProfile: "Voice profile",
  navIdeas: "Ideas",
  navSources: "Sources",
  navSwipeFile: "Swipe File",
  navLeadMagnets: "Lead Magnets",
  navImage: "Image",
  navPreview: "Preview",
  navLearn: "Learn",
  signOut: "Sign out",
  showSidebar: "Show sidebar",
  hideSidebar: "Hide sidebar",
  pendingBadge: "Pending",

  brandTagline: "Content OS",
  homeTitle: "What do you want to write?",
  homeSubtitle: "Search ideas, imitate a post, draft content, score your writing.",
  newChat: "+ New chat",
  currentChat: "Current",
  hideHistory: "Hide history",
  historyCount: (n) => `History (${n})`,
  messagesCount: (n) => `${n} messages`,
  deleteChat: "Delete",
  inputPlaceholder: "Search ideas, imitate a post, draft content...",
  modelLabel: "Claude Sonnet 4.6",
  errorPrefix: "Error",
  errorGeneric: "Something went wrong",
  commands: enCommands,
};

const ar: DashboardDict = {
  navHome: "الرئيسية",
  navVoiceProfile: "ملف الصوت",
  navIdeas: "الأفكار",
  navSources: "المصادر",
  navSwipeFile: "ملف الإلهام",
  navLeadMagnets: "مغناطيس العملاء",
  navImage: "الصور",
  navPreview: "المعاينة",
  navLearn: "تعلّم",
  signOut: "تسجيل الخروج",
  showSidebar: "إظهار الشريط الجانبي",
  hideSidebar: "إخفاء الشريط الجانبي",
  pendingBadge: "قريبًا",

  brandTagline: "كونتنت أو إس",
  homeTitle: "ماذا تريد أن تكتب؟",
  homeSubtitle: "ابحث عن أفكار، قلّد منشورًا، اكتب مسودة، وقيّم كتابتك.",
  newChat: "+ محادثة جديدة",
  currentChat: "الحالية",
  hideHistory: "إخفاء السجل",
  historyCount: (n) => `السجل (${n})`,
  messagesCount: (n) => `${n} رسالة`,
  deleteChat: "حذف",
  inputPlaceholder: "ابحث عن أفكار، قلّد منشورًا، اكتب مسودة…",
  modelLabel: "Claude Sonnet 4.6",
  errorPrefix: "خطأ",
  errorGeneric: "حدث خطأ ما",
  commands: arCommands,
};

export function getDashboardDict(lang: ContentLanguage): DashboardDict {
  return lang === "ar" ? ar : en;
}

export function dirFor(lang: ContentLanguage): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
