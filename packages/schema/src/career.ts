import { z } from 'zod';
import { EducationLevelSchema } from './character.js';

export const SkillRequirementSchema = z.object({
  skill: z.string(),
  minValue: z.number().min(0).max(100),
});
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

export const CareerSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  category: z.string().default('general'),
  requiredEducation: EducationLevelSchema.default('none'),
  requiredSkills: z.array(SkillRequirementSchema).default([]),
  salaryRange: z.tuple([z.number().min(0), z.number().min(0)]),
  stress: z.number().min(0).max(100), // §17
  prestige: z.number().min(0).max(100), // §17
  stability: z.number().min(0).max(100), // §17
  socialExposure: z.number().min(0).max(100), // §17
  promotions: z.array(z.string()).default([]),
});
export type Career = z.infer<typeof CareerSchema>;
