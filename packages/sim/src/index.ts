import fs from 'node:fs';
import path from 'node:path';
import {
  CharacterState,
  EventDefinition,
} from '@life/schema';
import {
  EventDatabase,
  FamilySystem,
  GameEngine,
  RNG,
} from '@life/engine';

export interface SimConfig {
  lives: number;
  seed: number;
  maxTurnsPerLife?: number;
  monthsPerTurn?: number;
}

export interface SimReport {
  totalLives: number;
  avgLifespan: number;
  avgPeakWealth: number;
  avgHappiness: number;
  childhoodDeathRate: number;
  billionaireRate: number;
  careersDistribution: Record<string, number>;
  mostSeenEvents: [string, number][];
  deadEvents: string[];
  assertionsPassed: boolean;
  violations: string[];
}

function createSampleEventDatabase(): EventDatabase {
  const db = new EventDatabase();
  const sampleEvents: EventDefinition[] = [
    {
      id: 'evt_sim_childhood_play',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'FAMILY',
      importance: 20,
      decisionType: 'INSTANT',
      title: 'Playing in the Garden',
      description: 'You spend the afternoon exploring outdoors.',
      conditions: [{ type: 'age', min: 0, max: 10 }],
      weight: 100,
      choices: [
        {
          id: 'catch_bugs',
          text: 'Catch bugs and study nature',
          effects: [{ type: 'SKILL_CHANGE', target: 'creativity', value: 2 }],
        },
        {
          id: 'run_around',
          text: 'Run around with the family dog',
          effects: [{ type: 'STAT_CHANGE', field: 'health', value: 2 }],
        },
      ],
      cooldownMonths: 6,
      tags: ['childhood'],
      maxChainDepth: 5,
      repeatable: true,
      isWowMoment: false,
    },
    {
      id: 'evt_sim_school_exam',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'SCHOOL',
      importance: 40,
      decisionType: 'STRATEGIC',
      title: 'Midterm Examinations',
      description: 'The school exams are next week.',
      conditions: [{ type: 'age', min: 11, max: 18 }],
      weight: 120,
      choices: [
        {
          id: 'study_hard',
          text: 'Study every evening',
          effects: [
            { type: 'SKILL_CHANGE', target: 'logic', value: 5 },
            { type: 'STAT_CHANGE', field: 'stress', value: 10 },
          ],
        },
        {
          id: 'relax_play',
          text: 'Hang out with friends instead',
          effects: [
            { type: 'STAT_CHANGE', field: 'happiness', value: 5 },
            { type: 'STAT_CHANGE', field: 'stress', value: -5 },
          ],
        },
      ],
      cooldownMonths: 12,
      tags: ['school'],
      maxChainDepth: 5,
      repeatable: true,
      isWowMoment: false,
    },
    {
      id: 'evt_sim_job_hunt',
      schemaVersion: 1,
      contentVersion: 1,
      category: 'CAREER',
      importance: 60,
      decisionType: 'STRATEGIC',
      title: 'Applying for Employment',
      description: 'You begin looking for work opportunities in the city.',
      conditions: [{ type: 'age', min: 18, max: 30 }, { type: 'career', hasJob: false }],
      weight: 150,
      choices: [
        {
          id: 'apply_tech',
          text: 'Apply for entry-level tech position',
          effects: [
            {
              type: 'CAREER_CHANGE',
              target: 'career_software_engineer',
              field: 'Junior Software Engineer',
              value: 2000,
            },
          ],
        },
        {
          id: 'apply_retail',
          text: 'Take a position in retail commerce',
          effects: [
            {
              type: 'CAREER_CHANGE',
              target: 'career_retail_worker',
              field: 'Retail Associate',
              value: 600,
            },
          ],
        },
      ],
      cooldownMonths: 12,
      tags: ['career'],
      maxChainDepth: 5,
      repeatable: false,
      isWowMoment: false,
    },
  ];

  db.loadBulk(sampleEvents);
  return db;
}

export function runSimulation(config: SimConfig, customDb?: EventDatabase): SimReport {
  const db = customDb ?? createSampleEventDatabase();
  const masterRng = new RNG(config.seed);

  let totalAgeAtDeath = 0;
  let totalPeakWealth = 0;
  let totalHappiness = 0;
  let childhoodDeaths = 0;
  let billionaires = 0;

  const careerCounts: Record<string, number> = {};
  const eventSeenCounts: Record<string, number> = {};
  const violations: string[] = [];

  const maxTurns = config.maxTurnsPerLife ?? 150;
  const monthsPerTurn = config.monthsPerTurn ?? 6;

  for (let lifeIdx = 0; lifeIdx < config.lives; lifeIdx++) {
    const lifeSeed = masterRng.nextInt(1, 10000000);
    const lifeRng = new RNG(lifeSeed);
    const fam = FamilySystem.generateFamily(lifeRng, 0);

    const initialCharacter: CharacterState = {
      id: `sim_char_${lifeIdx}`,
      name: `Sim Citizen ${lifeIdx}`,
      age: 0,
      ageMonths: 0,
      gender: lifeRng.chance(0.5) ? 'female' : 'male',
      locationId: 'sim_city',
      isAlive: true,
      money: 0,
      health: 95,
      happiness: 75,
      stress: 5,
      lifeExpectancyFactor: 1.0,
      personality: {
        openness: lifeRng.nextInt(30, 80),
        conscientiousness: lifeRng.nextInt(30, 80),
        extraversion: lifeRng.nextInt(30, 80),
        agreeableness: lifeRng.nextInt(30, 80),
        neuroticism: lifeRng.nextInt(20, 60),
        ambition: lifeRng.nextInt(30, 80),
        risk_tolerance: lifeRng.nextInt(30, 80),
        empathy: lifeRng.nextInt(30, 80),
        discipline: lifeRng.nextInt(30, 80),
        curiosity: lifeRng.nextInt(30, 80),
      },
      relationships: fam.relationships,
      family: fam.members,
      familyBackground: fam.familyBackground,
      memories: [],
      traits: [],
      skills: { logic: 20, social: 20, creativity: 20 },
      education: { level: 'none', completed: false, yearsEnrolled: 0 },
      career: {
        currentJobId: null,
        jobTitle: null,
        companyName: null,
        salary: 0,
        jobPerformance: 50,
        yearsAtCompany: 0,
        totalCareerYears: 0,
        history: [],
      },
      goals: [],
      reputation: { fame: 0, integrity: 50, communityTrust: 50 },
      inventory: [],
      statusEffects: [],
      statistics: {
        totalChoicesMade: 0,
        careersChanged: 0,
        timesMarried: 0,
        totalChildren: 0,
        peakWealth: 0,
        lowestWealth: 0,
        majorSuccesses: 0,
        majorTraumas: 0,
        placesLived: [],
        keyAchievements: [],
      },
      secretState: {
        loneliness: 0,
        regret: 0,
        burnout: 0,
        social_pressure: 0,
        self_worth: 50,
        attachment: 50,
        family_responsibility: 50,
      },
      schemaVersion: 1,
      idCounter: 0,
    };

    const engine = new GameEngine(initialCharacter, db, lifeSeed);

    for (let turn = 0; turn < maxTurns; turn++) {
      const event = engine.nextTurn(monthsPerTurn);
      eventSeenCounts[event.id] = (eventSeenCounts[event.id] ?? 0) + 1;

      // Bot picks a choice according to personality / random
      const choice = lifeRng.pick(event.choices) ?? event.choices[0]!;
      const outcome = engine.makeChoice(choice.id);

      if (outcome.isGameOver) break;
    }

    const finalChar = engine.getCharacter();
    totalAgeAtDeath += finalChar.age;
    totalPeakWealth += finalChar.statistics.peakWealth;
    totalHappiness += finalChar.happiness;

    if (finalChar.age < 20 && finalChar.health <= 0) {
      childhoodDeaths++;
    }

    if (finalChar.statistics.peakWealth >= 1000000000) {
      billionaires++;
    }

    if (finalChar.career.currentJobId) {
      careerCounts[finalChar.career.currentJobId] =
        (careerCounts[finalChar.career.currentJobId] ?? 0) + 1;
    }

    // Sanity invariant checks (§88)
    if (finalChar.health < 0 || finalChar.health > 100) {
      violations.push(`Life ${lifeIdx}: Invalid health value: ${finalChar.health}`);
    }
    if (finalChar.happiness < 0 || finalChar.happiness > 100) {
      violations.push(`Life ${lifeIdx}: Invalid happiness value: ${finalChar.happiness}`);
    }
    if (finalChar.age < 0 || finalChar.age > 120) {
      violations.push(`Life ${lifeIdx}: Impossible age reached: ${finalChar.age}`);
    }
  }

  const avgLifespan = totalAgeAtDeath / config.lives;
  const avgPeakWealth = totalPeakWealth / config.lives;
  const avgHappiness = totalHappiness / config.lives;
  const childhoodDeathRate = childhoodDeaths / config.lives;
  const billionaireRate = billionaires / config.lives;

  // Check sanity assertions from blueprint §88 & E16
  if (childhoodDeathRate > 0.05) {
    violations.push(`Childhood death rate too high: ${(childhoodDeathRate * 100).toFixed(1)}% (max 5%)`);
  }
  if (billionaireRate > 0.02) {
    violations.push(`Billionaire rate inflated: ${(billionaireRate * 100).toFixed(1)}% (max 2%)`);
  }

  const sortedEvents = Object.entries(eventSeenCounts).sort((a, b) => b[1] - a[1]);
  const deadEvents = db.getAll().map((e) => e.id).filter((id) => !eventSeenCounts[id]);

  return {
    totalLives: config.lives,
    avgLifespan: Math.round(avgLifespan * 10) / 10,
    avgPeakWealth: Math.round(avgPeakWealth),
    avgHappiness: Math.round(avgHappiness),
    childhoodDeathRate,
    billionaireRate,
    careersDistribution: careerCounts,
    mostSeenEvents: sortedEvents.slice(0, 10),
    deadEvents,
    assertionsPassed: violations.length === 0,
    violations,
  };
}

function runCLI() {
  const lives = process.argv.includes('--lives')
    ? parseInt(process.argv[process.argv.indexOf('--lives') + 1] ?? '1000', 10)
    : 1000;
  const seed = process.argv.includes('--seed')
    ? parseInt(process.argv[process.argv.indexOf('--seed') + 1] ?? '42', 10)
    : 42;

  console.log(`\n🎲 Running Headless Monte Carlo Simulation: ${lives} lives (seed: ${seed})...`);

  const start = performance.now();
  const report = runSimulation({ lives, seed });
  const duration = ((performance.now() - start) / 1000).toFixed(2);

  console.log(`\n⏱️ Completed in ${duration}s.`);
  console.log(`- Average Lifespan: ${report.avgLifespan} years`);
  console.log(`- Average Peak Wealth: $${report.avgPeakWealth}`);
  console.log(`- Average Happiness: ${report.avgHappiness}/100`);
  console.log(`- Childhood Mortality Rate: ${(report.childhoodDeathRate * 100).toFixed(2)}%`);
  console.log(`- Billionaire Rate: ${(report.billionaireRate * 100).toFixed(2)}%`);
  console.log(`- Dead Content Events: ${report.deadEvents.length}`);

  // Write BALANCE.md automatically (§90)
  const balanceContent = `# LIFE — AUTOMATED BALANCE REPORT

Generated: ${new Date().toISOString()}
Lives Simulated: ${report.totalLives} | Seed: ${seed} | Time: ${duration}s

## Sanity Metrics (§88, §90)
- **Average Lifespan**: ${report.avgLifespan} years
- **Average Peak Wealth**: $${report.avgPeakWealth}
- **Average Happiness**: ${report.avgHappiness} / 100
- **Childhood Mortality (<20 yo)**: ${(report.childhoodDeathRate * 100).toFixed(2)}% (Target: < 5%)
- **Billionaire Rate**: ${(report.billionaireRate * 100).toFixed(2)}% (Target: < 2%)
- **Sanity Assertions**: ${report.assertionsPassed ? '✅ ALL PASSED' : '❌ FAILED'}

## Violations
${report.violations.length === 0 ? 'None. All biological and economic invariants hold.' : report.violations.map((v) => `- ${v}`).join('\n')}

## Career Distribution
${Object.entries(report.careersDistribution).map(([c, count]) => `- **${c}**: ${count} (${((count / report.totalLives) * 100).toFixed(1)}%)`).join('\n')}

## Top 10 Most Frequent Events
${report.mostSeenEvents.map(([evt, count]) => `- **${evt}**: ${count} times`).join('\n')}
`;

  function findRepoRoot(startDir: string): string {
    let cur = startDir;
    while (cur !== path.dirname(cur)) {
      if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) {
        return cur;
      }
      cur = path.dirname(cur);
    }
    return startDir;
  }

  const root = findRepoRoot(process.cwd());
  const balanceFile = path.resolve(root, 'docs/BALANCE.md');
  fs.writeFileSync(balanceFile, balanceContent, 'utf-8');
  console.log(`\n📊 Balance report updated at: ${balanceFile}`);

  if (!report.assertionsPassed) {
    console.error('\n❌ Sanity violations detected:');
    for (const v of report.violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log('\n✅ ALL SANITY ASSERTIONS PASSED!\n');
}

if (process.argv[1]?.includes('dist') || process.argv[1]?.includes('sim')) {
  runCLI();
}
