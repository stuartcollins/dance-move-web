# Move Relationship Methodology

This document explains how moves in the universal move database are connected to each other, what the relationship types mean, and how relationship weights are determined.

## Relationship Types

Each relationship between two moves has a **type** that describes the nature of the connection.

### 1. `prerequisite`
Move A should be learned before Move B. The source move provides foundational skills needed for the target move.

**Examples:**
- "Triple Step" → "6-Count Basic" (you need the footwork before the pattern)
- "Swingout from Closed" → "Texas Tommy" (you need the basic swingout before the hand-behind-back variation)
- "Basic Charleston" → "Hand-to-Hand Charleston" (solo before partnered)

**Typical weight range:** 0.8 - 0.9

### 2. `variation`
Move B is a stylistic variant of Move A. They share the same core pattern but differ in execution, direction, or embellishment.

**Examples:**
- "Texas Tommy" → "Reverse Texas Tommy" (same move, opposite direction)
- "Basic Charleston" → "Squat Charleston" (same footwork, different level)
- "Inside Turn" → "Double Inside Turn" (same turn, more rotations)
- "Sliding Doors" → "Revolving Doors" (same concept, added rotation)

**Typical weight range:** 0.7 - 0.9 (higher = more similar)

### 3. `related`
Moves share common elements, are often taught together, or complement each other conceptually. This is the most flexible relationship type.

**Sub-categories of "related":**
- **Mechanical similarity** - Similar footwork, body mechanics, or timing
- **Conceptual pairs** - Complementary concepts (Closed Position ↔ Open Position)
- **Same family** - Moves in the same category (jazz steps, Charleston variations)
- **Often combined** - Frequently done together in social dancing

**Examples:**
- "Suzie Q" ↔ "Truckin'" (both jazz steps with traveling footwork)
- "Closed Position" ↔ "Open Position" (complementary positions)
- "Shorty George" ↔ "Boogie Forward" (both jazz steps, often in same routines)

**Typical weight range:** 0.5 - 0.8

### 4. `leads_to`
Move A naturally flows into or sets up Move B. Common in combination sequences or when one move creates momentum for another.

**Examples:**
- "Rock Step" → "6-Count Basic" (the rock step initiates the pattern)
- "Send Out" → "Come Around" (send out creates the momentum to bring partner back)
- "Free Spin" → "Double Turn" (single spin technique enables multiple rotations)

**Typical weight range:** 0.7 - 0.9

## Weight Scale (0.0 - 1.0)

The weight indicates how **strong** the relationship is. Higher weight = stronger connection.

| Weight | Meaning | When to use |
|--------|---------|-------------|
| 0.9 | Very strong | Direct variation, immediate prerequisite, core component |
| 0.8 | Strong | Clear dependency, same move family, closely related |
| 0.7 | Moderate-strong | Related but not essential, common combination |
| 0.6 | Moderate | Shares some concepts, occasionally combined |
| 0.5 | Weak | Loosely related, tangential connection |

## Weight Assignment Guidelines

### By Relationship Type

| Type | Default Weight | Range | Notes |
|------|----------------|-------|-------|
| `prerequisite` | 0.9 | 0.8-0.9 | Lower if prerequisite is "soft" (helpful but not required) |
| `variation` | 0.8 | 0.7-0.9 | Higher = more similar to original |
| `leads_to` | 0.8 | 0.7-0.9 | Higher = more natural/common flow |
| `related` | 0.7 | 0.5-0.8 | Most variable; depends on similarity |

### Factors That Increase Weight

1. **Same tier** - Moves at the same difficulty level that relate are weighted higher
2. **Naming relationship** - "Reverse X", "Double X" → 0.9 to parent move
3. **Shared in routines** - Moves that appear in the same jazz routine (Shim Sham, Big Apple)
4. **Mechanical overlap** - Same footwork pattern, just different context
5. **Historical connection** - Moves developed from each other historically

### Factors That Decrease Weight

1. **Tier gap** - If moves are 2+ tiers apart, relationship is less direct
2. **Different category** - Solo move related to partnered move (cross-category)
3. **Optional connection** - "Sometimes combined" vs "always combined"
4. **Conceptual only** - Related by idea but not execution

## How Relationships Were Determined

The initial dataset relationships came from several sources:

### 1. Curriculum Progression
How Lindy Hop is commonly taught in progressive syllabi:
- Wednesday Night Hop curriculum structure
- iLindy.com course progressions
- Common workshop sequences at events

This informed **prerequisite** and **leads_to** relationships.

### 2. Naming Analysis
Move names often encode relationships:
- "Reverse X" → variation of "X"
- "Double X" → variation of "X" with more rotations
- "X with Y" → combination, related to both X and Y
- "X Charleston" → variation in Charleston family

This informed **variation** relationships.

### 3. Jazz Routine Composition
Moves that appear in the same routines share relationships:
- **Shim Sham**: Tacky Annie, Shorty George, Boogie Forward/Back
- **Big Apple**: Suzie Q, Truckin', Shout, Praise Allah
- **Tranky Doo**: Fall Off the Log, Boogie Forward

This informed **related** and **prerequisite** relationships for solo jazz moves.

### 4. Mechanical Families
Moves grouped by body mechanics and footwork:
- **Charleston family**: Basic, Hand-to-Hand, Tandem, Side-by-Side
- **Turn family**: Inside Turn, Outside Turn, Free Spin, Double Turn
- **Tandem family**: Tandem Charleston, Tandem Turn, Airplane

This informed **related** and **variation** relationships.

### 5. Lead/Follow Mechanics
How moves connect in partner dancing:
- Closed position moves that open up
- Send outs that lead to come arounds
- Turns that chain together

This informed **leads_to** relationships.

## Category Assignment (Solo vs Partnered)

Moves are categorized to enable color-coding on the graph:

### Solo (Red nodes)
- Jazz steps done individually (Suzie Q, Truckin', Shorty George)
- Jazz routines (Shim Sham, Big Apple, Tranky Doo)
- Charleston variations done solo
- Styling elements that don't require a partner

### Partnered (Blue nodes)
- Moves requiring lead/follow connection
- Swingouts, turns, tandem work
- Positions (closed, open, tandem)
- Aerials and dips

**Edge cases:**
- Basic Charleston is marked "solo" (can be done alone or partnered)
- Some moves have solo and partnered versions (Charleston variations)

## Future Improvements

1. **Bidirectional weights** - Currently A→B and B→A could have different weights
2. **Community input** - Allow users to suggest relationship changes
3. **Regional variations** - Some relationships differ by scene/lineage
4. **Confidence scores** - How certain we are about a relationship
5. **Source citations** - Link relationships to curriculum sources

## Modifying Relationships

Relationships are defined in `/src/app/api/graph/seed/route.ts` in the `lindyHopMoveData` array. Each move has a `relatedMoves` array:

```typescript
{
  name: "Texas Tommy",
  description: "...",
  tier: 3,
  category: "partnered",
  relatedMoves: [
    { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
    { name: "Reverse Texas Tommy", weight: 0.9, type: "variation" },
    { name: "Apache", weight: 0.7, type: "leads_to" },
  ]
}
```

After modifying, reseed the database:
```bash
curl -X POST http://localhost:3000/api/graph/seed
```
