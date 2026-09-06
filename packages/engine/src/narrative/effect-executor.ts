import {
  CharacterState,
  Effect,
  Memory,
  PersonalityAxis,
  Provenance,
  RelationshipField,
  RelationshipState,
  ScheduledEvent,
  StateDelta,
  StatusEffect,
  Trait,
} from '@life/schema';

export interface ExecutionResult {
  nextState: CharacterState;
  deltas: StateDelta[];
  scheduledEvents: ScheduledEvent[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Mints a deterministic, collision-free ID from the character's own monotonic
 * counter — never Date.now()/Math.random() (blueprint L1: engine must be a
 * pure, deterministic function of state + choice). Returns the id and the
 * state with the counter advanced.
 */
function mintId(state: CharacterState, prefix: string): [string, CharacterState] {
  const n = state.idCounter;
  return [`${prefix}_${n}`, { ...state, idCounter: n + 1 }];
}

export class EffectExecutor {
  public static execute(
    state: CharacterState,
    effects: readonly Effect[],
    provenance: Provenance,
    eventImportance: number = 20
  ): ExecutionResult {
    let current = { ...state };
    const deltas: StateDelta[] = [];
    const scheduledEvents: ScheduledEvent[] = [];

    for (const effect of effects) {
      const effectWithProv: Effect = { ...effect, provenance };

      switch (effect.type) {
        case 'STAT_CHANGE': {
          const field = effect.field;
          const val = typeof effect.value === 'number' ? effect.value : 0;

          if (field === 'health' || field === 'happiness' || field === 'stress') {
            const before = current[field];
            const maxDelta = eventImportance >= 81 ? 30 : 20;
            const boundedVal = clamp(val, -maxDelta, maxDelta);
            const after = clamp(before + boundedVal, 0, 100);
            current = { ...current, [field]: after };
            deltas.push({
              path: field,
              before,
              after,
              provenance,
            });
          } else if (field === 'personality' && effect.target) {
            const axis = effect.target as PersonalityAxis;
            const before = current.personality[axis] ?? 50;
            const maxAllowedDelta = eventImportance >= 81 ? 15 : 3; // Clamp §P0.4: max ±3/turn unless extreme
            const clampedDelta = clamp(val, -maxAllowedDelta, maxAllowedDelta);
            const after = clamp(before + clampedDelta, 0, 100);

            current = {
              ...current,
              personality: {
                ...current.personality,
                [axis]: after,
              },
            };
            deltas.push({
              path: `personality.${axis}`,
              before,
              after,
              provenance,
            });
          }
          break;
        }

        case 'MONEY_CHANGE': {
          const delta = typeof effect.value === 'number' ? effect.value : 0;
          const before = current.money;
          const after = before + delta;
          current = { ...current, money: after };
          deltas.push({ path: 'money', before, after, provenance });
          break;
        }

        case 'SKILL_CHANGE': {
          const skillName = effect.target ?? effect.field ?? 'general';
          const delta = typeof effect.value === 'number' ? effect.value : 1;
          const before = current.skills[skillName] ?? 0;
          const after = clamp(before + delta, 0, 100);
          current = {
            ...current,
            skills: {
              ...current.skills,
              [skillName]: after,
            },
          };
          deltas.push({ path: `skills.${skillName}`, before, after, provenance });
          break;
        }

        case 'RELATIONSHIP_CHANGE': {
          if (!effect.relationshipPayload) break;
          const { target, field, delta } = effect.relationshipPayload;

          const relIndex = current.relationships.findIndex(
            (r) => r.npcId === target || r.relationshipType === target
          );

          if (relIndex >= 0) {
            const rel = current.relationships[relIndex]!;
            const before = rel[field];
            const maxDelta = eventImportance >= 81 ? 40 : 15;
            const clampedDelta = clamp(delta, -maxDelta, maxDelta);
            const after = clamp(before + clampedDelta, 0, 100);

            const updatedRel: RelationshipState = {
              ...rel,
              [field]: after,
              interactionFrequency: clamp(rel.interactionFrequency + 10, 0, 100),
            };

            const updatedList = [...current.relationships];
            updatedList[relIndex] = updatedRel;
            current = { ...current, relationships: updatedList };

            deltas.push({
              path: `relationships[${rel.npcId}].${field}`,
              before,
              after,
              provenance,
            });
          }
          break;
        }

        case 'TRAIT_ADD': {
          const traitId = effect.target ?? String(effect.value);
          if (!current.traits.some((t) => t.id === traitId)) {
            const newTrait: Trait = {
              id: traitId,
              name: effect.field ?? traitId,
              description: 'Acquired trait',
              category: 'acquired',
              isPermanent: effect.durationMonths === undefined,
              durationMonths: effect.durationMonths,
            };
            current = { ...current, traits: [...current.traits, newTrait] };
            deltas.push({ path: 'traits', before: null, after: newTrait, provenance });
          }
          break;
        }

        case 'TRAIT_REMOVE': {
          const traitId = effect.target ?? String(effect.value);
          const filtered = current.traits.filter((t) => t.id !== traitId);
          current = { ...current, traits: filtered };
          deltas.push({ path: 'traits', before: traitId, after: null, provenance });
          break;
        }

        case 'MEMORY_ADD': {
          if (!effect.memoryPayload) break;
          const { type, tags, emotionalWeight, importance, description, participants } =
            effect.memoryPayload;

          const [memoryId, stateWithId] = mintId(current, 'mem');
          current = stateWithId;

          const newMemory: Memory = {
            id: memoryId,
            timestamp: { year: 2000 + current.age, month: current.ageMonths + 1, day: 1 },
            age: current.age,
            type,
            participants: participants ?? [],
            emotionalWeight,
            importance,
            tags,
            sourceEventId: provenance.sourceEventId,
            description,
          };

          // Check memory quota (§43): majorMemories <= 500
          let memoriesList = [...current.memories, newMemory];
          if (memoriesList.length > 500) {
            // Compress lowest importance memory
            memoriesList.sort((a, b) => a.importance - b.importance);
            const dropped = memoriesList.shift();
            // Preserve tags in a summarized archive tag list
            if (dropped && dropped.tags.length > 0) {
              memoriesList[0]?.tags.push(...dropped.tags);
            }
          }

          current = { ...current, memories: memoriesList };
          deltas.push({ path: 'memories', before: null, after: newMemory, provenance });
          break;
        }

        case 'STATUS_ADD': {
          if (effect.durationMonths && effect.target) {
            const status: StatusEffect = {
              id: effect.target,
              name: effect.field ?? effect.target,
              type: effect.target,
              value: typeof effect.value === 'number' ? effect.value : 0,
              durationMonths: effect.durationMonths,
              remainingMonths: effect.durationMonths,
              provenance,
            };
            current = { ...current, statusEffects: [...current.statusEffects, status] };
            deltas.push({ path: 'statusEffects', before: null, after: status, provenance });
          }
          break;
        }

        case 'STATUS_REMOVE': {
          if (effect.target) {
            current = {
              ...current,
              statusEffects: current.statusEffects.filter((s) => s.id !== effect.target),
            };
            deltas.push({ path: 'statusEffects', before: effect.target, after: null, provenance });
          }
          break;
        }

        case 'CREATE_NPC': {
          if (effect.npcPayload) {
            // Quota check (§43): activeRelationships <= 100
            if (current.relationships.length < 100) {
              const newRel: RelationshipState = {
                npcId: effect.npcPayload.npcId,
                name: effect.npcPayload.name,
                closeness: effect.npcPayload.initialCloseness,
                trust: effect.npcPayload.initialTrust,
                respect: effect.npcPayload.initialRespect,
                conflict: 0,
                dependence: 0,
                interactionFrequency: 50,
                relationshipType: effect.npcPayload.relationshipType,
                importantMemories: [],
                tier: effect.npcPayload.tier,
              };
              current = { ...current, relationships: [...current.relationships, newRel] };
              deltas.push({ path: 'relationships', before: null, after: newRel, provenance });
            }
          }
          break;
        }

        case 'KILL_NPC': {
          const npcId = effect.target;
          if (npcId) {
            // Update family member if exists
            const fam = current.family.map((f) =>
              f.npcId === npcId ? { ...f, isAlive: false } : f
            );
            current = { ...current, family: fam };
            deltas.push({ path: `family[${npcId}].isAlive`, before: true, after: false, provenance });
          }
          break;
        }

        case 'CAREER_CHANGE': {
          const jobId = effect.target ?? null;
          const title = effect.field ?? null;
          const salary = typeof effect.value === 'number' ? effect.value : current.career.salary;

          const prevJobId = current.career.currentJobId;
          const newCareer = {
            ...current.career,
            currentJobId: jobId,
            jobTitle: title,
            salary,
            yearsAtCompany: 0,
          };
          if (prevJobId && prevJobId !== jobId) {
            current = {
              ...current,
              statistics: {
                ...current.statistics,
                careersChanged: current.statistics.careersChanged + 1,
              },
            };
          }
          current = { ...current, career: newCareer };
          deltas.push({ path: 'career', before: prevJobId, after: jobId, provenance });
          break;
        }

        case 'EDUCATION_CHANGE': {
          if (effect.target) {
            const newEducation = {
              ...current.education,
              level: effect.target as any,
              completed: effect.value === true,
            };
            current = { ...current, education: newEducation };
            deltas.push({ path: 'education', before: current.education, after: newEducation, provenance });
          }
          break;
        }

        case 'SCHEDULE_EVENT': {
          if (effect.schedulePayload) {
            const [schedId, stateWithId] = mintId(current, 'sched');
            current = stateWithId;
            const sched: ScheduledEvent = {
              id: schedId,
              eventId: effect.schedulePayload.eventId,
              triggerAge: effect.schedulePayload.targetAge,
              triggerAgeMonths: effect.schedulePayload.monthsFromNow ?? 0,
              priority: effect.schedulePayload.priority,
              provenance,
            };
            scheduledEvents.push(sched);
          }
          break;
        }

        default:
          break;
      }
    }

    return {
      nextState: current,
      deltas,
      scheduledEvents,
    };
  }
}
