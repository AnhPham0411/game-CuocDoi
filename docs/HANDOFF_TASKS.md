# HANDOFF — Việc cần làm tiếp (viết cho AI/dev khác thực hiện)

Tài liệu này liệt kê các lỗi/thiếu sót đã tìm ra qua review + chơi thử thật (không suy đoán —
mọi con số dưới đây đo được bằng cách chạy code thật), kèm quy tắc bắt buộc phải tuân theo khi
sửa. Đọc phần 0 trước khi sửa bất kỳ dòng code nào.

Repo: monorepo pnpm, TypeScript. `packages/engine` = headless simulation engine,
`packages/content` = data JSON (event/career/trait), `apps/game` = React UI.
Roadmap gốc: [docs/ROADMAP.md](ROADMAP.md). Blueprint gốc: [tailieu.md](../tailieu.md).

---

## 0. QUY TẮC BẮT BUỘC (đọc trước khi sửa)

### Luật kiến trúc — vi phạm = không được merge

1. **L1 — Engine phải xác định (deterministic).** Cấm `Math.random()`, `Date.now()`, `new Date()`
   không tham số trong toàn bộ `packages/engine/src/**`. Mọi ngẫu nhiên đi qua `RNG` (đã seed).
   Mọi ID mới sinh ra phải qua `CharacterState.idCounter` (xem `mintId()` trong
   `effect-executor.ts`), không tự bịa ID bằng timestamp.
2. **L2 — Content là data.** Không hard-code text/số liệu event vào code TypeScript. Mọi event
   nằm trong `packages/content/events/*.json`, đúng schema `EventDefinitionSchema`
   (`packages/schema/src/event.ts`).
3. **L3 — Không sửa nghĩa field cũ.** Nếu cần thêm effect/condition type mới, thêm mới trong
   `packages/schema/src/effect.ts` / `condition.ts`, không đổi nghĩa field đang tồn tại.
4. **L4 — Mọi thay đổi state phải có provenance.** Effect nào đổi state cũng phải mang
   `{sourceEventId, sourceChoiceId, atAge}`.

### Trước khi coi 1 task là xong — chạy đủ 4 lệnh này, tất cả phải xanh

```bash
pnpm build              # tsc + vite build tất cả package
pnpm test               # vitest, hiện có 24 test trong packages/engine
pnpm validate:content   # kiểm tra packages/content/events/*.json, phải "Errors: 0"
pnpm sim --lives 10000  # chạy 10.000 đời headless, phải "ALL SANITY ASSERTIONS PASSED"
```

Nếu sửa `packages/schema`, phải `pnpm --filter @life/schema build` trước rồi mới build engine
(dist của schema được engine import trực tiếp).

### Quy tắc viết test (bắt buộc cho mọi bug fix)

Mọi fix bug PHẢI có test đi kèm, và PHẢI verify theo kiểu red→green:
1. Viết test mô tả đúng hành vi đúng.
2. Tạm revert code về trạng thái lỗi, chạy test → phải FAIL đúng như mô tả bug.
3. Khôi phục fix, chạy lại → PASS.
4. Không tự tin fix đúng nếu chưa làm bước 2-3.

### Không được tự ý làm

- Không tự đoán ý đồ thiết kế của content author rồi "sửa" content JSON theo phỏng đoán riêng
  (ví dụ: không tự thêm field mới vào schema để "cứu" content sai mà chưa hỏi).
- Không đổi mặc định hành vi ảnh hưởng nhiều nơi (vd đổi tuổi thọ mô phỏng, đổi monthsPerTurn)
  mà không nói rõ lý do và số đo trước/sau.
- Không import package ngoài chưa có trong `package.json` mà không giải thích vì sao cần.

---

## 1. BUG ĐỘNG CƠ (packages/engine) — ưu tiên cao, ảnh hưởng đúng đắn của game

### 1.1. `CausalGraphTracker` KHÔNG BAO GIỜ tạo được cạnh nhân-quả (BUG NGHIÊM TRỌNG)

**File:** `packages/engine/src/core/turn-pipeline.ts` dòng ~177, và
`packages/engine/src/narrative/causal-graph.ts`.

**Vấn đề:** Tính năng "Why did this happen?" (blueprint §92/§93 — engine tự giải thích vì sao
một outcome xảy ra, bằng cách truy ngược chuỗi quyết định) **không hoạt động**, dù đã có class
`CausalGraphTracker.explain()` với đầy đủ logic truy ngược graph. Lý do: nơi duy nhất gọi
`recordDecision(...)` — trong `turn-pipeline.ts` — luôn truyền tham số thứ 6 (`causedByNodeId`)
là `undefined`:

```ts
context.causalTracker.recordDecision(
  event.id, choice.id, state.age, event.title, choice.text,
  undefined,      // <-- luôn undefined, không bao giờ nối cạnh nhân-quả
  event.tags
);
```

Hậu quả: mỗi quyết định tạo ra 1 node cô lập, `graph.edges` luôn rỗng, `explain()` chỉ trả về
đúng 1 phần tử (chính node đang tìm), không bao giờ trả về chuỗi nhiều bước như ví dụ trong
blueprint §93:
```
Age 11: bạn phát triển tính tò mò
Age 14: giáo viên khích lệ
Age 17: bạn chọn khối khoa học
...
```

**Việc cần làm (phạm vi tối thiểu, khớp đúng ví dụ §41 của blueprint):**

Khi một event được kích hoạt từ `ScheduledEvent` (tức `PreparedTurn.dueFromQueue === true`,
xem `turn-pipeline.ts` dòng ~105-113), event đó **có nguồn gốc rõ ràng** — nó nằm trong
`ScheduledEvent.provenance = {sourceEventId, sourceChoiceId, atAge}` (xem
`packages/schema/src/save.ts` — `ScheduledEventSchema`). Cần:

1. Thêm phương thức tra cứu vào `CausalGraphTracker`, ví dụ:
   `findNodeId(eventId: string, choiceId: string, atAge: number): string | undefined`
   — tìm trong `this.graph.nodes` node khớp cả 3 giá trị.
2. Sửa `TurnPipeline.prepareTurn` để khi lấy event từ hàng đợi (`dueRes.readyEvents[0]`), **giữ
   lại luôn `ScheduledEvent` gốc** (hiện tại code chỉ giữ `dueFromQueue: boolean`, vứt bỏ object
   `ScheduledEvent` — cần thêm field vào `PreparedTurn`, ví dụ `triggeringSchedule?: ScheduledEvent`).
3. Trong `TurnPipeline.executeChoice`, khi gọi `recordDecision`, nếu
   `prepared.triggeringSchedule` tồn tại: gọi `causalTracker.findNodeId(sched.provenance.sourceEventId, sched.provenance.sourceChoiceId, sched.provenance.atAge)` và truyền kết quả làm `causedByNodeId`.

**Tiêu chí nghiệm thu:**
- [ ] Test mới trong `packages/engine/src/__tests__/causal-graph.test.ts` (file đã tồn tại, có 2
      test cũ — thêm test mới, không xóa test cũ): dựng kịch bản đúng ví dụ §41 —
      1. Tạo event A ở tuổi 14 có effect `SCHEDULE_EVENT` trỏ tới event B ở tuổi 23.
      2. Chơi tới tuổi 23, để event B tự kích hoạt từ hàng đợi.
      3. Gọi `causalTracker.explain('B')` (hoặc theo tag) — **phải trả về mảng 2 phần tử**:
         bước ở tuổi 14 (event A) rồi bước ở tuổi 23 (event B), đúng thứ tự thời gian.
- [ ] Test phải fail nếu revert fix (làm theo quy tắc red→green ở mục 0).
- [ ] `pnpm sim --lives 10000` vẫn xanh sau khi sửa (không phá simulation).
- [ ] Ghi chú rõ trong code: đây là liên kết "cứng" qua SCHEDULE_EVENT — **không** cố gắng suy
      luận nhân-quả kiểu "cùng tag/chủ đề" giữa các quyết định độc lập (đó là bài toán thiết kế
      khác, khó, không nằm trong phạm vi fix này — nếu muốn làm, phải hỏi lại người phụ trách
      thiết kế trước, không tự quyết định thuật toán suy luận).

### 1.2. UI hoàn toàn chưa dùng tính năng causal graph

Sau khi xong mục 1.1, cần thêm 1 màn hình UI (ví dụ nút "Vì sao?" ở màn Life Summary hoặc ở mỗi
memory quan trọng trong tab Ký ức) gọi `GameEngine.getCausalTracker().explain(...)` và hiển thị
kết quả dạng danh sách các bước theo tuổi. Xem `apps/game/src/hooks/useGameEngine.ts` để biết
cách hook hiện tại lấy `GameEngine` instance (biến `engineRef`).

**Tiêu chí nghiệm thu:**
- [ ] Từ màn Life Summary, bấm được vào ít nhất 1 outcome lớn (career/relationship) để xem chuỗi
      nguyên nhân.
- [ ] Test bằng tay: chơi 1 đời có helped-friend ở tuổi trẻ dẫn tới job offer sau này (nếu content
      chưa có sẵn kịch bản này rõ ràng, xem mục 3 bên dưới), xác nhận UI hiện đúng 2+ bước.

---

## 2. VẤN ĐỀ NỘI DUNG (packages/content) — đo được bằng chơi thử thật

### 2.1. 33-49% cốt truyện KHÔNG đổi dù lựa chọn đối lập hoàn toàn (vi phạm nguyên tắc P1)

**Cách tôi đo:** chơi 2 đời bằng Playwright — đời A luôn bấm lựa chọn đầu tiên, đời B luôn bấm
lựa chọn cuối cùng, khác giới tính, khác nơi sinh. Kết quả:
- 33% số turn cho ra **đúng event giống hệt ở đúng cùng độ tuổi**.
- 49% tổng số tựa event xuất hiện ở **cả hai** đời, bất kể chọn gì.
- Từ tuổi 0-14, hai đời gần như đọc y hệt: Chào đời → "Đứa em mới"(4t) → "Ngày đầu tiên đi
  học"(5t) → "Rung động đầu đời"(12t) → "Ba mẹ ly hôn"(12t) → "Tốt nghiệp cấp 2"(14t)...

**Nguyên nhân gốc (đã xác nhận bằng script đếm):** trong 69 event hiện có,
**55/69 (80%) event chỉ có duy nhất 1 điều kiện: `{type: "age", ...}`** — không đọc
personality/relationship/memory/trait của nhân vật. Vì vậy dù người chơi là ai, chọn gì, engine
vẫn chọn từ đúng 1 pool event y hệt cho mỗi độ tuổi.

**Việc cần làm:** với các event milestone quan trọng (KHÔNG cần làm hết 55 event, ưu tiên các
event có `importance >= 60` hoặc `isWowMoment: true` trước), thêm điều kiện phụ dựa trên state
tích lũy từ các lựa chọn trước đó. Ví dụ cách làm đúng (dùng `ConditionSchema`, xem
`packages/schema/src/condition.ts`):

```json
// TRƯỚC (chỉ gate theo tuổi — sai với P1):
"conditions": [{ "type": "age", "min": 12, "max": 14 }]

// SAU (thêm nhánh theo state, đúng tinh thần P1):
"conditions": [
  { "type": "and", "conditions": [
    { "type": "age", "min": 12, "max": 14 },
    { "type": "personality", "axis": "extraversion", "op": ">=", "value": 55 }
  ]}
]
```
Rồi viết **một event khác** (event mới, id khác) với điều kiện ngược lại
(`extraversion < 55`) cho cùng độ tuổi, để nhánh nào cũng có nội dung — không được để một nhánh
personality rơi vào filler trong khi nhánh kia có nội dung xịn.

Các trường có thể dùng để phân nhánh (xem đủ trong `condition.ts`):
`personality.<axis>`, `relationship(<npcId hoặc role>).<field>`, `trait`, `memory(tag=...)`,
`skill.<name>`, `career.hasJob`, `education.minLevel`, `event_seen(<eventId>)`, `flag`.

**Tiêu chí nghiệm thu:**
- [ ] Chạy lại đúng kịch bản đo ở trên (2 đời, chọn đối lập hoàn toàn) — tỉ lệ "event giống hệt ở
      cùng độ tuổi" phải giảm xuống **dưới 20%** (mục tiêu ROADMAP Gate G1: ≥40% khác biệt).
- [ ] `pnpm validate:content` vẫn 0 lỗi.
- [ ] `pnpm sim --lives 10000` — không nhánh personality nào rơi vào 0% (tức là mọi nhánh đều
      thực sự được chọn tới trong mô phỏng thật, không phải chỉ tồn tại trên giấy).

### 2.2. 94% ký ức không có mô tả — hỏng tính năng cảm xúc cốt lõi

**Số đo:** đếm toàn bộ `packages/content/events/*.json` — **93 effect `MEMORY_ADD`, chỉ 6 cái
(6%) có field `memoryPayload.description`.** Hậu quả: màn Life Summary (khoảnh khắc cảm xúc nhất
của cả game, blueprint §29) hiện "(không có mô tả)" ở phần lớn "Những ký ức đáng nhớ nhất".

**Việc cần làm:** với mỗi `MEMORY_ADD` effect thiếu `description`, viết 1 câu mô tả ngắn (10-20
từ, tiếng Việt, giọng hồi tưởng ở ngôi thứ 2 "bạn...", khớp với `title`/`description` của event và
lựa chọn cụ thể đã chọn). Ví dụ tốt đã có sẵn trong content (dùng làm mẫu):
```json
"memoryPayload": {
  "type": "family", "tags": ["grandmother", "childhood"],
  "emotionalWeight": 70, "importance": 65,
  "description": "Kỷ niệm ngày hè câu cá bên bờ ao với bà ngoại."
}
```

**Tiêu chí nghiệm thu:**
- [ ] Chạy lại phép đếm ở trên — tỉ lệ có `description` phải đạt **≥ 90%** (không cần 100%, một
      vài memory trung tính/filler có thể không cần mô tả đặc sắc).
- [ ] Mỗi description phải khác nhau — không copy-paste hàng loạt cùng 1 câu cho nhiều event khác
      nhau (kiểm tra bằng: số description unique / tổng số description phải ≥ 95%).
- [ ] `pnpm validate:content` vẫn 0 lỗi.

### 2.3. `isWowMoment: true` bị lạm dụng — 32% content, làm nhạt tính đặc biệt

**Số đo:** 22/69 event (32%) gắn `isWowMoment: true`. Khi chơi thật, pop-up "Khoảnh khắc đặc
biệt" xuất hiện 13-15 lần trong 49 turn — gần 1/3 tổng số lượt. Blueprint §50 mô tả đây là
khoảnh khắc **hiếm và đáng nhớ** ("mỗi run phải có ít nhất **vài** event đặc biệt"), không phải
xảy ra đều đặn.

**Việc cần làm:** rà lại danh sách 22 event đang gắn `isWowMoment: true` (lệnh liệt kê:
`node -e "const fs=require('fs');let all=[];for(const f of fs.readdirSync('packages/content/events')){const d=JSON.parse(fs.readFileSync('packages/content/events/'+f));all=all.concat(Array.isArray(d)?d:d.events||[])}console.log(all.filter(e=>e.isWowMoment).map(e=>e.id).join('\n'))"`
chạy từ thư mục gốc repo). Bỏ cờ `isWowMoment` khỏi các event **thường/nhẹ** (ví dụ: gia nhập đội
thể thao, làm tình nguyện viên, dự án khoa học — đây là các milestone bình thường, không phải
"đặc biệt"). **Giữ lại** cờ này cho các event thật sự lớn: ly hôn cha mẹ, mất người thân, chọn
trường/nghề mang tính bước ngoặt, gặp lại người quen sau nhiều năm.

**Tiêu chí nghiệm thu:**
- [ ] Số event `isWowMoment: true` giảm còn khoảng **10-15 event (15-22%)**, không dưới 8 (vẫn
      cần đủ wow moment theo ROADMAP C10: ≥15 event, và ≥90% số đời gặp ít nhất 2 wow moment
      trong 10.000 sim — kiểm tra lại bằng `pnpm sim` sau khi sửa, đọc trong `docs/BALANCE.md`).
- [ ] `pnpm sim --lives 10000` — xem báo cáo, đảm bảo vẫn còn đủ wow moment trung bình mỗi đời.

---

## 3. VẤN ĐỀ UI (apps/game) — polish, không ảnh hưởng logic game

### 3.1. Không có hiệu ứng chuyển cảnh khi bấm chọn — mọi lựa chọn đều "cụt"

**File:** `apps/game/src/components/EventScreen.tsx` (hàm `onChoice`),
`apps/game/src/hooks/useGameEngine.ts` (hàm `makeChoice`).

**Vấn đề:** bấm 1 lựa chọn → React re-render tức thì sang event tiếp theo, 0ms delay, 0 hiệu ứng.
Dù là lựa chọn nhẹ ("ăn sáng gì") hay nặng (ly hôn, mất người thân), cảm giác chuyển cảnh giống
hệt nhau — không có khoảnh khắc "lựa chọn của bạn vừa được ghi nhận".

**Việc cần làm:**
1. Thêm state cục bộ trong `EventScreen` hoặc component cha: khi bấm 1 choice, hiện trạng thái
   "đã chọn" (ví dụ: làm mờ các choice khác, khoá thêm click, hiện brief highlight lên choice vừa
   bấm) trong khoảng 250-400ms, RỒI mới gọi `onChoice(choice.id)` thật sự.
2. Thêm CSS animation fade-out/fade-in khi `.event-card`'s nội dung (title/description) đổi sang
   event mới — dùng pattern `key={event.id}` trên phần tử gốc để React tự unmount/remount và
   trigger lại animation `fadeIn` đã có sẵn trong `index.css` (dòng ~439, `@keyframes fadeIn`),
   HOẶC viết animation riêng cho `.event-card`.
3. **Không** thêm animation quá 500ms — sẽ làm chậm nhịp chơi, gây khó chịu khi chơi nhiều turn
   liên tiếp.

**Tiêu chí nghiệm thu:**
- [ ] Bấm 1 choice → có độ trễ/hiệu ứng thấy rõ (không phải instant swap) nhưng dưới 500ms tổng.
- [ ] Không phá vỡ luồng logic hiện tại: `makeChoice` trong hook vẫn phải là nguồn sự thật duy
      nhất về state — animation chỉ là lớp trình bày, KHÔNG được giữ state giả trong component
      UI kiểu "double state" (đọc lại nguyên tắc single-source-of-truth đã áp dụng trong hook).
- [ ] `pnpm build` xanh, không lỗi console khi chơi thử qua nhiều turn liên tiếp (test bằng
      Playwright hoặc thủ công, xem console).

---

## 4. THỨ TỰ ƯU TIÊN ĐỀ XUẤT

1. **2.1 (phân nhánh content)** — quan trọng nhất, ảnh hưởng trực tiếp lời hứa cốt lõi của game
   ("không có hai cuộc đời nào giống nhau"). Việc nặng nhất nhưng giá trị cao nhất.
2. **2.2 (viết mô tả ký ức)** — rẻ, tác động lớn tới cảm xúc màn kết thúc.
3. **1.1 + 1.2 (causal graph)** — giá trị cao, nhưng cần sửa đúng ở engine trước khi làm UI, đừng
   làm ngược.
4. **2.3 (giảm tỉ lệ wow moment)** — rẻ, chỉ sửa field trong JSON có sẵn.
5. **3.1 (transition khi chọn)** — polish thuần UI, làm sau cùng vì không ảnh hưởng đúng-sai của
   game, chỉ ảnh hưởng cảm giác.

Sau khi làm xong bất kỳ mục nào, chạy đủ 4 lệnh ở mục 0 và dán kết quả output thật (không tóm tắt)
vào PR/commit message để người review đối chiếu.
