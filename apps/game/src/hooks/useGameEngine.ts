/**
 * useGameEngine — React hook that bridges the headless engine to React state.
 * Single source of truth: all simulation state lives in the GameEngine
 * instance (held in a ref); this hook only mirrors it into React state and
 * translates it into the UI-facing shapes below. No gameplay logic lives
 * here — content, conditions and effects all come from @life/content via
 * @life/engine, per blueprint L2 (content is data, not code).
 */

import { useCallback, useRef, useState } from 'react';
import type { CharacterState, EducationLevel, EventDefinition, Gender } from '@life/schema';
import { EventDatabase, FamilySystem, GameEngine, RNG } from '@life/engine';

import childhoodEvents from '../../../../packages/content/events/childhood.json';
import adolescenceEvents from '../../../../packages/content/events/adolescence.json';
import youngAdultEvents from '../../../../packages/content/events/young_adult.json';

// ─── Content database (built once per page load) ─────────────────────────────
// Vertical Slice scope is Birth → 25 (docs/SCOPE.md), so only those three
// content files exist yet — see B4 code-review note: content only covers
// ages 0-26, later phases (docs/ROADMAP.md Phase 4+) add the rest of life.
const eventDb = new EventDatabase();
{
  const loadResult = eventDb.loadBulk([
    ...(childhoodEvents as unknown[]),
    ...(adolescenceEvents as unknown[]),
    ...(youngAdultEvents as unknown[]),
  ]);
  if (loadResult.errors.length > 0) {
    // Fail loud in the console, not by crashing the page for a real player —
    // `pnpm validate:content` is what should catch this before it ships.
    console.error('[content] some events failed to load:', loadResult.errors);
  }
}

const MONTHS_PER_TURN = 6;
const VERTICAL_SLICE_MAX_AGE = 25;

// ─── UI-facing types (consumed by components in ../components/*) ─────────────

export type GamePhase =
  | 'menu'
  | 'character_creation'
  | 'playing'
  | 'wow_moment'
  | 'life_summary';

export interface EventChoice {
  id: string;
  text: string;
}

export interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: number;
  decisionType: string;
  choices: EventChoice[];
  isWowMoment?: boolean;
}

export interface NPC {
  npcId: string;
  name: string;
  relationshipType: string;
  closeness: number;
  trust: number;
  respect: number;
  conflict: number;
  dependence: number;
  tier: number;
}

export interface Memory {
  id: string;
  age: number;
  description: string;
  type: string;
  tags: string[];
  emotionalWeight: number;
  importance: number;
}

export interface UICharacterState {
  name: string;
  age: number;
  gender: string;
  location: string;
  money: number;
  health: number;
  happiness: number;
  stress: number;
  education: number;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    ambition: number;
    risk_tolerance: number;
    empathy: number;
    discipline: number;
    curiosity: number;
  };
  currentCareer: string | null;
  relationships: NPC[];
  memories: Memory[];
  traits: string[];
  lifeEvents: string[];
  stats: {
    turnsPlayed: number;
    choicesMade: number;
    wowMomentsEncountered: number;
  };
}

export interface GameEngineState {
  phase: GamePhase;
  character: UICharacterState;
  activeEvent: ActiveEvent | null;
  pendingWowEvent: ActiveEvent | null;
}

// ─── Engine state -> UI state adapters ────────────────────────────────────────

// Purely a presentation heuristic for the HUD's single "education" bar —
// the engine has no scalar education stat, only EducationState.level (§17).
const EDUCATION_LEVEL_SCORE: Record<EducationLevel, number> = {
  none: 0,
  primary: 15,
  middle_school: 30,
  high_school: 50,
  vocational: 60,
  bachelor: 75,
  master: 90,
  doctorate: 100,
};

/** Fallback label for a relationship with no stored display name (should be
 * rare now that CREATE_NPC persists npcPayload.name — see effect-executor.ts). */
function humanizeNpcId(npcId: string): string {
  return npcId
    .replace(/^npc_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toNPCList(state: CharacterState): NPC[] {
  return state.relationships.map((r) => ({
    npcId: r.npcId,
    name: r.name ?? state.family.find((f) => f.npcId === r.npcId)?.name ?? humanizeNpcId(r.npcId),
    relationshipType: r.relationshipType,
    closeness: r.closeness,
    trust: r.trust,
    respect: r.respect,
    conflict: r.conflict,
    dependence: r.dependence,
    tier: r.tier,
  }));
}

function toMemoryList(state: CharacterState): Memory[] {
  // Newest first, matching the previous demo hook's UX (it used unshift()).
  return [...state.memories].reverse().map((m) => ({
    id: m.id,
    age: m.age,
    description: m.description ?? '(không có mô tả)',
    type: m.type,
    tags: m.tags,
    emotionalWeight: m.emotionalWeight,
    importance: m.importance,
  }));
}

function toUICharacterState(state: CharacterState, wowMomentsEncountered: number): UICharacterState {
  return {
    name: state.name,
    age: state.age,
    gender: state.gender,
    location: state.locationId,
    money: state.money,
    health: state.health,
    happiness: state.happiness,
    stress: state.stress,
    // Defensive fallback: a content bug that lets an unrecognized level
    // through would otherwise render as NaN in the HUD's stat bar (see the
    // EDUCATION_CHANGE fix in effect-executor.ts, the actual source of truth).
    education: EDUCATION_LEVEL_SCORE[state.education.level] ?? 0,
    personality: { ...state.personality },
    currentCareer: state.career.jobTitle,
    relationships: toNPCList(state),
    memories: toMemoryList(state),
    traits: state.traits.map((t) => t.name),
    lifeEvents: [],
    stats: {
      turnsPlayed: state.statistics.totalChoicesMade,
      choicesMade: state.statistics.totalChoicesMade,
      wowMomentsEncountered,
    },
  };
}

function toActiveEvent(event: EventDefinition): ActiveEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    importance: event.importance,
    decisionType: event.decisionType,
    choices: event.choices.map((c) => ({ id: c.id, text: c.text })),
    isWowMoment: event.isWowMoment,
  };
}

// ─── New-character construction ───────────────────────────────────────────────

function mapGenderToEngine(genderUI: string): Gender {
  if (genderUI === 'female') return 'female';
  if (genderUI === 'nonbinary') return 'non_binary';
  return 'male';
}

const STARTING_MONEY_BY_LOCATION: Record<string, number> = {
  urban: 5000,
  suburban: 3000,
  rural: 2000,
};

function rollPersonalityAxis(rng: RNG, base: number, spread: number): number {
  return Math.min(100, base + rng.nextInt(0, spread));
}

/**
 * Picks which seed a new run starts with. This is a UI-level decision
 * external to the engine — exactly like `pnpm sim --seed 42` picks a seed
 * from the command line — so drawing it from wall-clock randomness here does
 * not violate the engine's own determinism contract (L1, docs/ADR/001).
 * Once chosen, replaying the same seed through the same choices always
 * reproduces the same life.
 */
function pickNewGameSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function createNewCharacter(rng: RNG, seed: number, name: string, genderUI: string, locationId: string): CharacterState {
  const fam = FamilySystem.generateFamily(rng, 0); // forks its own sub-stream (E1.1)
  const money = STARTING_MONEY_BY_LOCATION[locationId] ?? 3000;

  return {
    id: `char_${seed}`,
    name: name || 'Nhân vật vô danh',
    age: 0,
    ageMonths: 0,
    gender: mapGenderToEngine(genderUI),
    locationId,
    isAlive: true,
    money,
    health: 80,
    happiness: 60,
    stress: 10,
    lifeExpectancyFactor: 1.0,
    personality: {
      openness: rollPersonalityAxis(rng, 45, 30),
      conscientiousness: rollPersonalityAxis(rng, 40, 30),
      extraversion: rollPersonalityAxis(rng, 35, 40),
      agreeableness: rollPersonalityAxis(rng, 45, 30),
      neuroticism: rollPersonalityAxis(rng, 30, 30),
      ambition: rollPersonalityAxis(rng, 40, 35),
      risk_tolerance: rollPersonalityAxis(rng, 35, 40),
      empathy: rollPersonalityAxis(rng, 40, 35),
      discipline: rollPersonalityAxis(rng, 35, 35),
      curiosity: rollPersonalityAxis(rng, 45, 30),
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
      peakWealth: money,
      lowestWealth: money,
      majorSuccesses: 0,
      majorTraumas: 0,
      placesLived: [locationId],
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameEngine() {
  const engineRef = useRef<GameEngine | null>(null);
  const wowCountRef = useRef(0);

  const [state, setState] = useState<GameEngineState>({
    phase: 'menu',
    character: toUICharacterState(createNewCharacter(new RNG(0), 0, '', 'male', 'urban'), 0),
    activeEvent: null,
    pendingWowEvent: null,
  });

  /** Advances to the next natural turn and updates React state accordingly,
   * ending the run once the Vertical Slice's age cap is reached (§SCOPE). */
  const presentNextTurn = useCallback((engine: GameEngine) => {
    const event = engine.nextTurn(MONTHS_PER_TURN);
    const character = engine.getCharacter();

    if (character.age >= VERTICAL_SLICE_MAX_AGE) {
      setState({
        phase: 'life_summary',
        character: toUICharacterState(character, wowCountRef.current),
        activeEvent: null,
        pendingWowEvent: null,
      });
      return;
    }

    const isWow = event.isWowMoment ?? false;
    if (isWow) wowCountRef.current += 1;

    const activeEvent = toActiveEvent(event);
    setState({
      phase: isWow ? 'wow_moment' : 'playing',
      character: toUICharacterState(character, wowCountRef.current),
      activeEvent,
      pendingWowEvent: isWow ? activeEvent : null,
    });
  }, []);

  const startGame = useCallback((name: string, gender: string, location: string) => {
    const seed = pickNewGameSeed();
    wowCountRef.current = 0;

    const rng = new RNG(seed);
    const character = createNewCharacter(rng, seed, name, gender, location);
    const engine = new GameEngine(character, eventDb, seed);
    engineRef.current = engine;

    // Blueprint §34: the seed is the single most important thing to log for
    // bug reproduction — a tester reporting "bug at age 37" is only
    // actionable if this value was captured.
    console.info(`[LIFE] New run started — seed=${seed}`);

    presentNextTurn(engine);
  }, [presentNextTurn]);

  const makeChoice = useCallback((choiceId: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    const outcome = engine.makeChoice(choiceId);

    if (outcome.isGameOver) {
      setState({
        phase: 'life_summary',
        character: toUICharacterState(outcome.nextState, wowCountRef.current),
        activeEvent: null,
        pendingWowEvent: null,
      });
      return;
    }

    if (outcome.followUpEvent) {
      // Event chain (§42): present immediately, no time advance this step.
      const isWow = outcome.followUpEvent.isWowMoment ?? false;
      if (isWow) wowCountRef.current += 1;
      const activeEvent = toActiveEvent(outcome.followUpEvent);
      setState({
        phase: isWow ? 'wow_moment' : 'playing',
        character: toUICharacterState(outcome.nextState, wowCountRef.current),
        activeEvent,
        pendingWowEvent: isWow ? activeEvent : null,
      });
      return;
    }

    presentNextTurn(engine);
  }, [presentNextTurn]);

  const continueAfterWow = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'playing', pendingWowEvent: null }));
  }, []);

  const returnToMenu = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'menu' }));
  }, []);

  const goToCreation = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'character_creation' }));
  }, []);

  return {
    state,
    startGame,
    makeChoice,
    continueAfterWow,
    returnToMenu,
    goToCreation,
  };
}
