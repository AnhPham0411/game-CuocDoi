---
schema_version: 1
id: engine-no-fs
title: packages/engine must not import Node fs or path
scope:
  - "packages/engine/**"
anchors: []
check: deterministic
rule: |
  The engine package must not import Node built-ins: fs, path, os, child_process,
  net, http, https, stream, or crypto. I/O is the caller's responsibility.
  Content (events, careers, traits) is injected via a loader interface, not
  read directly from disk inside the engine.
deterministic:
  kind: no-import
  from:
    - "packages/engine/**"
  to:
    - "node:fs"
    - "node:path"
    - "node:os"
    - "node:child_process"
    - "fs"
    - "path"
severity: error
status: active
owner: team
created: 2026-09-06
---

## Context

The engine must run in both Node (headless sim) and the browser (Tauri shell)
without a bundler polyfill for Node built-ins.

If the engine reads files directly:
- The browser build breaks (no `fs` in browser context).
- The headless sim becomes entangled with the file system layout, making it
  impossible to inject synthetic content for testing.

The correct pattern is: `packages/sim` and `apps/game` both call
`EventDatabase.load(rawJson[])` — they own the I/O, the engine owns the logic.

## Exceptions

None. Test helpers in `tests/**` may use `fs` to load fixtures, but they must
not import engine internals that pull in `fs`.
