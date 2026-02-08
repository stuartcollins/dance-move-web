import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface MoveData {
  name: string
  description: string
  tier: number
  category: 'solo' | 'partnered'
  aliases?: string[]
  relatedMoves: { name: string; weight: number; type: string }[]
}

// Comprehensive Lindy Hop move dataset - 150 moves
// category: "solo" = individual styling/jazz steps (red), "partnered" = partner work (blue)
const lindyHopMoveData: MoveData[] = [
  // ===== TIER 1 - FUNDAMENTALS =====

  // Partnered Fundamentals
  {
    name: "Rock Step",
    description: "The foundational weight shift - stepping back and returning. The starting point of most Lindy Hop patterns.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Triple Step", weight: 0.9, type: "related" },
      { name: "6-Count Basic", weight: 0.9, type: "leads_to" },
      { name: "8-Count Basic", weight: 0.9, type: "leads_to" },
    ]
  },
  {
    name: "Triple Step",
    description: "Three steps in two beats (step-ball-change). Creates the syncopated, bouncy feel of swing.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Rock Step", weight: 0.9, type: "related" },
      { name: "Kick Ball Change", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Pulse",
    description: "The continuous bouncing that maintains connection to music and partner. The engine of Lindy Hop.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Triple Step", weight: 0.8, type: "related" },
      { name: "Connection", weight: 0.9, type: "related" },
    ]
  },
  {
    name: "Connection",
    description: "Physical and energetic link between partners through frame and hand holds.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Pulse", weight: 0.9, type: "related" },
      { name: "Closed Position", weight: 0.8, type: "leads_to" },
      { name: "Open Position", weight: 0.8, type: "leads_to" },
      { name: "Frame", weight: 0.9, type: "related" },
    ]
  },
  {
    name: "Frame",
    description: "The structure of arms and body that allows partners to communicate movement intentions.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Connection", weight: 0.9, type: "related" },
      { name: "Closed Position", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Closed Position",
    description: "Partners facing each other in embrace. Starting position for many patterns.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Connection", weight: 0.9, type: "prerequisite" },
      { name: "Open Position", weight: 0.8, type: "related" },
      { name: "Swingout from Closed", weight: 0.9, type: "leads_to" },
    ]
  },
  {
    name: "Open Position",
    description: "Partners connected by hands with space between. Allows individual expression.",
    tier: 1,
    category: "partnered",
    relatedMoves: [
      { name: "Connection", weight: 0.9, type: "prerequisite" },
      { name: "Closed Position", weight: 0.8, type: "related" },
      { name: "Swingout from Open", weight: 0.9, type: "leads_to" },
    ]
  },
  {
    name: "6-Count Basic",
    description: "Step-step-triple-step-triple-step. Foundation for 6-count moves.",
    tier: 1,
    category: "partnered",
    aliases: ["Single Rhythm"],
    relatedMoves: [
      { name: "Rock Step", weight: 0.9, type: "prerequisite" },
      { name: "Triple Step", weight: 0.9, type: "prerequisite" },
      { name: "8-Count Basic", weight: 0.8, type: "related" },
      { name: "Tuck Turn", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "8-Count Basic",
    description: "Step-step-triple-step-step-step-triple-step. Foundation for swingouts.",
    tier: 1,
    category: "partnered",
    aliases: ["Double Rhythm"],
    relatedMoves: [
      { name: "Rock Step", weight: 0.9, type: "prerequisite" },
      { name: "6-Count Basic", weight: 0.8, type: "related" },
      { name: "Swingout from Closed", weight: 0.9, type: "leads_to" },
    ]
  },

  // Solo Fundamentals
  {
    name: "Basic Charleston",
    description: "Solo Charleston footwork - kick forward, step back, kick back, step forward. Historical root of Lindy Hop.",
    tier: 1,
    category: "solo",
    aliases: ["20s Charleston", "Solo Charleston"],
    relatedMoves: [
      { name: "Side-by-Side Charleston", weight: 0.9, type: "leads_to" },
      { name: "Jazz Walk", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Jazz Walk",
    description: "Stylized walking with attitude, bent knees, and rhythmic emphasis. Foundation of solo movement.",
    tier: 1,
    category: "solo",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.6, type: "related" },
      { name: "Strut", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Bounce",
    description: "Continuous vertical pulse in the body, fundamental to swing rhythm when dancing solo.",
    tier: 1,
    category: "solo",
    relatedMoves: [
      { name: "Pulse", weight: 0.9, type: "related" },
      { name: "Jazz Walk", weight: 0.7, type: "related" },
    ]
  },

  // ===== TIER 2 - CORE MOVES =====

  // Core Partnered Moves
  {
    name: "Swingout from Closed",
    description: "THE defining move of Lindy Hop. Partners rotate around each other from closed to open position.",
    tier: 2,
    category: "partnered",
    aliases: ["Swingout", "Lindy Turn"],
    relatedMoves: [
      { name: "8-Count Basic", weight: 0.9, type: "prerequisite" },
      { name: "Closed Position", weight: 0.9, type: "prerequisite" },
      { name: "Swingout from Open", weight: 0.9, type: "related" },
      { name: "Lindy Circle", weight: 0.8, type: "leads_to" },
      { name: "Savoy Swingout", weight: 0.7, type: "variation" },
      { name: "Hollywood Swingout", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Savoy Swingout",
    description: "Original Harlem style swingout with circular path and grounded movement.",
    tier: 2,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "variation" },
      { name: "Hollywood Swingout", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Hollywood Swingout",
    description: "West coast variation with more linear slot movement, influenced by film choreography.",
    tier: 2,
    category: "partnered",
    aliases: ["Hollywood Whip"],
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "variation" },
      { name: "Savoy Swingout", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Swingout from Open",
    description: "Swingout starting from open position. Partners come together then open again.",
    tier: 2,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Open Position", weight: 0.8, type: "prerequisite" },
    ]
  },
  {
    name: "Lindy Circle",
    description: "Partners rotate together in closed position without opening up.",
    tier: 2,
    category: "partnered",
    aliases: ["Circle"],
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.8, type: "prerequisite" },
      { name: "Swingout from Open", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Send Out",
    description: "Leader sends follower away to establish open position and distance.",
    tier: 2,
    category: "partnered",
    aliases: ["Throw Out"],
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.7, type: "prerequisite" },
      { name: "Tuck Turn", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Tuck Turn",
    description: "6-count turn where leader creates compression before redirecting follower into a spin.",
    tier: 2,
    category: "partnered",
    relatedMoves: [
      { name: "6-Count Basic", weight: 0.8, type: "prerequisite" },
      { name: "Send Out", weight: 0.6, type: "related" },
      { name: "Pass By", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Pass By",
    description: "Partners pass each other, changing places. Simple but versatile 6-count pattern.",
    tier: 2,
    category: "partnered",
    aliases: ["Change of Places", "Side Pass"],
    relatedMoves: [
      { name: "6-Count Basic", weight: 0.8, type: "prerequisite" },
      { name: "Tuck Turn", weight: 0.7, type: "related" },
      { name: "Underarm Turn", weight: 0.6, type: "leads_to" },
    ]
  },
  {
    name: "Underarm Turn",
    description: "Follower turns under leader's raised arm while passing.",
    tier: 2,
    category: "partnered",
    aliases: ["Inside Turn from Pass"],
    relatedMoves: [
      { name: "Pass By", weight: 0.8, type: "prerequisite" },
      { name: "Tuck Turn", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Bring In",
    description: "Leader brings follower from open position back to closed position.",
    tier: 2,
    category: "partnered",
    aliases: ["Gather In"],
    relatedMoves: [
      { name: "Send Out", weight: 0.9, type: "related" },
      { name: "Closed Position", weight: 0.7, type: "leads_to" },
    ]
  },

  // Partnered Charleston
  {
    name: "Side-by-Side Charleston",
    description: "Partners stand next to each other doing Charleston kicks together.",
    tier: 2,
    category: "partnered",
    aliases: ["Side Charleston"],
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.9, type: "prerequisite" },
      { name: "Hand-to-Hand Charleston", weight: 0.8, type: "leads_to" },
      { name: "Tandem Charleston", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Hand-to-Hand Charleston",
    description: "Partners face each other doing Charleston, connected by both hands.",
    tier: 2,
    category: "partnered",
    aliases: ["Face-to-Face Charleston"],
    relatedMoves: [
      { name: "Side-by-Side Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Charleston Tuck Turn", weight: 0.6, type: "leads_to" },
    ]
  },
  {
    name: "Jockey Position",
    description: "Compact closed position for Charleston, useful on crowded floors.",
    tier: 2,
    category: "partnered",
    relatedMoves: [
      { name: "Closed Position", weight: 0.7, type: "related" },
      { name: "Hand-to-Hand Charleston", weight: 0.6, type: "related" },
    ]
  },

  // Core Solo Jazz
  {
    name: "Boogie Forward",
    description: "Weight shifts forward with attitude. Building block for Shim Sham.",
    tier: 2,
    category: "solo",
    aliases: ["Boogie"],
    relatedMoves: [
      { name: "Boogie Back", weight: 0.9, type: "related" },
      { name: "Shim Sham", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Boogie Back",
    description: "Weight shifts backward with attitude. Paired with boogie forward.",
    tier: 2,
    category: "solo",
    relatedMoves: [
      { name: "Boogie Forward", weight: 0.9, type: "related" },
      { name: "Boogie Drop", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Boogie Drop",
    description: "Boogie with a lowering motion, adding dynamics to the basic boogie.",
    tier: 2,
    category: "solo",
    relatedMoves: [
      { name: "Boogie Back", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Kick Ball Change",
    description: "Syncopated footwork - kick, step on ball, change weight. Very versatile.",
    tier: 2,
    category: "solo",
    relatedMoves: [
      { name: "Triple Step", weight: 0.8, type: "related" },
      { name: "Apple Jacks", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Strut",
    description: "Stylized walking with extended legs and attitude. Classic jazz movement.",
    tier: 2,
    category: "solo",
    relatedMoves: [
      { name: "Jazz Walk", weight: 0.9, type: "variation" },
      { name: "Camel Walk", weight: 0.6, type: "related" },
    ]
  },

  // ===== TIER 3 - INTERMEDIATE =====

  // Swingout Variations
  {
    name: "Texas Tommy",
    description: "Swingout where leader passes follower's hand behind her back. Historic move from 1910s.",
    tier: 3,
    category: "partnered",
    aliases: ["Apache"],
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Texas Tommy Reverse", weight: 0.8, type: "variation" },
      { name: "Hammerlock", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Inside Turn",
    description: "Follower turns toward leader during swingout. Most common swingout variation.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Outside Turn", weight: 0.8, type: "related" },
      { name: "Free Spin", weight: 0.6, type: "leads_to" },
      { name: "Double Inside Turn", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Outside Turn",
    description: "Follower turns away from leader during swingout.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Inside Turn", weight: 0.8, type: "related" },
      { name: "Double Outside Turn", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Free Spin",
    description: "Follower spins without hand connection, relying on momentum.",
    tier: 3,
    category: "partnered",
    aliases: ["Frisbee"],
    relatedMoves: [
      { name: "Inside Turn", weight: 0.8, type: "prerequisite" },
      { name: "Double Turn", weight: 0.6, type: "leads_to" },
    ]
  },
  {
    name: "Swingout with Kick",
    description: "Swingout with decorative kicks added to the footwork.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Swingout with Double Kick", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Swingout with Double Kick",
    description: "Swingout with two kicks, typically on 7-8 or 1-2.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout with Kick", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Syncopated Swingout",
    description: "Swingout with delayed timing - follower holds on 1, comes in fast on 2.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Reverse Swingout",
    description: "Swingout with follower moving counter-clockwise around leader.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Half Swingout", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Half Swingout",
    description: "Follower stays on one side of leader, combining normal and reverse.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Reverse Swingout", weight: 0.8, type: "related" },
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Swingout in Place",
    description: "Swingout executed without traveling, staying in closed position area.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "variation" },
      { name: "Lindy Circle", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Swingout with Tap Behind",
    description: "Swingout incorporating a tap step behind the body.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
    ]
  },

  // Charleston Variations
  {
    name: "Tandem Charleston",
    description: "Both partners face same direction doing Charleston. Must-know for all Lindy Hoppers.",
    tier: 3,
    category: "partnered",
    aliases: ["Shadow Charleston"],
    relatedMoves: [
      { name: "Side-by-Side Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Tandem Push Out", weight: 0.8, type: "leads_to" },
      { name: "Tandem Turn", weight: 0.7, type: "leads_to" },
      { name: "Tandem Kick Variations", weight: 0.6, type: "leads_to" },
    ]
  },
  {
    name: "Charleston Tuck Turn",
    description: "Tuck turn from Charleston rhythm. Transitions between Charleston variations.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Hand-to-Hand Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Tuck Turn", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Tandem Push Out",
    description: "From tandem Charleston, leader pushes follower out to open position.",
    tier: 3,
    category: "partnered",
    aliases: ["Tandem Exit"],
    relatedMoves: [
      { name: "Tandem Charleston", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Charleston Cross Kicks",
    description: "Charleston with crossing leg action, adding visual interest.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Hand-to-Hand Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Hand-to-Hand Cross Kicks", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Hand-to-Hand Cross Kicks",
    description: "Cross kicks done in hand-to-hand position.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Charleston Cross Kicks", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Skip Up",
    description: "Quick kicking Charleston variation with upward energy.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Skip Up with Flare", weight: 0.8, type: "variation" },
      { name: "Long Skip Up", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Skip Up with Flare",
    description: "Skip up with added arm or leg flair.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Skip Up", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Long Skip Up",
    description: "Extended version of skip up covering more distance.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Skip Up", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Flip Flops",
    description: "Charleston variation with alternating kick direction.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.8, type: "prerequisite" },
      { name: "Skip Up Flip Flops", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Skip Up Flip Flops",
    description: "Combination of skip up and flip flop movements.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Skip Up", weight: 0.8, type: "prerequisite" },
      { name: "Flip Flops", weight: 0.8, type: "prerequisite" },
    ]
  },
  {
    name: "Tandem Kick Variations",
    description: "Various kick patterns done while in tandem position.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Tandem Charleston", weight: 0.9, type: "prerequisite" },
    ]
  },

  // Other Partnered Moves
  {
    name: "Sugar Push",
    description: "Compression-based move where partners push and rebound.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Connection", weight: 0.7, type: "prerequisite" },
      { name: "Tuck Turn", weight: 0.5, type: "related" },
    ]
  },
  {
    name: "Basket Whip",
    description: "Double hand hold where lead moves around follow.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.8, type: "prerequisite" },
      { name: "Cuddle Position", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Cuddle Position",
    description: "Wrapped position with follower's back to leader.",
    tier: 3,
    category: "partnered",
    aliases: ["Sweetheart"],
    relatedMoves: [
      { name: "Basket Whip", weight: 0.8, type: "related" },
      { name: "Tandem Charleston", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Promenade Position",
    description: "Partners side by side, both facing same direction.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Side-by-Side Charleston", weight: 0.7, type: "related" },
      { name: "Cuddle Position", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Pecks",
    description: "Quick pecking motion often done from closed position.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.7, type: "related" },
      { name: "Pecks with Spin", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Pecks with Spin",
    description: "Pecks move with added follower spin.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "Pecks", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Frankie 6s",
    description: "Syncopated 6-count variations attributed to Frankie Manning.",
    tier: 3,
    category: "partnered",
    relatedMoves: [
      { name: "6-Count Basic", weight: 0.8, type: "prerequisite" },
    ]
  },

  // Styling (can be done partnered)
  {
    name: "Swivels",
    description: "Follower pivots on balls of feet, rotating hips. Classic styling for swingouts.",
    tier: 3,
    category: "solo",
    aliases: ["Twists"],
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.7, type: "related" },
      { name: "Switches", weight: 0.6, type: "leads_to" },
      { name: "Swivel Walks", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Switches",
    description: "Quick directional changes in swivels. Advanced styling.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Swivels", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Swivel Walks",
    description: "Walking with swivel action on each step.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Swivels", weight: 0.9, type: "variation" },
    ]
  },

  // Solo Jazz Steps
  {
    name: "Shorty George",
    description: "Bent knees walking with attitude, named after Shorty George Snowden.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Boogie Forward", weight: 0.6, type: "related" },
      { name: "Shim Sham", weight: 0.8, type: "leads_to" },
      { name: "Truckin'", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Suzie Q",
    description: "Heel-toe twisting motion. Featured in Big Apple routine.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Shorty George", weight: 0.6, type: "related" },
      { name: "Big Apple", weight: 0.8, type: "leads_to" },
    ]
  },
  {
    name: "Truckin'",
    description: "Walking with index finger wagging and hips swaying.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Shorty George", weight: 0.7, type: "related" },
      { name: "Big Apple", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Apple Jacks",
    description: "Jazz step with heel-toe action, developed in 1940s.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Kick Ball Change", weight: 0.8, type: "prerequisite" },
      { name: "Shorty George", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Tacky Annie",
    description: "Originally a tap step, now classic jazz movement.",
    tier: 3,
    category: "solo",
    aliases: ["Tack Annie"],
    relatedMoves: [
      { name: "Shim Sham", weight: 0.9, type: "leads_to" },
      { name: "Boogie Forward", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Camel Walk",
    description: "Stylized walk imitating camel movement. Classic vernacular jazz.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Strut", weight: 0.7, type: "related" },
      { name: "Camel Walk Backward", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Camel Walk Backward",
    description: "Camel walk executed moving backward.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Camel Walk", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Fishtail",
    description: "Side-to-side movement imitating a fish's tail.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Suzie Q", weight: 0.6, type: "related" },
      { name: "Snake Hips", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Snake Hips",
    description: "Undulating hip movement creating snake-like motion.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Fishtail", weight: 0.7, type: "related" },
      { name: "Body Roll", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Body Roll",
    description: "Wave-like movement rolling through the body.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Snake Hips", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Break-a-Leg",
    description: "Dramatic leg break movement, often used as accent.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Big Apple", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Shout",
    description: "Energetic movement often done in Big Apple calls.",
    tier: 3,
    category: "solo",
    aliases: ["Hallelujah"],
    relatedMoves: [
      { name: "Big Apple", weight: 0.9, type: "leads_to" },
    ]
  },
  {
    name: "Box Step",
    description: "Basic jazz box pattern used as foundation.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Jazz Walk", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Grapevine",
    description: "Side-stepping pattern crossing feet alternately.",
    tier: 3,
    category: "solo",
    aliases: ["Cool Breeze"],
    relatedMoves: [
      { name: "Jazz Walk", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Crazy Legs",
    description: "Loose, rubber-legged movement.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Snake Hips", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Eagle Slide",
    description: "Sliding movement with arms extended.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Grapevine", weight: 0.5, type: "related" },
    ]
  },
  {
    name: "Scissor Kicks",
    description: "Alternating front kicks crossing at the knees.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Kick Ball Change", weight: 0.7, type: "related" },
      { name: "Basic Charleston", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Stomp Off",
    description: "Stomping exit from Shim Sham routine.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Shim Sham", weight: 0.9, type: "related" },
    ]
  },
  {
    name: "Push and Cross Over",
    description: "Shim Sham movement with push and crossing action.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Shim Sham", weight: 0.9, type: "related" },
    ]
  },
  {
    name: "Half Break",
    description: "Tap-derived break step used in jazz routines.",
    tier: 3,
    category: "solo",
    relatedMoves: [
      { name: "Shim Sham", weight: 0.8, type: "leads_to" },
    ]
  },

  // ===== TIER 4 - ADVANCED =====

  // Advanced Partnered Moves
  {
    name: "Texas Tommy Reverse",
    description: "Texas Tommy with reversed hand position or direction.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Texas Tommy", weight: 0.9, type: "variation" },
      { name: "Hammerlock", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Hammerlock",
    description: "Follower's arm wrapped behind their back in held position.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Texas Tommy", weight: 0.8, type: "prerequisite" },
      { name: "Texas Tommy Reverse", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Double Inside Turn",
    description: "Two inside turns in one swingout.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Inside Turn", weight: 0.9, type: "variation" },
      { name: "Double Turn", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Double Outside Turn",
    description: "Two outside turns in one swingout.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Outside Turn", weight: 0.9, type: "variation" },
      { name: "Double Turn", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Double Turn",
    description: "Two full rotations in a single turn. Requires spotting and balance.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Free Spin", weight: 0.9, type: "prerequisite" },
      { name: "Triple Turn", weight: 0.7, type: "leads_to" },
    ]
  },
  {
    name: "Triple Turn",
    description: "Three full rotations. Advanced spinning technique.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Double Turn", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Tandem Turn",
    description: "Partners rotate 360° together while in tandem.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Tandem Charleston", weight: 0.9, type: "prerequisite" },
      { name: "Tandem Rainbow", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Tandem Rainbow",
    description: "Follower led in arc over leader's head from tandem.",
    tier: 4,
    category: "partnered",
    aliases: ["Rainbow"],
    relatedMoves: [
      { name: "Tandem Charleston", weight: 0.9, type: "prerequisite" },
      { name: "Tandem Turn", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Loop-de-Loops",
    description: "Chained inside turns, follower continuously rotates.",
    tier: 4,
    category: "partnered",
    aliases: ["Chained Inside Turns"],
    relatedMoves: [
      { name: "Inside Turn", weight: 0.9, type: "prerequisite" },
      { name: "Double Turn", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Sliding Doors",
    description: "Partners pass each other repeatedly in quick succession.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Pass By", weight: 0.8, type: "prerequisite" },
    ]
  },
  {
    name: "Revolving Doors",
    description: "Variation on sliding doors with rotation.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Sliding Doors", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Trebuchet Sendout",
    description: "Dramatic sendout with rotational momentum.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Send Out", weight: 0.8, type: "prerequisite" },
      { name: "Free Spin", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Cross-Body Sendout",
    description: "Sendout going across the leader's body.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Send Out", weight: 0.9, type: "prerequisite" },
      { name: "Cross-Body Inside Turn Sendout", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Cross-Body Inside Turn Sendout",
    description: "Cross-body sendout with inside turn.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Cross-Body Sendout", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Toss Across",
    description: "Quick toss of follower across to other side.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Pass By", weight: 0.8, type: "prerequisite" },
    ]
  },
  {
    name: "Minnie Dip",
    description: "Playful small dip, named after Minnie the Moocher.",
    tier: 4,
    category: "partnered",
    aliases: ["Mini Dip"],
    relatedMoves: [
      { name: "Connection", weight: 0.7, type: "prerequisite" },
    ]
  },
  {
    name: "Dip",
    description: "Full dip where follower leans back supported by leader.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Minnie Dip", weight: 0.8, type: "related" },
      { name: "Drop", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Drop",
    description: "Controlled lowering of follower toward floor.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Dip", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Airplane Charleston",
    description: "Partner lifted/leaned with arms extended like wings.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Tandem Charleston", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Basic Aerial",
    description: "Simple lift where follower leaves ground briefly.",
    tier: 4,
    category: "partnered",
    aliases: ["Air Step"],
    relatedMoves: [
      { name: "Connection", weight: 0.8, type: "prerequisite" },
      { name: "Side Car", weight: 0.7, type: "leads_to" },
      { name: "Kip", weight: 0.6, type: "leads_to" },
    ]
  },
  {
    name: "Side Car",
    description: "Aerial where follower is lifted to leader's side.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Basic Aerial", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Kip",
    description: "Springing aerial movement.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Basic Aerial", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Frankie Throw",
    description: "Classic aerial named after Frankie Manning.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Basic Aerial", weight: 0.9, type: "prerequisite" },
    ]
  },
  {
    name: "Stop on 5",
    description: "Musical accent stopping movement on count 5.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Swingout Kate",
    description: "Reverse half swingout taught by Frankie Manning.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Half Swingout", weight: 0.9, type: "variation" },
      { name: "Reverse Swingout", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Liquid",
    description: "Smooth flowing movement between positions.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Lindy Circle", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Lift and Slide",
    description: "Fancy footwork combining lift and sliding motion.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Skip Up", weight: 0.7, type: "related" },
      { name: "Cross and Lunge", weight: 0.8, type: "leads_to" },
    ]
  },
  {
    name: "Cross and Lunge",
    description: "Crossing step into a lunge position.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Lift and Slide", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Foot Sweep",
    description: "Sweeping the foot along the floor decoratively.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Double Foot Sweep", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Double Foot Sweep",
    description: "Two consecutive foot sweeps.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Foot Sweep", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Kick Away",
    description: "Stylized kick facing away from partner.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout with Kick", weight: 0.7, type: "related" },
    ]
  },

  // Jazz Routines
  {
    name: "Shim Sham",
    description: "Classic jazz line dance routine. Lindy Hop tradition at social events.",
    tier: 4,
    category: "solo",
    aliases: ["Shim Sham Shimmy"],
    relatedMoves: [
      { name: "Boogie Forward", weight: 0.8, type: "prerequisite" },
      { name: "Boogie Back", weight: 0.8, type: "prerequisite" },
      { name: "Shorty George", weight: 0.8, type: "prerequisite" },
      { name: "Tacky Annie", weight: 0.9, type: "prerequisite" },
      { name: "Tranky Doo", weight: 0.6, type: "related" },
      { name: "Big Apple", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Big Apple",
    description: "Circle dance where caller shouts out jazz moves. Historical social dance.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Suzie Q", weight: 0.8, type: "prerequisite" },
      { name: "Truckin'", weight: 0.8, type: "prerequisite" },
      { name: "Shout", weight: 0.8, type: "prerequisite" },
      { name: "Shim Sham", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Tranky Doo",
    description: "Jazz line dance choreographed by Frankie Manning.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Boogie Forward", weight: 0.8, type: "prerequisite" },
      { name: "Shim Sham", weight: 0.7, type: "related" },
      { name: "Fall Off the Log", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "California Routine",
    description: "Famous partnered routine from Hellzapoppin' by Frankie Manning.",
    tier: 4,
    category: "partnered",
    relatedMoves: [
      { name: "Swingout from Closed", weight: 0.9, type: "prerequisite" },
      { name: "Basic Aerial", weight: 0.8, type: "prerequisite" },
    ]
  },
  {
    name: "Jitterbug Stroll",
    description: "Modern jazz line dance by Ryan Francois.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Shim Sham", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "First Stops",
    description: "Early Savoy Ballroom ensemble routine.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Big Apple", weight: 0.6, type: "related" },
    ]
  },

  // Advanced Solo Jazz
  {
    name: "Fall Off the Log",
    description: "Stumbling motion as if falling off a log. Featured in Tranky Doo.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Tranky Doo", weight: 0.9, type: "related" },
      { name: "Extreme Fall Off the Log", weight: 0.8, type: "variation" },
    ]
  },
  {
    name: "Extreme Fall Off the Log",
    description: "Exaggerated version with bigger movement.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Fall Off the Log", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Peckin",
    description: "Chicken-like head bobbing movement.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Truckin'", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Spank the Baby",
    description: "Slapping motion jazz step.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Tacky Annie", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Gaze Afar",
    description: "Looking into distance with stylized movement.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Big Apple", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Rusty Dusty",
    description: "Brushing off movement, jazz styling.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Spank the Baby", weight: 0.5, type: "related" },
    ]
  },
  {
    name: "Knee Slaps",
    description: "Slapping the knees rhythmically.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Break-a-Leg", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Freeze",
    description: "Sudden stop in movement for musical accent.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Stop on 5", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Jump Charleston",
    description: "Charleston with added jumping action.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Squat Charleston",
    description: "Charleston executed in a low squat position.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Kansas City Charleston",
    description: "Regional Charleston variation with distinct style.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.9, type: "variation" },
    ]
  },
  {
    name: "Savoy Kicks",
    description: "Kick style associated with Savoy Ballroom dancers.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Basic Charleston", weight: 0.8, type: "related" },
      { name: "Scissor Kicks", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Johnny's Drop",
    description: "Dramatic drop movement named after a dancer.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Break-a-Leg", weight: 0.7, type: "related" },
    ]
  },
  {
    name: "Heel Rock",
    description: "Rocking on the heels as footwork substitution.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Rock Step", weight: 0.7, type: "variation" },
    ]
  },
  {
    name: "Ba Dum",
    description: "Rhythmic step variation for musical accent.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Kick Ball Change", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Flying Home",
    description: "Step named after the famous Lionel Hampton song.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Boogie Forward", weight: 0.6, type: "related" },
    ]
  },
  {
    name: "Grinds",
    description: "Circular hip grinding movement.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Snake Hips", weight: 0.8, type: "related" },
    ]
  },
  {
    name: "Crossovers",
    description: "Stepping across the body repeatedly.",
    tier: 4,
    category: "solo",
    relatedMoves: [
      { name: "Grapevine", weight: 0.7, type: "related" },
    ]
  },
]

export async function POST() {
  try {
    // Get or create the Lindy Hop dance style
    let danceStyle = await prisma.danceStyle.findUnique({
      where: { name: 'Lindy Hop' }
    })

    if (!danceStyle) {
      danceStyle = await prisma.danceStyle.create({
        data: {
          name: 'Lindy Hop',
          description: 'The original swing dance, born in Harlem in the late 1920s.',
        }
      })
    }

    // Clear existing Lindy Hop moves to reseed
    await prisma.universalMoveRelation.deleteMany({
      where: {
        fromMove: { danceStyleId: danceStyle.id }
      }
    })
    await prisma.universalMove.deleteMany({
      where: { danceStyleId: danceStyle.id }
    })

    // Create all moves first
    const moveMap = new Map<string, string>()

    for (const move of lindyHopMoveData) {
      try {
        const created = await prisma.universalMove.create({
          data: {
            name: move.name,
            description: move.description,
            tier: move.tier,
            category: move.category,
            aliases: move.aliases?.join(', ') || null,
            danceStyleId: danceStyle.id,
          }
        })
        moveMap.set(move.name.toLowerCase(), created.id)
      } catch (err) {
        console.log(`Skipping duplicate move: ${move.name}`, err)
      }
    }

    // Now create relationships
    let relationCount = 0
    for (const move of lindyHopMoveData) {
      const fromId = moveMap.get(move.name.toLowerCase())
      if (!fromId || !move.relatedMoves) continue

      for (const rel of move.relatedMoves) {
        const toId = moveMap.get(rel.name.toLowerCase())
        if (!toId || fromId === toId) continue

        try {
          await prisma.universalMoveRelation.create({
            data: {
              fromMoveId: fromId,
              toMoveId: toId,
              weight: rel.weight,
              relationType: rel.type,
            }
          })
          relationCount++
        } catch {
          // Skip duplicates
        }
      }
    }

    return NextResponse.json({
      success: true,
      danceStyle: danceStyle.name,
      moveCount: moveMap.size,
      relationCount,
    })
  } catch (error) {
    console.error('Error seeding graph:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to seed graph data: ${message}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    let danceStyle = await prisma.danceStyle.findUnique({
      where: { name: 'Lindy Hop' }
    })

    if (!danceStyle) {
      const anyStyle = await prisma.danceStyle.findFirst({
        where: { universalMoves: { some: {} } }
      })
      danceStyle = anyStyle
    }

    if (!danceStyle) {
      return NextResponse.json([])
    }

    const moves = await prisma.universalMove.findMany({
      where: { danceStyleId: danceStyle.id },
      include: {
        danceStyle: true,
        relatedFrom: {
          include: { toMove: true }
        },
        relatedTo: {
          include: { fromMove: true }
        },
      },
      orderBy: { tier: 'asc' }
    })

    return NextResponse.json(moves)
  } catch (error) {
    console.error('Error fetching graph:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch graph data: ${message}` },
      { status: 500 }
    )
  }
}
