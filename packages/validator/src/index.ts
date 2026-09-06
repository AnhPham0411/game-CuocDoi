import fs from 'node:fs';
import path from 'node:path';
import { EventDefinitionSchema } from '@life/schema';

export interface ValidationSummary {
  errors: string[];
  warnings: string[];
  totalValidated: number;
}

export function validateEventsDirectory(dirPath: string): ValidationSummary {
  const summary: ValidationSummary = {
    errors: [],
    warnings: [],
    totalValidated: 0,
  };

  if (!fs.existsSync(dirPath)) {
    summary.warnings.push(`Content directory not found: ${dirPath}`);
    return summary;
  }

  const seenIds = new Set<string>();

  function scanDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const raw = JSON.parse(content);
          const rawArray = Array.isArray(raw) ? raw : [raw];

          for (const item of rawArray) {
            summary.totalValidated++;
            const parsed = EventDefinitionSchema.safeParse(item);

            if (!parsed.success) {
              summary.errors.push(
                `[${entry.name}] Schema validation error: ${parsed.error.message}`
              );
              continue;
            }

            const evt = parsed.data;

            // 1. Duplicate ID check (§89)
            if (seenIds.has(evt.id)) {
              summary.errors.push(`Duplicate event ID: ${evt.id} in ${entry.name}`);
            } else {
              seenIds.add(evt.id);
            }

            // 2. Age range validity check (§89)
            for (const cond of evt.conditions) {
              if (cond.type === 'age') {
                if (cond.min !== undefined && cond.max !== undefined && cond.min > cond.max) {
                  summary.errors.push(
                    `Event ${evt.id}: minAge (${cond.min}) cannot be greater than maxAge (${cond.max})`
                  );
                }
              }
            }

            // 3. Follow up circular check (§89)
            for (const choice of evt.choices) {
              if (choice.followUpEventId === evt.id) {
                summary.errors.push(`Event ${evt.id}: Choice ${choice.id} references self in followUpEventId`);
              }
            }
          }
        } catch (err) {
          summary.errors.push(`[${entry.name}] Failed to parse JSON: ${String(err)}`);
        }
      }
    }
  }

  scanDir(dirPath);
  return summary;
}

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

function runCLI() {
  const root = findRepoRoot(process.cwd());
  const contentDir = path.resolve(root, 'packages/content/events');
  console.log(`\n🔍 Validating content in: ${contentDir}`);

  const start = performance.now();
  const summary = validateEventsDirectory(contentDir);
  const duration = (performance.now() - start).toFixed(2);

  console.log(`⏱️ Completed in ${duration}ms across ${summary.totalValidated} event(s).`);

  if (summary.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    for (const w of summary.warnings) {
      console.log(`  - ${w}`);
    }
  }

  if (summary.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const e of summary.errors) {
      console.log(`  - ${e}`);
    }
    console.log(`\nResult: FAIL (Errors: ${summary.errors.length}, Warnings: ${summary.warnings.length})\n`);
    process.exit(1);
  }

  console.log(`\n✅ Result: PASS (Errors: 0, Warnings: ${summary.warnings.length})\n`);
}

if (process.argv[1]?.includes('dist') || process.argv[1]?.includes('validator')) {
  runCLI();
}
