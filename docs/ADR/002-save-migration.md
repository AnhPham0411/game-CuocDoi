# ADR 002: Save File Schema & Version Migration Contract

## Status
Accepted (Phase 0 — Pre-Production)

## Context
Blueprint §34 và §53 yêu cầu hệ thống lưu trữ phải bền vững, không làm mất tiến trình của người chơi khi cập nhật game.
Save file cần lưu:
- `slot`, `character_state`, `world_state`, `turn_history`, `scheduled_queue`, `causal_graph`, `rng_seed`, `version`.

Khi hệ thống bổ sung tính năng mới (ví dụ thêm thuộc tính tính cách mới, thêm loại nghề nghiệp, hoặc điều chỉnh schema), các save file cũ phiên bản `vN` phải tự động nâng cấp lên `vN+1` mà không gây crash hoặc làm hỏng dữ liệu (*zero save corruption*).

## Decision
1. **Schema Versioning**:
   - `CharacterState` và `SaveData` luôn mang field `schemaVersion: number` (bắt đầu từ `1`).
   - Content events mang field `contentVersion: number`.

2. **Sequential Migration Pipeline**:
   - Định nghĩa mảng các hàm migration thuần:
     `type MigrationFn = (raw: Record<string, unknown>) => Record<string, unknown>;`
     `const migrations: Record<number, MigrationFn> = { 1: migrateV1toV2, 2: migrateV2toV3 };`
   - Khi `loadSaveData(json)`:
     Kiểm tra `version = raw.version ?? 1`.
     Nếu `version < CURRENT_SCHEMA_VERSION`, chạy tuần tự từng hàm nâng cấp từ `version` lên `CURRENT_SCHEMA_VERSION`.

3. **Safe Defaults & Non-Destructive Fields**:
   - Mọi field mới thêm vào schema bắt buộc phải có giá trị `.default(...)` trong Zod schema.
   - Không được xóa bỏ trường dữ liệu cũ mà không qua thời kỳ deprecation ghi rõ trong ADR.

4. **Iron Life Handling (§48)**:
   - Chế độ Iron Life ghi đè save liên tục sau mỗi turn.
   - Khi thoát đột ngột (crash/kill process), engine khôi phục turn gần nhất và không cho phép rollback về các checkpoint trước đó.

## Verification
- Unit test chạy migration pipeline trên 100 save data mẫu của phiên bản trước.
- Không có lỗi save corruption trong 50 lần kiểm thử tắt tiến trình đột ngột.
