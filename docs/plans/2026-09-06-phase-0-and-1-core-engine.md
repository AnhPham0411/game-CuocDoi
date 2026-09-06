# Triển Khai LIFE — Phase 0 (Pre-Production) & Phase 1 (Engine Core Headless)

Dự án **LIFE** là game mô phỏng cuộc đời theo lựa chọn, hệ quả và ký ức theo chuẩn Production Blueprint ([tailieu.md](file:///e:/projects/game-cuocdoi/tailieu.md)) và lộ trình sản xuất ([docs/ROADMAP.md](file:///e:/projects/game-cuocdoi/docs/ROADMAP.md)).

Kế hoạch này tập trung vào việc hiện thực hóa toàn bộ nền tảng kỹ thuật cốt lõi từ **Phase 0** đến **Phase 1** (vượt qua cổng **Gate G0** và **Gate G1 - Milestone §99 của blueprint**), đảm bảo engine có tính xác định tuyệt đối (*deterministic*), độc lập không phụ thuộc UI/I/O, có công cụ xác thực content tự động và mô phỏng 100.000 cuộc đời (*headless Monte Carlo sim*) để kiểm soát cân bằng trước khi bước vào Phase 2 (Content) & Phase 3 (React UI Vertical Slice).

---

## User Review Required

> [!IMPORTANT]
> **Tuân thủ 4 Luật Cốt Lõi (L1 - L4) & Ranh Giới Kiến Trúc:**
> 1. **L1 — Engine Deterministic**: `packages/engine` là hàm thuần `nextState = step(prevState, choiceId)`. Tuyệt đối không dùng `Math.random()`, `Date.now()`, hay I/O. Tất cả ngẫu nhiên đi qua PRNG seedable (`splitmix32`/`xorshift128+`).
> 2. **L2 — Content is Data**: Content (events, careers, traits) lưu dưới dạng JSON trong `packages/content`. Engine chỉ cung cấp condition/effect primitives.
> 3. **L3 — Closed Primitives with Schema Versioning**: Effect và Condition primitives là API đóng, có zod schema quản lý chặt chẽ.
> 4. **L4 — Provenance Tracking**: Mọi thay đổi trạng thái đều mang thông tin nguồn `{ sourceEventId, sourceChoiceId, atAge }` phục vụ Causal Graph (§91, §92).
> 5. **AnhCompass Enforcement**: Pre-commit hook và CI chặn đứng bất kỳ vi phạm ranh giới import nào giữa `engine`, `apps/game`, và `content`.

> [!NOTE]
> **Tiêu chí cổng Gate G1 (§99):**
> Engine chỉ được nghiệm thu khi chạy 2 run cùng seed nhưng khác lựa chọn sinh ra 2 cuộc đời khác biệt rõ rệt (≥40% event khác biệt, career khác nhau, quan hệ khác biệt), đồng thời 2 run cùng seed cùng lựa chọn cho ra hash trạng thái giống nhau 100%.

---

## Proposed Changes

### Phase 0: Monorepo Setup, Toolchain, Intent & Schema Foundation

```
life/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── turbo.json
├── packages/
│   ├── schema/           # Zod schemas & TypeScript types
│   ├── engine/           # Pure deterministic headless engine
│   ├── content/          # JSON data: events, traits, careers, templates
│   ├── validator/        # Content validator CLI (pnpm validate:content)
│   └── sim/              # Monte Carlo simulation CLI (pnpm sim)
├── apps/
│   └── game/             # React UI application (scaffolded shell)
└── docs/
    ├── GDD.md
    ├── TECH.md
    ├── EVENTS.md
    ├── SCOPE.md
    └── ADR/
```

- [NEW] [pnpm-workspace.yaml](file:///e:/projects/game-cuocdoi/pnpm-workspace.yaml)
- [NEW] [package.json](file:///e:/projects/game-cuocdoi/package.json)
- [NEW] [tsconfig.base.json](file:///e:/projects/game-cuocdoi/tsconfig.base.json)
- [NEW] [turbo.json](file:///e:/projects/game-cuocdoi/turbo.json)
- [NEW] [packages/schema/src/character.ts](file:///e:/projects/game-cuocdoi/packages/schema/src/character.ts)
- [NEW] [packages/schema/src/event.ts](file:///e:/projects/game-cuocdoi/packages/schema/src/event.ts)
- [NEW] [packages/schema/src/condition.ts](file:///e:/projects/game-cuocdoi/packages/schema/src/condition.ts)
- [NEW] [packages/schema/src/effect.ts](file:///e:/projects/game-cuocdoi/packages/schema/src/effect.ts)
- [NEW] [packages/schema/src/save.ts](file:///e:/projects/game-cuocdoi/packages/schema/src/save.ts)
- [NEW] [docs/GDD.md](file:///e:/projects/game-cuocdoi/docs/GDD.md)
- [NEW] [docs/TECH.md](file:///e:/projects/game-cuocdoi/docs/TECH.md)
- [NEW] [docs/EVENTS.md](file:///e:/projects/game-cuocdoi/docs/EVENTS.md)
- [NEW] [docs/SCOPE.md](file:///e:/projects/game-cuocdoi/docs/SCOPE.md)
- [NEW] [docs/ADR/001-determinism.md](file:///e:/projects/game-cuocdoi/docs/ADR/001-determinism.md)
- [NEW] [docs/ADR/002-save-migration.md](file:///e:/projects/game-cuocdoi/docs/ADR/002-save-migration.md)

### Phase 1: Engine Core (Headless)

- [NEW] [packages/engine/src/core/rng.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/core/rng.ts)
- [NEW] [packages/engine/src/core/clock.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/core/clock.ts)
- [NEW] [packages/engine/src/core/reducer.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/core/reducer.ts)
- [NEW] [packages/engine/src/narrative/condition-evaluator.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/condition-evaluator.ts)
- [NEW] [packages/engine/src/narrative/effect-executor.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/effect-executor.ts)
- [NEW] [packages/engine/src/narrative/event-database.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/event-database.ts)
- [NEW] [packages/engine/src/narrative/event-selector.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/event-selector.ts)
- [NEW] [packages/engine/src/narrative/causal-graph.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/causal-graph.ts)
- [NEW] [packages/engine/src/narrative/consequence-queue.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/narrative/consequence-queue.ts)
- [NEW] [packages/engine/src/simulation/relationship-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/relationship-system.ts)
- [NEW] [packages/engine/src/simulation/memory-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/memory-system.ts)
- [NEW] [packages/engine/src/simulation/family-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/family-system.ts)
- [NEW] [packages/engine/src/simulation/health-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/health-system.ts)
- [NEW] [packages/engine/src/simulation/happiness-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/happiness-system.ts)
- [NEW] [packages/engine/src/simulation/career-system.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/simulation/career-system.ts)
- [NEW] [packages/engine/src/core/turn-pipeline.ts](file:///e:/projects/game-cuocdoi/packages/engine/src/core/turn-pipeline.ts)
- [NEW] [packages/validator/src/index.ts](file:///e:/projects/game-cuocdoi/packages/validator/src/index.ts)
- [NEW] [packages/sim/src/index.ts](file:///e:/projects/game-cuocdoi/packages/sim/src/index.ts)

---

## Verification Plan

1. Unit tests toàn bộ engine và schema
2. Golden replay test
3. Content validator CLI (`pnpm validate:content`)
4. Headless Monte Carlo sim 10.000 lives (`pnpm sim`)
5. AnhCompass architecture rules check (`anhcompass check --staged --strict`)
