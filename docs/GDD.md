# LIFE — GAME DESIGN DOCUMENT (GDD)

Tham chiếu: [Production Blueprint (tailieu.md)](file:///e:/projects/game-cuocdoi/tailieu.md)

---

## 1. TẦM NHÌN & TRIẾT LÝ THIẾT KẾ
- **High Concept**: Người chơi tạo một con người từ khi sinh ra, sống qua các giai đoạn của cuộc đời và chết (§1.1).
- **Core Loop**:
  `LIVE → CHOOSE → CHANGE → REMEMBER → CONSEQUENCE → LIVE AGAIN` (§94).
- **7 Nguyên tắc cốt lõi (§2)**:
  1. *P1*: Không có đường ray cố định (Choice → State → Eligibility → Relationships → Opportunities → Future choices).
  2. *P2*: Quyết định nhỏ cũng có giá trị (ví dụ: đi thăm bà năm 9 tuổi kích hoạt ký ức 30 năm sau).
  3. *P3*: Không phải lựa chọn nào cũng phải có hậu quả (phân loại 5 cấp độ quyết định).
  4. *P4*: Không phải hậu quả nào cũng nhìn thấy ngay (trì hoãn qua Future Consequence Queue).
  5. *P5*: Random có kiểm soát (ràng buộc bởi tuổi, gia cảnh, tính cách, quan hệ).
  6. *P6*: Không có "cuộc đời hoàn hảo nhất" (KPI là trải nghiệm và câu chuyện riêng biệt).
  7. *P7*: Người chơi có thể kể lại cuộc đời mình sau khi kết thúc run.

---

## 2. CẤU TRÚC RUN & LIFE STAGES
1. **Character Creation**: Giới tính, nơi sinh (Urban / Suburban / Rural), nền tảng gia đình (tạo từ 6 biến ngẫu nhiên).
2. **Early Childhood (0–5 tuổi)**: Khám phá thế giới, quan hệ gia đình, hình thành nét tính cách đầu tiên.
3. **Childhood (6–11 tuổi)**: Đi học, bạn bè, thầy cô, kỷ niệm tuổi thơ, sở thích.
4. **Adolescence (12–17 tuổi)**: Dậy thì, tình cảm đầu đời, áp lực học tập, ranh giới đạo đức, định hướng học vấn.
5. **Young Adult (18–25 tuổi)**: Đại học / học nghề / đi làm, khủng hoảng tuổi 20, tình yêu nghiêm túc, độc lập tài chính.
6. **Adult (26–40 tuổi)** *(Phase 4)*: Hôn nhân, sinh con, phát triển sự nghiệp, nhà cửa, biến cố lớn.
7. **Middle Age (41–60 tuổi)** *(Phase 4)*: Khủng hoảng trung niên, chăm sóc cha mẹ già, con cái trưởng thành.
8. **Old Age (61+ tuổi)** *(Phase 4)*: Nghỉ hưu, di sản, hoài niệm, bệnh tật tuổi già.
9. **Death & Life Summary**: Bản tóm tắt cuộc đời, danh hiệu Epitaph, Shareable Life Card, tính năng "Tại sao chuyện này xảy ra?".

---

## 3. CÁC HỆ THỐNG MÔ PHỎNG NỘI TẠI
- **Tính cách (10 chiều, 0–100)**: `openness`, `conscientiousness`, `extraversion`, `agreeableness`, `neuroticism`, `ambition`, `risk_tolerance`, `empathy`, `discipline`, `curiosity`. Biến thiên có quán tính, không nhảy vọt trừ biến cố chấn động (§6).
- **Mối quan hệ (5 trục độc lập)**: `closeness`, `trust`, `respect`, `conflict`, `dependence`. Hiện tượng trôi (*drift*) khi không tương tác thường xuyên (§7).
- **Ký ức (Memories)**: Lưu trữ các sự kiện có trọng số cảm xúc (`emotionalWeight`) và tầm quan trọng (`importance`). Ký ức được tái triệu hồi để mở khóa các sự kiện tương lai (§8).
- **Trạng thái ẩn (Secret State)**: `loneliness`, `regret`, `burnout`, `social_pressure`, `self_worth`, `attachment`, `family_responsibility` (§27).

---

## 4. GIAO DIỆN & ART DIRECTION
- **Phong cách thị giác (§64, §65)**: 2D Stylized Illustrated / Minimalist Premium UI.
- **Pipeline Modular NPC**: Khuôn mặt cơ sở + kiểu tóc + trang phục + biến thể theo tuổi (10, 18, 30, 50, 70 tuổi) + biểu cảm cảm xúc.
- **Bố cục 7 màn hình (§32, §33)**:
  1. *Life Screen*: Sự kiện hiện tại, lựa chọn, thanh chỉ số chính (Health, Happiness, Stress, Money, Age).
  2. *Relationships Screen*: Danh sách NPC, mạng lưới quan hệ định tính.
  3. *Family Screen*: Cây phả hệ gia đình (cha mẹ, anh chị em, con cái).
  4. *Career & Education Screen*: Công việc, học vấn, cơ hội nghề nghiệp khả dụng.
  5. *Memories Screen*: Dòng thời gian các ký ức đáng nhớ.
  6. *Statistics Screen*: Bảng thống kê chi tiết toàn bộ đời sống.
  7. *Settings Screen*: Âm lượng, chế độ Iron Life, ngôn ngữ (Tiếng Việt / English).
