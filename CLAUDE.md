# Dance Journal

A mobile-optimized web app for partner dance learners to track moves, fundamentals, and their learning journey. Currently focused on **Lindy Hop**.

## Vision

Dancers struggle to remember the vocabulary of moves they've learned. While YouTube has countless dance videos, only the ones you've studied and understood are valuable. Dance Journal lets you:

- Track moves you've actually learned and understood
- Link moves to YouTube videos and online resources
- See relationships between moves (prerequisites, related moves, variations)
- Visualize the entire "move universe" and see your progress within it
- Quickly refresh your memory on what you've built up over time

## Target Users

- Personal use first (the developer)
- Eventually other dancers in the community
- Free to use, no payments

## Core Features (MVP)

### User Accounts
- Simple login/authentication
- Private journals by default
- Optional sharing (let others view your dance journal)

### Move Tracking (Search-First UX)
The key insight: manually filling out move details is too tedious. Nobody will build a library that way.

**Add Move Flow:**
1. User types move name in a search box (e.g., "Sugar Push")
2. App searches for that move and auto-suggests:
   - Description of the move
   - Difficulty level/tier
   - Relevant YouTube videos or instructional content
3. User confirms/adjusts the suggestions and adds personal notes
4. Move is saved to their journal

**What gets auto-filled:**
- Description (from web/LLM knowledge of the move)
- Difficulty tier (based on how the move is discussed online)
- Suggested videos (YouTube search or curated links)

**What the user provides:**
- Move name (search query)
- Personal notes (optional, always blank by default)
- Confirmation that suggestions are correct

This approach reduces friction dramatically - the app does the research, the user just confirms.

### Relationships
- "Related to" connections between moves
- Soft prerequisites (A is usually learned before B, but not strictly required)
- Moves can exist standalone without logging all prerequisites

### Move Universe Graph (Implemented)
The graph page (`/graph`) visualizes the entire universe of Lindy Hop moves:

- **137 moves** organized into tiers 1-4 (fundamentals to advanced)
- **247 relationships** connecting moves (prerequisites, related, variations, leads_to)
- **Color coding by category:**
  - Red nodes = Solo/styling moves (Shim Sham, Big Apple, jazz steps, Charleston variations)
  - Blue nodes = Partnered moves (Swingouts, turns, tandem work)
  - Lighter shades = Not yet learned
  - Brighter/larger = Already in your journal
- **Relationship visualization:**
  - Dashed orange lines = Variation relationships
  - Solid lines = Other relationships (prerequisite, related, leads_to)
- **Interactive features:**
  - Click nodes to see move details
  - Legend overlay showing category counts
  - Stats overlay showing total moves and connections
- Force-directed layout using react-force-graph-2d

### AI-Assisted Move Lookup (Core Feature)
This is essential to the UX, not a future nice-to-have:
- When user searches for a move, use LLM to provide:
  - Move description
  - Suggested difficulty tier based on how it's discussed online
  - Related moves or prerequisites
- Search YouTube API for relevant instructional videos
- The goal: user types "Sugar Push" and gets a fully-populated move card to confirm

## Design Requirements

- Mobile-first (optimized for tablet and phone)
- Quick navigation to find and review moves
- Simple, clean interface for on-the-go reference

## Technical Considerations

### Hosting
- **Vercel** (free tier) - optimized for Next.js, zero-config deployment
- Domain can be configured later (custom domain or Vercel subdomain for now)

### Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first, utility classes)
- **Authentication**: NextAuth.js (Auth.js) - not yet implemented
- **Database**: SQLite (local dev via better-sqlite3, Prisma adapter)
- **ORM**: Prisma 7 with `@prisma/adapter-better-sqlite3`
- **Graph Visualization**: react-force-graph-2d (2D force-directed graph)
- **LLM Integration**: Anthropic Claude API (for move descriptions, tier suggestions)
- **Video Search**: YouTube Data API (for finding instructional videos)

### Data Model (Implemented in Prisma)

**User-specific data:**
- `User` - User accounts with email, name, profile settings
- `Move` - User's personal move journal entries (name, description, tier, notes)
- `Video` - YouTube URLs linked to user's moves
- `MoveRelation` - User-defined connections between their moves

**Universal move database:**
- `UniversalMove` - The complete universe of known moves for a dance style
  - Fields: name, description, tier (1-4), category (solo/partnered), aliases
- `UniversalMoveRelation` - Relationships between universal moves
  - Types: prerequisite, related, variation, leads_to
  - Weight: 0-1 strength of relationship
- `DanceStyle` - Dance styles (currently Lindy Hop)

**Auth (for NextAuth):**
- `Account` - OAuth provider accounts
- `Session` - User sessions

## Out of Scope (MVP)
- File uploads
- Email notifications
- Payments
- Marketing features
- Multiple dance styles (Lindy Hop only for MVP)

## API Keys Required
- **Anthropic API Key**: For Claude LLM to generate move descriptions and tier suggestions (set in `.env` as `ANTHROPIC_API_KEY`)
- **YouTube Data API Key**: For searching instructional videos (free tier: 10,000 units/day)

## Resolved Decisions
- **Graph library**: Using react-force-graph-2d (simpler, 2D-only avoids A-Frame/VR dependencies)
- **Database**: SQLite locally with Prisma + better-sqlite3 adapter (simple, no external services needed for dev)
- **Dance style**: Lindy Hop (developer is more familiar with the move vocabulary)

## Open Questions
- Production database: Keep SQLite or migrate to PostgreSQL/Supabase?
- Should we cache LLM responses for common moves to reduce API costs?
- How to handle move name variations/aliases in search?

## Development Notes

### Running Locally
```bash
npm run dev          # Start dev server on localhost:3000
npx prisma studio    # Browse/edit database
npx prisma db push   # Push schema changes to database
npx prisma generate  # Regenerate Prisma client after schema changes
```

### Seeding the Move Graph
POST to `/api/graph/seed` to populate the universal move database with 137 Lindy Hop moves and their relationships. The graph page will show "Generate Move Graph" button if no moves exist.

### Key Files
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton with better-sqlite3 adapter
- `src/app/graph/page.tsx` - Move universe graph visualization
- `src/app/api/graph/seed/route.ts` - Lindy Hop move seed data (137 moves, 247 relationships)
- `docs/move-relationships.md` - Documentation of how move relationships and weights are determined
