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
  // ideas
  ideasTagline: string;
  ideasTitle: string;
  ideasSortNewestAdded: string;
  ideasSortNewestPublished: string;
  ideasSortMostLiked: string;
  ideasSortMostDiscussed: string;
  ideasAllTypes: string;
  ideasSearchPlaceholder: string;
  ideasEmpty: string;
  ideasCountLabel: (n: number) => string;
  ideasNewBadge: string;
  ideasMore: string;
  ideasLikes: string;
  ideasComments: string;
  ideasViews: string;
  ideasReposts: string;
  ideasWhyItWorked: string;
  ideasOpenOriginal: string;
  ideasDateToday: string;
  ideasDateWeek: string;
  ideasDateAll: string;
  ideasSourceAll: string;
  ideasSourceLinkedIn: string;
  ideasSourceReddit: string;
  ideasSourceNewsletter: string;
  ideasSourceYouTube: string;
  ideasTypeLabel: (type: string) => string;
  // sources
  sourcesTagline: string;
  sourcesTitle: string;
  sourcesSubtitle: string;
  sourcesRescan: string;
  sourcesRescanning: string;
  sourcesRestore: string;
  sourcesRestoring: string;
  sourcesRestoreConfirm: string;
  sourcesRestoreSuccess: (restored: number, total: number) => string;
  sourcesRestoreFail: string;
  sourcesRescanFail: (err: string) => string;
  sourcesRescanQueued: (n: number) => string;
  sourcesRescanRetry: string;
  sourcesScrapeNotice: (name: string) => string;
  sourcesAddHeading: (kind: string) => string;
  sourcesKindLinkedIn: string;
  sourcesKindReddit: string;
  sourcesKindNewsletter: string;
  sourcesKindYouTube: string;
  sourcesNamePlaceholder: string;
  sourcesUrlPlaceholder: string;
  sourcesNotePlaceholder: string;
  sourcesMaxPlaceholder: string;
  sourcesAdd: string;
  sourcesColName: string;
  sourcesColUrl: string;
  sourcesColNote: string;
  sourcesColMax: string;
  sourcesColStatus: string;
  sourcesEnabled: string;
  sourcesDisabled: string;
  sourcesRemove: string;
  sourcesEmpty: (kind: string) => string;
  sourcesCount: (n: number) => string;
  // swipe file (creators)
  swipeTagline: string;
  swipeTitle: string;
  swipeSubtitle: (tracked: number, posts: number) => string;
  swipeSearchPlaceholder: string;
  swipeEmpty: string;
  swipePostsBadge: (n: number) => string;
  swipeAvgLikes: string;
  swipeBest: string;
  // learn
  learnTagline: string;
  learnTitle: string;
  learnCoachTagline: string;
  learnCoachTitle: string;
  learnCoachSubtitle: string;
  learnAnalyze: string;
  learnAnalyzing: string;
  learnRefresh: string;
  learnLoadingMain: string;
  learnLoadingSub: string;
  learnEmptyHint: string;
  learnAnalysisFooter: (myCount: number, creatorCount: number) => string;
  learnGeneratedOn: (date: string, time: string) => string;
  learnAddTitle: string;
  learnAddSubtitle: string;
  learnUrlLabel: string;
  learnUrlPlaceholder: string;
  learnTextLabel: string;
  learnTextPlaceholder: string;
  learnDateLabel: string;
  learnLikesLabel: string;
  learnCommentsLabel: string;
  learnSave: string;
  learnSaving: string;
  learnSaved: string;
  learnErrUrl: string;
  learnErrText: string;
  learnErrSaveFail: string;
  // image
  imageTitle: string;
  imageSubtitle: string;
  imageStep1: string;
  imageStep2: string;
  imagePostPlaceholder: string;
  imageBriefPlaceholder: string;
  imageAnalyze: string;
  imageAnalyzing: string;
  imageGenerate: string;
  imageGenerating: string;
  imageGenerateHint: string;
  imageDrawing: string;
  imageDownload: string;
  imageRendered: (sec: string) => string;
  imageErrAnalyzeFail: string;
  imageErrGenerateFail: string;
  imageErrTimeout: string;
  // preview
  previewTagline: string;
  previewTitle: string;
  previewModeBoth: string;
  previewModeDesktop: string;
  previewModeMobile: string;
  previewNameLabel: string;
  previewHeadlineLabel: string;
  previewContentLabel: string;
  previewContentPlaceholder: string;
  previewCharsLabel: string;
  previewWordsLabel: string;
  previewLinesLabel: string;
  previewLimitsBody: string;
  previewEmpty: string;
  previewDeviceMobile: string;
  previewDeviceDesktop: string;
  previewFollow: string;
  previewSeeMore: string;
  previewActionLike: string;
  previewActionComment: string;
  previewActionRepost: string;
  previewActionSend: string;
  previewEngagement: (likes: number, comments: number, reposts: number) => string;
  previewStatsExpanded: string;
  previewStatsFeed: string;
  // lead magnets
  lmTagline: string;
  lmTitle: string;
  lmSubtitle: (n: number) => string;
  lmSearchPlaceholder: string;
  lmCreateCta: string;
  lmAddTitle: string;
  lmSingleTab: string;
  lmBulkTab: string;
  lmUrlPlaceholder: string;
  lmNotesPlaceholder: string;
  lmAdd: string;
  lmBulkPlaceholder: string;
  lmScrapeAll: string;
  lmBulkDetected: (n: number) => string;
  lmErrNoUrls: string;
  lmScraping: string;
  lmSaved: string;
  lmBulkProgress: (i: number, n: number) => string;
  lmBulkSummary: (saved: number, skipped: number, failed: number) => string;
  lmLoading: string;
  lmEmptyTitle: string;
  lmEmptyBody: string;
  lmCardLikes: string;
  lmCardComments: string;
  lmCardUntitled: string;
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

  ideasTagline: "Swipe File",
  ideasTitle: "Ideas",
  ideasSortNewestAdded: "Newest added",
  ideasSortNewestPublished: "Newest published",
  ideasSortMostLiked: "Most liked",
  ideasSortMostDiscussed: "Most discussed",
  ideasAllTypes: "All types",
  ideasSearchPlaceholder: "Search posts...",
  ideasEmpty: "No posts match your filters.",
  ideasCountLabel: (n) => `${n} post${n === 1 ? "" : "s"}`,
  ideasNewBadge: "New",
  ideasMore: "...more",
  ideasLikes: "likes",
  ideasComments: "comments",
  ideasViews: "views",
  ideasReposts: "reposts",
  ideasWhyItWorked: "Why it worked",
  ideasOpenOriginal: "Open original →",
  ideasDateToday: "Today",
  ideasDateWeek: "This week",
  ideasDateAll: "All time",
  ideasSourceAll: "All",
  ideasSourceLinkedIn: "LinkedIn",
  ideasSourceReddit: "Reddit",
  ideasSourceNewsletter: "Newsletter",
  ideasSourceYouTube: "YouTube",
  ideasTypeLabel: (type) => {
    const m: Record<string, string> = {
      "hot-takes": "Hot take", "hot take": "Hot take",
      stories: "Story", story: "Story",
      "case-studies": "Case study", "case study": "Case study",
      educational: "Educational", insightful: "Insightful",
      transparency: "Transparency",
      announcements: "Announcement", announcement: "Announcement",
      engagement: "Engagement",
      reddit: "Reddit", newsletters: "Newsletter", youtube: "YouTube",
    };
    return m[type] || type;
  },

  sourcesTagline: "Watchlist",
  sourcesTitle: "Sources",
  sourcesSubtitle: "Creators, subreddits, newsletters and channels we watch for you.",
  sourcesRescan: "↻ Rescan all",
  sourcesRescanning: "Rescanning...",
  sourcesRestore: "↻ Restore defaults",
  sourcesRestoring: "Restoring...",
  sourcesRestoreConfirm: "Add the 35 default sources? Any sources you've already added will be kept.",
  sourcesRestoreSuccess: (r, total) => `Restored ${r} sources (${total} total).`,
  sourcesRestoreFail: "Restore failed. Try again.",
  sourcesRescanFail: (err) => `Rescan failed: ${err}`,
  sourcesRescanQueued: (n) => `Queued ${n} source${n !== 1 ? "s" : ""} — check Swipe File in ~5 min.`,
  sourcesRescanRetry: "Rescan failed. Try again.",
  sourcesScrapeNotice: (name) => `Scraping posts for "${name}" in background — check Swipe File in ~5 min.`,
  sourcesAddHeading: (k) => `Add ${k} source`,
  sourcesKindLinkedIn: "LinkedIn",
  sourcesKindReddit: "Reddit",
  sourcesKindNewsletter: "Newsletters",
  sourcesKindYouTube: "YouTube",
  sourcesNamePlaceholder: "Name",
  sourcesUrlPlaceholder: "URL",
  sourcesNotePlaceholder: "Note (optional)",
  sourcesMaxPlaceholder: "Max",
  sourcesAdd: "Add",
  sourcesColName: "Name",
  sourcesColUrl: "URL",
  sourcesColNote: "Note",
  sourcesColMax: "Max",
  sourcesColStatus: "Status",
  sourcesEnabled: "enabled",
  sourcesDisabled: "disabled",
  sourcesRemove: "Remove",
  sourcesEmpty: (k) => `No ${k} sources yet.`,
  sourcesCount: (n) => `${n} source${n !== 1 ? "s" : ""}`,

  swipeTagline: "Swipe File",
  swipeTitle: "Creators",
  swipeSubtitle: (t, p) => `${t} tracked creator${t === 1 ? "" : "s"} · ${p} posts · click a tile to open the dashboard`,
  swipeSearchPlaceholder: "Search creators...",
  swipeEmpty: "No creators match your search.",
  swipePostsBadge: (n) => `${n} posts`,
  swipeAvgLikes: "avg likes",
  swipeBest: "best",

  learnTagline: "Learn",
  learnTitle: "Learn & Improve",
  learnCoachTagline: "AI Coach",
  learnCoachTitle: "What to do next",
  learnCoachSubtitle: "Analyzes your posts vs top creators and tells you exactly what to change",
  learnAnalyze: "Analyze my posts",
  learnAnalyzing: "Analyzing...",
  learnRefresh: "Refresh analysis",
  learnLoadingMain: "Pulling your posts and comparing against top creators...",
  learnLoadingSub: "This takes 15-30 seconds",
  learnEmptyHint: 'Click "Analyze my posts" to get your first coaching report. Make sure you\'ve logged posts on the Analytics page first.',
  learnAnalysisFooter: (my, cr) => `Based on ${my} of your posts vs ${cr} top creator posts`,
  learnGeneratedOn: (d, t) => `Generated ${d} at ${t}`,
  learnAddTitle: "Add a post",
  learnAddSubtitle: "Just published something? Paste the URL + text here so it shows up in Analytics and gets included in the next coaching report.",
  learnUrlLabel: "LinkedIn post URL",
  learnUrlPlaceholder: "https://www.linkedin.com/posts/...",
  learnTextLabel: "Post text",
  learnTextPlaceholder: "Paste the full post copy...",
  learnDateLabel: "Date",
  learnLikesLabel: "Likes (optional)",
  learnCommentsLabel: "Comments (optional)",
  learnSave: "Save post",
  learnSaving: "Saving...",
  learnSaved: "✓ Added to Analytics",
  learnErrUrl: "Post URL is required.",
  learnErrText: "Post text is required.",
  learnErrSaveFail: "Failed to save",

  imageTitle: "Image",
  imageSubtitle: "Paste a post, analyze it to get a brief, then generate the diagram.",
  imageStep1: "Step 1 — paste your LinkedIn post",
  imageStep2: "Step 2 — review the brief, then generate",
  imagePostPlaceholder: "Paste your post here…",
  imageBriefPlaceholder: "Brief will appear here after you analyze the post. You can also type one manually.",
  imageAnalyze: "Analyze post",
  imageAnalyzing: "Analyzing…",
  imageGenerate: "Generate diagram",
  imageGenerating: "Generating…",
  imageGenerateHint: "⌘↵ to generate",
  imageDrawing: "Claude is drawing the scene… (~30–60s)",
  imageDownload: "Download PNG",
  imageRendered: (s) => `rendered in ${s}s`,
  imageErrAnalyzeFail: "Analysis failed",
  imageErrGenerateFail: "Generation failed",
  imageErrTimeout: "Timed out after 5 minutes — try again with a simpler brief.",

  previewTagline: "Preview",
  previewTitle: "Post Preview",
  previewModeBoth: "Both",
  previewModeDesktop: "🖥️ Desktop",
  previewModeMobile: "📱 Mobile",
  previewNameLabel: "Your name",
  previewHeadlineLabel: "Headline",
  previewContentLabel: "Post content",
  previewContentPlaceholder: "Paste your post here...",
  previewCharsLabel: "chars",
  previewWordsLabel: "words",
  previewLinesLabel: "lines",
  previewLimitsBody: 'LinkedIn limits: 3,000 chars max. Feed shows 3 lines before "…see more" — what\'s visible above depends on your line breaks. Sweet spot: 600–1,300 chars.',
  previewEmpty: "Paste your post on the left to see the preview",
  previewDeviceMobile: "📱 Mobile",
  previewDeviceDesktop: "🖥️ Desktop",
  previewFollow: "+ Follow",
  previewSeeMore: "…see more",
  previewActionLike: "👍 Like",
  previewActionComment: "💬 Comment",
  previewActionRepost: "🔄 Repost",
  previewActionSend: "📤 Send",
  previewEngagement: (l, c, r) => `${l} · ${c} comments · ${r} reposts`,
  previewStatsExpanded: "expanded",
  previewStatsFeed: "feed view (3 lines)",

  lmTagline: "Lead Magnets",
  lmTitle: "Swipe File",
  lmSubtitle: (n) => `${n} lead magnet post${n === 1 ? "" : "s"} saved`,
  lmSearchPlaceholder: "Search...",
  lmCreateCta: "+ Create a lead magnet",
  lmAddTitle: "Add lead magnet posts",
  lmSingleTab: "Single URL",
  lmBulkTab: "Bulk paste",
  lmUrlPlaceholder: "Paste LinkedIn post URL...",
  lmNotesPlaceholder: "Notes (optional)",
  lmAdd: "Add",
  lmBulkPlaceholder: "Paste LinkedIn post URLs — one per line.\n\nTip: Go to your LinkedIn profile → Comments tab → use the bookmarklet below to copy all post URLs, then paste here.",
  lmScrapeAll: "Scrape all",
  lmBulkDetected: (n) => `${n} URLs detected`,
  lmErrNoUrls: "No LinkedIn URLs found. Paste one URL per line.",
  lmScraping: "Scraping...",
  lmSaved: "✓ Saved",
  lmBulkProgress: (i, n) => `Scraping ${i}/${n}...`,
  lmBulkSummary: (s, k, f) => `✓ ${s} saved · ${k} duplicates · ${f} failed`,
  lmLoading: "Loading...",
  lmEmptyTitle: "No lead magnets yet",
  lmEmptyBody: "Paste a LinkedIn post URL above or wait for the daily comment scraper to populate this.",
  lmCardLikes: "likes",
  lmCardComments: "comments",
  lmCardUntitled: "Untitled",
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

  ideasTagline: "ملف الإلهام",
  ideasTitle: "الأفكار",
  ideasSortNewestAdded: "الأحدث إضافةً",
  ideasSortNewestPublished: "الأحدث نشرًا",
  ideasSortMostLiked: "الأكثر إعجابًا",
  ideasSortMostDiscussed: "الأكثر نقاشًا",
  ideasAllTypes: "كل الأنواع",
  ideasSearchPlaceholder: "ابحث في المنشورات…",
  ideasEmpty: "لا توجد منشورات تطابق الفلاتر.",
  ideasCountLabel: (n) => `${n} منشور`,
  ideasNewBadge: "جديد",
  ideasMore: "…المزيد",
  ideasLikes: "إعجاب",
  ideasComments: "تعليق",
  ideasViews: "مشاهدة",
  ideasReposts: "إعادة نشر",
  ideasWhyItWorked: "لماذا نجح",
  ideasOpenOriginal: "← فتح الأصلي",
  ideasDateToday: "اليوم",
  ideasDateWeek: "هذا الأسبوع",
  ideasDateAll: "كل الأوقات",
  ideasSourceAll: "الكل",
  ideasSourceLinkedIn: "لينكدإن",
  ideasSourceReddit: "ريديت",
  ideasSourceNewsletter: "نشرة بريدية",
  ideasSourceYouTube: "يوتيوب",
  ideasTypeLabel: (type) => {
    const m: Record<string, string> = {
      "hot-takes": "رأي حاد", "hot take": "رأي حاد",
      stories: "قصة", story: "قصة",
      "case-studies": "دراسة حالة", "case study": "دراسة حالة",
      educational: "تعليمي", insightful: "ثاقب",
      transparency: "شفافية",
      announcements: "إعلان", announcement: "إعلان",
      engagement: "تفاعل",
      reddit: "ريديت", newsletters: "نشرة بريدية", youtube: "يوتيوب",
    };
    return m[type] || type;
  },

  sourcesTagline: "قائمة المتابعة",
  sourcesTitle: "المصادر",
  sourcesSubtitle: "صنّاع المحتوى والمجتمعات والنشرات والقنوات التي نراقبها لك.",
  sourcesRescan: "↻ إعادة فحص الكل",
  sourcesRescanning: "جاري إعادة الفحص…",
  sourcesRestore: "↻ استعادة الافتراضي",
  sourcesRestoring: "جاري الاستعادة…",
  sourcesRestoreConfirm: "إضافة 35 مصدرًا افتراضيًا؟ سيتم الإبقاء على المصادر التي أضفتها بالفعل.",
  sourcesRestoreSuccess: (r, total) => `تمت استعادة ${r} مصادر (${total} إجمالًا).`,
  sourcesRestoreFail: "فشلت الاستعادة. حاول مجددًا.",
  sourcesRescanFail: (err) => `فشل إعادة الفحص: ${err}`,
  sourcesRescanQueued: (n) => `تمت إضافة ${n} مصدر للطابور — تحقق من ملف الإلهام بعد ~5 دقائق.`,
  sourcesRescanRetry: "فشل إعادة الفحص. حاول مجددًا.",
  sourcesScrapeNotice: (name) => `جاري سحب المنشورات لـ "${name}" في الخلفية — تحقق من ملف الإلهام بعد ~5 دقائق.`,
  sourcesAddHeading: (k) => `إضافة مصدر ${k}`,
  sourcesKindLinkedIn: "لينكدإن",
  sourcesKindReddit: "ريديت",
  sourcesKindNewsletter: "النشرات البريدية",
  sourcesKindYouTube: "يوتيوب",
  sourcesNamePlaceholder: "الاسم",
  sourcesUrlPlaceholder: "الرابط",
  sourcesNotePlaceholder: "ملاحظة (اختياري)",
  sourcesMaxPlaceholder: "الحد",
  sourcesAdd: "إضافة",
  sourcesColName: "الاسم",
  sourcesColUrl: "الرابط",
  sourcesColNote: "ملاحظة",
  sourcesColMax: "الحد",
  sourcesColStatus: "الحالة",
  sourcesEnabled: "مفعّل",
  sourcesDisabled: "متوقّف",
  sourcesRemove: "حذف",
  sourcesEmpty: (k) => `لا توجد مصادر ${k} بعد.`,
  sourcesCount: (n) => `${n} مصدر`,

  swipeTagline: "ملف الإلهام",
  swipeTitle: "صنّاع المحتوى",
  swipeSubtitle: (t, p) => `${t} صانع محتوى متابَع · ${p} منشور · انقر على بطاقة لفتح اللوحة`,
  swipeSearchPlaceholder: "ابحث عن صانع محتوى…",
  swipeEmpty: "لا يوجد صانعو محتوى يطابقون البحث.",
  swipePostsBadge: (n) => `${n} منشور`,
  swipeAvgLikes: "متوسط الإعجابات",
  swipeBest: "أفضل",

  learnTagline: "تعلّم",
  learnTitle: "تعلّم وحسّن",
  learnCoachTagline: "مدرّب الذكاء الاصطناعي",
  learnCoachTitle: "ماذا تفعل تاليًا",
  learnCoachSubtitle: "يحلّل منشوراتك مقابل أفضل صنّاع المحتوى ويخبرك تمامًا بما يجب تغييره",
  learnAnalyze: "حلّل منشوراتي",
  learnAnalyzing: "جاري التحليل…",
  learnRefresh: "تحديث التحليل",
  learnLoadingMain: "نسحب منشوراتك ونقارنها بأفضل صنّاع المحتوى…",
  learnLoadingSub: "يستغرق هذا 15-30 ثانية",
  learnEmptyHint: 'انقر "حلّل منشوراتي" للحصول على أول تقرير تدريبي. تأكّد من تسجيل منشوراتك في صفحة التحليلات أولًا.',
  learnAnalysisFooter: (my, cr) => `بناءً على ${my} من منشوراتك مقابل ${cr} من منشورات أفضل صنّاع المحتوى`,
  learnGeneratedOn: (d, t) => `تم الإنشاء في ${d} الساعة ${t}`,
  learnAddTitle: "إضافة منشور",
  learnAddSubtitle: "نشرت شيئًا توًا؟ الصق الرابط + النص هنا ليظهر في التحليلات ويُدرَج في التقرير التدريبي التالي.",
  learnUrlLabel: "رابط منشور لينكدإن",
  learnUrlPlaceholder: "https://www.linkedin.com/posts/...",
  learnTextLabel: "نص المنشور",
  learnTextPlaceholder: "الصق نص المنشور كاملًا…",
  learnDateLabel: "التاريخ",
  learnLikesLabel: "الإعجابات (اختياري)",
  learnCommentsLabel: "التعليقات (اختياري)",
  learnSave: "حفظ المنشور",
  learnSaving: "جاري الحفظ…",
  learnSaved: "✓ تمت الإضافة للتحليلات",
  learnErrUrl: "رابط المنشور مطلوب.",
  learnErrText: "نص المنشور مطلوب.",
  learnErrSaveFail: "فشل الحفظ",

  imageTitle: "الصور",
  imageSubtitle: "الصق منشورًا، حلّله للحصول على وصف، ثم أنشئ المخطط.",
  imageStep1: "الخطوة 1 — الصق منشور لينكدإن",
  imageStep2: "الخطوة 2 — راجع الوصف ثم أنشئ",
  imagePostPlaceholder: "الصق منشورك هنا…",
  imageBriefPlaceholder: "سيظهر الوصف هنا بعد تحليل المنشور. يمكنك أيضًا كتابة وصف يدويًا.",
  imageAnalyze: "حلّل المنشور",
  imageAnalyzing: "جاري التحليل…",
  imageGenerate: "أنشئ المخطط",
  imageGenerating: "جاري الإنشاء…",
  imageGenerateHint: "⌘↵ للإنشاء",
  imageDrawing: "كلود يرسم المشهد… (~30-60 ثانية)",
  imageDownload: "تنزيل PNG",
  imageRendered: (s) => `تم العرض في ${s} ث`,
  imageErrAnalyzeFail: "فشل التحليل",
  imageErrGenerateFail: "فشل الإنشاء",
  imageErrTimeout: "انتهى الوقت بعد 5 دقائق — حاول مجددًا بوصف أبسط.",

  previewTagline: "المعاينة",
  previewTitle: "معاينة المنشور",
  previewModeBoth: "كلاهما",
  previewModeDesktop: "🖥️ سطح المكتب",
  previewModeMobile: "📱 الجوال",
  previewNameLabel: "اسمك",
  previewHeadlineLabel: "العنوان الوظيفي",
  previewContentLabel: "نص المنشور",
  previewContentPlaceholder: "الصق منشورك هنا…",
  previewCharsLabel: "حرف",
  previewWordsLabel: "كلمة",
  previewLinesLabel: "سطر",
  previewLimitsBody: 'حدود لينكدإن: 3,000 حرف كحد أقصى. تظهر 3 أسطر في الخلاصة قبل "…المزيد" — وما يُرى يعتمد على فواصل الأسطر. المثالي: 600-1,300 حرف.',
  previewEmpty: "الصق منشورك على اليسار لرؤية المعاينة",
  previewDeviceMobile: "📱 الجوال",
  previewDeviceDesktop: "🖥️ سطح المكتب",
  previewFollow: "+ متابعة",
  previewSeeMore: "…المزيد",
  previewActionLike: "👍 إعجاب",
  previewActionComment: "💬 تعليق",
  previewActionRepost: "🔄 إعادة نشر",
  previewActionSend: "📤 إرسال",
  previewEngagement: (l, c, r) => `${l} · ${c} تعليق · ${r} إعادة نشر`,
  previewStatsExpanded: "موسّع",
  previewStatsFeed: "عرض الخلاصة (3 أسطر)",

  lmTagline: "مغناطيس العملاء",
  lmTitle: "ملف الإلهام",
  lmSubtitle: (n) => `${n} منشور مغناطيس عملاء محفوظ`,
  lmSearchPlaceholder: "ابحث…",
  lmCreateCta: "+ أنشئ مغناطيس عملاء",
  lmAddTitle: "إضافة منشورات مغناطيس عملاء",
  lmSingleTab: "رابط واحد",
  lmBulkTab: "لصق متعدد",
  lmUrlPlaceholder: "الصق رابط منشور لينكدإن…",
  lmNotesPlaceholder: "ملاحظات (اختياري)",
  lmAdd: "إضافة",
  lmBulkPlaceholder: "الصق روابط منشورات لينكدإن — رابطًا في كل سطر.\n\nنصيحة: اذهب لملفك على لينكدإن → تبويب التعليقات → استخدم الـ bookmarklet لنسخ كل الروابط، ثم الصقها هنا.",
  lmScrapeAll: "اسحب الكل",
  lmBulkDetected: (n) => `تم رصد ${n} رابطًا`,
  lmErrNoUrls: "لم يُعثر على روابط لينكدإن. الصق رابطًا في كل سطر.",
  lmScraping: "جاري السحب…",
  lmSaved: "✓ تم الحفظ",
  lmBulkProgress: (i, n) => `جاري سحب ${i}/${n}…`,
  lmBulkSummary: (s, k, f) => `✓ ${s} محفوظ · ${k} مكرر · ${f} فشل`,
  lmLoading: "جاري التحميل…",
  lmEmptyTitle: "لا توجد مغناطيسات بعد",
  lmEmptyBody: "الصق رابط منشور لينكدإن أعلاه أو انتظر السحب اليومي للتعليقات لتعبئة هذا.",
  lmCardLikes: "إعجاب",
  lmCardComments: "تعليق",
  lmCardUntitled: "بدون عنوان",
};

export function getDashboardDict(lang: ContentLanguage): DashboardDict {
  return lang === "ar" ? ar : en;
}

export function dirFor(lang: ContentLanguage): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
