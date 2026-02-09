# Move Categorization Ideas

This document captures different ways to categorize Lindy Hop moves for visualization purposes. The goal is to create distinct "trees" or lanes on the graph with natural interplay between them.

## Current State

Currently moves have a binary `category` field:
- `solo` - Jazz steps, routines, solo Charleston variations
- `partnered` - Swingouts, turns, tandem work

This creates two vertical regions on the graph but doesn't capture the full complexity of how moves relate.

---

## Option 1: By Movement Family

Categorize by the core movement pattern or mechanic.

| Family | Description | Examples |
|--------|-------------|----------|
| **Swingout** | Core Lindy patterns built around the swingout | Swingout from closed/open, send out, come around, entries/exits |
| **Charleston** | Charleston-based footwork in any context | Basic Charleston, tandem, side-by-side, hand-to-hand, variations |
| **Turns** | Rotational movements | Inside turn, outside turn, free spin, Texas Tommy, double/triple turns |
| **Jazz/Styling** | Solo expression and jazz vocabulary | Suzie Q, Truckin', Shorty George, Shim Sham, Big Apple |
| **Fundamentals** | Building blocks that appear everywhere | Pulse, connection, rock step, triple step, frame |

**Pros:** Clear mechanical groupings, intuitive for dancers
**Cons:** Some moves span multiple families (e.g., swingout with turn)

---

## Option 2: By Position/Frame

Categorize by the physical relationship between partners.

| Position | Description | Examples |
|----------|-------------|----------|
| **Closed** | Partners in embrace, chest-to-chest | Swingout from closed, closed position basics |
| **Open** | Connected by hands, space between | Swingout from open, tuck turn, pass by |
| **Tandem/Shadow** | Same direction, leader behind or beside | Tandem Charleston, airplane |
| **Side-by-side** | Partners facing same direction, connected | Side-by-side Charleston, promenade |
| **Solo** | No partner connection required | Jazz steps, Shim Sham, solo Charleston |

**Pros:** Clear physical distinctions, maps to dance floor reality
**Cons:** Many moves transition between positions

---

## Option 3: By Rhythm/Count

Categorize by the rhythmic structure.

| Rhythm | Description | Examples |
|--------|-------------|----------|
| **6-count** | Step-step-triple-step-triple-step | Basic 6-count, tuck turn, inside turn |
| **8-count** | Swingout rhythm (rock-step timing) | Swingout, swing out with variations |
| **Charleston** | Charleston timing (kick patterns) | All Charleston variations |
| **Breakaway/Solo** | Jazz insertions and breaks | Jazz steps, styling moments |

**Pros:** Fundamental to how dancers count and learn
**Cons:** Many dancers don't think in counts, some moves work in multiple rhythms

---

## Option 4: Hybrid (Recommended for Testing)

A practical grouping that balances clarity with the reality of how moves interconnect.

| Family | Description | Examples |
|--------|-------------|----------|
| **Core Lindy** | The backbone vocabulary of Lindy Hop | Swingouts, turns, passes, send outs, come arounds |
| **Charleston** | All Charleston variations - bridges solo and partnered | Basic, tandem, side-by-side, hand-to-hand, Charleston variations |
| **Jazz/Styling** | Solo jazz steps and routines | Suzie Q, Truckin', Shorty George, Shim Sham, Big Apple, jazz walks |
| **Aerials/Specials** | Air steps, dips, and special moves | Basic aerial, side car, dips, drops |

**Pros:**
- Charleston naturally bridges between Core Lindy and Jazz (it's used in both contexts)
- Clear lanes that match how curriculum is often taught
- Aerials/Specials are distinct enough to warrant separation

**Cons:**
- Some moves might feel "mushy" between Core Lindy and Charleston
- Fundamentals (rock step, triple step) get absorbed into Core Lindy

---

## Implementation Notes

To implement any of these options:

1. Add a `family` field to `UniversalMove` in the Prisma schema
2. Update seed data to assign each move to a family
3. Modify graph Y-positioning to use family instead of (or in addition to) solo/partnered
4. Add force tuning slider for family separation strength

The family field could coexist with the existing `category` (solo/partnered) field, or replace it depending on which provides more value.

---

## Future Considerations

- **Multiple tags**: A move could belong to multiple families (e.g., "Tandem Charleston" is both Charleston and Tandem)
- **Weighted positioning**: Instead of discrete families, use continuous weights for positioning
- **User-defined groupings**: Let users create their own categorization schemes
- **Historical lineage**: Track which moves evolved from which (true tree structure)
