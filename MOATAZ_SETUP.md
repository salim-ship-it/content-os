# Content OS - Setup Guide for Moataz

Welcome! You now have a complete LinkedIn content creation system. Here's everything you need to get started.

---

## **What You're Getting**

A personal AI-powered tool to create LinkedIn content with:
- ✅ Chat interface powered by Claude AI
- ✅ 1,000 pre-loaded high-performing posts (swipe file)
- ✅ Content idea generator
- ✅ AI post scoring & feedback
- ✅ Lead magnet creator
- ✅ LinkedIn preview

---

## **⏱️ Setup Time: 15 minutes**

### **What You Need**
1. GitHub account (free)
2. Supabase account (free)
3. Anthropic API key (free $5/month credit)
4. Posts export file (you'll receive this)

---

## **🚀 Step-by-Step Setup**

### **Step 1: Fork the Repository**

1. Go to: https://github.com/salim-ship-it/content-os
2. Click **Fork** (top right button)
3. This creates your own copy of the code

### **Step 2: Clone to Your Computer**

```bash
git clone https://github.com/YOUR-USERNAME/content-os.git
cd content-os
npm install
```

Replace `YOUR-USERNAME` with your GitHub username.

### **Step 3: Create Supabase Account**

1. Go to https://supabase.com/
2. Click **Sign up**
3. Use email/GitHub to sign up
4. Create a new project (free tier)
5. Wait ~2 minutes for it to initialize

### **Step 4: Get Supabase Credentials**

In your Supabase project:
1. Click **Settings** (bottom left)
2. Click **API**
3. Copy these two values:
   - **Project URL** → This is `SUPABASE_URL`
   - **Service Role Key** → This is `SUPABASE_SERVICE_KEY`

(Don't share these keys with anyone!)

### **Step 5: Get Anthropic API Key**

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Click **API Keys**
4. Create a new key
5. Copy it

### **Step 6: Create `.env.local` File**

In your project folder, create a file called `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_xxxxx...
```

Paste the keys you just copied.

### **Step 7: Import the Posts**

1. Save the `posts-export.json` file in your project folder (root level)
2. Run this command:

```bash
npx ts-node scripts/import-posts.ts posts-export.json
```

You should see:
```
✅ Successfully imported 1000 posts
🎉 Your swipe file is ready!
```

### **Step 8: Start the App**

```bash
npm run dev
```

Open: http://localhost:3000

---

## **📝 First Thing to Do**

1. Click **Voice profile** in the sidebar
2. Answer the questions to describe your writing style
3. This makes all AI suggestions personalized to YOU

---

## **🎯 What to Do Next**

**Explore these features:**

| Page | What It Does |
|------|-------------|
| **Home** | Chat with AI about your content |
| **Ideas** | Browse 1,000 posts or generate new ideas |
| **Sources** | Manage content sources (LinkedIn, Reddit, Instagram, YouTube) |
| **Swipe File** | View all 1,000 imported posts |
| **Lead Magnets** | Create posts that offer free resources |
| **Preview** | See how posts look on LinkedIn |

---

## **💡 How to Use It**

### **Generate a Post**
1. Go to **Home**
2. Click **"Write in creator style"**
3. AI asks 4 questions
4. AI writes post matching your voice

### **Get Feedback**
1. Go to **Home**
2. Click **"Score my post"**
3. Paste your LinkedIn post
4. AI scores it on 6 dimensions

### **Find Ideas**
1. Go to **Ideas**
2. Filter by source (LinkedIn, Reddit, Instagram, YouTube)
3. Filter by type (Story, Hot take, Educational, etc.)
4. Study high-performing posts

---

## **🔑 Important: Keep Keys Secret**

Never:
- Share `.env.local` file
- Push `.env.local` to GitHub
- Post your API keys online

If you accidentally expose them:
- Delete the key in Anthropic/Supabase console
- Create a new one

---

## **❓ Troubleshooting**

**"Import failed"**
- Check your SUPABASE_URL and SUPABASE_SERVICE_KEY are correct
- Make sure `posts-export.json` is in the project root folder
- Verify Supabase project is fully initialized

**"App won't start"**
- Did you run `npm install`? (Step 2)
- Check `.env.local` exists with all 3 keys
- Try: `rm -rf node_modules` then `npm install` again

**"No posts showing"**
- Refresh the browser
- Go to `/ideas` and click "All time" tab
- Check browser console (F12) for error messages

**"Claude API error"**
- Verify your ANTHROPIC_API_KEY is correct
- Go to https://console.anthropic.com/ and check your key
- Make sure you have API credits (or $5 free trial)

---

## **📚 More Information**

Inside the repo, read these files:

- **README.md** — Full project overview
- **SETUP.md** — All API configuration details
- **DATA_SETUP.md** — How to share/import posts
- **PERSONALIZATION.md** — How to customize further

---

## **✨ You're All Set!**

Start creating content on LinkedIn today.

**Quick wins:**
1. ✅ Import 1,000 posts (done in setup)
2. ✅ Set your voice profile (5 min)
3. ✅ Generate first post (5 min)
4. ✅ Start using daily

---

## **Questions?**

- Check the troubleshooting section above
- Read the documentation files in the repo
- Review HANDOFF.md for more context

**Happy creating!** 🚀
