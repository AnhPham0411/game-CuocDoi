import { CharacterState, EventDefinition, ScheduledEvent } from '@life/schema';
import { ConditionEvaluator } from './condition-evaluator.js';
import { EventDatabase } from './event-database.js';

export interface DueEventResult {
  readyEvents: EventDefinition[];
  cancelledEvents: { eventId: string; reason: string }[];
  remainingQueue: ScheduledEvent[];
}

export class ConsequenceQueue {
  public static evaluateDue(
    queue: readonly ScheduledEvent[],
    state: CharacterState,
    db: EventDatabase
  ): DueEventResult {
    const readyEvents: EventDefinition[] = [];
    const cancelledEvents: { eventId: string; reason: string }[] = [];
    const remainingQueue: ScheduledEvent[] = [];

    for (const item of queue) {
      const isTimeDue =
        state.age > item.triggerAge ||
        (state.age === item.triggerAge && state.ageMonths >= item.triggerAgeMonths);

      if (!isTimeDue) {
        remainingQueue.push(item);
        continue;
      }

      const eventDef = db.getById(item.eventId);
      if (!eventDef) {
        cancelledEvents.push({ eventId: item.eventId, reason: 'Event definition no longer exists' });
        continue;
      }

      // Check whether prerequisites and conditions still hold (§41)
      const valid = ConditionEvaluator.evaluateAll(eventDef.conditions, state);
      if (valid) {
        readyEvents.push(eventDef);
      } else {
        cancelledEvents.push({
          eventId: item.eventId,
          reason: 'Conditions no longer met at trigger time (e.g. relationship severed or deceased)',
        });
      }
    }

    return {
      readyEvents,
      cancelledEvents,
      remainingQueue,
    };
  }
}
