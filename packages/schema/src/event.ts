import { z } from 'zod';
import { ConditionSchema } from './condition.js';
import { EffectSchema } from './effect.js';

export const EventCategorySchema = z.enum([
  'LIFE',
  'FAMILY',
  'FRIENDSHIP',
  'ROMANCE',
  'SCHOOL',
  'CAREER',
  'MONEY',
  'HEALTH',
  'CRIME',
  'ACCIDENT',
  'TRAVEL',
  'HOBBY',
  'SOCIAL',
  'RANDOM',
]);
export type EventCategory = z.infer<typeof EventCategorySchema>;

export const DecisionTypeSchema = z.enum([
  'INSTANT',       // Type A (§13)
  'SOCIAL',        // Type B (§13)
  'STRATEGIC',     // Type C (§13)
  'MORAL',         // Type D (§13)
  'IRREVERSIBLE',  // Type E (§13)
]);
export type DecisionType = z.infer<typeof DecisionTypeSchema>;

export const EventChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  condition: ConditionSchema.optional(), // choice eligibility
  effects: z.array(EffectSchema).default([]),
  followUpEventId: z.string().optional(),
});
export type EventChoice = z.infer<typeof EventChoiceSchema>;

export const EventDefinitionSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(1).default(1),
  contentVersion: z.number().int().min(1).default(1),
  category: EventCategorySchema,
  importance: z.number().int().min(1).max(100), // 1-100 (§12)
  decisionType: DecisionTypeSchema.default('INSTANT'),
  title: z.string().min(1),
  description: z.string().min(1),
  conditions: z.array(ConditionSchema).default([]),
  weight: z.number().positive().default(100),
  choices: z.array(EventChoiceSchema).min(1),
  cooldownMonths: z.number().int().min(0).default(0),
  tags: z.array(z.string()).default([]),
  maxChainDepth: z.number().int().min(1).max(5).default(5), // Anti-cascade (§42)
  repeatable: z.boolean().default(false),
  isWowMoment: z.boolean().default(false), // §50
});
export type EventDefinition = z.infer<typeof EventDefinitionSchema>;
