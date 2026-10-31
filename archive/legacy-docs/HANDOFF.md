# Content OS - Handoff Package

Everything you need to set up your own Content OS instance with pre-loaded posts.

---

## **📦 What You're Getting**

1. **GitHub Repository** — Complete Content OS app
2. **Posts Export** — 1,000 pre-loaded posts (LinkedIn, Reddit, Instagram, YouTube)
3. **Setup Instructions** — Step-by-step guide

---

## **🚀 Quick Start (5 minutes)**

### **Step 1: Fork the GitHub Repo**

Go to: https://github.com/salim-ship-it/content-os

Click **Fork** button (top right)

### **Step 2: Clone Your Fork**

```bash
git clone https://github.com/YOUR-USERNAME/content-os.git
cd content-os
npm install
```

### **Step 3: Create Supabase Account**

1. Go to https://supabase.com/
2. Sign up (free)
3. Create new project
4. Wait for project to initialize (~2 min)

### **Step 4: Get Your Supabase Credentials**

In Supabase dashboard:
1. Go to **Settings → API**
2. Copy these values:
   - **Project URL** (labeled "Project URL")
   - **Service Role Key** (labeled "service_role")

### **Step 5: Create `.env.local`**

In your project root, create `.env.local`:

```bash
cp .env.example .env.local
```

Add your Supabase credentials:

```
ANTHROPIC_API_KEY=sk-ant-...  (get from https://console.anthropic.com/)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
```

### **Step 6: Import the Posts**

Place the `posts-export.json` file in your project root, then run:

```bash
npx ts-node scripts/import-posts.ts posts-export.json
```

You should see:
```
✅ Successfully imported 1000 posts
🎉 Your swipe file is ready!
```

### **Step 7: Start the App**

```bash
npm run dev
```

Visit: http://localhost:3000

---

## **📝 Next: Set Up Your Voice**

1. Click **Voice profile** in sidebar
2. Answer the questions to define your writing style
3. This personalizes all content generation

---

## **📊 What You Have Now**

✅ 1,000 posts in your Swipe File  
✅ Ready to generate ideas  
✅ AI chat powered by Claude  
✅ All tools configured  

---

## **📱 Available Pages**

- **Home** — Chat with AI assistant
- **Voice profile** — Define your writing style
- **Ideas** — Browse/generate post ideas
- **Sources** — Manage content sources (LinkedIn, Reddit, Instagram, YouTube)
- **Swipe File** — View all 1,000 imported posts
- **Lead Magnets** — Create lead magnet posts
- **Preview** — See posts as LinkedIn preview

---

## **🔑 API Keys You Need**

Only **2 required:**

1. **Anthropic Claude** — https://console.anthropic.com/
   - Free $5/month credit
   - Used for: All content generation

2. **Supabase** — https://supabase.com/
   - Free tier includes 500MB storage
   - Used for: Storing posts and data

**Optional APIs** (see SETUP.md):
- Apify (scraping trending content)
- OpenRouter (alternative AI)
- vidIQ (YouTube/Instagram mining)
- Clay (data enrichment)

---

## **❓ Troubleshooting**

**"Import failed"**
- Check SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
- Make sure `posts-export.json` is in project root
- Verify your Supabase project is initialized

**"App won't start"**
- Did you run `npm install`?
- Check `.env.local` has all 3 keys
- Try deleting `node_modules` and running `npm install` again

**"No posts showing"**
- Refresh the page
- Go to `/ideas` → All time tab
- Check browser console (F12) for errors

---

## **📚 Full Documentation**

See these files in the repo:

- **README.md** — Project overview
- **SETUP.md** — All API configuration options
- **DATA_SETUP.md** — How to export/import data
- **PERSONALIZATION.md** — How to customize for your needs

---

## **✨ You're All Set!**

Your Content OS is ready to use. Start creating LinkedIn content today.

Questions? Check the documentation files above.

Happy creating! 🚀
