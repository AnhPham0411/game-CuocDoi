import { z } from 'zod';

export const GenderSchema = z.enum(['male', 'female', 'non_binary']);
export type Gender = z.infer<typeof GenderSchema>;

export const GameDateSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31).default(1),
});
export type GameDate = z.infer<typeof GameDateSchema>;

export const ProvenanceSchema = z.object({
  sourceEventId: z.string().min(1),
  sourceChoiceId: z.string().min(1),
  atAge: z.number().min(0),
  timestamp: GameDateSchema.optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const RelationshipFieldSchema = z.enum([
  'closeness',
  'trust',
  'respect',
  'conflict',
  'dependence',
]);
export type RelationshipField = z.infer<typeof RelationshipFieldSchema>;
