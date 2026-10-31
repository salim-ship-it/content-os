<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository map

- `app/`: Next.js product and route handlers.
- `lib/`: application modules and external-service adapters.
- `skills/`: composable agent workflows. Each skill owns a `SKILL.md` and optional references.
- `data/brands/`: active brand identity, evidence, voice, guardrails, and performance data.
- `data/creator-styles/`: structural creator references used by the product.
- `content/`: human-authored drafts and client work. It is not application code.
- `media/`: generated visual and video artifacts.
- `supabase/`: ordered database migrations and SQL utilities.
- `docs/`: durable product and engineering documentation.
- `archive/`: retained legacy material. Do not treat it as current guidance.

# Working rules

- Keep the repository root small. New drafts belong under `content/`, exports under `data/exports/`, and generated assets under `media/`.
- `data/brands/salim-sraj/` is the default active workspace.
- Never turn unverified meeting notes into public claims. Use the active brand evidence library and guardrails.
- Do not add a second configuration path when an existing canonical directory owns the concept.
- Preserve client material and generated assets unless the user explicitly authorizes deletion.
- Run targeted lint and TypeScript checks for code changes. Do not hide failures with configuration flags.
