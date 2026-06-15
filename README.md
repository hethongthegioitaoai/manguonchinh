# AI World System

A dark futuristic cyber cultivation web app where players authenticate, select immersive AI-driven worlds, and create characters bound to randomly assigned power systems.

---

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion
- **Fonts**: Orbitron (display), Rajdhani (body)
- **Routing**: Wouter
- **Auth & Database**: Supabase
- **UI Components**: shadcn/ui + Radix UI

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Full-screen entry point with animated logo and Enter World CTA |
| `/login` | Login | Email + password auth via Supabase. New accounts auto-register |
| `/worlds` | World Selection | Three world cards — Cultivation, Cyberpunk, Wasteland |
| `/create-character/:worldId` | Character Creation | Enter name, roll a random System, save character to Supabase |

---

## Worlds

| World | Subtitle | Accent |
|---|---|---|
| Cultivation | Nine Heavens Ascension | Cyan |
| Cyberpunk | Neo-Kowloon Secundus | Purple |
| Wasteland | Necro-Biome Zero | Toxic Green |

---

## Systems (randomly assigned)

- Sword God System
- Alchemy System
- Merchant System
- Beast Taming System
- Immortal Cultivation System

---

## Supabase Setup

### Environment Variables

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Project URL from Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Anon public key from the same section |

> The app auto-prepends `https://` if the URL was entered without a protocol.

### Database Tables

Run `artifacts/ai-world-system/supabase-setup.sql` in your Supabase **SQL Editor**:

```
users       — Public profiles, auto-created via trigger on auth.users insert
worlds      — The 3 worlds (seeded: cultivation, cyberpunk, zombie)
characters  — User characters with name, world FK, and stats JSONB
```

All tables use **Row Level Security** — users can only read and write their own data.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start the frontend dev server
pnpm --filter @workspace/ai-world-system run dev

# Start the API server
pnpm --filter @workspace/api-server run dev

# Full typecheck
pnpm run typecheck
```

---

## Project Structure

```
artifacts/
  ai-world-system/          # React + Vite frontend
    src/
      pages/
        LandingPage.tsx
        LoginPage.tsx
        WorldsPage.tsx
        CharacterCreationPage.tsx
      contexts/
        AuthContext.tsx     # Supabase session state
      lib/
        supabase.ts         # Supabase client
        worlds.ts           # Worlds + Systems constants
      components/ui/        # shadcn/ui components
    supabase-setup.sql      # DB schema + RLS policies
    vite.config.ts
  api-server/               # Express API (future backend logic)
lib/                        # Shared workspace libraries
```

---

## Auth Flow

1. User enters email + password on `/login`
2. `signInWithPassword` is attempted — if account doesn't exist, it auto-registers via `signUp` then signs in
3. Session is stored by Supabase in localStorage and managed via `AuthContext`
4. Protected routes (`/worlds`, `/create-character/*`) redirect to `/login` if no session

---

## Character Creation Flow

1. Select a world on `/worlds`
2. Enter a character name (2–32 chars)
3. Click **ASSIGN SYSTEM** — roulette animation cycles through all systems before landing on a random one
4. Review system description, re-roll or confirm
5. On confirm: character is saved to Supabase `characters` table with name, world FK, and `stats.system`
6. Redirects back to `/worlds`
