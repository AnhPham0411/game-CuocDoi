---
schema_version: 1
id: engine-no-react
title: packages/engine must not import React or browser-only APIs
scope:
  - "packages/engine/**"
anchors: []
check: deterministic
rule: |
  The engine package is a pure, headless simulation layer (L1 of ROADMAP.md).
  It must never import React, ReactDOM, or any browser-only module.
  All logic in packages/engine must be runnable in Node (for headless sim) and
  in a browser (for the UI) without bundler shims.
deterministic:
  kind: no-import
  from:
    - "packages/engine/**"
  to:
    - "**/react"
    - "**/react-dom"
    - "**/react/**"
severity: error
status: active
owner: team
created: 2026-09-06
---

## Context

The engine's determinism contract (L1) requires it to run identically in Node.js
(`pnpm sim --lives 100000`) and in the browser UI. Importing React would:

1. Couple the engine to a renderer, making headless simulation impossible.
2. Break the causal graph test (`pnpm sim`) and golden replay tests.
3. Force the validator CLI to bundle React, inflating it from ~1 MB to ~50 MB.

This is the single most important architectural boundary in the project.

## Exceptions

None. Engine code that needs UI feedback must emit events/state — the UI layer
in `apps/game` reads that state. Data flows one way: engine → UI.
