import { z } from 'zod';
import { ProvenanceSchema, RelationshipFieldSchema } from './common.js';
import { MemoryTypeSchema, RelationshipTypeSchema } from './character.js';

export const EffectTypeSchema = z.enum([
  'STAT_CHANGE',
  'RELATIONSHIP_CHANGE',
  'MONEY_CHANGE',
  'SKILL_CHANGE',
  'TRAIT_ADD',
  'TRAIT_REMOVE',
  'MEMORY_ADD',
  'STATUS_ADD',
  'STATUS_REMOVE',
  'UNLOCK_EVENT',
  'LOCK_EVENT',
  'CREATE_NPC',
  'KILL_NPC',
  'MOVE',
  'CAREER_CHANGE',
  'EDUCATION_CHANGE',
  'GOAL_CHANGE',
  'SCHEDULE_EVENT',
]);
export type EffectType = z.infer<typeof EffectTypeSchema>;

/** Master Effect Schema adhering to blueprint §14, §15, and L4 provenance */
export const EffectSchema = z.object({
  type: EffectTypeSchema,
  target: z.string().optional(),
  field: z.string().optional(),
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
  durationMonths: z.number().int().positive().optional(), // temporary effect support (§15)

  // Specialized payload fields
  relationshipPayload: z.object({
    target: z.string(),
    field: RelationshipFieldSchema,
    delta: z.number(),
  }).optional(),

  memoryPayload: z.object({
    type: MemoryTypeSchema,
    tags: z.array(z.string()),
    emotionalWeight: z.number().min(-100).max(100),
    importance: z.number().min(1).max(100),
    description: z.string().optional(),
    participants: z.array(z.string()).optional(),
  }).optional(),

  npcPayload: z.object({
    npcId: z.string(),
    name: z.string(),
    relationshipType: RelationshipTypeSchema,
    initialCloseness: z.number().min(0).max(100).default(50),
    initialTrust: z.number().min(0).max(100).default(50),
    initialRespect: z.number().min(0).max(100).default(50),
    tier: z.number().min(1).max(4).default(2),
  }).optional(),

  schedulePayload: z.object({
    eventId: z.string(),
    targetAge: z.number().min(0),
    monthsFromNow: z.number().min(0).optional(),
    priority: z.number().default(1),
  }).optional(),

  provenance: ProvenanceSchema.optional(), // provenance attached by engine when executed
});
export type Effect = z.infer<typeof EffectSchema>;
