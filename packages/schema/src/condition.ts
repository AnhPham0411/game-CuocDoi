import { z } from 'zod';
import { EducationLevelSchema } from './character.js';
import { RelationshipFieldSchema } from './common.js';

export const ComparisonOpSchema = z.enum(['>', '>=', '<', '<=', '==', '!=']);
export type ComparisonOp = z.infer<typeof ComparisonOpSchema>;

export const StatFieldSchema = z.enum(['health', 'happiness', 'stress', 'money']);
export type StatField = z.infer<typeof StatFieldSchema>;

export const PersonalityAxisSchema = z.enum([
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
  'ambition',
  'risk_tolerance',
  'empathy',
  'discipline',
  'curiosity',
]);

const BaseConditionSchema = z.object({
  type: z.literal('age'),
  min: z.number().optional(),
  max: z.number().optional(),
}).or(z.object({
  type: z.literal('stat'),
  field: StatFieldSchema,
  op: ComparisonOpSchema,
  value: z.number(),
})).or(z.object({
  type: z.literal('personality'),
  axis: PersonalityAxisSchema,
  op: ComparisonOpSchema,
  value: z.number(),
})).or(z.object({
  type: z.literal('skill'),
  name: z.string().min(1),
  op: ComparisonOpSchema,
  value: z.number(),
})).or(z.object({
  type: z.literal('money'),
  op: ComparisonOpSchema,
  value: z.number(),
})).or(z.object({
  type: z.literal('relationship'),
  target: z.string().min(1), // can be role (e.g. 'friend', 'father') or npcId
  field: RelationshipFieldSchema,
  op: ComparisonOpSchema,
  value: z.number(),
})).or(z.object({
  type: z.literal('trait'),
  id: z.string().min(1),
  has: z.boolean().default(true),
})).or(z.object({
  type: z.literal('memory'),
  tag: z.string().optional(),
  memoryType: z.string().optional(),
  participant: z.string().optional(),
  minImportance: z.number().optional(),
})).or(z.object({
  type: z.literal('career'),
  hasJob: z.boolean().optional(),
  jobId: z.string().optional(),
  minSalary: z.number().optional(),
})).or(z.object({
  type: z.literal('education'),
  minLevel: EducationLevelSchema.optional(),
  completed: z.boolean().optional(),
})).or(z.object({
  type: z.literal('event_seen'),
  eventId: z.string().min(1),
  seen: z.boolean().default(true),
})).or(z.object({
  type: z.literal('flag'),
  key: z.string().min(1),
  op: ComparisonOpSchema.default('=='),
  value: z.union([z.string(), z.number(), z.boolean()]),
}));

export type BaseCondition = z.infer<typeof BaseConditionSchema>;
export type BaseConditionInput = z.input<typeof BaseConditionSchema>;

// Recursive definition for logical operators: and, or, not
export type Condition =
  | BaseCondition
  | { type: 'and'; conditions: Condition[] }
  | { type: 'or'; conditions: Condition[] }
  | { type: 'not'; condition: Condition };

export type ConditionInput =
  | BaseConditionInput
  | { type: 'and'; conditions: ConditionInput[] }
  | { type: 'or'; conditions: ConditionInput[] }
  | { type: 'not'; condition: ConditionInput };

export const ConditionSchema: z.ZodType<Condition, z.ZodTypeDef, ConditionInput> = z.lazy(() =>
  z.union([
    BaseConditionSchema,
    z.object({
      type: z.literal('and'),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({
      type: z.literal('or'),
      conditions: z.array(ConditionSchema).min(1),
    }),
    z.object({
      type: z.literal('not'),
      condition: ConditionSchema,
    }),
  ])
);
