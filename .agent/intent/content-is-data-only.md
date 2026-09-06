---
schema_version: 1
id: content-is-data-only
title: packages/content must not import any code package
scope:
  - "packages/content/**"
anchors: []
check: deterministic
rule: |
  packages/content is a pure data layer: JSON files for events, careers, traits,
  NPCs, locations, and localizations. It must not import from packages/engine,
  packages/schema, apps/*, or any other code package.
  TypeScript files inside packages/content are only allowed for type-checking
  the JSON at build time (e.g. a validate script) — they must not export
  runtime logic.
deterministic:
  kind: no-import
  from:
    - "packages/content/**/*.ts"
  to:
    - "packages/engine/**"
    - "apps/**"
severity: error
status: active
owner: team
created: 2026-09-06
---

## Context

L2 of ROADMAP.md states: "Content is data, not code. A designer adds an event
by writing a JSON file — they never open a .ts file."

If content imports engine code:
- Circular dependency: engine → (loader) → content → engine.
- Designers can no longer add/edit events without understanding TypeScript.
- The validator CLI cannot independently load content for checking without
  instantiating the full engine.

The only TypeScript allowed in packages/content is a thin `validate.ts` script
that imports `packages/schema` (zod shapes) to type-check the JSON files at
build time. It must not be importable by the engine at runtime.

## Exceptions

`packages/content/validate.ts` may import `packages/schema` for build-time
type checking only. It must not be re-exported from `packages/content/index.*`.
