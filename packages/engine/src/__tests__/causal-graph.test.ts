import { describe, it, expect } from 'vitest';
import { CausalGraphTracker } from '../narrative/causal-graph.js';

describe('CausalGraph & "Why Did This Happen?" API (E10, §92, §93)', () => {
  it('traces backwards through causal chain to explain life outcome', () => {
    const tracker = new CausalGraphTracker();

    // Age 11: developed curiosity
    const node1 = tracker.recordDecision(
      'evt_science_book',
      'choice_read_deeply',
      11,
      'Bought a Science Book',
      'You read about astronomy and mechanics',
      undefined,
      ['curiosity', 'science']
    );

    // Age 14: teacher encouragement
    const node2 = tracker.recordDecision(
      'evt_science_fair',
      'choice_enter_project',
      14,
      'Entered Science Fair',
      'Your teacher encouraged you to pursue engineering',
      node1,
      ['science_fair', 'engineering']
    );

    // Age 17: chose science major
    const node3 = tracker.recordDecision(
      'evt_major_selection',
      'choice_stem',
      17,
      'High School Specialization',
      'You chose STEM instead of business',
      node2,
      ['stem_track']
    );

    // Age 20: engineering scholarship
    const node4 = tracker.recordDecision(
      'evt_college_scholarship',
      'choice_accept',
      20,
      'Engineering Scholarship',
      'You accepted a competitive university scholarship',
      node3,
      ['scholarship']
    );

    // Age 23: accepted first engineering job
    tracker.recordDecision(
      'evt_job_offer_tech',
      'choice_accept_offer',
      23,
      'First Job Offer',
      'You accepted an offer as Junior Software Engineer',
      node4,
      ['became_engineer', 'career_start']
    );

    // Test blueprint §93 API: "Why did I become an engineer?"
    const explanation = tracker.explain('became_engineer');

    expect(explanation).toHaveLength(5);
    expect(explanation[0]?.atAge).toBe(11);
    expect(explanation[0]?.title).toBe('Bought a Science Book');

    expect(explanation[1]?.atAge).toBe(14);
    expect(explanation[2]?.atAge).toBe(17);
    expect(explanation[3]?.atAge).toBe(20);

    expect(explanation[4]?.atAge).toBe(23);
    expect(explanation[4]?.title).toBe('First Job Offer');
  });

  it('returns empty array when querying an unrecorded outcome', () => {
    const tracker = new CausalGraphTracker();
    const result = tracker.explain('became_astronaut');
    expect(result).toEqual([]);
  });
});
