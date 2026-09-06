# LIFE — BẢN ĐÓNG BĂNG PHẠM VI (SCOPE.MD)

Tham chiếu: [Production Blueprint §81, §82, §83](file:///e:/projects/game-cuocdoi/tailieu.md)

---

## 1. PHẠM VI BẮT BUỘC (IN-SCOPE — PHASE 0 ĐẾN PHASE 3: VERTICAL SLICE)

Chỉ tiêu cho Vertical Slice (Birth → Tuổi 25):
- [x] Tạo nhân vật và sinh gia đình có kiểm soát từ 6 biến ngẫu nhiên.
- [x] Hệ thống thời gian GameClock theo tháng & tuổi.
- [x] Động cơ mô phỏng thuần túy (Deterministic Headless Engine).
- [x] Vector tính cách 10 chiều có quán tính (§6).
- [x] Mối quan hệ 5 trục độc lập + hiện tượng trôi (*drift*) (§7).
- [x] Ký ức có trọng số cảm xúc và nhãn truy vấn (§8).
- [x] Động cơ sự kiện và lựa chọn đa dạng (Decision Types A–E).
- [x] 18 Effect primitives hỗ trợ hiệu ứng tạm thời và nguồn gốc provenance (§14, §15, L4).
- [x] Hàng đợi hậu quả tương lai (Future Consequence Queue §41).
- [x] Đồ thị nhân quả Causal Graph và tính năng "Tại sao chuyện này xảy ra?" (§92, §93).
- [x] Cơ chế lưu trữ Save/Load có RNG seed tái hiện bug + chế độ Iron Life (§34, §48).
- [x] Bộ công cụ kiểm thử mô phỏng hàng loạt (Headless Simulation Runner §88, §90).
- [x] Công cụ kiểm tra hợp lệ nội dung (Content Validator CLI §89).
- [x] Giao diện React UI hoàn chỉnh cho Vertical Slice (Birth → 25).

---

## 2. NGOẠI PHẠM VI TUYỆT ĐỐI (OUT-OF-SCOPE — KHÔNG LÀM TRONG GIAI ĐOẠN NÀY)

Theo quy định nghiêm ngặt tại mục §81 của Production Blueprint, các tính năng sau **bị cấm** đưa vào code hoặc sprint trong Phase 0–3:
1. ❌ Không làm thế giới mở (Open world).
2. ❌ Không làm di chuyển thời gian thực (Real-time movement / WASD).
3. ❌ Không làm tính năng nhiều người chơi (Multiplayer / Co-op).
4. ❌ Không lồng tiếng toàn bộ (Full voice acting) — chi phí sản xuất quá lớn (§66).
5. ❌ Không tích hợp AI NPC tự do chat (Freeform LLM NPC chat) — logic simulation phải là deterministic code/data (§28).
6. ❌ Không mô phỏng 100 quốc gia.
7. ❌ Không viết 1.000 nghề hay 10.000 sự kiện ngay từ đầu.
8. ❌ Không làm đồ họa 3D toàn phần.
9. ❌ Không mô phỏng kinh tế vĩ mô toàn cầu phức tạp.

Mọi ý tưởng phát sinh ngoài phạm vi trên bắt buộc phải ghi nhận vào `docs/PARKING_LOT.md` và chỉ được xem xét sau khi phát hành bản Vertical Slice thành công.
