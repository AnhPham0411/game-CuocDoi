import { CharacterState, EventDefinition, SaveData } from '@life/schema';
import { CausalGraphTracker } from '../narrative/causal-graph.js';
import { EventDatabase } from '../narrative/event-database.js';
import { RNG } from './rng.js';
import { PreparedTurn, StepOutcome, TurnPipeline, TurnStateContext } from './turn-pipeline.js';

export interface GameEngineState {
  character: CharacterState;
  context: TurnStateContext;
  currentPreparedTurn: PreparedTurn | null;
  rngSeed: number;
}

export class GameEngine {
  private rng: RNG;
  private db: EventDatabase;
  private state: GameEngineState;

  constructor(
    initialCharacter: CharacterState,
    db: EventDatabase,
    seed: number = 42,
    existingContext?: Partial<TurnStateContext>
  ) {
    this.rng = new RNG(seed);
    this.db = db;

    const context: TurnStateContext = {
      turnNumber: existingContext?.turnNumber ?? 1,
      seenEvents: { ...(existingContext?.seenEvents ?? {}) },
      eventCooldowns: { ...(existingContext?.eventCooldowns ?? {}) },
      scheduledQueue: [...(existingContext?.scheduledQueue ?? [])],
      activeFlags: { ...(existingContext?.activeFlags ?? {}) },
      causalTracker: existingContext?.causalTracker ?? new CausalGraphTracker(),
    };

    this.state = {
      character: { ...initialCharacter },
      context,
      currentPreparedTurn: null,
      rngSeed: seed,
    };
  }

  public getCharacter(): Readonly<CharacterState> {
    return this.state.character;
  }

  public getContext(): Readonly<TurnStateContext> {
    return this.state.context;
  }

  public getCausalTracker(): CausalGraphTracker {
    return this.state.context.causalTracker;
  }

  /**
   * Prepares the next turn and returns the chosen event to present to the user/bot
   */
  public nextTurn(monthsPerTurn: number = 3): EventDefinition {
    const prepared = TurnPipeline.prepareTurn(
      this.state.character,
      this.db,
      this.rng,
      this.state.context,
      monthsPerTurn
    );

    this.state.character = prepared.state;
    this.state.currentPreparedTurn = prepared;
    return prepared.event;
  }

  /**
   * Takes player's decision and applies state transitions
   */
  public makeChoice(choiceId: string): StepOutcome {
    if (!this.state.currentPreparedTurn) {
      throw new Error('Cannot make choice before nextTurn() is called');
    }

    const outcome = TurnPipeline.executeChoice(
      this.state.currentPreparedTurn,
      choiceId,
      this.db,
      this.state.context
    );

    this.state.character = outcome.nextState;
    this.state.currentPreparedTurn = null;
    this.state.context.turnNumber += 1;

    return outcome;
  }

  /**
   * `savedAt` is wall-clock metadata about *when the player saved*, not
   * simulation state — it must come from the caller (real I/O), never be
   * fabricated inside the engine. Passing it explicitly keeps `exportSave`
   * itself a pure function of engine state, so two identical runs still
   * produce byte-identical saves when given the same `savedAt` (L1).
   */
  public exportSave(slot: number = 1, isIronLife: boolean = false, savedAt: string = new Date(0).toISOString()): SaveData {
    return {
      slot,
      version: 1,
      savedAt,
      rngSeed: this.state.rngSeed,
      characterState: this.state.character,
      worldState: {
        year: 2000 + this.state.character.age,
        economicStatus: 'stable',
        inflationRate: 0.03,
        jobMarketHealth: 50,
        housingIndex: 100,
        technologyEra: 'digital',
        activeFlags: this.state.context.activeFlags as Record<string, string | number | boolean>,
      },
      turnHistory: [],
      scheduledQueue: this.state.context.scheduledQueue,
      causalGraph: this.state.context.causalTracker.getGraph(),
      seenEvents: this.state.context.seenEvents,
      eventCooldowns: this.state.context.eventCooldowns,
      isIronLife,
    };
  }
}
