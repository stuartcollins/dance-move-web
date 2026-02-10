# Dance Journal - Product Vision

> **Note:** This file contains the full product vision, UX design, and feature requirements. For technical reference, see `CLAUDE.md`. Ask Claude to "read the product vision" when making UX or feature decisions.

## Vision

A mobile-optimized web app for partner dance learners to track moves, fundamentals, and their learning journey. Currently focused on **Lindy Hop**.

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

## Design Requirements

- Mobile-first (optimized for tablet and phone)
- Quick navigation to find and review moves
- Simple, clean interface for on-the-go reference

## Core Features (MVP)

### User Accounts
- Simple login/authentication (NextAuth.js - not yet implemented)
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

### AI-Assisted Move Lookup (Core Feature)
This is essential to the UX, not a future nice-to-have:
- When user searches for a move, use LLM to provide:
  - Move description
  - Suggested difficulty tier based on how it's discussed online
  - Related moves or prerequisites
- Search YouTube API for relevant instructional videos
- The goal: user types "Sugar Push" and gets a fully-populated move card to confirm

### Move Universe Graph (Implemented)
See `CLAUDE.md` for current technical state of the graph visualization.

## Out of Scope (MVP)
- File uploads
- Email notifications
- Payments
- Marketing features

## Open Questions
- Production database: Keep SQLite or migrate to PostgreSQL/Supabase?
- Should we cache LLM responses for common moves to reduce API costs?
- How to handle move name variations/aliases in search?
