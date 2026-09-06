import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EventDefinition, EventDefinitionSchema } from '@life/schema';

export interface ValidationSummary {
  errors: string[];
  warnings: string[];
  totalValidated: number;
}

export interface LoadResult {
  events: EventDefinition[];
  summary: ValidationSummary;
}

/**
 * Scans a content directory for event JSON files, validates each against
 * EventDefinitionSchema plus the structural checks from blueprint §89, and
 * returns both the successfully-parsed events and the validation summary.
 * This is the single source of truth for reading event content — both the
 * validator CLI and the sim runner (E16) load through this function, so
 * neither can silently diverge from what content actually exists on disk.
 */
export function loadEventsFromDirectory(dirPath: string): LoadResult {
  const summary: ValidationSummary = {
    errors: [],
    warnings: [],
    totalValidated: 0,
  };
  const events: EventDefinition[] = [];

  if (!fs.existsSync(dirPath)) {
    summary.warnings.push(`Content directory not found: ${dirPath}`);
    return { events, summary };
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
              continue; // don't let a duplicate silently overwrite the first definition
            }
            seenIds.add(evt.id);

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

            events.push(evt);
          }
        } catch (err) {
          summary.errors.push(`[${entry.name}] Failed to parse JSON: ${String(err)}`);
        }
      }
    }
  }

  scanDir(dirPath);
  return { events, summary };
}

export function validateEventsDirectory(dirPath: string): ValidationSummary {
  return loadEventsFromDirectory(dirPath).summary;
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

// Only run the CLI when this file is the actual entrypoint (`node dist/index.js`),
// never when another package imports loadEventsFromDirectory/validateEventsDirectory
// as a library. A substring check on argv[1] (e.g. ".../dist") is not enough —
// any consumer whose own entrypoint also lives under a "dist" folder would
// accidentally trigger this CLI (and its process.exit(1) on content errors)
// as a side effect of importing this module. See @life/sim for that consumer.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCLI();
}
