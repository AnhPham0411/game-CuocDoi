import { describe, it, expect } from 'vitest';
import {
  CharacterState,
  CharacterStateSchema,
  ConditionSchema,
  EffectSchema,
  EventDefinitionSchema,
} from '../index.js';

function createSampleCharacter(seed = 1): CharacterState {
  return {
    id: `char_${seed}`,
    name: `Player ${seed}`,
    age: 18,
    ageMonths: 4,
    gender: seed % 2 === 0 ? 'female' : 'male',
    locationId: 'hanoi_urban',
    isAlive: true,
    money: 1500 + seed * 10,
    health: 90,
    happiness: 75,
    stress: 20,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: (seed * 13) % 100,
      conscientiousness: (seed * 17) % 100,
      extraversion: (seed * 19) % 100,
      agreeableness: (seed * 23) % 100,
      neuroticism: (seed * 29) % 100,
      ambition: (seed * 31) % 100,
      risk_tolerance: (seed * 37) % 100,
      empathy: (seed * 41) % 100,
      discipline: (seed * 43) % 100,
      curiosity: (seed * 47) % 100,
    },
    relationships: [
      {
        npcId: `npc_friend_${seed}`,
        closeness: 80,
        trust: 90,
        respect: 70,
        conflict: 10,
        dependence: 30,
        interactionFrequency: 60,
        relationshipType: 'friend',
        importantMemories: ['mem_childhood_1'],
        tier: 2,
      },
    ],
    family: [
      {
        npcId: `npc_father_${seed}`,
        name: 'Father',
        role: 'father',
        age: 48,
        isAlive: true,
      },
      {
        npcId: `npc_mother_${seed}`,
        name: 'Mother',
        role: 'mother',
        age: 46,
        isAlive: true,
      },
    ],
    familyBackground: {
      family_income: 50,
      housing_quality: 60,
      parent_education: 70,
      family_size: 4,
      financial_stability: 65,
      social_capital: 55,
      tier: 'Middle',
    },
    memories: [
      {
        id: `mem_${seed}`,
        timestamp: { year: 2010, month: 6, day: 15 },
        age: 10,
        type: 'family',
        participants: [`npc_father_${seed}`],
        emotionalWeight: 60,
        importance: 75,
        tags: ['father', 'childhood', 'fishing'],
        sourceEventId: 'evt_father_trip_1',
      },
    ],
    traits: [
      {
        id: 'curious_mind',
        name: 'Curious Mind',
        description: 'Constantly eager to learn and experiment.',
        category: 'innate',
        isPermanent: true,
      },
    ],
    skills: {
      logic: 45,
      social: 60,
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
    reputation: {
      fame: 5,
      integrity: 80,
      communityTrust: 70,
    },
    inventory: [],
    statusEffects: [],
    statistics: {
      totalChoicesMade: 25,
      careersChanged: 0,
      timesMarried: 0,
      totalChildren: 0,
      peakWealth: 2000,
      lowestWealth: 500,
      majorSuccesses: 1,
      majorTraumas: 0,
      placesLived: ['hanoi_urban'],
      keyAchievements: ['graduated_high_school'],
    },
    secretState: {
      loneliness: 15,
      regret: 5,
      burnout: 0,
      social_pressure: 30,
      self_worth: 70,
      attachment: 60,
      family_responsibility: 50,
    },
    schemaVersion: 1,
    idCounter: 0,
  };
}

describe('Schema Serialization & Integrity (P0.2)', () => {
  it('passes 500 property tests: CharacterState -> JSON -> parse identical', () => {
    for (let i = 1; i <= 500; i++) {
      const original = createSampleCharacter(i);
      const jsonString = JSON.stringify(original);
      const parsedObj = JSON.parse(jsonString);
      const validated = CharacterStateSchema.parse(parsedObj);

      expect(validated).toEqual(original);
    }
  });

  it('rejects personality with alignment or missing 10-dimensions', () => {
    const char = createSampleCharacter(1) as any;
    delete char.personality.openness;
    expect(() => CharacterStateSchema.parse(char)).toThrow();

    // Check alignment doesn't count as personality
    const charWithAlignment = {
      ...createSampleCharacter(2),
      personality: {
        alignment: 'lawful_good',
      },
    };
    expect(() => CharacterStateSchema.parse(charWithAlignment)).toThrow();
  });

  it('rejects relationship missing 5 axes or having single friendship field', () => {
    const invalidRelationship = {
      npcId: 'npc_1',
      friendship: 50, // forbidden single field
      relationshipType: 'friend',
    };
    expect(() => CharacterStateSchema.parse({
      ...createSampleCharacter(3),
      relationships: [invalidRelationship],
    })).toThrow();
  });

  it('validates recursive condition DSL correctly', () => {
    const complexCondition = {
      type: 'and',
      conditions: [
        { type: 'age', min: 18, max: 25 },
        {
          type: 'or',
          conditions: [
            { type: 'stat', field: 'money', op: '>=', value: 1000 },
            { type: 'relationship', target: 'friend', field: 'trust', op: '>=', value: 70 },
          ],
        },
        {
          type: 'not',
          condition: { type: 'trait', id: 'trust_issues', has: true },
        },
      ],
    };

    const validated = ConditionSchema.parse(complexCondition);
    expect(validated.type).toBe('and');
  });

  it('validates effect schema with provenance', () => {
    const effect = {
      type: 'STAT_CHANGE',
      field: 'health',
      value: -15,
      durationMonths: 6,
      provenance: {
        sourceEventId: 'evt_bike_crash',
        sourceChoiceId: 'choice_speed_up',
        atAge: 16,
      },
    };

    const validated = EffectSchema.parse(effect);
    expect(validated.type).toBe('STAT_CHANGE');
    expect(validated.durationMonths).toBe(6);
    expect(validated.provenance?.sourceEventId).toBe('evt_bike_crash');
  });

  it('validates event definition schema with choices', () => {
    const event = {
      id: 'evt_school_bully_01',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'SCHOOL',
      importance: 45,
      decisionType: 'MORAL',
      title: 'A classmate is being bullied',
      description: 'You see your classmate surrounded behind the gym.',
      conditions: [{ type: 'age', min: 10, max: 15 }],
      weight: 100,
      choices: [
        {
          id: 'stand_up',
          text: 'Stand up for your classmate',
          effects: [
            {
              type: 'RELATIONSHIP_CHANGE',
              relationshipPayload: {
                target: 'friend',
                field: 'trust',
                delta: 20,
              },
            },
          ],
        },
        {
          id: 'walk_away',
          text: 'Walk away quietly',
          effects: [
            {
              type: 'STAT_CHANGE',
              field: 'happiness',
              value: -10,
            },
          ],
        },
      ],
      cooldownMonths: 12,
      tags: ['school', 'moral', 'childhood'],
      maxChainDepth: 5,
    };

    const validated = EventDefinitionSchema.parse(event);
    expect(validated.id).toBe('evt_school_bully_01');
    expect(validated.choices).toHaveLength(2);
  });
});
