import type { ContentLanguage } from "@/lib/recommended-creators";

export type OnboardingDict = {
  // shared
  stepLabel: (current: number, total: number) => string;
  back: string;
  continue_: string;
  saving: string;
  // language step
  langTitle: string;
  langSubtitle: string;
  langEnTitle: string;
  langEnBody: string;
  langEnCta: string;
  langArTitle: string;
  langArBody: string;
  langArCta: string;
  // creators — level step
  levelTitle: string;
  levelSubtitle: string;
  beginnerTitle: string;
  beginnerBody: string;
  beginnerCta: string;
  expertTitle: string;
  expertBody: (max: number) => string;
  expertCta: string;
  alreadyFollow: (n: number) => string;
  // creators — pick step
  pickTitle: string;
  pickSubtitle: string;
  pickedCounter: (n: number, max: number) => string;
  moreIndustries: string;
  soonBadge: string;
  emptyLangCreators: string;
  // creators — paste step
  pasteTitle: string;
  pasteSubtitle: string;
  pastePlaceholder: (i: number) => string;
  // posts-per-creator
  postsPerCreatorLabel: string;
  postsCount: (n: number) => string;
  postsPerCreatorHint: string;
  // errors
  errPickAtLeastOne: string;
  errMaxCreators: (max: number) => string;
  errAddValidUrl: string;
  errCouldNotSave: string;
  // voice — shared
  voiceBadge: string;
  questionCounter: (current: number, total: number) => string;
  inputPlaceholder: string;
  skip: string;
  next: string;
  finish: string;
  cmdEnterHint: string;
  // voice — final step
  finalTitle: string;
  finalSubtitle: string;
  generate: string;
  generating: string;
  // voice — profile output
  profileGenerated: string;
  saved: string;
  regenerate: string;
  regenerating: string;
  editAnswers: string;
  backHome: string;
  savedToProfile: string;
  // errors
  errGenerationFailed: string;
  errNetwork: string;
};

const en: OnboardingDict = {
  stepLabel: (c, t) => `Onboarding · Step ${c} of ${t}`,
  back: "← Back",
  continue_: "Continue",
  saving: "Saving…",

  langTitle: "What language will you create content in?",
  langSubtitle: "We'll surface creators in that language and tune your posts to it.",
  langEnTitle: "English",
  langEnBody: "I want to write and publish my LinkedIn posts in English.",
  langEnCta: "Continue in English",
  langArTitle: "Arabic / العربية",
  langArBody: "أريد إنشاء منشورات لينكدإن باللغة العربية.",
  langArCta: "المتابعة بالعربية",

  levelTitle: "Pick the creators you'll learn from",
  levelSubtitle: "We'll watch their posts daily and surface ideas in your inbox.",
  beginnerTitle: "I'm new to LinkedIn",
  beginnerBody: "See a recommended set of top creators, picked by industry. Pick up to 4.",
  beginnerCta: "Show me recommendations",
  expertTitle: "I already have favorites",
  expertBody: (m) => `Paste up to ${m} LinkedIn profile URLs of creators you follow.`,
  expertCta: "Paste my own list",
  alreadyFollow: (n) =>
    `You already follow ${n} creator${n === 1 ? "" : "s"}. Adding new ones won't remove them.`,

  pickTitle: "Pick up to 4 creators",
  pickSubtitle: "Choose an industry, then tap a creator to add or remove.",
  pickedCounter: (n, m) => `${n} / ${m} picked`,
  moreIndustries: "More industries & creators",
  soonBadge: "Soon",
  emptyLangCreators:
    "No recommended creators in this language yet. Go back and paste your own LinkedIn profile URLs instead.",

  pasteTitle: "Paste up to 4 LinkedIn profiles",
  pasteSubtitle:
    "Just the URL of each creator's profile (e.g. https://www.linkedin.com/in/justinwelsh).",
  pastePlaceholder: (i) => `https://www.linkedin.com/in/creator-${i}`,

  postsPerCreatorLabel: "Posts to scrape per creator",
  postsCount: (n) => `${n} posts`,
  postsPerCreatorHint:
    "We'll start scraping right after you continue. New posts arrive 1× per day after that.",

  errPickAtLeastOne: "Pick at least one creator to continue.",
  errMaxCreators: (m) => `You can pick up to ${m} creators. Remove one to add another.`,
  errAddValidUrl: "Add at least one valid LinkedIn URL (https://www.linkedin.com/in/...).",
  errCouldNotSave: "Could not save",

  voiceBadge: "Voice profile",
  questionCounter: (c, t) => `Question ${c} of ${t}`,
  inputPlaceholder: "Type your answer…",
  skip: "Skip",
  next: "Next →",
  finish: "Finish →",
  cmdEnterHint: "to continue",

  finalTitle: "All questions answered",
  finalSubtitle: "Ready to generate your voice profile from your answers.",
  generate: "Generate voice profile →",
  generating: "Generating…",

  profileGenerated: "Voice profile generated",
  saved: "✓ Saved",
  regenerate: "Regenerate",
  regenerating: "Regenerating…",
  editAnswers: "Edit answers",
  backHome: "Back to home →",
  savedToProfile: "✓ Saved to your profile",

  errGenerationFailed: "Generation failed",
  errNetwork: "Network error during generation",
};

const ar: OnboardingDict = {
  stepLabel: (c, t) => `تأهيل · الخطوة ${c} من ${t}`,
  back: "→ رجوع",
  continue_: "متابعة",
  saving: "جاري الحفظ…",

  langTitle: "ما اللغة التي ستنشئ بها المحتوى؟",
  langSubtitle: "سنعرض لك صانعي محتوى بتلك اللغة ونضبط منشوراتك عليها.",
  langEnTitle: "English",
  langEnBody: "I want to write and publish my LinkedIn posts in English.",
  langEnCta: "Continue in English",
  langArTitle: "العربية",
  langArBody: "أريد إنشاء منشورات لينكدإن باللغة العربية.",
  langArCta: "المتابعة بالعربية",

  levelTitle: "اختر صانعي المحتوى الذين ستتعلم منهم",
  levelSubtitle: "سنراقب منشوراتهم يوميًا ونرسل لك أفكارًا في بريدك.",
  beginnerTitle: "أنا جديد على لينكدإن",
  beginnerBody: "اطّلع على قائمة موصى بها من أفضل صانعي المحتوى، مصنّفة حسب المجال. اختر حتى 4.",
  beginnerCta: "اعرض لي التوصيات",
  expertTitle: "لديّ صانعو محتوى مفضّلون بالفعل",
  expertBody: (m) => `الصق حتى ${m} روابط لملفات صانعي محتوى تتابعهم على لينكدإن.`,
  expertCta: "ألصق قائمتي",
  alreadyFollow: (n) =>
    `أنت تتابع بالفعل ${n} من صانعي المحتوى. إضافة جدد لن يحذف الحاليين.`,

  pickTitle: "اختر حتى 4 صانعي محتوى",
  pickSubtitle: "اختر مجالًا، ثم اضغط على صانع لإضافته أو إزالته.",
  pickedCounter: (n, m) => `تم اختيار ${n} من ${m}`,
  moreIndustries: "مجالات وصنّاع محتوى إضافيون",
  soonBadge: "قريبًا",
  emptyLangCreators:
    "لا يوجد صانعو محتوى موصى بهم بهذه اللغة بعد. عُد وألصق روابط لينكدإن الخاصة بك بدلاً من ذلك.",

  pasteTitle: "ألصق حتى 4 ملفات لينكدإن",
  pasteSubtitle:
    "فقط رابط ملف كل صانع محتوى (مثال: https://www.linkedin.com/in/justinwelsh).",
  pastePlaceholder: (i) => `https://www.linkedin.com/in/creator-${i}`,

  postsPerCreatorLabel: "عدد المنشورات لكل صانع",
  postsCount: (n) => `${n} منشور`,
  postsPerCreatorHint:
    "سنبدأ السحب فور المتابعة. منشورات جديدة تصل مرة واحدة يوميًا بعد ذلك.",

  errPickAtLeastOne: "اختر صانع محتوى واحدًا على الأقل للمتابعة.",
  errMaxCreators: (m) => `يمكنك اختيار حتى ${m} صانعي محتوى. أزل واحدًا لإضافة آخر.`,
  errAddValidUrl: "أضف رابط لينكدإن صالحًا واحدًا على الأقل (https://www.linkedin.com/in/...).",
  errCouldNotSave: "تعذّر الحفظ",

  voiceBadge: "ملف الصوت",
  questionCounter: (c, t) => `سؤال ${c} من ${t}`,
  inputPlaceholder: "اكتب إجابتك…",
  skip: "تخطّي",
  next: "التالي ←",
  finish: "إنهاء ←",
  cmdEnterHint: "للمتابعة",

  finalTitle: "تمّت الإجابة على كل الأسئلة",
  finalSubtitle: "جاهز لإنشاء ملف صوتك من إجاباتك.",
  generate: "إنشاء ملف الصوت ←",
  generating: "جاري الإنشاء…",

  profileGenerated: "تم إنشاء ملف الصوت",
  saved: "✓ تم الحفظ",
  regenerate: "إعادة الإنشاء",
  regenerating: "جاري إعادة الإنشاء…",
  editAnswers: "تعديل الإجابات",
  backHome: "← العودة للرئيسية",
  savedToProfile: "✓ تم الحفظ في ملفك",

  errGenerationFailed: "فشل الإنشاء",
  errNetwork: "خطأ في الشبكة أثناء الإنشاء",
};

export function getDict(lang: ContentLanguage): OnboardingDict {
  return lang === "ar" ? ar : en;
}

export function dirFor(lang: ContentLanguage): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
