# Architecture

## Product layers

```text
Authenticated user
      ↓
Next.js application and route handlers
      ↓
Content workspace loader
      ├── Supabase user voice
      ├── data/brands/<brand>
      ├── skills/linkedin-content
      ├── data/creator-styles
      └── Supabase content and sources
      ↓
Claude generation and analysis
```

## Canonical locations

| Concern | Location |
| --- | --- |
| Application routes and UI | `app/` |
| Shared application logic | `lib/` |
| Active brand configuration | `data/brands/` |
| Agent workflows | `skills/` |
| Creator structural references | `data/creator-styles/` |
| Salim drafts and resources | `content/salim/` |
| Client deliverables | `content/clients/` |
| Imports and exports | `data/exports/` |
| Generated media | `media/` |
| Historical instructions | `archive/legacy-docs/` |

## Design rule

Files in `content/`, `media/`, and `archive/` must never become implicit runtime configuration. Runtime behavior should depend only on explicit modules, authenticated database state, active brand data, and installed skills.
