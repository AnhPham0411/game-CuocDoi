import { CharacterState, EventCategory, EventDefinition } from '@life/schema';
import { GameClock, LifeStage } from '../core/clock.js';
import { RNG } from '../core/rng.js';
import { ConditionEvaluator, EvaluationContext } from './condition-evaluator.js';
import { EventDatabase } from './event-database.js';

export interface SelectorContext extends EvaluationContext {
  eventCooldowns?: Record<string, number>; // eventId -> cooldown until ageInMonths
  currentTurn?: number;
}

// Life stage distribution targets from blueprint §22
const STAGE_CATEGORY_WEIGHTS: Record<LifeStage, Partial<Record<EventCategory, number>>> = {
  early_childhood: {
    FAMILY: 0.5,
    HEALTH: 0.2,
    RANDOM: 0.3,
  },
  childhood: {
    FAMILY: 0.3,
    SCHOOL: 0.3,
    FRIENDSHIP: 0.25,
    RANDOM: 0.15,
  },
  adolescence: {
    SCHOOL: 0.25,
    FRIENDSHIP: 0.2,
    ROMANCE: 0.2,
    FAMILY: 0.15,
    CAREER: 0.1,
    RANDOM: 0.1,
  },
  young_adult: {
    CAREER: 0.3,
    ROMANCE: 0.2,
    MONEY: 0.15,
    FRIENDSHIP: 0.1,
    FAMILY: 0.1,
    RANDOM: 0.15,
  },
  adult: {
    CAREER: 0.25,
    FAMILY: 0.25,
    MONEY: 0.2,
    HEALTH: 0.15,
    RANDOM: 0.15,
  },
  middle_age: {
    FAMILY: 0.25,
    HEALTH: 0.25,
    CAREER: 0.2,
    MONEY: 0.15,
    RANDOM: 0.15,
  },
  old_age: {
    HEALTH: 0.35,
    FAMILY: 0.25,
    LIFE: 0.25,
    RANDOM: 0.15,
  },
};

export class EventSelector {
  public static selectEvent(
    db: EventDatabase,
    state: CharacterState,
    rng: RNG,
    context: SelectorContext = {}
  ): EventDefinition {
    const allEvents = db.getAll();
    const currentAgeInMonths = state.age * 12 + state.ageMonths;
    const stage = GameClock.getLifeStage(state.age);
    const categoryTargetWeights = STAGE_CATEGORY_WEIGHTS[stage] ?? {};

    const eligibleEvents: EventDefinition[] = [];
    const weights: number[] = [];

    for (const event of allEvents) {
      // 1. Check cooldown
      const cooldownUntil = context.eventCooldowns?.[event.id];
      if (cooldownUntil !== undefined && currentAgeInMonths < cooldownUntil) {
        continue;
      }

      // 2. Check repetition limits
      const seenCount = context.seenEvents?.[event.id] ?? 0;
      // `repeatable: false` means exactly that — a one-time milestone (first
      // crush, first job, birth...) must never fire twice in one life, no
      // matter how wide its age window is relative to its cooldown. The
      // previous `seenCount >= 3` threshold let 30/56 non-repeatable events
      // in real content (e.g. evt_teen_first_crush: age 12-14 but only an
      // 18-month cooldown inside that 36-month window) fire 2-3 times per
      // run — duplicating CREATE_NPC'd relationships (a real React
      // duplicate-key warning on npc_first_crush is what surfaced this) and
      // undermining the exact "no fake, repeated firsts" narrative integrity
      // blueprint P3 asks for. Repeatable events are intentionally uncapped
      // here — their frequency is governed by noveltyFactor's weight decay
      // instead (§E6/§10), which is the right tool for "can recur, but
      // increasingly rarely."
      if (!event.repeatable && seenCount >= 1) {
        continue;
      }

      // 3. Evaluate conditions
      if (!ConditionEvaluator.evaluateAll(event.conditions, state, context)) {
        continue;
      }

      // 4. Calculate adaptive weight according to blueprint §10 formula
      const baseWeight = event.weight;

      // Novelty factor: exponential penalty for recently seen events
      const noveltyFactor = seenCount === 0 ? 1.0 : Math.max(0.1, 1.0 / (seenCount * 2));

      // Life stage category bias factor (§22)
      const categoryBias = (categoryTargetWeights[event.category] ?? 0.1) * 10;

      // Personality resonance factor
      let personalityFactor = 1.0;
      if (event.tags.includes('ambitious') && state.personality.ambition > 70) {
        personalityFactor *= 1.5;
      }
      if (event.tags.includes('risk') && state.personality.risk_tolerance > 70) {
        personalityFactor *= 1.4;
      }
      if (event.tags.includes('social') && state.personality.extraversion > 70) {
        personalityFactor *= 1.3;
      }

      const finalWeight = baseWeight * noveltyFactor * categoryBias * personalityFactor;

      eligibleEvents.push(event);
      weights.push(Math.max(1, Math.round(finalWeight)));
    }

    if (eligibleEvents.length === 0) {
      // Fallback filler event (§E6, §22) - NEVER crash when pool is empty
      return this.createFillerEvent(state);
    }

    const eventSubRng = rng.fork('events');
    const selected = eventSubRng.weightedPick(eligibleEvents, weights);
    const result = selected ?? eligibleEvents[0];
    return result ? result : this.createFillerEvent(state);
  }

  private static createFillerEvent(state: CharacterState): EventDefinition {
    return {
      id: `evt_filler_generic_${state.age}`,
      schemaVersion: 1,
      contentVersion: 1,
      category: 'LIFE',
      importance: 5,
      decisionType: 'INSTANT',
      title: 'A Quiet Day Passes',
      description: 'Nothing out of the ordinary happens this season. Time gently flows by.',
      conditions: [],
      weight: 10,
      choices: [
        {
          id: 'rest',
          text: 'Rest and reflect on life',
          effects: [
            { type: 'STAT_CHANGE', field: 'stress', value: -2 },
            { type: 'STAT_CHANGE', field: 'happiness', value: 1 },
          ],
        },
      ],
      cooldownMonths: 0,
      tags: ['filler', 'generic'],
      maxChainDepth: 1,
      repeatable: true,
      isWowMoment: false,
    };
  }
}
