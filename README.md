# Content OS

A personal AI-powered LinkedIn content creation system. Write better posts faster by leveraging your own voice, style, and content database.

## What It Does

- **Generate ideas** — AI suggests post angles based on your interests and creator analysis
- **Write posts** — Get AI-assisted writing in your specific voice and style
- **Get feedback** — Post coach analyzes your content and suggests specific improvements
- **Build lead magnets** — Create posts that offer free resources (playbooks, templates, guides)
- **Track sources** — Store links, articles, and insights for future content
- **Preview posts** — See exactly how your posts will look on LinkedIn

## Getting Started

### 1. Clone This Repo

```bash
git clone <your-fork-url> content-os
cd content-os
npm install
```

### 2. Set Up Your Environment

Create a `.env.local` file with your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Get your free API key at: https://console.anthropic.com/

### 3. Personalize It

Edit `config/personalization.json` with your information:

```json
{
  "user": {
    "name": "Your Name",
    "title": "Your Title",
    "company": "Your Company",
    "expertise": ["Topic 1", "Topic 2", "Topic 3"],
    "description": "What you do"
  }
}
```

See [PERSONALIZATION.md](./PERSONALIZATION.md) for full setup instructions.

### 4. Run It

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps in the App

1. **Set up your voice** — Go to `/onboarding/voice` and describe your writing style
2. **Add creators** — Go to `/onboarding/creators` and add people whose writing you admire
3. **Start using chat** — Go to `/` and talk to your AI assistant
4. **Create content** — Use Ideas, Sources, Lead Magnets, and other tools

## Features

### Chat
Your AI assistant that knows your voice. Ask for post ideas, write drafts, get feedback, or iterate on existing posts.

### Ideas
Generate LinkedIn post ideas based on your interests, creator analysis, and top-performing content.

### Sources
Curate content sources, save articles, and build a research database for your writing.

### Swipe File
Analyze high-performing posts from creators you study. The system learns their hook patterns and structure.

### Lead Magnets
Create posts that offer free resources (guides, playbooks, templates, checklists). Track which offers perform best.

### Post Coach
Get detailed feedback on your published posts:
- Hook analysis
- Structure suggestions
- CTA improvements
- Next post recommendations

### Preview
See exactly how your posts will render on LinkedIn (desktop and mobile).

## How It Works

The system reads from your local files:

- `config/personalization.json` — Your information and preferences
- `config/voice-profile.md` — Your writing voice and style
- `config/post-formats.md` — Your post structure rules (optional)
- `creator-styles/` — Style guides for creators you study
- `supabase` database — Your posts, sources, and content

When you ask for help, the AI uses all of this context to match your exact voice and give you specific, actionable feedback.

## Architecture

- **Frontend** — Next.js with React, TypeScript, Tailwind CSS
- **Backend** — Next.js API routes
- **Database** — Supabase (PostgreSQL)
- **AI** — Claude API (Anthropic)
- **File Storage** — Local file system for config and profiles

## Deploying

This is designed to run locally. If you want to deploy it:

1. Set up a Supabase project
2. Set environment variables in your hosting platform
3. Deploy to your hosting (Vercel, Railway, Fly.io, etc.)

For local development only:

```bash
npm run dev
```

## FAQ

**Q: Do I need a Supabase account?**  
A: Yes, for storing posts and sources. Create a free account at supabase.com.

**Q: What if I don't want to use Supabase?**  
A: Edit the API routes in `app/api/` to use a different database.

**Q: How much does this cost?**  
A: Anthropic charges for API usage. Free tier starts at $5/month credit.

**Q: How do I improve content quality?**  
A: Better voice profile = better content. Spend time describing your exact style.

**Q: Can I customize this further?**  
A: Yes. All the code is yours. Edit components, API routes, prompts, whatever you need.

## Questions?

Check [PERSONALIZATION.md](./PERSONALIZATION.md) for detailed setup and configuration.

---

**Built with Next.js, Claude, and Supabase.**
