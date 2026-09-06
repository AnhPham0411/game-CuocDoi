# LIFE — SỔ TAY THIẾT KẾ SỰ KIỆN (EVENTS.MD)

Dành cho Game Designer và Content Writer.
**Quy tắc số 1**: Designer viết nội dung qua file JSON trong thư mục `packages/content/events/`, tuyệt đối **không** sửa file code `.ts`.

---

## 1. CẤU TRÚC MỘT SỰ KIỆN CHUẨN

```json
{
  "id": "evt_family_001",
  "schemaVersion": 1,
  "contentVersion": 1,
  "category": "FAMILY",
  "importance": 45,
  "decisionType": "SOCIAL",
  "title": "Bữa cơm gia đình cuối tuần",
  "description": "Mẹ gọi bạn xuống ăn cơm, nhưng bạn đang dở một ván game quan trọng cùng bạn bè.",
  "conditions": [
    { "type": "age", "min": 10, "max": 18 }
  ],
  "weight": 100,
  "choices": [
    {
      "id": "eat_family",
      "text": "Bỏ ván game, xuống ăn cơm cùng gia đình",
      "effects": [
        {
          "type": "RELATIONSHIP_CHANGE",
          "relationshipPayload": { "target": "mother", "field": "closeness", "delta": 5 }
        },
        { "type": "STAT_CHANGE", "field": "happiness", "value": 3 }
      ]
    },
    {
      "id": "stay_game",
      "text": "Bảo mẹ chờ một chút rồi tiếp tục chơi",
      "effects": [
        {
          "type": "RELATIONSHIP_CHANGE",
          "relationshipPayload": { "target": "mother", "field": "closeness", "delta": -5 }
        },
        { "type": "STAT_CHANGE", "field": "stress", "value": -3 }
      ]
    }
  ],
  "cooldownMonths": 6,
  "tags": ["family", "childhood", "mother"]
}
```

---

## 2. BỘ 15 VÍ DỤ ĐIỀU KIỆN (CONDITIONS) MẪU CHO DESIGNER

### 1. Điều kiện theo độ tuổi
```json
{ "type": "age", "min": 15, "max": 18 }
```

### 2. Điều kiện chỉ số sức khỏe thấp
```json
{ "type": "stat", "field": "health", "op": "<", "value": 40 }
```

### 3. Điều kiện tài sản tối thiểu (đủ tiền mua xe)
```json
{ "type": "money", "op": ">=", "value": 5000 }
```

### 4. Điều kiện tính cách: Lòng trắc ẩn cao
```json
{ "type": "personality", "axis": "empathy", "op": ">=", "value": 70 }
```

### 5. Điều kiện tính cách: Thích mạo hiểm
```json
{ "type": "personality", "axis": "risk_tolerance", "op": ">=", "value": 65 }
```

### 6. Điều kiện mối quan hệ: Bạn thân có độ tin cậy cao
```json
{ "type": "relationship", "target": "friend", "field": "trust", "op": ">=", "value": 75 }
```

### 7. Điều kiện mối quan hệ: Xung đột gia đình nghiêm trọng
```json
{ "type": "relationship", "target": "father", "field": "conflict", "op": ">=", "value": 60 }
```

### 8. Điều kiện sở hữu đặc điểm tính cách (Trait)
```json
{ "type": "trait", "id": "trait_insomnia", "has": true }
```

### 9. Điều kiện nhớ về biến cố tuổi thơ (Memory Tag)
```json
{ "type": "memory", "tag": "last_trip_with_grandmother" }
```

### 10. Điều kiện tình trạng việc làm
```json
{ "type": "career", "hasJob": true, "minSalary": 2000 }
```

### 11. Điều kiện học vấn: Đã tốt nghiệp đại học
```json
{ "type": "education", "minLevel": "bachelor", "completed": true }
```

### 12. Điều kiện đã từng trải qua một sự kiện trong quá khứ
```json
{ "type": "event_seen", "eventId": "evt_highschool_confession", "seen": true }
```

### 13. Điều kiện kết hợp AND (Cả hai đều phải đúng)
```json
{
  "type": "and",
  "conditions": [
    { "type": "age", "min": 18, "max": 24 },
    { "type": "stat", "field": "money", "op": "<", "value": 500 }
  ]
}
```

### 14. Điều kiện kết hợp OR (Một trong hai đúng)
```json
{
  "type": "or",
  "conditions": [
    { "type": "relationship", "target": "friend", "field": "closeness", "op": ">=", "value": 80 },
    { "type": "relationship", "target": "sibling", "field": "closeness", "op": ">=", "value": 80 }
  ]
}
```

### 15. Điều kiện phủ định NOT
```json
{
  "type": "not",
  "condition": { "type": "trait", "id": "fear_of_heights", "has": true }
}
```

---

## 3. CÁCH CHẠY KIỂM THỰC NỘI DUNG
Sau khi viết file sự kiện mới trong `packages/content/events/`:
Chỉ cần mở terminal và gõ:
```bash
pnpm validate:content
```
Hệ thống sẽ quét cú pháp, kiểm tra ID trùng lặp, logic hợp lệ và đưa ra thông báo:
`Errors: 0 | Warnings: 0`.
