# Dance Journal - Technical Reference

Multi-style dance move tracking web app. For product vision & UX requirements, read `docs/product-vision.md`.

## Stack
- **Next.js 14+** (App Router) / TypeScript / Tailwind CSS
- **Prisma 7** + SQLite (better-sqlite3 adapter)
- **react-force-graph-2d** + d3-force-3d for graph visualization
- **Auth**: NextAuth.js (not yet implemented)
- **APIs**: Anthropic Claude (move lookup + style generation), YouTube Data API (videos)

## Data Model

**UniversalMove** - dance moves with:
- `tier` (1-4), `category` (solo/partnered), `aliases`
- `family`, `movementFamily`, `positionFrame` - 3 classification fields reused per style with different semantics
- Linked to a `DanceStyle`

**UniversalMoveRelation** - relationships:
- Types: prerequisite, related, variation, leads_to
- Weight: 0-1 (see `docs/move-relationships.md`)

**User data**: User, Move (journal entries), Video, MoveRelation, Account, Session

## Multi-Style Architecture

Move data lives in `data/<slug>.json` files (one per dance style). Each JSON contains:
- `style` - name, slug, description
- `schemes` - 3 categorization schemes with groups (positions, colors, labels)
- `moves` - array with explicit `classifications` (no computed keyword-matching)

The 3 scheme `nodeKey` values are always `"family"`, `"movementFamily"`, `"positionFrame"` — matching the DB columns but with per-style group names/semantics.

## Graph Visualization (`/graph`)

Style selector dropdown (appears when multiple styles exist). Three categorization views switchable via radio buttons. Force-directed layout: X-axis by tier, Y-axis by active scheme bands. Canvas-drawn axis labels pan/zoom with graph. Variations always placed RIGHT of parent. Force tuning sliders available. Scheme configs loaded from JSON, not hardcoded.

## API Endpoints

- `GET /api/graph/seed?style=<slug>` - returns `{ style, schemes, moves }` envelope
- `POST /api/graph/seed?style=<slug>` - seeds DB from JSON data
- `GET /api/styles` - lists available styles from `data/` directory
- `POST /api/styles/generate` - generates new style via Claude API (`{ styleName }`)

## Dev Commands
```bash
npm run dev                    # Dev server on localhost:3000
npx prisma studio              # Browse/edit database
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate client after schema changes
curl -X POST localhost:3000/api/graph/seed?style=lindy-hop  # Reseed Lindy Hop
curl -X POST localhost:3000/api/styles/generate -d '{"styleName":"Balboa"}' -H 'Content-Type: application/json'  # Generate new style
```

## Key Files
- `data/lindy-hop.json` - Lindy Hop move data (137 moves, 247 relationships)
- `src/lib/dance-style.ts` - Style loading helpers and TypeScript types
- `prisma/schema.prisma` - Database schema
- `src/lib/prisma.ts` - Prisma client singleton
- `src/app/graph/page.tsx` - Graph visualization (~840 lines)
- `src/app/api/graph/seed/route.ts` - Seed/fetch move data (~155 lines, loads from JSON)
- `src/app/api/styles/route.ts` - List available styles
- `src/app/api/styles/generate/route.ts` - Claude API style generation pipeline
- `docs/product-vision.md` - Full product vision and UX requirements
- `docs/move-relationships.md` - Relationship types, weights, methodology

## Gotchas
- After schema changes: run `prisma db push` then `prisma generate`, then restart dev server
- Seeding returns 0 moves if Prisma client is stale - restart dev server first
- Default d3 center force (at 0,0) conflicts with custom positioning - we remove it with `fg.d3Force('center', null)`
- Style generation requires `ANTHROPIC_API_KEY` environment variable
