# Content OS — Personalization Guide

This Content OS is a LinkedIn content creation system built for **you**. To make it work for your specific voice and style, follow these steps:

## 1. Personalize Your Profile

Edit `config/personalization.json` with your information:

```json
{
  "user": {
    "name": "Your Name",
    "title": "Your Job Title",
    "company": "Your Company",
    "expertise": ["Your Expertise 1", "Your Expertise 2", "Your Expertise 3"],
    "description": "A brief description of what you do"
  },
  "content": {
    "defaultPlatform": "linkedin",
    "platforms": ["linkedin"],
    "maxPostLength": 1500
  }
}
```

The AI assistant will use this information to personalize all writing prompts and guidance.

## 2. Create Your Voice Profile

Before using the system, create your voice profile:

1. Go to `/onboarding/voice` in the app
2. Describe your writing style, tone, and unique voice
3. This will be used as the foundation for all content generation

## 3. Add Content Creators to Analyze

Upload or add creator profiles to study:

1. Go to `/onboarding/creators`
2. Add creators whose writing style you want to emulate or learn from
3. The system will analyze their posts and hook patterns

## 4. Build Your Swipe File

Collect high-performing lead magnet posts:

1. Go to `/lead-magnets`
2. Add posts that offer free resources (playbooks, templates, guides, etc.)
3. These will be used as reference patterns for your own lead magnets

## 5. Set Your Post Format Rules

Define how you want your posts to look:

1. Create `config/post-formats.md` with your rules
2. Example:
   ```
   # Your Post Format Rules
   
   - Max length: 1500 characters
   - Always include a personal story or specific number
   - Use 1-2 short paragraphs, not walls of text
   - End with a question, not a statement
   ```

## 6. Set Up Your Environment

You'll need an Anthropic API key to run this system locally:

```bash
# Create .env.local in the root directory
ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key at: https://console.anthropic.com/

## 7. Install and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start creating content.

## What's Included

- **Chat**: AI assistant that knows your voice and style
- **Ideas**: Generate post ideas based on your interests
- **Sources**: Manage content sources and references
- **Swipe File**: Store and analyze high-performing posts
- **Lead Magnets**: Create posts that offer free resources
- **Preview**: See posts as they'd appear on LinkedIn
- **Post Coach**: Get feedback on your posts and improvement suggestions

## How It Works

1. The system reads your voice profile and content preferences
2. It analyzes creators and high-performing posts you provide
3. When you ask for help, it remembers your style and uses it
4. All content is generated locally using the Claude API

## Need Help?

- **Post won't generate?** Check that your voice profile is filled out
- **Wrong tone?** Update your personalization.json and voice profile
- **Missing creator analysis?** Add more creators to the system
- **API errors?** Verify your ANTHROPIC_API_KEY is set correctly

---

**Remember:** The better you describe your voice, style, and preferences, the better the system gets at matching your writing.
