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

import { GameEngine } from '../core/reducer.js';
import { EventDatabase } from '../narrative/event-database.js';
import { RNG } from '../core/rng.js';
import { CharacterState } from '@life/schema';

describe('CausalGraph Integration with GameEngine (Task 1.1)', () => {
  it('links SCHEDULE_EVENT consequences to their source in causal graph', () => {
    const db = new EventDatabase();
    db.loadBulk([
      {
        id: 'evt_A',
        schemaVersion: 1,
        contentVersion: 1,
        category: 'LIFE',
        importance: 50,
        decisionType: 'SOCIAL',
        title: 'Event A at 14',
        description: '...',
        conditions: [],
        weight: 100,
        choices: [
          {
            id: 'choice_A1',
            text: 'Trigger B at 23',
            effects: [
              {
                type: 'SCHEDULE_EVENT',
                schedulePayload: {
                  eventId: 'evt_B',
                  targetAge: 23,
                  monthsFromNow: 0
                }
              }
            ]
          }
        ],
        cooldownMonths: 0,
        tags: ['tag_A'],
        repeatable: false
      },
      {
        id: 'evt_B',
        schemaVersion: 1,
        contentVersion: 1,
        category: 'LIFE',
        importance: 50,
        decisionType: 'SOCIAL',
        title: 'Event B at 23',
        description: '...',
        conditions: [
          {
            type: 'age',
            min: 23
          }
        ],
        weight: 100,
        choices: [
          {
            id: 'choice_B1',
            text: 'Done',
            effects: []
          }
        ],
        cooldownMonths: 0,
        tags: ['tag_B'],
        repeatable: false
      },
      {
        id: 'evt_fallback',
        schemaVersion: 1,
        contentVersion: 1,
        category: 'LIFE',
        importance: 10,
        decisionType: 'ROUTINE',
        title: 'Just another year',
        description: '...',
        conditions: [],
        weight: 100,
        choices: [
          {
            id: 'choice_f1',
            text: 'Continue',
            effects: []
          }
        ],
        cooldownMonths: 0,
        tags: [],
        repeatable: true
      }
    ]);

    const charState: CharacterState = {
      id: 'test_char',
      name: 'Test',
      age: 14,
      ageMonths: 0,
      gender: 'male',
      locationId: 'urban',
      isAlive: true,
      money: 100,
      health: 100,
      happiness: 100,
      stress: 0,
      lifeExpectancyFactor: 1.0,
      personality: { openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50, ambition: 50, risk_tolerance: 50, empathy: 50, discipline: 50, curiosity: 50 },
      relationships: [],
      family: [],
      familyBackground: { socialClass: 'middle', stability: 50, wealth: 50 },
      memories: [],
      traits: [],
      skills: {},
      education: { level: 'none', completed: false, yearsEnrolled: 0 },
      career: { currentJobId: null, jobTitle: null, companyName: null, salary: 0, jobPerformance: 50, yearsAtCompany: 0, totalCareerYears: 0, history: [] },
      goals: [],
      reputation: { fame: 0, integrity: 50, communityTrust: 50 },
      inventory: [],
      statusEffects: [],
      statistics: { totalChoicesMade: 0, careersChanged: 0, timesMarried: 0, totalChildren: 0, peakWealth: 0, lowestWealth: 0, majorSuccesses: 0, majorTraumas: 0, placesLived: [], keyAchievements: [] },
      secretState: { loneliness: 0, regret: 0, burnout: 0, social_pressure: 0, self_worth: 50, attachment: 50, family_responsibility: 50 },
      schemaVersion: 1,
      idCounter: 0
    };

    const engine = new GameEngine(charState, db, 123);
    
    // Force play Event A at 14
    engine.getContext().scheduledQueue.push({
      eventId: 'evt_A',
      triggerAge: 14,
      triggerAgeMonths: 0,
      provenance: { sourceEventId: 'start', sourceChoiceId: 'start', atAge: 14, timestamp: { year: 2014, month: 1, day: 1 } }
    });

    const turnA = engine.nextTurn(0);
    expect(turnA.id).toBe('evt_A');
    engine.makeChoice('choice_A1');

    // Simulate to age 23
    let age = 14;
    let iterations = 0;
    while (age < 23 && iterations < 100) {
      const turn = engine.nextTurn(12); // advance 1 year
      if (turn.id === 'evt_B') {
        engine.makeChoice('choice_B1');
      } else {
        engine.makeChoice(turn.choices[0].id);
      }
      age = engine.getCharacter().age;
      iterations++;
    }

    // Now explain B
    const explanation = engine.getCausalTracker().explain('tag_B');
    
    expect(explanation).toHaveLength(2);
    expect(explanation[0].atAge).toBe(14);
    expect(explanation[0].title).toBe('Event A at 14');
    expect(explanation[1].atAge).toBe(23);
    expect(explanation[1].title).toBe('Event B at 23');
  });
});
