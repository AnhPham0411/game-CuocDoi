import {
  CharacterState,
  EventDefinition,
  Provenance,
  ScheduledEvent,
  StateDelta,
  TurnLogEntry,
} from '@life/schema';
import { CausalGraphTracker } from '../narrative/causal-graph.js';
import { ConsequenceQueue } from '../narrative/consequence-queue.js';
import { EffectExecutor } from '../narrative/effect-executor.js';
import { EventDatabase } from '../narrative/event-database.js';
import { EventSelector } from '../narrative/event-selector.js';
import { CareerSystem } from '../simulation/career-system.js';
import { HappinessSystem } from '../simulation/happiness-system.js';
import { HealthSystem } from '../simulation/health-system.js';
import { RelationshipSystem } from '../simulation/relationship-system.js';
import { GameClock } from './clock.js';
import { RNG } from './rng.js';

export interface TurnStateContext {
  turnNumber: number;
  seenEvents: Record<string, number>;
  eventCooldowns: Record<string, number>;
  scheduledQueue: ScheduledEvent[];
  activeFlags: Record<string, unknown>;
  causalTracker: CausalGraphTracker;
}

export interface PreparedTurn {
  event: EventDefinition;
  state: CharacterState;
  dueFromQueue: boolean;
  triggeringSchedule?: ScheduledEvent;
}

export interface StepOutcome {
  nextState: CharacterState;
  turnLog: TurnLogEntry;
  followUpEvent?: EventDefinition | undefined;
  isGameOver: boolean;
}

export class TurnPipeline {
  /**
   * Steps 1-11 of blueprint §40:
   * Advances time, runs simulation updates, and selects the next eligible event to present to the player.
   */
  public static prepareTurn(
    currentState: CharacterState,
    db: EventDatabase,
    rng: RNG,
    context: TurnStateContext,
    monthsPerTurn: number = 3
  ): PreparedTurn {
    let state = { ...currentState };

    // 1. Advance time (§40.1)
    const advanceRes = GameClock.advance(state, monthsPerTurn);
    state = advanceRes.nextState;

    // 2. Update temporary effects (§40.2)
    const updatedStatusEffects = state.statusEffects
      .map((s) => ({
        ...s,
        remainingMonths: s.remainingMonths - monthsPerTurn,
      }))
      .filter((s) => s.remainingMonths > 0);
    state = { ...state, statusEffects: updatedStatusEffects };

    // 3. Update relationships drift & quotas (§40.3, §E7)
    const driftedRels = RelationshipSystem.updateDrift(state.relationships);
    const quotaRels = RelationshipSystem.enforceQuotas(driftedRels);
    state = { ...state, relationships: quotaRels };

    // 4. Update career / education income & stress (§40.4)
    const incomeRes = CareerSystem.processTurnIncome(state, monthsPerTurn);
    state = {
      ...state,
      money: incomeRes.nextMoney,
      stress: incomeRes.nextStress,
    };

    // 5. Update health & happiness (§40.5)
    const healthRes = HealthSystem.updateTurn(state, monthsPerTurn);
    const nextHappiness = HappinessSystem.calculateNextHappiness(state, 0);
    state = {
      ...state,
      health: healthRes.nextHealth,
      stress: healthRes.nextStress,
      happiness: nextHappiness,
      isAlive: healthRes.isAlive,
      causeOfDeath: healthRes.causeOfDeath,
    };

    if (!state.isAlive) {
      // Return death event immediately
      return {
        event: this.createDeathEvent(state),
        state,
        dueFromQueue: false,
      };
    }

    // 6. Check due scheduled consequences (§40.6, §41)
    const dueRes = ConsequenceQueue.evaluateDue(context.scheduledQueue, state, db);
    context.scheduledQueue = dueRes.remainingQueue;

    if (dueRes.readyEvents.length > 0 && dueRes.readyEvents[0]) {
      return {
        event: dueRes.readyEvents[0].event,
        state,
        dueFromQueue: true,
        triggeringSchedule: dueRes.readyEvents[0].schedule,
      };
    }

    // 7-10. Select event from pool (§40.7-10)
    const selectorCtx = {
      seenEvents: context.seenEvents,
      eventCooldowns: context.eventCooldowns,
      activeFlags: context.activeFlags,
      currentTurn: context.turnNumber,
    };

    const selectedEvent = EventSelector.selectEvent(db, state, rng, selectorCtx);

    return {
      event: selectedEvent,
      state,
      dueFromQueue: false,
    };
  }

  /**
   * Steps 12-16 of blueprint §40:
   * Takes player's choice, applies effects, updates memories, schedules future events, records causal graph.
   */
  public static executeChoice(
    prepared: PreparedTurn,
    choiceId: string,
    db: EventDatabase,
    context: TurnStateContext,
    chainDepth: number = 0
  ): StepOutcome {
    const { event, state } = prepared;
    const choice = event.choices.find((c) => c.id === choiceId) ?? event.choices[0]!;

    const provenance: Provenance = {
      sourceEventId: event.id,
      sourceChoiceId: choice.id,
      atAge: state.age,
      timestamp: { year: 2000 + state.age, month: state.ageMonths + 1, day: 1 },
    };

    // 13. Apply effects (§40.13)
    const execRes = EffectExecutor.execute(state, choice.effects, provenance, event.importance);
    let nextState = execRes.nextState;
    const deltas: StateDelta[] = [...execRes.deltas];

    // 14. Create memories if significant (§40.14)
    if (event.importance >= 41) {
      const memoryDelta: StateDelta = {
        path: 'memories',
        before: null,
        after: `Memory of ${event.title}`,
        provenance,
      };
      deltas.push(memoryDelta);
    }

    // 15. Schedule future consequences (§40.15)
    if (execRes.scheduledEvents.length > 0) {
      context.scheduledQueue.push(...execRes.scheduledEvents);
    }

    // 16. Record to Causal Graph (§40.16, §92)
    if (event.importance >= 30) {
      const causedByNodeId = prepared.triggeringSchedule
        ? context.causalTracker.findNodeId(
            prepared.triggeringSchedule.provenance.sourceEventId,
            prepared.triggeringSchedule.provenance.sourceChoiceId,
            prepared.triggeringSchedule.provenance.atAge
          )
        : undefined;

      context.causalTracker.recordDecision(
        event.id,
        choice.id,
        state.age,
        event.title,
        choice.text,
        causedByNodeId,
        event.tags
      );
    }

    // Update cooldowns and seen counts
    const currentAgeInMonths = state.age * 12 + state.ageMonths;
    if (event.cooldownMonths > 0) {
      context.eventCooldowns[event.id] = currentAgeInMonths + event.cooldownMonths;
    }
    context.seenEvents[event.id] = (context.seenEvents[event.id] ?? 0) + 1;

    // Update total choices made
    nextState = {
      ...nextState,
      statistics: {
        ...nextState.statistics,
        totalChoicesMade: nextState.statistics.totalChoicesMade + 1,
        peakWealth: Math.max(nextState.statistics.peakWealth, nextState.money),
        lowestWealth: Math.min(nextState.statistics.lowestWealth, nextState.money),
      },
    };

    const turnLog: TurnLogEntry = {
      turnNumber: context.turnNumber,
      age: state.age,
      ageMonths: state.ageMonths,
      eventId: event.id,
      choiceId: choice.id,
      timestamp: provenance.timestamp!,
      deltas,
    };

    // Check chained event with maxChainDepth limit (§42)
    let followUpEvent: EventDefinition | undefined;
    if (choice.followUpEventId && chainDepth < (event.maxChainDepth ?? 5)) {
      followUpEvent = db.getById(choice.followUpEventId);
    }

    const isGameOver = !nextState.isAlive;

    return {
      nextState,
      turnLog,
      followUpEvent,
      isGameOver,
    };
  }

  private static createDeathEvent(state: CharacterState): EventDefinition {
    return {
      id: 'evt_game_over_death',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'LIFE',
      importance: 100,
      decisionType: 'IRREVERSIBLE',
      title: 'The End of Life',
      description: state.causeOfDeath ?? 'Your life has come to its peaceful conclusion.',
      conditions: [],
      weight: 1000,
      choices: [
        {
          id: 'accept',
          text: 'Reflect on the life you lived',
          effects: [],
        },
      ],
      cooldownMonths: 0,
      tags: ['death', 'milestone', 'summary'],
      maxChainDepth: 1,
      repeatable: false,
      isWowMoment: true,
    };
  }
}
