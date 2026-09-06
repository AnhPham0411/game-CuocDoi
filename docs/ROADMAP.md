# LIFE — PRODUCTION ROADMAP

Nguồn: [tailieu.md](../tailieu.md) (Production Blueprint, 100 mục).
Stack chốt: **TypeScript engine (headless) + React UI**, monorepo pnpm, đóng gói Steam bằng Tauri.
Phạm vi tài liệu này: **Phase 0 → Phase 3 (Vertical Slice)**. Phase 4+ chỉ nêu milestone ở cuối.

---

## 0. LUẬT CHUNG CỦA DỰ ÁN

Bốn luật này ràng buộc mọi task bên dưới. Vi phạm = task không được nghiệm thu.

### L1 — Engine là hàm thuần, xác định (deterministic)

```
nextState = step(prevState, choiceId)
```

Không `Math.random()`, không `Date.now()`, không I/O trong `packages/engine`.
Mọi ngẫu nhiên đi qua `RNG` được seed. Mọi thời gian đi qua `GameClock` nằm trong state.

**Vì sao:** blueprint §34 yêu cầu lưu `rng_seed` để tái hiện bug ở tuổi 37; §88 yêu cầu chạy
10.000 đời không UI; §92 yêu cầu causal graph. Cả ba đều sập nếu engine không xác định.

### L2 — Content là data, không phải code

Designer thêm event bằng file JSON trong `packages/content`, không đụng `.ts`.
Programmer chỉ cung cấp *primitive* condition/effect (blueprint §52).

### L3 — Effect/Condition primitive là API đóng, có version

Thêm primitive mới = bump `schemaVersion` + viết migration. Không sửa nghĩa của primitive cũ.

### L4 — Mọi state change phải truy được nguồn

Mỗi thay đổi mang theo `{sourceEventId, sourceChoiceId, atAge}` (blueprint §91).
Không có "state đổi mà không biết ai đổi".

### Definition of Ready — một task được phép bắt đầu

- [ ] Có acceptance criteria đo được (không phải "hoạt động tốt")
- [ ] Đã biết task phụ thuộc gì, ai đang giữ task đó
- [ ] Nếu đụng schema: đã có ADR hoặc đã thống nhất trong `docs/TECH.md`

### Definition of Done — áp dụng cho MỌI task code

- [ ] Acceptance criteria của task pass
- [ ] Unit test mới, `pnpm test` xanh toàn repo
- [ ] `pnpm validate:content` 0 error
- [ ] `pnpm sim --lives 10000` chạy xong, 0 impossible state
- [ ] `pnpm typecheck` + `pnpm lint` xanh
- [ ] Không vượt ngân sách hiệu năng 1 turn (xem E15)

---

## 1. KIẾN TRÚC & REPO

```
life/
├── packages/
│   ├── engine/          # L1: pure, headless, không import React / fs
│   │   ├── core/        # rng, clock, reducer, save
│   │   ├── simulation/  # character, relationship, memory, career, family, health, world
│   │   ├── narrative/   # eventDb, selector, conditionEval, effectExec, causalGraph
│   │   └── index.ts
│   ├── schema/          # zod schema + type, dùng chung engine / validator / tools
│   ├── content/         # JSON: events, careers, traits, npc, locations, i18n
│   ├── validator/       # CLI: pnpm validate:content
│   └── sim/             # CLI: pnpm sim  → balance report
├── apps/
│   ├── game/            # React UI
│   └── devtools/        # debug console, event authoring, causal graph viewer
├── tests/
│   ├── unit/   simulation/   golden/     # golden = replay log → state hash
└── docs/
    ├── GDD.md  TECH.md  EVENTS.md  BALANCE.md  SCOPE.md  ADR/
```

Ranh giới cứng, enforce bằng lint rule + intent của `anhcompass`:

| Từ | Được import | Cấm import |
|---|---|---|
| `engine` | `schema` | React, `fs`, `content` (content nạp qua injection) |
| `content` | — (chỉ data) | tất cả |
| `apps/game` | `engine`, `schema` | file nội bộ của `engine/*` (chỉ đi qua `index.ts`) |

---

# PHASE 0 — PRE-PRODUCTION

**Thời lượng:** 2–3 tuần · **Mục tiêu:** chốt schema và scope trước khi viết dòng gameplay nào.
Blueprint §58. Tuyệt đối không viết event content ở phase này.

### P0.1 — Repo, toolchain, CI

Deliverable: monorepo pnpm + turbo, tsconfig strict, vitest, eslint, GitHub Actions.
Sau `git init` chạy `anhcompass init` và viết intent thật cho dự án theo bảng ranh giới trên.

**Nghiệm thu**
- [ ] `pnpm install && pnpm build && pnpm test` xanh trên máy sạch
- [ ] CI chạy: typecheck, lint, test, validate:content, sim smoke 1.000 lives
- [ ] `tsconfig` bật `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [ ] `anhcompass check --staged --strict` chặn được một PR cố tình import React vào `engine`

### P0.2 — Schema: CharacterState

Deliverable: `packages/schema/character.ts` (zod), phủ blueprint §5, §6, §7, §8, §25, §27.

**Nghiệm thu**
- [ ] Đủ field: age/ageMonths, gender, location, money, health, happiness, stress, education,
      career, personality (10 trục §6), skills, relationships[], family[], memories[], traits[],
      goals[], reputation, statusEffects[], statistics, **secretState** (§27), `schemaVersion`
- [ ] Personality là vector 10 chiều 0–100; không tồn tại field `alignment` / `good` / `bad`
- [ ] Relationship có đủ 5 trục `closeness/trust/respect/conflict/dependence` (§7),
      **không** có field `friendship` đơn lẻ
- [ ] Property test 500 case: `CharacterState` → JSON → parse ra object bằng nhau
- [ ] Không field nào kiểu `any`

### P0.3 — Schema: Event + Condition DSL

Deliverable: `packages/schema/event.ts` + `docs/EVENTS.md` (sổ tay designer).

**Nghiệm thu**
- [ ] Event có: id, schemaVersion, contentVersion, category (§11), importance 1–100 (§12),
      decisionType A–E (§13), conditions, weight, choices[], cooldown, tags, maxChainDepth
- [ ] Condition DSL hỗ trợ tối thiểu: `age`, `stat.*`, `personality.*`, `skill.*`, `money`,
      `relationship(<ref>).<field>`, `trait`, `memory(<tag>)`, `career.*`, `education.*`,
      `location`, `world.*`, `flag`, `eventSeen(<id>)`, `and` / `or` / `not`
- [ ] `docs/EVENTS.md` có ≥15 ví dụ condition viết được mà không cần biết TypeScript
- [ ] Một người ngoài team (không code) đọc `EVENTS.md` rồi viết được 1 event hợp lệ trong 20 phút

### P0.4 — Schema: Effect primitive (API đóng)

Deliverable: danh mục effect cố định theo §14, hỗ trợ temporary/permanent (§15).

**Nghiệm thu**
- [ ] Đủ 18 effect type của §14
- [ ] Mỗi effect hỗ trợ `duration` (temporary) và không-duration (permanent); test cả hai nhánh
- [ ] Mỗi effect bắt buộc mang `provenance` theo L4 — schema từ chối effect thiếu nó
- [ ] `docs/TECH.md` có bảng "effect nào bị clamp thế nào", ví dụ: personality tối đa ±3 mỗi
      event trừ khi `importance ≥ 81` — chống nhảy empathy 10 → 90 (§6)

### P0.5 — ADR: Determinism & Save contract

Deliverable: `docs/ADR/001-determinism.md`, `docs/ADR/002-save-migration.md`.

**Nghiệm thu**
- [ ] Định nghĩa `RunLog = {seed, contentVersion, choices[]}` và cam kết: cùng RunLog → cùng state hash
- [ ] Nêu rõ khi nào được phép phá determinism (bump `contentVersion`) và migration xử lý ra sao
- [ ] Có checklist review PR: "PR này có phá golden replay không?"

### P0.6 — GDD + UI wireframe + Art direction

Deliverable: `docs/GDD.md`, wireframe 7 màn (§32, §33), art bible 2D stylized (§64, §65).

**Nghiệm thu**
- [ ] Wireframe đủ: Life, Relationships, Family, Career, Memories, Statistics, Settings
- [ ] Màn Life hiển thị đủ age, money, health, happiness, event text, 2–4 choice — không cuộn ở 1280×720
- [ ] Art bible chốt pipeline modular: base face + hair + clothes + age variant + emotion (§65)
- [ ] Ngân sách asset MVP ghi rõ: 50 background, 100 portrait, 200 prop

### P0.7 — Scope freeze

Deliverable: `docs/SCOPE.md` — §81 (không làm) + §82 (phải có) thành danh sách có người ký.

**Nghiệm thu**
- [ ] Mọi mục §81 nằm trong "OUT — Phase 4+", không ngoại lệ
- [ ] Vertical Slice chốt cứng: **Birth → Age 25**
- [ ] Mọi đề xuất feature mới ghi vào `docs/PARKING_LOT.md`, không vào sprint

### Gate G0 — thoát Phase 0

- [ ] P0.1 → P0.7 nghiệm thu xong
- [ ] Schema đã freeze; thay đổi sau đây phải qua ADR
- [ ] 0 dòng event content đã viết (nếu có → scope creep, quay lại)

---

# PHASE 1 — ENGINE CORE (HEADLESS)

**Thời lượng:** 6–8 tuần · **Mục tiêu:** engine sống trọn một đời mà không cần UI.
Blueprint §59. Art = 0, UI = 0. Toàn bộ verify bằng test và CLI.

### E1.1 — RNG có seed

**Nghiệm thu**
- [ ] `RNG(seed)` cho cùng chuỗi số trên Node và browser (test cross-env)
- [ ] Có sub-stream tách biệt: `rng.fork('events')`, `rng.fork('family')` — thêm event mới không
      làm dịch chuỗi ngẫu nhiên của family generation
- [ ] Test CI grep `Math.random` trong `packages/engine` → 0 kết quả

### E1.2 — GameClock

**Nghiệm thu**
- [ ] `advance(state, months)` cập nhật `age`/`ageMonths` đúng qua mốc sinh nhật; test 0 → 100 tuổi
- [ ] Bước thời gian mặc định 1 quyết định ≈ 3–6 tháng (§20), cấu hình được theo life stage
- [ ] Tuổi thọ không hard-code: `lifeExpectancyFactor` ảnh hưởng được (§25)

### E2 — CharacterState reducer

**Nghiệm thu**
- [ ] `applyEffects(state, effects, provenance)` không mutate input (test bằng deep-freeze)
- [ ] Stat bị clamp đúng bảng P0.4; test biên: money âm, health 0, happiness 100
- [ ] Mỗi lần gọi sinh `StateDelta[]` ghi vào event log (§35)

### E3 — ConditionEvaluator

**Nghiệm thu**
- [ ] Test bảng ≥60 case phủ mọi toán tử của P0.3, gồm `and`/`or`/`not` lồng 3 tầng
- [ ] Condition trỏ tới NPC/trait không tồn tại → trả `false` + warning, **không throw**
      (game không được crash vì content sai)
- [ ] Test ví dụ §87: `age=18, education=high_school` → event đại học `eligible = true`
- [ ] Đánh giá 1 condition < 50µs (benchmark) — E6 gọi nó hàng nghìn lần mỗi turn

### E4 — EffectExecutor

**Nghiệm thu**
- [ ] Cả 18 effect type có test riêng, gồm `CREATE_NPC` / `KILL_NPC` / `MOVE` / `CAREER_CHANGE`
- [ ] Temporary effect hết hạn đúng tháng: test `stress +20 duration 3 months` → tháng thứ 4 về 0 (§15)
- [ ] `TRAIT_ADD` trùng không nhân đôi trait
- [ ] Effect vi phạm quota §43 bị từ chối kèm lý do, state không hỏng

### E5 — EventDatabase + loader

**Nghiệm thu**
- [ ] Nạp toàn bộ `packages/content/events/**`, index theo age / category / tag
- [ ] Content sai schema: fail-fast ở dev, skip + log ở production build
- [ ] Nạp 3.000 event < 300ms

### E6 — EventSelector

Cài công thức §10: `score = baseWeight × ageFactor × personalityFactor × relationshipFactor × locationFactor × worldFactor × noveltyFactor`.

**Nghiệm thu**
- [ ] Weighted random dùng RNG có seed, tái lập 100%
- [ ] `noveltyFactor` chống lặp: trong 100 turn, không event nào xuất hiện > 3 lần
      (trừ event gắn cờ `repeatable`)
- [ ] Cooldown được tôn trọng (test)
- [ ] Pool rỗng → trả filler event, không crash, không lặp lại event vừa thấy (§22)
- [ ] Phân bố category khớp tỉ lệ life stage §22, sai số ≤ 5% qua 10.000 turn
- [ ] Chọn 1 event từ pool 3.000 < 5ms

### E7 — RelationshipSystem

**Nghiệm thu**
- [ ] 5 trục độc lập: dựng được trạng thái `closeness=82, trust=20` (§7 — "thân nhưng hết tin")
- [ ] Quan hệ trôi dần khi lâu không tương tác; `interactionFrequency` điều tiết tốc độ trôi
- [ ] Quota §43: `closeFriends ≤ 8`, `activeRelationships ≤ 100` — vượt thì hạ tier, không xóa lịch sử
- [ ] NPC tier 1–4 (§44) có mức mô phỏng khác nhau; tier 4 không chiếm slot active

### E8 — MemorySystem

**Nghiệm thu**
- [ ] `MEMORY_ADD` tạo memory đúng schema §8: `emotionalWeight`, `importance`, `tags`, `sourceEventId`
- [ ] Query được `memory('grandmother')`, `memory.byTag`, `memory.byParticipant`
- [ ] `majorMemories ≤ 500`: vượt quota thì memory importance thấp nhất bị nén thành summary,
      không mất tag
- [ ] Test kịch bản §P2: đi thăm bà lúc 9 tuổi → 30 năm sau event tang lễ đọc được memory đó

### E9 — Future Consequence Queue

**Nghiệm thu**
- [ ] `ScheduledEvent {triggerDate, eventId, conditions, priority}` (§41) được lưu trong save
- [ ] Đến hạn mà condition không còn đúng → hủy im lặng, ghi log lý do
- [ ] Test kịch bản §P4: 14 tuổi bảo vệ bạn → schedule 22–30 tuổi → 23 tuổi được giới thiệu việc
- [ ] Người bạn đó chết hoặc tuyệt giao trước 22 tuổi → schedule bị hủy, không sinh event ma

### E10 — CausalGraph

**Nghiệm thu**
- [ ] Mỗi decision importance ≥ 41 tạo một node; edge nối nguyên nhân → kết quả (§92)
- [ ] API `explain(outcome)` trả chuỗi nguyên nhân dạng §93
- [ ] Graph của một đời 80 năm < 2MB trong save
- [ ] Test: đời scripted sẵn → `explain('became_engineer')` trả đúng 5 mốc mong đợi

### E11 — FamilyGeneration

**Nghiệm thu**
- [ ] Cha/mẹ/anh chị em nhất quán: tuổi cha mẹ hợp lệ, thứ tự sinh hợp lệ, không có "mẹ 9 tuổi"
- [ ] Gia cảnh tính từ 6 biến §4.3 rồi mới phân loại 7 bậc — người chơi **không** chọn thẳng "giàu"
- [ ] 10.000 lần generate: 0 gia đình vi phạm ràng buộc (test bất biến)
- [ ] Dựng được family tree tới đời con (§18)

### E12 — Health / Happiness / SecretState

**Nghiệm thu**
- [ ] Happiness có quán tính đúng §26 (carry-over 0.8), **không** phải trung bình cộng các stat
- [ ] Công thức happiness không lộ ra UI (test: không string UI nào chứa hệ số)
- [ ] Secret state §27 (loneliness, regret, burnout, self_worth…) tồn tại, tác động event weight,
      không hiển thị số cho người chơi
- [ ] Health chịu ảnh hưởng age / stress / money / lifestyle / healthcare (§25), test hồi quy từng yếu tố

### E13 — Career & Education

**Nghiệm thu**
- [ ] Career eligibility tính từ state (§16), **không** có bảng hard-code `doctor ending`
- [ ] Test §16: `education thấp + social cao + ambition cao` mở sales / entrepreneurship /
      service / management; `education cao + discipline cao + curiosity cao` mở medicine /
      research / engineering / academia
- [ ] Career ảnh hưởng đủ: time, stress, health, relationships, location, status (§17)
- [ ] Qua 10.000 đời, không state nào rơi vào tình trạng 0 nghề khả dụng

### E14 — Save / Load / Migration

**Nghiệm thu**
- [ ] Save chứa `save_slot, character_state, world_state, event_history, rng_seed, version` (§34)
- [ ] Round-trip: save → load → chơi tiếp 50 turn cho state hash y hệt bản không save
- [ ] Migration v1 → v2 chạy được trên 100 save cũ, 0 corruption
- [ ] Save một đời 80 năm < 5MB, load < 500ms

### E15 — Turn Pipeline (16 bước §40)

**Nghiệm thu**
- [ ] Đủ 16 bước, đúng thứ tự, mỗi bước có hook test riêng
- [ ] `maxChainDepth = 5` được enforce (§42): event chain cố tình sâu 10 → dừng ở 5
- [ ] Một turn (gồm selection) < 15ms trên máy dev tham chiếu
- [ ] Golden test trong CI: `RunLog` cố định → state hash cố định

### E16 — Headless Sim Runner + Balance Report

Blueprint §88, §90.

**Nghiệm thu**
- [ ] `pnpm sim --lives 100000 --seed 42` xong trên một máy dev < 10 phút
- [ ] Tự xuất `docs/BALANCE.md`: avg lifespan, avg wealth, avg happiness, marriage rate,
      children/life, career distribution, event frequency, death causes, top choices
- [ ] Bộ **assertion sanity** làm fail CI khi: > 5% chết trước 20 tuổi không rõ nguyên nhân,
      > 2% thành triệu phú, bất kỳ ai kết hôn < 16 tuổi, bất kỳ state bất khả thi
- [ ] Báo cáo "event chưa bao giờ được chọn" (dead content) và "event chiếm > 2% tổng lượt"

### E17 — Content Validator CLI

Blueprint §89.

**Nghiệm thu**
- [ ] Bắt đủ: trùng ID, thiếu localization key, condition sai, effect sai, NPC/trait không tồn tại,
      age range vô lý, event không thể đạt tới, phụ thuộc vòng
- [ ] In `Errors: N / Warnings: M`, exit code ≠ 0 khi có error
- [ ] Chạy trên 3.000 event < 5s
- [ ] Được gọi trong pre-commit hook và CI

### E18 — Debug Console

Blueprint §36 — **bắt buộc**, không phải nice-to-have.

**Nghiệm thu**
- [ ] Đủ: Set Age / Money / Relationship, Add Trait, Trigger Event, Kill/Create NPC, Teleport,
      Skip Year, View State, View Event Conditions, View RNG Seed
- [ ] "View Event Conditions" chỉ rõ *condition nào fail* cho event đang bị loại
- [ ] Bật/tắt bằng flag, tự tắt trong production build (có test)

### Gate G1 — thoát Phase 1 (chính là test §99 của blueprint)

- [ ] Chạy trọn: tạo nhân vật → sinh gia đình → tuổi 0 → event → chọn → effect → lưu → tuổi kế
- [ ] Hai run cùng seed nhưng khác lựa chọn tạo ra **hai cuộc đời khác nhau rõ rệt** — đo bằng:
      ≥ 40% event gặp phải khác nhau, career khác nhau, ≥ 3 quan hệ khác biệt đáng kể
- [ ] Hai run cùng seed cùng lựa chọn → state hash **giống hệt**
- [ ] `pnpm sim --lives 100000` xanh toàn bộ assertion sanity
- [ ] Coverage `packages/engine` ≥ 85% dòng; 100% cho ConditionEvaluator + EffectExecutor

> Nếu mọi run vẫn hội tụ về cùng một kết quả → chưa có simulation thật.
> **Không được sang Phase 2.**

---

# PHASE 2 — CONTENT & LIFE PATH 0 → 25

**Thời lượng:** 8–10 tuần · **Mục tiêu:** 350–400 event chất lượng, engine chạy Birth → 25 đầy đủ.
Blueprint §45, §57, §97. Vẫn chưa cần art đẹp; UI tạm dạng debug.

Nguyên tắc content: **500 event tốt > 5.000 event nông** (§45). Mỗi event phải có nhiều điều kiện,
và phải trả lời được câu hỏi "event này khác gì nếu người chơi có quá khứ khác?"

### C1 — Content pipeline cho designer

**Nghiệm thu**
- [ ] Designer viết được event mới, chạy `pnpm validate:content`, thấy nó xuất hiện in-game —
      toàn bộ trong < 10 phút, không mở file `.ts` nào
- [ ] Có template event + 5 event mẫu đã bình luận kỹ trong `docs/EVENTS.md`
- [ ] Devtool xem trước event: nhập state giả → thấy event render và effect dự kiến

### C2 — Localization scaffolding (làm sớm, không để cuối)

Blueprint §67.

**Nghiệm thu**
- [ ] Mọi text đi qua key dạng `event_001.title` / `.description` / `.choice_1`
- [ ] Grep chuỗi tiếng Anh/tiếng Việt hard-code trong `apps/game` và `packages/engine` → 0 kết quả
- [ ] Có `en` và `vi` đủ key; thiếu key thì validator báo error
- [ ] Đổi ngôn ngữ trong game không cần restart

### C3 — Childhood 0–11 (~120 event)

Tỉ lệ mục tiêu §22: family 30% / school 30% / friendship 25% / random 15%.

**Nghiệm thu**
- [ ] ≥ 120 event, phân bố category lệch ≤ 5% so với mục tiêu qua 10.000 sim
- [ ] ≥ 25 event có condition phụ thuộc **quan hệ hoặc personality**, không chỉ phụ thuộc tuổi
- [ ] ≥ 15 event tạo memory có tag dùng lại ở giai đoạn sau
- [ ] Có event ví dụ §P2 (đi thăm bà) và nó thực sự sinh memory `last_trip_with_grandmother`
- [ ] Chơi tay 5 lần cho 5 tuổi thơ khác nhau rõ rệt

### C4 — Adolescence 12–17 (~120 event)

Tỉ lệ §22: school 25% / friendship 20% / romance 20% / family 15% / career 10% / random 10%.

**Nghiệm thu**
- [ ] ≥ 120 event, phân bố lệch ≤ 5%
- [ ] Có đủ 5 decision type A–E (§13); ≥ 10 event type D (moral) và ≥ 5 type E (irreversible)
- [ ] Event tuổi teen đọc được memory từ tuổi thơ ở ≥ 20 chỗ
- [ ] Có event mở nhánh học vấn: chọn khoa/ngành ảnh hưởng career pool sau này

### C5 — Young Adult 18–25 (~140 event)

Tỉ lệ §22: career 30% / romance 20% / money 15% / friendship 10% / family 10% / random 15%.

**Nghiệm thu**
- [ ] ≥ 140 event, phân bố lệch ≤ 5%
- [ ] Có "career crisis", "leaving home", "first serious relationship", "first job" (§23)
- [ ] ≥ 30 event có condition đọc memory/quan hệ từ tuổi < 18 — đây là chỗ trả nợ hậu quả dài hạn

### C6 — Milestone bảo đảm

Blueprint §23. Các mốc **phải** xuất hiện, nhưng *cách* xuất hiện thay đổi theo state.

**Nghiệm thu**
- [ ] Qua 10.000 sim tới tuổi 25: 100% gặp "first day of school"; ≥ 95% gặp "graduation hoặc
      nhánh thay thế" (bỏ học, đi làm sớm — nhánh thay thế cũng tính là đã xử lý mốc)
- [ ] Mỗi milestone có ≥ 3 biến thể theo gia cảnh (nghèo / trung bình / giàu)
- [ ] Không milestone nào xuất hiện 2 lần trong một đời

### C7 — Career pool (≥ 12 nghề cho slice)

**Nghiệm thu**
- [ ] ≥ 12 career đủ trường §17: requiredEducation, requiredSkills, salaryRange, stress,
      prestige, stability, socialExposure
- [ ] Qua 10.000 sim, không nghề nào chiếm > 25% và không nghề nào < 1% (nếu lệch → chỉnh eligibility)
- [ ] Test: hai hồ sơ ở §16 mở đúng hai nhóm nghề khác nhau

### C8 — Traits (≥ 30) + NPC archetypes (≥ 25)

**Nghiệm thu**
- [ ] ≥ 30 trait, mỗi trait ảnh hưởng ≥ 3 event hoặc ≥ 1 hệ thống (test)
- [ ] Không trait nào "chết" — validator báo trait không event nào dùng
- [ ] ≥ 25 NPC archetype phân theo tier §44, sinh ra được cả NPC tier 4 dùng một lần

### C9 — Random event có điều kiện thật (§24)

**Nghiệm thu**
- [ ] `inheritance` yêu cầu đủ: người thân tồn tại + đã mất + quan hệ ≥ ngưỡng (§24)
- [ ] Không có event nào chỉ cần `random()` là kích hoạt được trạng thái đổi đời (§P5)
- [ ] Qua 100.000 sim: 0 lần "random → billionaire"

### C10 — Wow moments (§50)

**Nghiệm thu**
- [ ] ≥ 15 event được đánh dấu `wow`, điều kiện hiếm nhưng có thật (vd: 17 năm không nói chuyện
      với anh trai → hôm nay anh gọi)
- [ ] Qua 10.000 sim tới tuổi 25: ≥ 90% số đời gặp **ít nhất 2** wow moment
- [ ] Không đời nào gặp cùng một wow moment 2 lần

### C11 — Balance pass

**Nghiệm thu**
- [ ] `docs/BALANCE.md` được sinh lại và có người review, ký
- [ ] Dead content = 0 (mọi event đã từng được chọn ít nhất 1 lần trong 100.000 sim)
- [ ] Không event nào chiếm > 2% tổng lượt xuất hiện
- [ ] Phân bố tuổi kết hôn / vào đại học / đi làm hợp lý theo mắt designer, có ghi lý do

### Gate G2 — thoát Phase 2

- [ ] ≥ 350 event, validator 0 error
- [ ] Chơi Birth → 25 bằng debug UI không crash, 20 lượt liên tiếp
- [ ] ≥ 2 life outcome khác biệt rõ rệt (DoD MVP §83)
- [ ] Feature "Why did this happen?" (§93) trả lời đúng cho ≥ 10 outcome được kiểm thử tay

---

# PHASE 3 — VERTICAL SLICE

**Thời lượng:** 6–8 tuần · **Mục tiêu:** Birth → 25 với UI, art, audio hoàn chỉnh, đem test bên ngoài.
Blueprint §60, §61, §84.

### U1 — App shell + binding engine

**Nghiệm thu**
- [ ] React app dùng engine qua `index.ts`, không import sâu vào `engine/*`
- [ ] State render từ engine, UI **không** giữ bản sao state riêng (một nguồn sự thật)
- [ ] Chuyển turn không giật: 60fps trên máy tham chiếu

### U2 — Character Creation

Blueprint §4.

**Nghiệm thu**
- [ ] Chọn được gender, nơi sinh (urban/suburban/rural)
- [ ] Gia cảnh **không** chọn trực tiếp — sinh từ 6 biến rồi hiện nhãn 7 bậc (§4.3)
- [ ] Người chơi mới hoàn tất character creation < 60 giây

### U3 — Event screen

Blueprint §32.

**Nghiệm thu**
- [ ] Layout đúng wireframe P0.6, đọc được ở 1280×720 và 1920×1080
- [ ] 2–4 choice, mỗi choice có phản hồi thị giác khi state đổi
- [ ] Choice **không** hiện con số effect (giữ mù mờ theo §26/§27)
- [ ] Text dài nhất trong content không tràn khung

### U4 — Các tab (§33)

**Nghiệm thu**
- [ ] Relationships hiện 5 trục theo dạng định tính, không phải số trần trụi
- [ ] Family hiện được family tree tới đời con
- [ ] Career hiện nghề hiện tại + nghề đang khả dụng và **lý do** chưa đủ điều kiện
- [ ] Memories duyệt được theo mốc thời gian và tag
- [ ] Statistics khớp với `LifeStatistics` trong engine (test đối chiếu)

### U5 — Life Summary + Epitaph + Share Card

Blueprint §29, §30, §31.

**Nghiệm thu**
- [ ] Summary in đủ mục §29: born, died, career, education, relationships, children, wealth,
      achievements, failures, memories, places, people
- [ ] Epitaph sinh từ `LifeStatistics`, **không** từ bảng ending cố định; ≥ 20 title khả dĩ
- [ ] Test: 100 đời khác nhau cho ≥ 12 title khác nhau
- [ ] Share card xuất PNG, **không** chứa thông tin định danh người chơi (§31)

### U6 — "Why did this happen?"

Blueprint §93 — điểm khác biệt lớn nhất, đưa vào slice, không để sau.

**Nghiệm thu**
- [ ] Từ màn Summary bấm được vào bất kỳ outcome lớn nào để xem chuỗi nguyên nhân
- [ ] Chuỗi hiển thị đúng thứ tự tuổi, mỗi bước có event + choice cụ thể
- [ ] Không outcome nào trả về "unknown" trong 100 đời test

### U7 — Art integration

**Nghiệm thu**
- [ ] Đủ ngân sách P0.6: 50 background, 100 portrait, 200 prop
- [ ] Pipeline modular chạy được: cùng một NPC render đúng ở 5 mốc tuổi (§65)
- [ ] Mọi event có background + portrait hợp cảnh; 0 event dùng placeholder
- [ ] Thời gian load màn event < 100ms (asset đã cache)

### U8 — Audio

Blueprint §66.

**Nghiệm thu**
- [ ] Có UI sound, transition, ambient, nhạc nền nhẹ, stinger cho event lớn
- [ ] Không voice acting (ngoài scope, §66)
- [ ] Có volume slider riêng cho music / sfx, lưu vào settings

### U9 — Save UI + Iron Life

Blueprint §48.

**Nghiệm thu**
- [ ] Save/load từ UI, nhiều slot, hiện tuổi + tên + thời điểm
- [ ] Chế độ Iron Life: không reload, có badge riêng; thoát giữa chừng vẫn giữ đúng trạng thái
- [ ] Kill process giữa turn rồi mở lại: không mất quá 1 turn, save không corrupt (test 50 lần)

### U10 — Accessibility + Settings

**Nghiệm thu**
- [ ] Cỡ chữ chỉnh được ≥ 3 mức, layout không vỡ
- [ ] Chơi được hoàn toàn bằng bàn phím
- [ ] Tương phản màu đạt WCAG AA cho text chính
- [ ] Có nút FEEDBACK và DISCORD trong menu (§77 — chuẩn bị sẵn cho demo)

### U11 — Build & packaging

**Nghiệm thu**
- [ ] Build Tauri chạy trên Windows sạch, không cần cài runtime
- [ ] Crash reporting bật, có test gửi được 1 báo cáo giả
- [ ] Cold start → màn đầu tiên < 5 giây

### T1 — External playtest

Blueprint §56, §61.

**Nghiệm thu**
- [ ] ≥ 20 người ngoài team chơi (mục tiêu §84), không được giải thích game trước
- [ ] Ghi lại: có hiểu không, có đọc text không, có replay không, có kể lại một sự kiện không
- [ ] **KPI cổng:** ≥ 7/10 người muốn chơi tiếp (§56); ≥ 30% chơi lại lần 2
- [ ] ≥ 50% người chơi tự kể lại được một sự kiện cụ thể trong đời họ (KPI của §P7)
- [ ] Thu được quit point: nếu ≥ 40% bỏ ở cùng một khoảng tuổi → đó là bug thiết kế, phải sửa
      trước khi sang Phase 4

### Gate G3 — Definition of Done: VERTICAL SLICE (§84)

- [ ] Birth → 25 hoàn chỉnh
- [ ] Art hoàn chỉnh · UI hoàn chỉnh · Audio cơ bản
- [ ] 350+ event · 12+ career · family / relationship / memory system đầy đủ
- [ ] Life summary + epitaph + share card
- [ ] Không có lỗi save corruption nghiêm trọng (50 lần kill-process test)
- [ ] ≥ 20 người ngoài team đã test, KPI T1 đạt
- [ ] `pnpm sim --lives 100000` xanh; `docs/BALANCE.md` được ký duyệt

> Đây là điểm ra quyết định: **có full production hay không** (§60, §95).
> Nếu KPI T1 không đạt, sửa gameplay rồi test lại — không đi tiếp bằng hy vọng.

---

# PHASE 4+ — CHỈ NÊU MILESTONE

Sẽ chi tiết hóa sau khi qua Gate G3, vì nội dung phụ thuộc kết quả playtest.

| Phase | Nội dung | Blueprint |
|---|---|---|
| 4 | Full life simulation 0 → death: marriage, children, aging, retirement, inheritance, death | §62 |
| 5 | Content expansion tới 1.500–3.000 event, 100+ career, 100+ trait | §46 |
| 6 | Polish: animation, microinteraction, visual feedback | §63 |
| 7 | QA, save migration, localization mở rộng, demo build, Steam integration | §85 |
| 8 | Steam: coming soon page, trailer, creator campaign, Next Fest, launch, post-launch update | §68–§80 |

---

## PHỤ LỤC A — LỊCH THAM CHIẾU

| Phase | Tuần | Cộng dồn |
|---|---|---|
| 0 Pre-production | 2–3 | ~3 tuần |
| 1 Engine core | 6–8 | ~11 tuần |
| 2 Content 0→25 | 8–10 | ~21 tuần |
| 3 Vertical slice | 6–8 | ~29 tuần |

≈ 7 tháng tới Vertical Slice với team 2–3 người (§96). Solo thì nhân 1.8–2.5.
Đây là khung tham chiếu, không phải cam kết (§95).

## PHỤ LỤC B — RỦI RO ĐÃ BIẾT

| Rủi ro | Dấu hiệu sớm | Xử lý |
|---|---|---|
| Content nông, mọi đời giống nhau | Gate G1 fail: 2 run hội tụ | Tăng condition phụ thuộc memory/quan hệ, không tăng số event |
| Engine mất tính xác định | Golden test đỏ | Chặn merge; L1 là luật, không thương lượng |
| Scope creep | `PARKING_LOT.md` phình ra | Scope freeze P0.7, mọi feature mới lùi Phase 4 |
| Balance vỡ | Assertion sanity của E16 đỏ | Chỉnh eligibility/weight, không chỉnh bằng cách xóa event |
| Người chơi bỏ ở tuổi 12 (§55) | Funnel playtest | Vấn đề gameplay, không phải marketing — sửa trước G3 |
| Content team bị chặn bởi programmer | Designer phải nhờ sửa `.ts` | L2 bị vi phạm; bổ sung primitive rồi bump schemaVersion |
