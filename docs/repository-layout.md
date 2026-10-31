# Repository layout

```text
content-os/
├── app/                 Next.js application
├── lib/                 Application modules
├── skills/              Composable agent workflows
├── data/
│   ├── brands/          Isolated brand workspaces
│   ├── creator-styles/  Structural references
│   ├── exports/         Portable data exports
│   └── foundation/      Bundled fallback data
├── content/
│   ├── salim/           Salim drafts and resources
│   └── clients/         Isolated client deliverables
├── media/               Generated graphics and video projects
├── supabase/            Database migrations and SQL utilities
├── docs/                Current documentation
├── archive/             Historical, non-canonical material
├── scripts/             Operational scripts
├── SCOPE.md             Product boundary
└── GLOSSARY.md          Shared domain language
```

## Placement test

Before adding a file, ask:

1. Does the running product import it? Put it in `app/`, `lib/`, `skills/`, or `data/`.
2. Is it a draft or deliverable? Put it in `content/`.
3. Is it generated visual output? Put it in `media/`.
4. Is it current documentation? Put it in `docs/`.
5. Is it retained only for history? Put it in `archive/`.
