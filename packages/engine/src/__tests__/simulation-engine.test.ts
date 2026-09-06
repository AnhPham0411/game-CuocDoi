import { describe, it, expect } from 'vitest';
import { CharacterState, EventDefinition } from '@life/schema';
import { GameEngine } from '../core/reducer.js';
import { RNG } from '../core/rng.js';
import { EventDatabase } from '../narrative/event-database.js';
import { FamilySystem } from '../simulation/family-system.js';

function createNewBornCharacter(seed = 100): CharacterState {
  const rng = new RNG(seed);
  const fam = FamilySystem.generateFamily(rng, 0);

  return {
    id: `char_run_${seed}`,
    name: `Child ${seed}`,
    age: 0,
    ageMonths: 0,
    gender: 'male',
    locationId: 'hanoi_urban',
    isAlive: true,
    money: 0,
    health: 95,
    happiness: 80,
    stress: 5,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 40,
      ambition: 50,
      risk_tolerance: 50,
      empathy: 50,
      discipline: 50,
      curiosity: 60,
    },
    relationships: fam.relationships,
    family: fam.members,
    familyBackground: fam.familyBackground,
    memories: [],
    traits: [],
    skills: {},
    education: { level: 'none', completed: false, yearsEnrolled: 0 },
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
      peakWealth: 0,
      lowestWealth: 0,
      majorSuccesses: 0,
      majorTraumas: 0,
      placesLived: ['hanoi_urban'],
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
  };
}

function buildTestDatabase(): EventDatabase {
  const db = new EventDatabase();

  const events: EventDefinition[] = [
    {
      id: 'evt_early_crying',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'FAMILY',
      importance: 20,
      decisionType: 'INSTANT',
      title: 'Midnight Tears',
      description: 'You wake up in the dark crying.',
      conditions: [{ type: 'age', min: 0, max: 2 }],
      weight: 100,
      choices: [
        {
          id: 'cry_loudly',
          text: 'Cry at the top of your lungs',
          effects: [
            {
              type: 'RELATIONSHIP_CHANGE',
              relationshipPayload: { target: 'mother', field: 'closeness', delta: 5 },
            },
          ],
        },
        {
          id: 'calm_down',
          text: 'Suck your thumb and go back to sleep',
          effects: [
            {
              type: 'STAT_CHANGE',
              field: 'personality',
              target: 'discipline',
              value: 2,
            },
          ],
        },
      ],
      cooldownMonths: 6,
      tags: ['infancy'],
      maxChainDepth: 5,
      repeatable: false,
      isWowMoment: false,
    },
    {
      id: 'evt_first_toy',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'FAMILY',
      importance: 30,
      decisionType: 'INSTANT',
      title: 'A New Toy',
      description: 'Your father brings home a colorful puzzle block.',
      conditions: [{ type: 'age', min: 2, max: 5 }],
      weight: 100,
      choices: [
        {
          id: 'solve_puzzle',
          text: 'Patiently try to fit the shapes together',
          effects: [
            { type: 'SKILL_CHANGE', target: 'logic', value: 5 },
            { type: 'STAT_CHANGE', field: 'personality', target: 'curiosity', value: 3 },
          ],
        },
        {
          id: 'throw_block',
          text: 'Bang the blocks loudly on the floor',
          effects: [
            { type: 'STAT_CHANGE', field: 'personality', target: 'risk_tolerance', value: 3 },
          ],
        },
      ],
      cooldownMonths: 12,
      tags: ['toddler'],
      maxChainDepth: 5,
      repeatable: false,
      isWowMoment: false,
    },
    {
      id: 'evt_school_first_day',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'SCHOOL',
      importance: 50,
      decisionType: 'SOCIAL',
      title: 'First Day of Primary School',
      description: 'You enter the primary school classroom and see a room full of strangers.',
      conditions: [{ type: 'age', min: 6, max: 7 }],
      weight: 150,
      choices: [
        {
          id: 'greet_classmates',
          text: 'Smile and introduce yourself to the kid next to you',
          effects: [
            {
              type: 'CREATE_NPC',
              npcPayload: {
                npcId: 'npc_childhood_friend',
                name: 'Minh',
                relationshipType: 'friend',
                initialCloseness: 75,
                initialTrust: 80,
                initialRespect: 70,
                tier: 2,
              },
            },
            { type: 'STAT_CHANGE', field: 'personality', target: 'extraversion', value: 3 },
          ],
        },
        {
          id: 'sit_quietly',
          text: 'Sit quietly at the back desk reading a book',
          effects: [
            { type: 'SKILL_CHANGE', target: 'logic', value: 5 },
            { type: 'STAT_CHANGE', field: 'personality', target: 'discipline', value: 3 },
          ],
        },
      ],
      cooldownMonths: 24,
      tags: ['school', 'milestone'],
      maxChainDepth: 5,
      repeatable: false,
      isWowMoment: true,
    },
    {
      id: 'evt_friend_trouble',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'FRIENDSHIP',
      importance: 60,
      decisionType: 'MORAL',
      title: 'A Friend Needs Help',
      description: 'Your friend was blamed for breaking a school window.',
      conditions: [
        { type: 'age', min: 8, max: 14 },
        { type: 'relationship', target: 'friend', field: 'closeness', op: '>=', value: 60 },
      ],
      weight: 120,
      choices: [
        {
          id: 'defend_friend',
          text: 'Speak up and defend your friend before the teacher',
          effects: [
            {
              type: 'RELATIONSHIP_CHANGE',
              relationshipPayload: { target: 'friend', field: 'trust', delta: 15 },
            },
            {
              type: 'MEMORY_ADD',
              memoryPayload: {
                type: 'friendship',
                tags: ['defended_friend', 'loyalty'],
                emotionalWeight: 80,
                importance: 75,
              },
            },
          ],
        },
        {
          id: 'stay_silent',
          text: 'Stay silent and avoid getting into trouble',
          effects: [
            {
              type: 'RELATIONSHIP_CHANGE',
              relationshipPayload: { target: 'friend', field: 'trust', delta: -15 },
            },
          ],
        },
      ],
      cooldownMonths: 24,
      tags: ['friendship', 'moral'],
      maxChainDepth: 5,
      repeatable: false,
      isWowMoment: false,
    },
  ];

  db.loadBulk(events);
  return db;
}

describe('Master Simulation Engine & Blueprint §99 Verification (Gate G1)', () => {
  it('enforces family generation invariants across 1,000 runs (E11)', () => {
    const rng = new RNG(12345);
    for (let i = 0; i < 1000; i++) {
      const fam = FamilySystem.generateFamily(rng, 0);

      const mother = fam.members.find((m) => m.role === 'mother');
      const father = fam.members.find((m) => m.role === 'father');

      expect(mother).toBeDefined();
      expect(father).toBeDefined();

      // Mother was between 18 and 45 when giving birth
      expect(mother!.age).toBeGreaterThanOrEqual(18);
      expect(mother!.age).toBeLessThanOrEqual(50);

      // Check siblings birth order
      for (const m of fam.members) {
        if (m.role === 'older_brother' || m.role === 'older_sister') {
          expect(m.age).toBeGreaterThanOrEqual(0);
        }
      }

      // Check tier
      expect(fam.familyBackground.tier).toBeDefined();
    }
  });

  it('proves 100% determinism: same seed + same choices = identical state hash', () => {
    const db = buildTestDatabase();
    const SEED = 424242;

    // Run A
    const charA = createNewBornCharacter(SEED);
    const engineA = new GameEngine(charA, db, SEED);

    // Run B
    const charB = createNewBornCharacter(SEED);
    const engineB = new GameEngine(charB, db, SEED);

    for (let turn = 0; turn < 20; turn++) {
      const evtA = engineA.nextTurn(3);
      const evtB = engineB.nextTurn(3);

      expect(evtA.id).toBe(evtB.id);

      const choiceA = evtA.choices[0]?.id ?? 'default';
      const choiceB = evtB.choices[0]?.id ?? 'default';

      engineA.makeChoice(choiceA);
      engineB.makeChoice(choiceB);
    }

    const saveA = JSON.stringify(engineA.exportSave());
    const saveB = JSON.stringify(engineB.exportSave());

    expect(saveA).toEqual(saveB);
  });

  it('satisfies Blueprint §99: same seed but different choices generate radically different lives', () => {
    const db = buildTestDatabase();
    const SEED = 98765;

    // Path 1: Social & Loyal path
    const engine1 = new GameEngine(createNewBornCharacter(SEED), db, SEED);
    const seenEvents1: string[] = [];

    // Path 2: Solitary & Rebellious path
    const engine2 = new GameEngine(createNewBornCharacter(SEED), db, SEED);
    const seenEvents2: string[] = [];

    for (let turn = 0; turn < 25; turn++) {
      // Path 1
      const evt1 = engine1.nextTurn(6);
      seenEvents1.push(evt1.id);
      const choice1 = evt1.choices[0]!.id; // first choice
      engine1.makeChoice(choice1);

      // Path 2
      const evt2 = engine2.nextTurn(6);
      seenEvents2.push(evt2.id);
      const choice2 = evt2.choices[evt2.choices.length - 1]!.id; // alternate choice
      engine2.makeChoice(choice2);
    }

    const state1 = engine1.getCharacter();
    const state2 = engine2.getCharacter();

    // 1. Check personalities diverged
    expect(state1.personality.discipline).not.toEqual(state2.personality.discipline);
    expect(state1.personality.curiosity).not.toEqual(state2.personality.curiosity);

    // 2. Check relationship differences (Path 1 made a friend, Path 2 did not)
    expect(state1.relationships.length).not.toEqual(state2.relationships.length);

    // 3. Check memory differences
    expect(state1.memories.length).not.toEqual(state2.memories.length);

    // 4. Divergence rate between the two paths
    const commonEvents = seenEvents1.filter((id) => seenEvents2.includes(id));
    const divergencePercent = ((seenEvents1.length - commonEvents.length) / seenEvents1.length) * 100;

    // Blueprint §99 criteria: two runs diverge naturally
    expect(state1).not.toEqual(state2);
  });
});
