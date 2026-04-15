# WordShare — Project Instructions for Claude Code

## Overview
WordShare is an English vocabulary sharing web app for small groups (2-3 friends).
Users post words they learned, react/comment, take spaced-repetition quizzes, and track progress.

This project migrates from a Claude Artifact prototype to a production Next.js + Supabase app.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **Styling**: Tailwind CSS
- **Fonts**: Playfair Display (headings), DM Sans (body) via next/font/google
- **Deployment**: Vercel
- **AI**: Anthropic Claude API (server-side, for example sentence generation and quiz hints)

## Project Structure
```
wordshare/
├── CLAUDE.md
├── .env.local.example
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts, metadata
│   │   ├── page.tsx            # Landing → redirect to /timeline or /login
│   │   ├── login/
│   │   │   └── page.tsx        # Auth page (magic link or OAuth)
│   │   ├── timeline/
│   │   │   └── page.tsx        # Main timeline feed
│   │   ├── quiz/
│   │   │   └── page.tsx        # Spaced repetition quiz
│   │   ├── stats/
│   │   │   └── page.tsx        # Learning statistics dashboard
│   │   └── api/
│   │       ├── ai/
│   │       │   ├── example/route.ts   # Generate AI example sentence
│   │       │   └── hint/route.ts      # Generate AI quiz hint
│   │       └── auth/
│   │           └── callback/route.ts  # Supabase auth callback
│   ├── components/
│   │   ├── ui/                 # Reusable UI primitives
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── WordCard.tsx        # Single word post card
│   │   ├── PostForm.tsx        # New word posting modal
│   │   ├── ReactionBar.tsx     # Emoji reaction buttons
│   │   ├── CommentSection.tsx  # Comments list + input
│   │   ├── QuizQuestion.tsx    # Single quiz question view
│   │   ├── QuizResults.tsx     # Quiz results with SRS info
│   │   ├── SRSProgress.tsx     # SRS progress bar widget
│   │   ├── WeeklyChart.tsx     # Weekly posting chart
│   │   ├── Leaderboard.tsx     # Member leaderboard
│   │   ├── BottomNav.tsx       # Tab navigation
│   │   └── TopBar.tsx          # Header bar
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser Supabase client
│   │   │   ├── server.ts       # Server Supabase client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── srs.ts              # SM-2 algorithm (pure functions)
│   │   ├── ai.ts               # Claude API helper
│   │   ├── utils.ts            # timeAgo, avatarColor, etc.
│   │   └── types.ts            # TypeScript type definitions
│   └── hooks/
│       ├── usePosts.ts         # Posts CRUD + realtime subscription
│       ├── useAuth.ts          # Auth state hook
│       ├── useQuiz.ts          # Quiz logic + SRS
│       └── useStats.ts         # Stats computation
└── public/
    └── favicon.ico
```

## Database Schema (Supabase/PostgreSQL)

See `supabase/migrations/001_initial_schema.sql` for full schema.

Key tables:
- `profiles` — user profiles (linked to Supabase auth)
- `posts` — vocabulary posts (word, meaning, example, episode)
- `reactions` — emoji reactions on posts
- `comments` — comments on posts
- `srs_cards` — per-user spaced repetition state for each post
- `quiz_history` — quiz attempt log

All tables use Row Level Security (RLS):
- Posts, reactions, comments: readable by all authenticated users, writable by author
- SRS cards, quiz history: private to each user

## Realtime
Use Supabase Realtime subscriptions on `posts`, `reactions`, `comments` tables.
This resolves the Artifact version's biggest limitation (no auto-refresh).

## Auth
Use Supabase Auth with:
1. **Magic Link** (email-based, passwordless) as primary
2. **Google OAuth** as optional alternative
3. Display name stored in `profiles` table

## Color Palette (preserve from Artifact design)
```
primary:      #2D6A4F
primaryLight: #52B788
primaryFaded: #D8F3DC
accent:       #E76F51
accentLight:  #F4A261
background:   #F6F1EB
card:         #FFFFFF
text:         #1B1B1B
textMid:      #555555
textLight:    #8B8B8B
border:       #E8E0D8
```

## SM-2 Spaced Repetition Algorithm
Keep the exact same algorithm from the Artifact version in `src/lib/srs.ts`:
- New card: easeFactor=2.5, interval=0, repetitions=0
- Correct (quality >= 3): interval grows (1 → 3 → interval * easeFactor)
- Incorrect: reset to 0
- easeFactor adjusts with each review (min 1.3)
- Cards due when nextReview <= now
- Priority: overdue days + difficulty weight + incorrect bonus

## AI Features (Server-Side)
Route AI calls through Next.js API routes to keep the API key secure:
- `POST /api/ai/example` — generates example sentence + JP translation
- `POST /api/ai/hint` — generates mnemonic hint for quiz
Use `claude-sonnet-4-20250514` model, max_tokens 500.

## Coding Conventions
- Use TypeScript strict mode
- Components are functional with hooks
- Use `use client` directive only where needed (interactivity, hooks)
- Server components by default for data fetching
- Error boundaries for each major section
- Loading states using Suspense + skeleton UI
- Mobile-first responsive design (max-width: 480px centered)
- All text in Japanese UI with English labels where appropriate

## Testing
- Unit tests for SRS algorithm (critical business logic)
- Component tests for WordCard, QuizQuestion
- E2E test for: login → post word → see on timeline → take quiz

## Free Tier Constraints (Supabase + Vercel)
- **Supabase Free**: 500MB DB, 5GB egress/month, 50K MAU, auto-pause after 1 week inactivity
- **Vercel Free**: Hobby plan, sufficient for personal/small group projects
- **Anthropic API**: Pay-per-use (~$0.002-$0.008/request). AI features are OPTIONAL — app must work fully without them. Implement a feature flag or env check: if ANTHROPIC_API_KEY is not set, hide AI buttons gracefully.
- For 2-3 users sharing text data, all free tier limits are more than sufficient for years of use.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=           # Optional — AI features disabled if not set
```

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run tests
npx supabase start   # Local Supabase
npx supabase db push # Push migrations
```

## Migration Notes (from Artifact)
The Artifact prototype used `window.storage` (key-value). The migration to Supabase means:
- `user:profile` → `profiles` table + Supabase Auth
- `posts:index` + `posts:{id}` → `posts` table with proper relations
- Reactions embedded in post → separate `reactions` table (proper many-to-many)
- Comments embedded in post → separate `comments` table
- `srs:cards` → `srs_cards` table (per-user)
- `quiz:history` → `quiz_history` table

Key improvements over Artifact:
1. Real-time sync via Supabase Realtime (no manual refresh)
2. Proper auth (no username spoofing)
3. Concurrent edit safety (proper DB transactions vs last-write-wins)
4. Scalable beyond 5MB storage limits
5. Shareable via URL
6. PWA-ready for home screen install
