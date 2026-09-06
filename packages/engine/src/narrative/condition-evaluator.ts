import {
  CharacterState,
  ComparisonOp,
  Condition,
  EducationLevel,
  RelationshipField,
} from '@life/schema';

export interface EvaluationContext {
  seenEvents?: Record<string, number>;
  activeFlags?: Record<string, unknown>;
}

const EDUCATION_RANK: Record<EducationLevel, number> = {
  none: 0,
  primary: 1,
  middle_school: 2,
  high_school: 3,
  vocational: 4,
  bachelor: 5,
  master: 6,
  doctorate: 7,
};

function compareValues(actual: number, op: ComparisonOp, expected: number): boolean {
  switch (op) {
    case '>': return actual > expected;
    case '>=': return actual >= expected;
    case '<': return actual < expected;
    case '<=': return actual <= expected;
    case '==': return actual === expected;
    case '!=': return actual !== expected;
  }
}

export class ConditionEvaluator {
  public static evaluate(
    condition: Condition,
    state: CharacterState,
    context: EvaluationContext = {}
  ): boolean {
    switch (condition.type) {
      case 'and': {
        for (const sub of condition.conditions) {
          if (!this.evaluate(sub, state, context)) return false;
        }
        return true;
      }

      case 'or': {
        for (const sub of condition.conditions) {
          if (this.evaluate(sub, state, context)) return true;
        }
        return false;
      }

      case 'not': {
        return !this.evaluate(condition.condition, state, context);
      }

      case 'age': {
        if (condition.min !== undefined && state.age < condition.min) return false;
        if (condition.max !== undefined && state.age > condition.max) return false;
        return true;
      }

      case 'stat': {
        const val = state[condition.field];
        return compareValues(val, condition.op, condition.value);
      }

      case 'personality': {
        const val = state.personality[condition.axis] ?? 0;
        return compareValues(val, condition.op, condition.value);
      }

      case 'skill': {
        const val = state.skills[condition.name] ?? 0;
        return compareValues(val, condition.op, condition.value);
      }

      case 'money': {
        return compareValues(state.money, condition.op, condition.value);
      }

      case 'relationship': {
        const rel = this.findRelationship(state, condition.target);
        if (!rel) return false; // Safe failure (§E3): missing NPC returns false, does not throw
        const fieldVal = rel[condition.field as RelationshipField] ?? 0;
        return compareValues(fieldVal, condition.op, condition.value);
      }

      case 'trait': {
        const hasTrait = state.traits.some((t) => t.id === condition.id);
        const expectedHas = condition.has ?? true;
        return hasTrait === expectedHas;
      }

      case 'memory': {
        return state.memories.some((m) => {
          if (condition.tag && !m.tags.includes(condition.tag)) return false;
          if (condition.memoryType && m.type !== condition.memoryType) return false;
          if (condition.participant && !m.participants.includes(condition.participant)) return false;
          if (condition.minImportance && m.importance < condition.minImportance) return false;
          return true;
        });
      }

      case 'career': {
        if (condition.hasJob !== undefined) {
          const isEmployed = state.career.currentJobId !== null;
          if (isEmployed !== condition.hasJob) return false;
        }
        if (condition.jobId && state.career.currentJobId !== condition.jobId) return false;
        if (condition.minSalary !== undefined && state.career.salary < condition.minSalary) return false;
        return true;
      }

      case 'education': {
        if (condition.completed !== undefined && state.education.completed !== condition.completed) {
          return false;
        }
        if (condition.minLevel) {
          const currentRank = EDUCATION_RANK[state.education.level] ?? 0;
          const reqRank = EDUCATION_RANK[condition.minLevel] ?? 0;
          if (currentRank < reqRank) return false;
        }
        return true;
      }

      case 'event_seen': {
        const count = context.seenEvents?.[condition.eventId] ?? 0;
        const seen = count > 0;
        return seen === (condition.seen ?? true);
      }

      case 'flag': {
        const flagVal = context.activeFlags?.[condition.key];
        if (condition.op === '==') return flagVal === condition.value;
        if (condition.op === '!=') return flagVal !== condition.value;
        if (typeof flagVal === 'number' && typeof condition.value === 'number') {
          return compareValues(flagVal, condition.op, condition.value);
        }
        return false;
      }

      default:
        return false;
    }
  }

  public static evaluateAll(
    conditions: readonly Condition[],
    state: CharacterState,
    context: EvaluationContext = {}
  ): boolean {
    for (const cond of conditions) {
      if (!this.evaluate(cond, state, context)) return false;
    }
    return true;
  }

  private static findRelationship(state: CharacterState, target: string) {
    // Check direct npcId match
    const byId = state.relationships.find((r) => r.npcId === target);
    if (byId) return byId;

    // Check relationshipType match (e.g. 'friend', 'father', 'mother', 'spouse')
    const byRole = state.relationships.find((r) => r.relationshipType === target);
    if (byRole) return byRole;

    // Check family members by role
    const familyMember = state.family.find((f) => f.role === target || f.npcId === target);
    if (familyMember) {
      return state.relationships.find((r) => r.npcId === familyMember.npcId);
    }

    return undefined;
  }
}
