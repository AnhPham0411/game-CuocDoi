import { describe, it, expect } from 'vitest';
import { CharacterState, Effect, Provenance } from '@life/schema';
import { EffectExecutor } from '../narrative/effect-executor.js';

function createMockCharacter(): CharacterState {
  return {
    id: 'char_effect_test',
    name: 'Effect Tester',
    age: 16,
    ageMonths: 0,
    gender: 'female',
    locationId: 'suburban',
    isAlive: true,
    money: 500,
    health: 80,
    happiness: 60,
    stress: 20,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      ambition: 50,
      risk_tolerance: 50,
      empathy: 50,
      discipline: 50,
      curiosity: 50,
    },
    relationships: [
      {
        npcId: 'npc_mate',
        closeness: 50,
        trust: 50,
        respect: 50,
        conflict: 0,
        dependence: 0,
        interactionFrequency: 50,
        relationshipType: 'friend',
        importantMemories: [],
        tier: 2,
      },
    ],
    family: [],
    familyBackground: {
      family_income: 50,
      housing_quality: 50,
      parent_education: 50,
      family_size: 2,
      financial_stability: 50,
      social_capital: 50,
      tier: 'Middle',
    },
    memories: [],
    traits: [],
    skills: { social: 30 },
    education: { level: 'middle_school', completed: true, yearsEnrolled: 9 },
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
    reputation: { fame: 0, integrity: 50, communityTrust: 50 },
    inventory: [],
    statusEffects: [],
    statistics: {
      totalChoicesMade: 0,
      careersChanged: 0,
      timesMarried: 0,
      totalChildren: 0,
      peakWealth: 500,
      lowestWealth: 500,
      majorSuccesses: 0,
      majorTraumas: 0,
      placesLived: [],
      keyAchievements: [],
    },
    secretState: {
      loneliness: 0,
      regret: 0,
      burnout: 0,
      social_pressure: 0,
      self_worth: 50,
      attachment: 50,
      family_responsibility: 50,
    },
    schemaVersion: 1,
    idCounter: 0,
  };
}

describe('EffectExecutor & Clamping Table Tests (E4)', () => {
  const prov: Provenance = {
    sourceEventId: 'evt_test_01',
    sourceChoiceId: 'choice_a',
    atAge: 16,
  };

  it('clamps personality changes to ±3 for normal events (P0.4 & §6)', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'STAT_CHANGE',
        field: 'personality',
        target: 'empathy',
        value: 50, // tries to jump empathy from 50 to 100!
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov, 20); // importance 20 = minor
    expect(result.nextState.personality.empathy).toBe(53); // capped at +3
  });

  it('allows larger personality changes (±15) for life-changing events (importance >= 81)', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'STAT_CHANGE',
        field: 'personality',
        target: 'empathy',
        value: 50,
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov, 85); // importance 85 = life-changing
    expect(result.nextState.personality.empathy).toBe(65); // capped at +15
  });

  it('executes MONEY_CHANGE and updates state without clamp', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [{ type: 'MONEY_CHANGE', value: 1500 }];

    const result = EffectExecutor.execute(char, effects, prov);
    expect(result.nextState.money).toBe(2000);
    expect(result.deltas[0]?.path).toBe('money');
  });

  it('executes RELATIONSHIP_CHANGE with target', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'RELATIONSHIP_CHANGE',
        relationshipPayload: {
          target: 'npc_mate',
          field: 'trust',
          delta: 15,
        },
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov);
    const rel = result.nextState.relationships.find((r) => r.npcId === 'npc_mate');
    expect(rel?.trust).toBe(65);
  });

  it('CREATE_NPC persists the display name from content (regression: was silently dropped)', () => {
    // Content authors write npcPayload.name (required by EffectSchema, and every
    // real CREATE_NPC event in packages/content sets it) so the UI can show a
    // real name instead of a raw npcId like "npc_first_friend". The executor
    // used to read every other npcPayload field but never wrote `name` into
    // the resulting RelationshipState, silently discarding content data.
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'CREATE_NPC',
        npcPayload: {
          npcId: 'npc_first_friend',
          name: 'Bạn học đầu tiên',
          relationshipType: 'friend',
          initialCloseness: 30,
          initialTrust: 40,
          initialRespect: 30,
          tier: 2,
        },
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov);
    const created = result.nextState.relationships.find((r) => r.npcId === 'npc_first_friend');
    expect(created?.name).toBe('Bạn học đầu tiên');
  });

  it('adds and removes traits without duplication', () => {
    const char = createMockCharacter();
    const addEffects: Effect[] = [
      { type: 'TRAIT_ADD', target: 'trait_resilient', field: 'Resilient' },
      { type: 'TRAIT_ADD', target: 'trait_resilient', field: 'Resilient' }, // Duplicate
    ];

    const afterAdd = EffectExecutor.execute(char, addEffects, prov).nextState;
    expect(afterAdd.traits.filter((t) => t.id === 'trait_resilient')).toHaveLength(1);

    const removeEffects: Effect[] = [
      { type: 'TRAIT_REMOVE', target: 'trait_resilient' },
    ];
    const afterRemove = EffectExecutor.execute(afterAdd, removeEffects, prov).nextState;
    expect(afterRemove.traits).toHaveLength(0);
  });

  it('adds temporary status effects with duration', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'STATUS_ADD',
        target: 'status_flu',
        field: 'Seasonal Flu',
        value: -10,
        durationMonths: 3,
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov);
    expect(result.nextState.statusEffects).toHaveLength(1);
    expect(result.nextState.statusEffects[0]?.durationMonths).toBe(3);
  });

  it('creates memories and schedules future consequences (§41, §P4)', () => {
    const char = createMockCharacter();
    const effects: Effect[] = [
      {
        type: 'MEMORY_ADD',
        memoryPayload: {
          type: 'friendship',
          tags: ['helped_friend', 'loyalty'],
          emotionalWeight: 60,
          importance: 70,
        },
      },
      {
        type: 'SCHEDULE_EVENT',
        schedulePayload: {
          eventId: 'evt_friend_job_offer',
          targetAge: 23,
          priority: 2,
        },
      },
    ];

    const result = EffectExecutor.execute(char, effects, prov);
    expect(result.nextState.memories).toHaveLength(1);
    expect(result.nextState.memories[0]?.tags).toContain('helped_friend');
    expect(result.scheduledEvents).toHaveLength(1);
    expect(result.scheduledEvents[0]?.triggerAge).toBe(23);
  });
});
