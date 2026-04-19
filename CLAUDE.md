# SarmaLink-AI

Open-source multi-provider AI assistant with automatic failover. Built by Sarma Linux (sarmalinux.com).

## Architecture

- **Framework:** Next.js 14 App Router + TypeScript
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **File storage:** Cloudflare R2 (optional)
- **Image gen:** Cloudflare Workers AI FLUX.2 klein (optional)
- **Deployment:** Vercel (or any Next.js host)

## Key directories

- `app/api/ai-chat/route.ts` — thin route handler (~30 lines), delegates to orchestrator
- `lib/services/` — 8 service modules (chat-orchestrator, intent-router, quota-service, streaming-service, etc.)
- `lib/router/index.ts` — unified intent detection with `routeIntent()` entrypoint
- `lib/providers/` — provider registry and failover runner
- `lib/env/validate.ts` — environment variable validation
- `lib/supabase/` — Supabase client setup (server + admin)
- `supabase/migrations/001_sarmalink_ai.sql` — database schema (4 tables)
- `__tests__/` — 90 tests across 4 suites (vitest)
- `docs/` — ARCHITECTURE, DB-SCHEMA, ENV-MATRIX, FAILURE-MODES, DEPLOY

## Environment variables

See `.env.example` for the full list. Minimum required:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `GROQ_API_KEY` — at least one chat provider

Optional providers: SambaNova, Cerebras, Google Gemini, OpenRouter, Tavily, Cloudflare.

## Commands

- `npm test` — run vitest suite (90 tests)
- `npx tsc --noEmit` — typecheck
- `npm run build` — production build
- `npm run dev` — development server

## Setup for new deployers

If someone asks you to help them set up SarmaLink-AI, follow the guide in `docs/SETUP-AI.md`. It walks through every step: Supabase project creation, API key collection, `.env.local` creation, database migration, build verification, and optional Vercel deployment.

## Contributing

PRs welcome. Run `npm test` and `npx tsc --noEmit` before committing. See `CONTRIBUTING.md` for details. If you fix something during setup, please submit a PR back to the upstream repo at github.com/sarmakska/sarmalink-ai.
