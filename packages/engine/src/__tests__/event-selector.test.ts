import { describe, it, expect } from 'vitest';
import { CharacterState, EventDefinition } from '@life/schema';
import { EventSelector } from '../narrative/event-selector.js';
import { RNG } from '../core/rng.js';

function createMockCharacter(age: number): CharacterState {
  return {
    id: 'char_selector_test',
    name: 'Selector Tester',
    age,
    ageMonths: 0,
    gender: 'female',
    locationId: 'urban',
    isAlive: true,
    money: 0,
    health: 90,
    happiness: 70,
    stress: 10,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50,
      neuroticism: 50, ambition: 50, risk_tolerance: 50, empathy: 50, discipline: 50, curiosity: 50,
    },
    relationships: [],
    family: [],
    familyBackground: {
      family_income: 50, housing_quality: 50, parent_education: 50,
      family_size: 2, financial_stability: 50, social_capital: 50, tier: 'Middle',
    },
    memories: [],
    traits: [],
    skills: {},
    education: { level: 'none', completed: false, yearsEnrolled: 0 },
    career: {
      currentJobId: null, jobTitle: null, companyName: null, salary: 0,
      jobPerformance: 50, yearsAtCompany: 0, totalCareerYears: 0, history: [],
    },
    goals: [],
    reputation: { fame: 0, integrity: 50, communityTrust: 50 },
    inventory: [],
    statusEffects: [],
    statistics: {
      totalChoicesMade: 0, careersChanged: 0, timesMarried: 0, totalChildren: 0,
      peakWealth: 0, lowestWealth: 0, majorSuccesses: 0, majorTraumas: 0,
      placesLived: [], keyAchievements: [],
    },
    secretState: {
      loneliness: 0, regret: 0, burnout: 0, social_pressure: 0,
      self_worth: 50, attachment: 50, family_responsibility: 50,
    },
    schemaVersion: 1,
    idCounter: 0,
  };
}

describe('EventSelector anti-repetition rule (E6)', () => {
  it('never re-selects a repeatable:false event once it has been seen (regression: was allowing up to 3 occurrences)', () => {
    // Regression test for a real bug found via code review: a React
    // "duplicate key" warning on npc_first_crush surfaced that
    // evt_teen_first_crush (repeatable: false, age 12-14, cooldown 18
    // months inside a 36-month age window) was firing more than once per
    // life. The root cause: `!event.repeatable && seenCount >= 3` let a
    // one-time milestone fire up to 3 times before being excluded — 30/56
    // non-repeatable events in real content have a cooldown shorter than
    // their own age window, so this was easily reachable, not an edge case.
    const oneTimeEvent: EventDefinition = {
      id: 'evt_one_time_milestone',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'LIFE',
      importance: 60,
      decisionType: 'SOCIAL',
      title: 'A once-in-a-lifetime moment',
      description: 'Should never happen twice.',
      conditions: [{ type: 'age', min: 10, max: 20 }], // wide window
      weight: 9999, // dominate selection so the test isn't flaky
      choices: [{ id: 'accept', text: 'Accept it', effects: [] }],
      cooldownMonths: 0, // no cooldown at all — the anti-repetition rule is the only backstop
      tags: [],
      maxChainDepth: 1,
      repeatable: false,
      isWowMoment: false,
    };

    const db = {
      getAll: () => [oneTimeEvent],
    } as unknown as import('../narrative/event-database.js').EventDatabase;

    const rng = new RNG(1);
    const state = createMockCharacter(12);

    // First selection: eligible, should be picked (it's the only event, weight 9999).
    const first = EventSelector.selectEvent(db, state, rng, { seenEvents: {} });
    expect(first.id).toBe('evt_one_time_milestone');

    // Simulate it having been chosen once.
    const seenEvents = { evt_one_time_milestone: 1 };

    // Still well within the age window (10-20) and no cooldown — the OLD
    // code (seenCount >= 3) would still select it here.
    const second = EventSelector.selectEvent(db, state, rng, { seenEvents });
    expect(second.id).not.toBe('evt_one_time_milestone');

    // And even after "3 turns" worth of seenCount, still never again.
    const third = EventSelector.selectEvent(db, state, rng, { seenEvents: { evt_one_time_milestone: 3 } });
    expect(third.id).not.toBe('evt_one_time_milestone');
  });

  it('does NOT cap a repeatable:true event the same way (frequency is governed by noveltyFactor instead)', () => {
    const repeatableEvent: EventDefinition = {
      id: 'evt_repeatable_flavor',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'LIFE',
      importance: 10,
      decisionType: 'INSTANT',
      title: 'An ordinary day',
      description: 'Can happen again and again.',
      conditions: [{ type: 'age', min: 0, max: 100 }],
      weight: 9999,
      choices: [{ id: 'ok', text: 'OK', effects: [] }],
      cooldownMonths: 0,
      tags: [],
      maxChainDepth: 1,
      repeatable: true,
      isWowMoment: false,
    };
    const db = { getAll: () => [repeatableEvent] } as unknown as import('../narrative/event-database.js').EventDatabase;
    const rng = new RNG(1);
    const state = createMockCharacter(20);

    const afterManySeens = EventSelector.selectEvent(db, state, rng, {
      seenEvents: { evt_repeatable_flavor: 50 },
    });
    expect(afterManySeens.id).toBe('evt_repeatable_flavor');
  });
});
