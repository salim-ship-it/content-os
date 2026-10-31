# Content OS

An evidence-based LinkedIn content system for turning real RevOps and GTM work into posts, reusable assets, and a measurable content strategy.

The default workspace is built for **Salim Sraj**. It combines Salim's authenticated voice profile, verified experience, publishing guardrails, creator references, and published-content data before generating anything.

## What it does

- Extracts post ideas from notes, meetings, workflows, and observations
- Writes and edits LinkedIn posts in Salim's voice
- Verifies claims against an approved evidence library
- Generates materially different hook directions
- Analyzes creator structures without copying their language
- Manages sources, swipe files, lead magnets, and previews
- Repurposes source ideas while retaining content lineage
- Provides a foundation for learning from published performance

## Repository map

```text
app/                         Next.js product
lib/                         Application modules
skills/linkedin-content/     Writing and analysis workflows
data/brands/salim-sraj/      Active brand workspace
data/creator-styles/         Creator structure references
content/salim/               Salim's drafts and resources
content/clients/             Isolated client work
media/                       Generated graphics and videos
docs/                        Current documentation
archive/                     Historical, non-canonical material
```

See [SCOPE.md](./SCOPE.md), [GLOSSARY.md](./GLOSSARY.md), and [the architecture guide](./docs/architecture.md) before extending the system.

## Content workflow

```text
Raw material
    ↓
Evidence and confidentiality gate
    ↓
Single post argument
    ↓
Hook exploration
    ↓
Draft in Salim's voice
    ↓
Voice, factuality, and structure checks
    ↓
Final post and optional repurposing
```

The workflow asks questions only when missing information would materially change the output. It never invents metrics, experiences, opinions, or implementation status.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Anthropic and Supabase are required. Individual scripts may also use Apify, Notion, OpenRouter, vidIQ, or Clay.

### 3. Prepare the database

Apply the relevant Supabase migrations before running authenticated features. Historical setup instructions remain under `archive/legacy-docs/`, but they are not the current source of truth.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Active brand workspace

The default brand is `data/brands/salim-sraj/`:

- `identity.json`: positioning and expertise
- `voice.md`: writing behavior and language patterns
- `audience.md`: intended readers and their problems
- `pillars.md`: recurring editorial territories
- `evidence.json`: approved, publicly shareable facts
- `guardrails.md`: confidentiality and publishing constraints
- `performance.json`: schema for post-performance learning

An authenticated Supabase voice profile overrides the bundled voice file. Set `CONTENT_OS_BRAND` only when selecting another isolated brand workspace.

## Skills

The LinkedIn workflow lives in [skills/linkedin-content/SKILL.md](./skills/linkedin-content/SKILL.md). Its references separate evidence verification, hooks, post writing, editing, repurposing, and performance analysis.

Keep skills small and composable. Add a reference when behavior belongs to the existing LinkedIn workflow; add a new skill only when it owns a distinct responsibility.

## Data and privacy

- Never commit `.env.local` or service credentials.
- Review exports and scraped datasets before publishing them.
- Keep client work isolated under `content/clients/`.
- Do not use client claims as Salim's evidence.
- Generated media belongs under `media/`, not the repository root.
- Portable post exports belong under `data/exports/`.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

TypeScript must pass before production builds. Remaining lint failures are tracked separately and should be cleared before strict CI is enabled.

## Agent-assisted changes

Read [AGENTS.md](./AGENTS.md) first. This project uses Next.js 16.2.3; consult the bundled guides under `node_modules/next/dist/docs/` before relying on older Next.js conventions.
