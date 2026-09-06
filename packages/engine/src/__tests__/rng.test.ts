import { describe, it, expect } from 'vitest';
import { RNG } from '../core/rng.js';

describe('PRNG Determinism & Sub-streams (E1.1)', () => {
  it('produces identical sequence from the same seed', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1.nextFloat());
    const seq2 = Array.from({ length: 100 }, () => rng2.nextFloat());

    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences from different seeds', () => {
    const rng1 = new RNG(12345);
    const rng2 = new RNG(54321);

    const val1 = rng1.nextFloat();
    const val2 = rng2.nextFloat();

    expect(val1).not.toEqual(val2);
  });

  it('generates integers within [min, max] inclusive', () => {
    const rng = new RNG(999);
    for (let i = 0; i < 500; i++) {
      const val = rng.nextInt(5, 12);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(12);
    }
  });

  it('forks isolated sub-streams without affecting other streams', () => {
    const masterRngA = new RNG(777);
    const masterRngB = new RNG(777);

    const familyStreamA = masterRngA.fork('family');
    const familyStreamB = masterRngB.fork('family');

    // Draw some numbers from masterRngA events stream
    const eventStreamA = masterRngA.fork('events');
    eventStreamA.nextFloat();
    eventStreamA.nextFloat();

    // Family streams must remain 100% identical regardless of activity in events
    const famSeqA = Array.from({ length: 20 }, () => familyStreamA.nextFloat());
    const famSeqB = Array.from({ length: 20 }, () => familyStreamB.nextFloat());

    expect(famSeqA).toEqual(famSeqB);
  });
});
