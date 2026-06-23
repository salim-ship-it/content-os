# Getting Started with Content OS

Welcome! You have a complete LinkedIn content creation system ready to use. Follow these steps to get up and running in **15 minutes**.

---

## **What You Have**

✅ **Content OS App** — AI-powered LinkedIn content tool  
✅ **1,000 Pre-loaded Posts** — Your swipe file is ready  
✅ **Claude AI Integration** — Generate, score, and improve posts  
✅ **All Tools Included** — Ideas, voice profile, lead magnets, preview

---

## **⏱️ Quick Setup (15 minutes)**

### **Step 1: Get Your Accounts** (5 min)

You need **2 free accounts**:

**A) Supabase** (Database)
- Go to https://supabase.com/
- Sign up with email or GitHub
- Create a new project (free tier)
- Wait 2-3 minutes for it to initialize

**B) Anthropic Claude** (AI)
- Go to https://console.anthropic.com/
- Sign up or log in
- Click "API Keys" 
- Create a new key
- You get $5/month free credit

### **Step 2: Clone the Repo** (2 min)

```bash
git clone https://github.com/salim-ship-it/content-os.git
cd content-os
npm install
```

### **Step 3: Get Your Credentials** (3 min)

**From Supabase:**
- Click Settings → API
- Copy "Project URL" (looks like `https://xxx.supabase.co`)
- Copy "Service Role Key" (starts with `sb_secret_`)

**From Anthropic:**
- Copy your API key (starts with `sk-ant-`)

### **Step 4: Create `.env.local`** (2 min)

In your project root, create a file called `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_xxxxx...
```

Paste your credentials from Step 3.

### **Step 5: Import the Posts** (1 min)

Place the `posts-export.json` file in your project root, then run:

```bash
npx ts-node scripts/import-posts.ts posts-export.json
```

You should see:
```
✅ Successfully imported 1000 posts
🎉 Your swipe file is ready!
```

### **Step 6: Start the App** (1 min)

```bash
npm run dev
```

Open: http://localhost:3000

---

## **🎯 Your First 10 Minutes in the App**

1. **Go to Voice Profile** (`/onboarding/voice`)
   - Answer the questions to describe your writing style
   - This personalizes all AI suggestions

2. **Browse Ideas** (`/ideas`)
   - See all 1,000 posts organized by source
   - Filter by LinkedIn, Reddit, Instagram, YouTube

3. **Try Chat** (Home page)
   - Click "Write in creator style"
   - AI will ask 4 questions
   - Get a personalized post

4. **Preview** (Preview page)
   - See how your post looks on LinkedIn
   - Mobile and desktop views

---

## **📖 Next Steps**

**Learn the tools:**
- **Home** — Chat with AI about content
- **Voice Profile** — Define your unique voice
- **Ideas** — Generate or browse post ideas
- **Sources** — Manage content sources
- **Swipe File** — View all 1,000 posts
- **Lead Magnets** — Create posts with offers
- **Preview** — See LinkedIn rendering

**Create your first post:**
1. Go to Home
2. Click "Suggest ideas"
3. Pick an idea you like
4. Click "Write in creator style"
5. Answer the 4 questions
6. Get your personalized post
7. Use Preview to see it on LinkedIn

---

## **❓ Troubleshooting**

**"App won't start"**
- Did you run `npm install`? (Step 2)
- Check `.env.local` has all 3 keys
- Try: `rm -rf node_modules && npm install`

**"Import failed"**
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
- Make sure `posts-export.json` is in project root
- Check your Supabase project is initialized

**"No posts showing"**
- Refresh the browser
- Go to `/ideas` → All time tab
- Check browser console (F12) for errors

**"Claude API error"**
- Verify your ANTHROPIC_API_KEY is correct
- Make sure it starts with `sk-ant-`
- Check you have API credits at https://console.anthropic.com/

---

## **📚 Full Documentation**

For more details, see:
- **README.md** — Project overview
- **MOATAZ_SETUP.md** — Detailed setup guide
- **SETUP.md** — All API configuration options
- **PERSONALIZATION.md** — How to customize

---

## **✨ You're Ready!**

Your LinkedIn content system is now live. Start creating and refining posts with AI assistance.

**Happy creating!** 🚀
