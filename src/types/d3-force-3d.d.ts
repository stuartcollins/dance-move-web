declare module 'd3-force-3d' {
  export function forceX(x?: number | ((node: unknown) => number)): {
    strength(strength: number | ((node: unknown) => number)): unknown
  }
  export function forceY(y?: number | ((node: unknown) => number)): {
    strength(strength: number | ((node: unknown) => number)): unknown
  }
  export function forceManyBody(): {
    strength(strength: number): unknown
  }
}
