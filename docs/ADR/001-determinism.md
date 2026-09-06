# ADR 001: Engine Determinism & Golden Replay Contract

## Status
Accepted (Phase 0 — Pre-Production)

## Context
Blueprint §34 yêu cầu lưu `rng_seed` để tái hiện bug ở bất kỳ độ tuổi nào (ví dụ bug ở tuổi 37).
Blueprint §88 yêu cầu chạy 10.000 đến 100.000 cuộc đời headless để kiểm soát cân bằng kinh tế và xã hội.
Blueprint §92 yêu cầu Causal Graph truy ngược nguyên nhân - kết quả.

Cả ba tính năng trên sẽ hoàn toàn bị phá vỡ nếu hệ thống không có tính xác định tuyệt đối (*deterministic*).
Nếu một hàm trong simulation sử dụng `Math.random()`, `Date.now()`, hay phụ thuộc vào thứ tự duyệt key của Object không cố định, hai lần chạy cùng một seed sẽ cho ra hai kết quả khác nhau, khiến việc debug và kiểm thử cân bằng trở nên vô nghĩa.

## Decision
1. **L1 — Pure Function State Machine**:
   `nextState = step(prevState, choiceId)`
   Không có I/O, không gọi API ngoài, không `Math.random()`, không `Date.now()` trong `packages/engine`.

2. **Seeded PRNG & Forkable Sub-streams**:
   - Sử dụng thuật toán xorshift128+ / splitmix32 với một số nguyên `seed` ban đầu.
   - Các hệ thống phụ rẽ nhánh ngẫu nhiên độc lập: `rng.fork('family')`, `rng.fork('events')`, `rng.fork('npc')`.
   - Lợi ích: Thêm một sự kiện mới hoặc thay đổi nhỏ trong hệ thống gia đình không làm trượt toàn bộ chuỗi số ngẫu nhiên của các sự kiện phía sau.

3. **Golden Replay Contract**:
   Định nghĩa `RunLog = { seed, contentVersion, choices: { turn, eventId, choiceId }[] }`.
   Cam kết: Với cùng một `RunLog` và cùng `contentVersion`, state hash sau N lượt chơi phải giống nhau 100% trên cả Node.js (headless runner) và Web Browser / Tauri shell.

4. **CI Enforcement**:
   - Grep CI kiểm tra `Math.random` trong `packages/engine` → bắt buộc 0 kết quả.
   - Replay test chạy trong mỗi pull request để bảo vệ golden hash.

## Consequences
- **Ưu điểm**:
  - Tái hiện 100% bug từ save file người chơi gửi về.
  - Chạy mô phỏng hàng trăm nghìn đời siêu tốc (không UI, headless).
  - Causal graph truy ngược chính xác 100% nguyên nhân - kết quả.
- **Hạn chế**:
  - Lập trình viên phải cẩn trọng không đưa bất kỳ hàm non-deterministic nào vào simulation.
