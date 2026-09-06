# LIFE — TECHNICAL SPECIFICATION (TECH.MD)

Tài liệu đặc tả kỹ thuật chi tiết cho engine mô phỏng cuộc đời theo chuẩn [Production Blueprint (tailieu.md)](file:///e:/projects/game-cuocdoi/tailieu.md).

---

## 1. NGUYÊN TẮC BẤT BIẾN & XÁC ĐỊNH (DETERMINISM)
- **Engine thuần túy (Headless Engine)**: `packages/engine` không chứa bất kỳ lời gọi API nào liên quan đến DOM, Canvas, React, hoặc file I/O của Node.
- **State Reducer**: Trạng thái được cập nhật qua hàm thuần:
  ```typescript
  export function step(currentState: CharacterState, choiceId: string, context: TurnContext): StepResult;
  ```
- **PRNG Multi-stream**: Sử dụng `SplitMix32` kết hợp `XorShift128+`.
  Mỗi phân hệ chạy trên một sub-stream độc lập từ master seed:
  - `stream.events`: Dành riêng cho việc chọn sự kiện và weighted random.
  - `stream.family`: Dành riêng cho việc sinh gia đình và chỉ số họ hàng ban đầu.
  - `stream.npc`: Dành riêng cho việc sinh NPC ngẫu nhiên trong đời.

---

## 2. BẢNG CLAMPING VÀ GIỚI HẠN BIẾN THIÊN STATS (§P0.4, §6)

Để tránh hiện tượng lựa chọn đơn lẻ làm thay đổi phi thực tế (ví dụ: Empathy từ 10 nhảy lên 90 trong 1 lượt):

| Trường trạng thái | Miền giá trị | Độ thay đổi tối đa / 1 lượt (Turn) | Điều kiện ngoại lệ |
|---|---|---|---|
| **Personality (10 trục)** | 0 – 100 | **±3** điểm / lượt | Biến cố cực lớn (`importance >= 81`): tối đa **±15** điểm |
| **Health** | 0 – 100 | ±20 điểm / lượt | Tai nạn nghiêm trọng: có thể về 0 (tử vong) |
| **Happiness** | 0 – 100 | Tính theo hàm quán tính (§26) | Biến cố chấn động: tối đa ±30 điểm |
| **Stress** | 0 – 100 | ±25 điểm / lượt | Cháy sạch năng lượng (*burnout*) |
| **Relationship (5 trục)** | 0 – 100 | **±15** điểm / lượt | Phản bội / cứu mạng: tối đa ±40 điểm |
| **Money** | -∞ – +∞ | Giới hạn bởi salary/effect value | Cho phép số âm (nợ nần) |

### Công thức quán tính hạnh phúc (§26):
```typescript
happiness[t + 1] = Math.round(
  happiness[t] * 0.8 +
  recentEventEmotionalWeight * 0.1 +
  relationshipAverageTrust * 0.05 +
  financialSecurityScore * 0.05
);
```

---

## 3. THỨ TỰ PIPELINE 16 BƯỚC MỖI TURN (§40)
1. **Advance time**: `GameClock.advance(state, monthsPerTurn)` (thường là 3–6 tháng/turn).
2. **Update temporary effects**: Giảm thời hạn của các hiệu ứng tạm thời, giải phóng hiệu ứng hết hạn.
3. **Update relationships**: Áp dụng độ trôi (*drift*) đối với các mối quan hệ lâu ngày không tương tác.
4. **Update career / education**: Cập nhật tích lũy kinh nghiệm, lương định kỳ, khấu trừ chi phí sinh hoạt.
5. **Update health / happiness**: Tính toán suy giảm sinh học theo tuổi và cập nhật hạnh phúc theo quán tính.
6. **Evaluate life milestones**: Kiểm tra các mốc bảo đảm (§23: ngày đầu đi học, tốt nghiệp, đi làm).
7. **Collect eligible events**: Sử dụng `ConditionEvaluator` lọc qua danh mục sự kiện trong `EventDatabase`.
8. **Remove blocked events**: Loại bỏ sự kiện đang trong thời gian hồi chiêu (`cooldownMonths`) hoặc xung đột.
9. **Calculate event weights**: Áp dụng công thức tính điểm thích ứng (§10):
   `score = baseWeight * ageFactor * personalityFactor * relationshipFactor * noveltyFactor`.
10. **Select event**: Bốc thăm ngẫu nhiên có trọng số thông qua sub-stream `rng.fork('events')`.
11. **Present event**: Đóng gói sự kiện gửi về cho UI/Caller kèm danh sách lựa chọn hợp lệ.
12. **Player chooses**: Tiếp nhận `choiceId` từ người chơi hoặc bot mô phỏng.
13. **Apply effects**: Thực thi 18 effect primitives qua `EffectExecutor`, sinh ra `StateDelta[]`.
14. **Create memories**: Ghi nhận ký ức nếu sự kiện có `importance >= 41` hoặc có `memoryPayload`.
15. **Schedule future consequences**: Thêm sự kiện trì hoãn vào `consequenceQueue` (§41).
16. **Record to Causal Graph & Save**: Thêm node/edge vào đồ thị nhân quả và ghi log lượt chơi.

---

## 4. QUOTA & CHỐNG BÙNG NỔ DỮ LIỆU (§43)
- `closeFriends`: Tối đa 8 người.
- `coreNPCs`: Tối đa 50 người (Tier 1 & Tier 2).
- `activeRelationships`: Tối đa 100 người.
- `majorMemories`: Tối đa 500 ký ức. Khi vượt quá 500, hệ thống tự động nén các ký ức có `importance < 30` thành một bản ghi tổng kết mà không làm mất các tag tra cứu.
- `maxChainDepth`: Tối đa 5 sự kiện liên hoàn liên tiếp trong cùng một chuỗi (§42).
