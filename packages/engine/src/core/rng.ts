/**
 * Deterministic Pseudo-Random Number Generator (PRNG)
 * Uses SplitMix32 for seeding and hash derivation, and XorShift128+ for fast high-quality streams.
 * Conforms to L1 determinism contract (§34, §88, §92).
 */

export class RNG {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // Initialize 128-bit state using SplitMix32 algorithm
    let s = (seed | 0);
    const nextSplitMix32 = () => {
      s = (s + 0x9e3779b9) | 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
      return (z ^ (z >>> 16)) >>> 0;
    };

    this.s0 = nextSplitMix32();
    this.s1 = nextSplitMix32();
    this.s2 = nextSplitMix32();
    this.s3 = nextSplitMix32();

    // Ensure state is not all zeros
    if (this.s0 === 0 && this.s1 === 0 && this.s2 === 0 && this.s3 === 0) {
      this.s0 = 1;
    }
  }

  /**
   * Generates next 32-bit unsigned integer in [0, 2^32 - 1]
   */
  public nextUint32(): number {
    // XorShift128 algorithm
    const t = this.s3;
    let s = this.s0;
    this.s3 = this.s2;
    this.s2 = this.s1;
    this.s1 = s;

    s ^= s << 11;
    s ^= s >>> 8;
    this.s0 = s ^ t ^ (t >>> 19);

    return this.s0 >>> 0;
  }

  /**
   * Generates a float in [0, 1)
   */
  public nextFloat(): number {
    return this.nextUint32() / 4294967296.0;
  }

  /**
   * Generates an integer in [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    if (lo > hi) return lo;
    const range = hi - lo + 1;
    return lo + Math.floor(this.nextFloat() * range);
  }

  /**
   * Returns true with given probability [0, 1]
   */
  public chance(probability: number): boolean {
    return this.nextFloat() < probability;
  }

  /**
   * Randomly picks an element from array
   */
  public pick<T>(items: readonly T[]): T | undefined {
    if (items.length === 0) return undefined;
    const index = this.nextInt(0, items.length - 1);
    return items[index];
  }

  /**
   * Weighted random selection from an array of items
   */
  public weightedPick<T>(items: readonly T[], weights: readonly number[]): T | undefined {
    if (items.length === 0 || items.length !== weights.length) return undefined;

    let totalWeight = 0;
    for (const w of weights) {
      if (w > 0) totalWeight += w;
    }

    if (totalWeight <= 0) return this.pick(items);

    const roll = this.nextFloat() * totalWeight;
    let cumulative = 0;

    for (let i = 0; i < items.length; i++) {
      const w = weights[i] ?? 0;
      if (w <= 0) continue;
      cumulative += w;
      if (roll <= cumulative) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  /**
   * Forks a deterministic sub-stream based on namespace/category
   * Ensures that events generation does not shift random numbers for family generation.
   */
  public fork(namespace: string): RNG {
    // Generate deterministic 32-bit hash from namespace string + current state
    let hash = 0x811c9dc5;
    for (let i = 0; i < namespace.length; i++) {
      hash ^= namespace.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const combinedSeed = (hash ^ this.nextUint32()) | 0;
    return new RNG(combinedSeed);
  }
}
