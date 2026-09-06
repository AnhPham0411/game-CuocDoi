import { describe, it, expect } from 'vitest';
import { CharacterState, Condition } from '@life/schema';
import { ConditionEvaluator } from '../narrative/condition-evaluator.js';

function createMockCharacter(): CharacterState {
  return {
    id: 'char_test',
    name: 'Test Character',
    age: 18,
    ageMonths: 0,
    gender: 'male',
    locationId: 'urban',
    isAlive: true,
    money: 1200,
    health: 85,
    happiness: 65,
    stress: 25,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: 60,
      conscientiousness: 70,
      extraversion: 40,
      agreeableness: 80,
      neuroticism: 30,
      ambition: 75,
      risk_tolerance: 50,
      empathy: 85,
      discipline: 65,
      curiosity: 90,
    },
    relationships: [
      {
        npcId: 'npc_best_friend',
        closeness: 85,
        trust: 90,
        respect: 75,
        conflict: 10,
        dependence: 20,
        interactionFrequency: 80,
        relationshipType: 'friend',
        importantMemories: [],
        tier: 1,
      },
    ],
    family: [
      {
        npcId: 'npc_father_1',
        name: 'Father',
        role: 'father',
        age: 48,
        isAlive: true,
      },
    ],
    familyBackground: {
      family_income: 60,
      housing_quality: 60,
      parent_education: 60,
      family_size: 3,
      financial_stability: 60,
      social_capital: 60,
      tier: 'Middle',
    },
    memories: [
      {
        id: 'mem_grandma_trip',
        timestamp: { year: 2009, month: 5, day: 1 },
        age: 9,
        type: 'family',
        participants: ['npc_grandmother'],
        emotionalWeight: 90,
        importance: 85,
        tags: ['grandmother', 'childhood', 'trip'],
        sourceEventId: 'evt_visit_grandma',
      },
    ],
    traits: [
      {
        id: 'trait_curious',
        name: 'Curious',
        description: 'Loves discovering new things',
        category: 'innate',
        isPermanent: true,
      },
    ],
    skills: {
      logic: 55,
      social: 45,
    },
    education: {
      level: 'high_school',
      completed: true,
      yearsEnrolled: 12,
    },
    career: {
      currentJobId: null,
      jobTitle: null,
      companyName: null,
      salary: 0,
      jobPerformance: 50,
      yearsAtCompany: 0,
      totalCareerYears: 0,
      history: [],
    },
    goals: [],
    reputation: { fame: 0, integrity: 80, communityTrust: 50 },
    inventory: [],
    statusEffects: [],
    statistics: {
      totalChoicesMade: 0,
      careersChanged: 0,
      timesMarried: 0,
      totalChildren: 0,
      peakWealth: 1200,
      lowestWealth: 1200,
      majorSuccesses: 0,
      majorTraumas: 0,
      placesLived: [],
      keyAchievements: [],
    },
    secretState: {
      loneliness: 10,
      regret: 0,
      burnout: 0,
      social_pressure: 20,
      self_worth: 75,
      attachment: 50,
      family_responsibility: 40,
    },
    schemaVersion: 1,
  };
}

describe('ConditionEvaluator Exhaustive Test Suite (E3, ≥60 cases)', () => {
  const char = createMockCharacter();
  const context = {
    seenEvents: { evt_visit_grandma: 1, evt_past_fight: 0 },
    activeFlags: { economic_crisis: true, city_tier: 'alpha', local_tax: 0.05 },
  };

  const testCases: { name: string; condition: Condition; expected: boolean }[] = [
    // Age cases (1-6)
    { name: 'age exact match', condition: { type: 'age', min: 18, max: 18 }, expected: true },
    { name: 'age in range', condition: { type: 'age', min: 15, max: 20 }, expected: true },
    { name: 'age too young', condition: { type: 'age', min: 21 }, expected: false },
    { name: 'age too old', condition: { type: 'age', max: 16 }, expected: false },
    { name: 'age min only met', condition: { type: 'age', min: 18 }, expected: true },
    { name: 'age max only met', condition: { type: 'age', max: 18 }, expected: true },

    // Stat cases (7-12)
    { name: 'health > 80', condition: { type: 'stat', field: 'health', op: '>', value: 80 }, expected: true },
    { name: 'health < 80', condition: { type: 'stat', field: 'health', op: '<', value: 80 }, expected: false },
    { name: 'happiness >= 65', condition: { type: 'stat', field: 'happiness', op: '>=', value: 65 }, expected: true },
    { name: 'happiness <= 60', condition: { type: 'stat', field: 'happiness', op: '<=', value: 60 }, expected: false },
    { name: 'stress == 25', condition: { type: 'stat', field: 'stress', op: '==', value: 25 }, expected: true },
    { name: 'stress != 25', condition: { type: 'stat', field: 'stress', op: '!=', value: 25 }, expected: false },

    // Money cases (13-16)
    { name: 'money >= 1000', condition: { type: 'money', op: '>=', value: 1000 }, expected: true },
    { name: 'money > 2000', condition: { type: 'money', op: '>', value: 2000 }, expected: false },
    { name: 'money <= 1200', condition: { type: 'money', op: '<=', value: 1200 }, expected: true },
    { name: 'money < 1200', condition: { type: 'money', op: '<', value: 1200 }, expected: false },

    // Personality cases (17-26)
    { name: 'openness >= 60', condition: { type: 'personality', axis: 'openness', op: '>=', value: 60 }, expected: true },
    { name: 'conscientiousness > 80', condition: { type: 'personality', axis: 'conscientiousness', op: '>', value: 80 }, expected: false },
    { name: 'extraversion < 50', condition: { type: 'personality', axis: 'extraversion', op: '<', value: 50 }, expected: true },
    { name: 'agreeableness == 80', condition: { type: 'personality', axis: 'agreeableness', op: '==', value: 80 }, expected: true },
    { name: 'neuroticism <= 35', condition: { type: 'personality', axis: 'neuroticism', op: '<=', value: 35 }, expected: true },
    { name: 'ambition >= 70', condition: { type: 'personality', axis: 'ambition', op: '>=', value: 70 }, expected: true },
    { name: 'risk_tolerance > 70', condition: { type: 'personality', axis: 'risk_tolerance', op: '>', value: 70 }, expected: false },
    { name: 'empathy >= 85', condition: { type: 'personality', axis: 'empathy', op: '>=', value: 85 }, expected: true },
    { name: 'discipline >= 60', condition: { type: 'personality', axis: 'discipline', op: '>=', value: 60 }, expected: true },
    { name: 'curiosity >= 85', condition: { type: 'personality', axis: 'curiosity', op: '>=', value: 85 }, expected: true },

    // Skill cases (27-30)
    { name: 'skill logic >= 50', condition: { type: 'skill', name: 'logic', op: '>=', value: 50 }, expected: true },
    { name: 'skill logic > 60', condition: { type: 'skill', name: 'logic', op: '>', value: 60 }, expected: false },
    { name: 'skill social <= 50', condition: { type: 'skill', name: 'social', op: '<=', value: 50 }, expected: true },
    { name: 'missing skill defaults to 0', condition: { type: 'skill', name: 'coding', op: '==', value: 0 }, expected: true },

    // Relationship cases (31-38)
    { name: 'friend trust >= 90', condition: { type: 'relationship', target: 'friend', field: 'trust', op: '>=', value: 90 }, expected: true },
    { name: 'friend trust > 95', condition: { type: 'relationship', target: 'friend', field: 'trust', op: '>', value: 95 }, expected: false },
    { name: 'friend closeness >= 80', condition: { type: 'relationship', target: 'friend', field: 'closeness', op: '>=', value: 80 }, expected: true },
    { name: 'friend conflict < 20', condition: { type: 'relationship', target: 'friend', field: 'conflict', op: '<', value: 20 }, expected: true },
    { name: 'direct npcId target trust', condition: { type: 'relationship', target: 'npc_best_friend', field: 'trust', op: '>=', value: 80 }, expected: true },
    { name: 'missing relationship returns false without throwing', condition: { type: 'relationship', target: 'spouse', field: 'closeness', op: '>=', value: 10 }, expected: false },
    { name: 'missing npcId returns false', condition: { type: 'relationship', target: 'npc_ghost_99', field: 'respect', op: '>', value: 0 }, expected: false },
    { name: 'family member role resolve', condition: { type: 'relationship', target: 'father', field: 'closeness', op: '>=', value: 0 }, expected: false },

    // Trait cases (39-42)
    { name: 'has curious trait', condition: { type: 'trait', id: 'trait_curious', has: true }, expected: true },
    { name: 'does not have curious trait', condition: { type: 'trait', id: 'trait_curious', has: false }, expected: false },
    { name: 'has missing trait', condition: { type: 'trait', id: 'trait_athlete', has: true }, expected: false },
    { name: 'does not have missing trait', condition: { type: 'trait', id: 'trait_athlete', has: false }, expected: true },

    // Memory cases (43-48)
    { name: 'memory by tag grandmother', condition: { type: 'memory', tag: 'grandmother' }, expected: true },
    { name: 'memory by tag nonexistent', condition: { type: 'memory', tag: 'university' }, expected: false },
    { name: 'memory by type family', condition: { type: 'memory', memoryType: 'family' }, expected: true },
    { name: 'memory by participant', condition: { type: 'memory', participant: 'npc_grandmother' }, expected: true },
    { name: 'memory minImportance met', condition: { type: 'memory', tag: 'trip', minImportance: 80 }, expected: true },
    { name: 'memory minImportance not met', condition: { type: 'memory', tag: 'trip', minImportance: 95 }, expected: false },

    // Career & Education cases (49-54)
    { name: 'career hasJob false', condition: { type: 'career', hasJob: false }, expected: true },
    { name: 'career hasJob true', condition: { type: 'career', hasJob: true }, expected: false },
    { name: 'education high_school completed', condition: { type: 'education', minLevel: 'high_school', completed: true }, expected: true },
    { name: 'education bachelor required', condition: { type: 'education', minLevel: 'bachelor' }, expected: false },
    { name: 'education primary required met', condition: { type: 'education', minLevel: 'primary' }, expected: true },
    { name: 'education completed check only', condition: { type: 'education', completed: true }, expected: true },

    // Event Seen cases (55-58)
    { name: 'event seen true', condition: { type: 'event_seen', eventId: 'evt_visit_grandma', seen: true }, expected: true },
    { name: 'event seen false', condition: { type: 'event_seen', eventId: 'evt_visit_grandma', seen: false }, expected: false },
    { name: 'unseen event seen false', condition: { type: 'event_seen', eventId: 'evt_college_grad', seen: false }, expected: true },
    { name: 'unseen event seen true', condition: { type: 'event_seen', eventId: 'evt_college_grad', seen: true }, expected: false },

    // Flags cases (59-62)
    { name: 'boolean flag true', condition: { type: 'flag', key: 'economic_crisis', op: '==', value: true }, expected: true },
    { name: 'boolean flag false', condition: { type: 'flag', key: 'economic_crisis', op: '==', value: false }, expected: false },
    { name: 'string flag alpha', condition: { type: 'flag', key: 'city_tier', op: '==', value: 'alpha' }, expected: true },
    { name: 'number flag local_tax >= 0.04', condition: { type: 'flag', key: 'local_tax', op: '>=', value: 0.04 }, expected: true },

    // Logical nesting cases (63-68)
    {
      name: 'and condition both true',
      condition: {
        type: 'and',
        conditions: [
          { type: 'age', min: 18 },
          { type: 'money', op: '>=', value: 1000 },
        ],
      },
      expected: true,
    },
    {
      name: 'and condition one false',
      condition: {
        type: 'and',
        conditions: [
          { type: 'age', min: 18 },
          { type: 'money', op: '>=', value: 5000 },
        ],
      },
      expected: false,
    },
    {
      name: 'or condition one true',
      condition: {
        type: 'or',
        conditions: [
          { type: 'money', op: '>', value: 5000 },
          { type: 'age', min: 18 },
        ],
      },
      expected: true,
    },
    {
      name: 'or condition both false',
      condition: {
        type: 'or',
        conditions: [
          { type: 'money', op: '>', value: 5000 },
          { type: 'age', max: 15 },
        ],
      },
      expected: false,
    },
    {
      name: 'not condition negates false to true',
      condition: {
        type: 'not',
        condition: { type: 'trait', id: 'trait_athlete', has: true },
      },
      expected: true,
    },
    {
      name: '3-layer nested logic (and -> or -> not)',
      condition: {
        type: 'and',
        conditions: [
          { type: 'age', min: 16, max: 25 },
          {
            type: 'or',
            conditions: [
              {
                type: 'not',
                condition: { type: 'trait', id: 'trait_athlete', has: true },
              },
              { type: 'money', op: '>=', value: 10000 },
            ],
          },
        ],
      },
      expected: true,
    },
  ];

  it(`evaluates all ${testCases.length} conditions accurately`, () => {
    expect(testCases.length).toBeGreaterThanOrEqual(60);

    for (const tc of testCases) {
      const result = ConditionEvaluator.evaluate(tc.condition, char, context);
      expect(result, `Failed case: ${tc.name}`).toBe(tc.expected);
    }
  });

  it('evaluates single condition in under 50 microseconds (E3 benchmark)', () => {
    const complexCondition: Condition = {
      type: 'and',
      conditions: [
        { type: 'age', min: 18, max: 25 },
        { type: 'personality', axis: 'empathy', op: '>=', value: 70 },
        { type: 'relationship', target: 'friend', field: 'trust', op: '>=', value: 80 },
      ],
    };

    const iterations = 10000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      ConditionEvaluator.evaluate(complexCondition, char, context);
    }
    const duration = performance.now() - start;
    const timePerEvalUs = (duration / iterations) * 1000;

    expect(timePerEvalUs).toBeLessThan(50); // Under 50µs
  });
});
