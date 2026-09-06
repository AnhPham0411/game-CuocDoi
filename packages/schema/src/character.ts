import { z } from 'zod';
import { GameDateSchema, GenderSchema } from './common.js';

/** 10-dimensional vector (0-100) from blueprint §6 */
export const PersonalityStateSchema = z.object({
  openness: z.number().min(0).max(100),
  conscientiousness: z.number().min(0).max(100),
  extraversion: z.number().min(0).max(100),
  agreeableness: z.number().min(0).max(100),
  neuroticism: z.number().min(0).max(100),
  ambition: z.number().min(0).max(100),
  risk_tolerance: z.number().min(0).max(100),
  empathy: z.number().min(0).max(100),
  discipline: z.number().min(0).max(100),
  curiosity: z.number().min(0).max(100),
});
export type PersonalityState = z.infer<typeof PersonalityStateSchema>;
export type PersonalityAxis = keyof PersonalityState;

export const RelationshipTypeSchema = z.enum([
  'parent',
  'sibling',
  'friend',
  'partner',
  'spouse',
  'child',
  'coworker',
  'teacher',
  'neighbor',
  'rival',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

/** 5-dimensional relationship vector (0-100) from blueprint §7 */
export const RelationshipStateSchema = z.object({
  npcId: z.string().min(1),
  closeness: z.number().min(0).max(100),
  trust: z.number().min(0).max(100),
  respect: z.number().min(0).max(100),
  conflict: z.number().min(0).max(100),
  dependence: z.number().min(0).max(100),
  interactionFrequency: z.number().min(0).max(100),
  relationshipType: RelationshipTypeSchema,
  importantMemories: z.array(z.string()).default([]),
  tier: z.number().int().min(1).max(4).default(2), // Tier 1-4 from §44
});
export type RelationshipState = z.infer<typeof RelationshipStateSchema>;

export const MemoryTypeSchema = z.enum([
  'family',
  'childhood',
  'school',
  'friendship',
  'romance',
  'career',
  'tragedy',
  'achievement',
  'milestone',
  'regret',
  'misc',
]);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

/** Memory object from blueprint §8 */
export const MemorySchema = z.object({
  id: z.string().min(1),
  timestamp: GameDateSchema,
  age: z.number().min(0),
  type: MemoryTypeSchema,
  participants: z.array(z.string()).default([]),
  emotionalWeight: z.number().min(-100).max(100),
  importance: z.number().min(1).max(100),
  tags: z.array(z.string()).default([]),
  sourceEventId: z.string().min(1),
  description: z.string().optional(),
});
export type Memory = z.infer<typeof MemorySchema>;

/** Secret internal states from blueprint §27 */
export const SecretStateSchema = z.object({
  loneliness: z.number().min(0).max(100).default(0),
  regret: z.number().min(0).max(100).default(0),
  burnout: z.number().min(0).max(100).default(0),
  social_pressure: z.number().min(0).max(100).default(0),
  self_worth: z.number().min(0).max(100).default(50),
  attachment: z.number().min(0).max(100).default(50),
  family_responsibility: z.number().min(0).max(100).default(50),
});
export type SecretState = z.infer<typeof SecretStateSchema>;

export const FamilyRoleSchema = z.enum([
  'father',
  'mother',
  'older_brother',
  'older_sister',
  'younger_brother',
  'younger_sister',
  'spouse',
  'partner',
  'son',
  'daughter',
]);
export type FamilyRole = z.infer<typeof FamilyRoleSchema>;

export const FamilyMemberSchema = z.object({
  npcId: z.string().min(1),
  name: z.string().min(1),
  role: FamilyRoleSchema,
  age: z.number().min(0),
  isAlive: z.boolean().default(true),
  personality: PersonalityStateSchema.partial().optional(),
});
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

export const EducationLevelSchema = z.enum([
  'none',
  'primary',
  'middle_school',
  'high_school',
  'vocational',
  'bachelor',
  'master',
  'doctorate',
]);
export type EducationLevel = z.infer<typeof EducationLevelSchema>;

export const EducationStateSchema = z.object({
  level: EducationLevelSchema.default('none'),
  institution: z.string().optional(),
  major: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  completed: z.boolean().default(false),
  yearsEnrolled: z.number().min(0).default(0),
});
export type EducationState = z.infer<typeof EducationStateSchema>;

export const CareerStateSchema = z.object({
  currentJobId: z.string().nullable().default(null),
  jobTitle: z.string().nullable().default(null),
  companyName: z.string().nullable().default(null),
  salary: z.number().min(0).default(0),
  jobPerformance: z.number().min(0).max(100).default(50),
  yearsAtCompany: z.number().min(0).default(0),
  totalCareerYears: z.number().min(0).default(0),
  history: z.array(z.object({
    jobId: z.string(),
    title: z.string(),
    company: z.string(),
    fromAge: z.number(),
    toAge: z.number(),
  })).default([]),
});
export type CareerState = z.infer<typeof CareerStateSchema>;

export const TraitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['innate', 'acquired', 'social', 'trauma', 'physical']).default('acquired'),
  isPermanent: z.boolean().default(true),
  durationMonths: z.number().optional(),
});
export type Trait = z.infer<typeof TraitSchema>;

export const StatusEffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  value: z.number().default(0),
  durationMonths: z.number().min(1),
  remainingMonths: z.number().min(0),
  provenance: z.object({
    sourceEventId: z.string(),
    sourceChoiceId: z.string(),
    atAge: z.number(),
  }).optional(),
});
export type StatusEffect = z.infer<typeof StatusEffectSchema>;

export const GoalSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  completed: z.boolean().default(false),
  targetAge: z.number().optional(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const ReputationStateSchema = z.object({
  fame: z.number().min(0).max(100).default(0),
  integrity: z.number().min(0).max(100).default(50),
  communityTrust: z.number().min(0).max(100).default(50),
});
export type ReputationState = z.infer<typeof ReputationStateSchema>;

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  acquiredAge: z.number().min(0),
  value: z.number().min(0).default(0),
  tag: z.string().optional(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const LifeStatisticsSchema = z.object({
  totalChoicesMade: z.number().min(0).default(0),
  careersChanged: z.number().min(0).default(0),
  timesMarried: z.number().min(0).default(0),
  totalChildren: z.number().min(0).default(0),
  peakWealth: z.number().default(0),
  lowestWealth: z.number().default(0),
  majorSuccesses: z.number().min(0).default(0),
  majorTraumas: z.number().min(0).default(0),
  placesLived: z.array(z.string()).default([]),
  keyAchievements: z.array(z.string()).default([]),
  epitaphTitle: z.string().optional(),
});
export type LifeStatistics = z.infer<typeof LifeStatisticsSchema>;

export const SocioeconomicTierSchema = z.enum([
  'Very Poor',
  'Poor',
  'Lower Middle',
  'Middle',
  'Upper Middle',
  'Rich',
  'Very Rich',
]);
export type SocioeconomicTier = z.infer<typeof SocioeconomicTierSchema>;

export const FamilyBackgroundSchema = z.object({
  family_income: z.number().min(0).max(100),
  housing_quality: z.number().min(0).max(100),
  parent_education: z.number().min(0).max(100),
  family_size: z.number().min(1).max(10),
  financial_stability: z.number().min(0).max(100),
  social_capital: z.number().min(0).max(100),
  tier: SocioeconomicTierSchema,
});
export type FamilyBackground = z.infer<typeof FamilyBackgroundSchema>;

/** Master CharacterState schema from blueprint §5 */
export const CharacterStateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  age: z.number().int().min(0),
  ageMonths: z.number().int().min(0).max(11).default(0),
  gender: GenderSchema,
  locationId: z.string().min(1),
  isAlive: z.boolean().default(true),
  causeOfDeath: z.string().optional(),

  // Primary stats (0-100)
  money: z.number().default(0),
  health: z.number().min(0).max(100).default(100),
  happiness: z.number().min(0).max(100).default(70),
  stress: z.number().min(0).max(100).default(10),
  lifeExpectancyFactor: z.number().default(1.0),

  // Systems
  personality: PersonalityStateSchema,
  relationships: z.array(RelationshipStateSchema).default([]),
  family: z.array(FamilyMemberSchema).default([]),
  familyBackground: FamilyBackgroundSchema,
  memories: z.array(MemorySchema).default([]),
  traits: z.array(TraitSchema).default([]),
  skills: z.record(z.string(), z.number()).default({}),
  education: EducationStateSchema.default({}),
  career: CareerStateSchema.default({}),
  goals: z.array(GoalSchema).default([]),
  reputation: ReputationStateSchema.default({}),
  inventory: z.array(InventoryItemSchema).default([]),
  statusEffects: z.array(StatusEffectSchema).default([]),
  statistics: LifeStatisticsSchema.default({}),
  secretState: SecretStateSchema.default({}),

  // Meta
  schemaVersion: z.literal(1).default(1),
});
export type CharacterState = z.infer<typeof CharacterStateSchema>;
