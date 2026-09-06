---
schema_version: 1
id: ui-engine-public-api-only
title: apps/game must only import engine through packages/engine/index.ts
scope:
  - "apps/game/**"
anchors: []
check: deterministic
rule: |
  The UI layer (apps/game) must import from "packages/engine" (the public barrel)
  only. It must not import from internal sub-paths such as
  packages/engine/core/*, packages/engine/simulation/*, or
  packages/engine/narrative/*.
deterministic:
  kind: no-import
  from:
    - "apps/game/**"
  to:
    - "packages/engine/core/**"
    - "packages/engine/simulation/**"
    - "packages/engine/narrative/**"
severity: error
status: active
owner: team
created: 2026-09-06
---

## Context

The engine's internal folder structure is implementation detail that changes
frequently as systems are refactored. Allowing `apps/game` to import internals
directly means:

- Any engine refactor breaks the UI build, even if the public API is unchanged.
- The engine team loses the ability to freely reorganise internals.
- It becomes impossible to mock the engine in UI tests — you can only mock a
  clean `index.ts` boundary.

Correct: `import { step, createCharacter } from "packages/engine"`
Wrong:   `import { applyEffects } from "packages/engine/simulation/character"`

## Exceptions

`apps/devtools` may import engine internals **only for debug inspection** and
only if each such import is marked with a `// devtools-only` comment on the
same line. The devtools app is never included in the production Tauri build.
