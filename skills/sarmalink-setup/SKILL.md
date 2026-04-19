---
name: sarmalink-setup
description: "Use when setting up SarmaLink-AI for the first time, deploying to Vercel, configuring Supabase, adding API keys, or troubleshooting a fresh installation. Also use when someone says 'help me set up', 'deploy this', 'configure environment', or 'I just cloned this repo'."
---

# SarmaLink-AI Setup Skill

You are helping a user set up SarmaLink-AI — an open-source multi-provider AI assistant with automatic failover across 36 engines and 7 providers.

## Before you start

Read these files for full context:
- `CLAUDE.md` — project overview and architecture
- `.env.example` — all environment variables
- `supabase/migrations/001_sarmalink_ai.sql` — database schema

## Setup flow — walk through each step, wait for confirmation

### Step 1: Install dependencies

```bash
npm install
```

Verify it completes without errors. If `node_modules/` already exists, skip.

### Step 2: Create Supabase project

Tell the user:

1. Go to https://supabase.com and sign up (free, no credit card)
2. Click "New Project" — pick any name and a strong database password
3. Wait for the project to finish provisioning (~30 seconds)
4. Go to **Settings > API** and copy these three values:
   - **Project URL** (starts with `https://`)
   - **anon public key** (starts with `eyJ`)
   - **service_role key** (starts with `eyJ`, keep this secret)

Ask the user to paste all three values.

### Step 3: Run database migration

Tell the user:

1. In their Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Read `supabase/migrations/001_sarmalink_ai.sql` and tell the user to paste it into the SQL editor
4. Click "Run" — should show "Success. No rows returned."
5. Verify: go to **Table Editor** — they should see `ai_chat_sessions`, `ai_chat_usage`, `ai_events`, `ai_user_memories`

### Step 4: Get AI provider keys (minimum: Groq)

**Required — Groq (free):**
1. Go to https://console.groq.com
2. Sign in with Google
3. Create an API key
4. Copy the key (starts with `gsk_`)

Ask the user to paste it.

**Then offer optional providers — all free, all increase capacity:**

| Provider | What it adds | Signup URL |
|---|---|---|
| SambaNova | DeepSeek V3.2 (685B) — frontier reasoning | https://cloud.sambanova.ai |
| Cerebras | 2,000 tok/sec ultra-fast inference | https://cloud.cerebras.ai |
| Google Gemini | Live web search grounding | https://aistudio.google.com/app/apikey |
| OpenRouter | 17+ free fallback models | https://openrouter.ai |
| Tavily | Web search (1,000/month) | https://app.tavily.com |
| Cloudflare | Image generation + R2 file storage | https://dash.cloudflare.com |

For each one the user wants, walk them through signup and key creation. Don't push — more keys = more capacity, but Groq alone works fine.

### Step 5: Create .env.local

Read `.env.example` and create `.env.local` with the user's actual values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` — fill in all the keys the user provided. Ask them:
- "What do you want your assistant called?" → set `NEXT_PUBLIC_APP_NAME`
- "What's your company/org name?" → set `NEXT_PUBLIC_COMPANY_NAME`
- Set `NEXT_PUBLIC_HOME_REDIRECT="/login"` (or their preferred landing page)

### Step 6: Verify everything works

Run in order:

```bash
npx tsc --noEmit      # Should complete with no output (= no errors)
npm test              # Should show 90 tests passing
npm run build         # Should complete with ✓ marks
```

If anything fails, read the error and fix it. Common issues:
- Missing env vars → check `.env.local`
- Module not found → run `npm install` again
- Supabase connection error → verify URL and keys

### Step 7: Launch locally

```bash
npm run dev
```

Tell the user to open the URL shown (usually http://localhost:3000). They should see the app. First signup creates their account.

### Step 8: Optional — Deploy to Vercel

If the user wants a public URL:

1. Push the repo to their GitHub (if not already)
2. Go to https://vercel.com → "Add New Project"
3. Import their GitHub repo
4. In "Environment Variables", add every variable from `.env.local`
5. Click "Deploy"
6. Wait ~60 seconds — they'll get a URL like `their-app.vercel.app`

### Step 9: Optional — Lock down registration

If the user wants to restrict signups:

1. **Supabase Dashboard** → Authentication → Settings → uncheck "Enable sign-ups" to block new registrations
2. **Invite-only:** use Supabase's "Invite user" button to add specific emails
3. **Admin endpoint:** set `ADMIN_EMAILS=their@email.com` in env vars to protect `/api/admin/health`

### Step 10: Contribute back

If you fixed any bugs or improved anything during setup:

1. Create a commit describing what you changed
2. Tell the user to fork https://github.com/sarmakska/sarmalink-ai and submit a PR
3. The SarmaLink-AI project welcomes contributions — see CONTRIBUTING.md

## Common mistakes

- **Forgetting the database migration** — the app will boot but auth and chat fail silently
- **Wrong Supabase key** — the anon key is the PUBLIC one, the service role key is the SECRET one. Don't swap them.
- **Skipping `npm install`** — build and tests will fail on missing modules
- **Not setting `NEXT_PUBLIC_APP_URL`** — OpenRouter requests may be rejected (wrong referer header)
- **Using expired API keys** — run `npm run dev` and try a chat message to verify each provider works

## Architecture reference

```
User sends message
    |
Auto-router (regex, instant) --> Smart / Reasoner / Live / Fast / Coder / Vision
    |
Live tools fire first (exchange rates, weather, tracking)
    |
Failover engine (up to 14 steps):
    Step 1: SambaNova DeepSeek V3.2 --> try all keys
    Step 2: Groq GPT-OSS 120B --> try all keys
    ...
    Step 14: OpenRouter Nemotron Nano :free
    |
Each step: if 429/5xx --> next step in <50ms
    |
Stream tokens via SSE --> render markdown --> save to Supabase
    |
Extract memories in background
```

Built by Sarma Linux — https://sarmalinux.com
