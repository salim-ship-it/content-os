import type { ContentLanguage } from "@/lib/recommended-creators";

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
};

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
};

export function getDashboardDict(lang: ContentLanguage): DashboardDict {
  return lang === "ar" ? ar : en;
}

export function dirFor(lang: ContentLanguage): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
