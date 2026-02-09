# Dance Journal - Technical Reference

Lindy Hop move tracking web app. For product vision & UX requirements, read `docs/product-vision.md`.

## Stack
- **Next.js 14+** (App Router) / TypeScript / Tailwind CSS
- **Prisma 7** + SQLite (better-sqlite3 adapter)
- **react-force-graph-2d** + d3-force-3d for graph visualization
- **Auth**: NextAuth.js (not yet implemented)
- **APIs needed**: Anthropic Claude (move lookup), YouTube Data API (videos)

## Data Model

**UniversalMove** - 137 Lindy Hop moves with:
- `tier` (1-4), `category` (solo/partnered), `aliases`
- `family` - Hybrid grouping: core_lindy, charleston, jazz_styling, aerials_specials
- `movementFamily` - Mechanic grouping: swingout, charleston, turns, jazz_styling, fundamentals
- `positionFrame` - Position grouping: closed, open, tandem, side_by_side, solo

**UniversalMoveRelation** - 247 relationships:
- Types: prerequisite, related, variation, leads_to
- Weight: 0-1 (see `docs/move-relationships.md`)

**User data**: User, Move (journal entries), Video, MoveRelation, Account, Session

## Graph Visualization (`/graph`)

Three categorization views switchable via radio buttons (Hybrid/Movement Family/Position Frame). Force-directed layout: X-axis by tier, Y-axis by active scheme bands. Canvas-drawn axis labels pan/zoom with graph. Variations always placed RIGHT of parent. Force tuning sliders available.

## Dev Commands
```bash
npm run dev                    # Dev server on localhost:3000
npx prisma studio              # Browse/edit database
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate client after schema changes
curl -X POST localhost:3000/api/graph/seed  # Reseed move database
```

## Key Files
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/graph/page.tsx` - Graph visualization (~800 lines)
- `src/app/api/graph/seed/route.ts` - Move seed data (~1600 lines, classification functions at top, POST/GET handlers at bottom)
- `docs/product-vision.md` - Full product vision and UX requirements
- `docs/move-relationships.md` - Relationship types, weights, methodology
- `docs/move-categorization-ideas.md` - Categorization options design exploration

## Gotchas
- After schema changes: run `prisma db push` then `prisma generate`, then restart dev server
- Seeding returns 0 moves if Prisma client is stale - restart dev server first
- Default d3 center force (at 0,0) conflicts with custom positioning - we remove it with `fg.d3Force('center', null)`
- The seed route is ~1600 lines - avoid full reads. Classification functions are at the top (lines 1-100), move data is lines 100-1460, POST handler ~1462, GET handler ~1553
