import { z } from 'zod';
import { CharacterStateSchema } from './character.js';
import { GameDateSchema } from './common.js';

export const StateDeltaSchema = z.object({
  path: z.string(),
  before: z.unknown(),
  after: z.unknown(),
  provenance: z.object({
    sourceEventId: z.string(),
    sourceChoiceId: z.string(),
    atAge: z.number(),
  }),
});
export type StateDelta = z.infer<typeof StateDeltaSchema>;

export const TurnLogEntrySchema = z.object({
  turnNumber: z.number().int().min(1),
  age: z.number().min(0),
  ageMonths: z.number().min(0),
  eventId: z.string(),
  choiceId: z.string(),
  timestamp: GameDateSchema,
  deltas: z.array(StateDeltaSchema).default([]),
});
export type TurnLogEntry = z.infer<typeof TurnLogEntrySchema>;

export const ScheduledEventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  triggerAge: z.number().min(0),
  triggerAgeMonths: z.number().min(0).default(0),
  priority: z.number().default(1),
  provenance: z.object({
    sourceEventId: z.string(),
    sourceChoiceId: z.string(),
    atAge: z.number(),
  }),
});
export type ScheduledEvent = z.infer<typeof ScheduledEventSchema>;

export const CausalNodeSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  choiceId: z.string(),
  atAge: z.number(),
  title: z.string(),
  choiceText: z.string(),
  causedByNodeId: z.string().optional(),
  outcomeSummary: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type CausalNode = z.infer<typeof CausalNodeSchema>;

export const CausalGraphSchema = z.object({
  nodes: z.array(CausalNodeSchema).default([]),
  edges: z.array(z.object({
    fromNodeId: z.string(),
    toNodeId: z.string(),
    relationship: z.string(),
  })).default([]),
});
export type CausalGraph = z.infer<typeof CausalGraphSchema>;

export const WorldStateSchema = z.object({
  year: z.number().default(2000),
  economicStatus: z.enum(['recession', 'stagnant', 'stable', 'boom']).default('stable'),
  inflationRate: z.number().default(0.03),
  jobMarketHealth: z.number().min(0).max(100).default(50),
  housingIndex: z.number().default(100),
  technologyEra: z.string().default('digital'),
  activeFlags: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
});
export type WorldState = z.infer<typeof WorldStateSchema>;

export const RunLogSchema = z.object({
  seed: z.number().int(),
  contentVersion: z.number().int().default(1),
  choices: z.array(z.object({
    turn: z.number(),
    eventId: z.string(),
    choiceId: z.string(),
  })),
});
export type RunLog = z.infer<typeof RunLogSchema>;

export const SaveDataSchema = z.object({
  slot: z.number().int().min(1).max(10),
  version: z.literal(1).default(1),
  savedAt: z.string(), // ISO string
  rngSeed: z.number().int(),
  characterState: CharacterStateSchema,
  worldState: WorldStateSchema,
  turnHistory: z.array(TurnLogEntrySchema).default([]),
  scheduledQueue: z.array(ScheduledEventSchema).default([]),
  causalGraph: CausalGraphSchema.default({ nodes: [], edges: [] }),
  seenEvents: z.record(z.string(), z.number()).default({}), // eventId -> count
  eventCooldowns: z.record(z.string(), z.number()).default({}), // eventId -> expiryAgeInMonths
  isIronLife: z.boolean().default(false), // Iron Life mode (§48)
});
export type SaveData = z.infer<typeof SaveDataSchema>;
