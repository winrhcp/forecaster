**Forecaster — Farcaster Mini App (Frame)**

- Stack: Next.js 14 (App Router), TypeScript, TailwindCSS, Supabase
- Purpose: Let Farcaster users vote/predict inside a Frame. Enforce one vote per `fid` per poll via unique index.

**Manifest**
- Served at `public/.well-known/farcaster.json` with placeholders for `iconUrl`, `splashImageUrl`, `ogImageUrl`, and `accountAssociation` (FIP-11).

**Database**
- SQL in `supabase/schema.sql`:
  - `votes` table with unique `(poll_id, fid)` and default `gen_random_uuid()` id.

**Environment**
- Copy `.env.local.example` to `.env.local` and fill:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

Note: The service role key is used only on the server in `app/api/vote/route.ts` via `lib/supabaseServer.ts`.

**Develop**
1. `pnpm i` or `npm i` or `yarn`
2. `npm run dev`
3. Open `http://localhost:3000`

**Endpoints**
- `GET /api/vote?poll_id=ai_race_2025` → `{ openai, anthropic, total }`
- `POST /api/vote` body: `{ fid, poll_id, choice }` where `choice ∈ {openai, anthropic}`
  - 200 → returns tally
  - 409 → `{ error: 'duplicate_vote' }`

**UI**
- Multi-poll
  - `app/page.tsx` lists available polls (from Supabase `polls` table if present, else `config/polls.json`).
  - `app/p/[pollId]/page.tsx` shows the poll detail with two options (OpenAI, Anthropic).
  - `components/PollClient.tsx` handles voting and live tally updates.

**Notes**
- In a real Frame, derive `fid` from the FIP-11 signed payload (see `accountAssociation` placeholders in the manifest).
- Options are currently fixed to {openai, anthropic} across polls for simplicity.

**Poll Sources**
- Supabase table (preferred in production):
  - Table: `polls (id text primary key, question text not null)`
  - If the table exists and has rows, the app uses it.
- Local JSON fallback:
  - `config/polls.json` — edit to add more polls in development.

