import {
  FamilyBackground,
  FamilyMember,
  RelationshipState,
  SocioeconomicTier,
} from '@life/schema';
import { RNG } from '../core/rng.js';

export interface GeneratedFamily {
  familyBackground: FamilyBackground;
  members: FamilyMember[];
  relationships: RelationshipState[];
}

export class FamilySystem {
  public static generateFamily(rng: RNG, initialAge: number = 0): GeneratedFamily {
    const familyRng = rng.fork('family');

    // 1. Generate 6 socioeconomic variables (§4.3)
    const family_income = familyRng.nextInt(10, 95);
    const housing_quality = familyRng.nextInt(10, 95);
    const parent_education = familyRng.nextInt(10, 95);
    const family_size = familyRng.nextInt(2, 6);
    const financial_stability = familyRng.nextInt(10, 95);
    const social_capital = familyRng.nextInt(10, 95);

    // Composite score
    const avgScore =
      (family_income + housing_quality + parent_education + financial_stability + social_capital) / 5;

    let tier: SocioeconomicTier = 'Middle';
    if (avgScore < 20) tier = 'Very Poor';
    else if (avgScore < 35) tier = 'Poor';
    else if (avgScore < 50) tier = 'Lower Middle';
    else if (avgScore < 65) tier = 'Middle';
    else if (avgScore < 80) tier = 'Upper Middle';
    else if (avgScore < 90) tier = 'Rich';
    else tier = 'Very Rich';

    const background: FamilyBackground = {
      family_income,
      housing_quality,
      parent_education,
      family_size,
      financial_stability,
      social_capital,
      tier,
    };

    // 2. Generate Parents with strict biological invariants (§E11)
    // Mother was between 18 and 42 when giving birth to player
    const motherAgeAtBirth = familyRng.nextInt(20, 38);
    const motherCurrentAge = motherAgeAtBirth + initialAge;

    // Father age is typically mother age ± 5
    const fatherAgeAtBirth = motherAgeAtBirth + familyRng.nextInt(-2, 6);
    const fatherCurrentAge = fatherAgeAtBirth + initialAge;

    const members: FamilyMember[] = [
      {
        npcId: 'npc_father_0',
        name: 'Father',
        role: 'father',
        age: fatherCurrentAge,
        isAlive: true,
      },
      {
        npcId: 'npc_mother_0',
        name: 'Mother',
        role: 'mother',
        age: motherCurrentAge,
        isAlive: true,
      },
    ];

    const relationships: RelationshipState[] = [
      {
        npcId: 'npc_father_0',
        closeness: familyRng.nextInt(50, 90),
        trust: familyRng.nextInt(60, 95),
        respect: familyRng.nextInt(60, 90),
        conflict: familyRng.nextInt(0, 20),
        dependence: 80,
        interactionFrequency: 90,
        relationshipType: 'parent',
        importantMemories: [],
        tier: 1,
      },
      {
        npcId: 'npc_mother_0',
        closeness: familyRng.nextInt(60, 95),
        trust: familyRng.nextInt(70, 98),
        respect: familyRng.nextInt(60, 90),
        conflict: familyRng.nextInt(0, 20),
        dependence: 85,
        interactionFrequency: 95,
        relationshipType: 'parent',
        importantMemories: [],
        tier: 1,
      },
    ];

    // 3. Generate Siblings based on family_size
    const siblingCount = Math.max(0, family_size - 2);
    for (let i = 0; i < siblingCount; i++) {
      const isOlder = familyRng.chance(0.5);
      let sibAge: number;

      if (isOlder) {
        // Older sibling: born before player, but after mother was 18
        const maxGap = Math.min(8, motherAgeAtBirth - 18);
        const gap = familyRng.nextInt(1, Math.max(1, maxGap));
        sibAge = initialAge + gap;
      } else {
        // Younger sibling: cannot be older than player
        const gap = familyRng.nextInt(1, 6);
        sibAge = Math.max(0, initialAge - gap);
      }

      const isBrother = familyRng.chance(0.5);
      const role = isOlder
        ? isBrother ? 'older_brother' : 'older_sister'
        : isBrother ? 'younger_brother' : 'younger_sister';

      const sibId = `npc_sibling_${i}`;
      members.push({
        npcId: sibId,
        name: `${role.replace('_', ' ')} ${i + 1}`,
        role,
        age: sibAge,
        isAlive: true,
      });

      relationships.push({
        npcId: sibId,
        closeness: familyRng.nextInt(40, 80),
        trust: familyRng.nextInt(50, 80),
        respect: familyRng.nextInt(40, 75),
        conflict: familyRng.nextInt(10, 40),
        dependence: isOlder ? 40 : 20,
        interactionFrequency: 80,
        relationshipType: 'sibling',
        importantMemories: [],
        tier: 1,
      });
    }

    return {
      familyBackground: background,
      members,
      relationships,
    };
  }
}
