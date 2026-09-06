# LIFE — PRODUCTION BLUEPRINT

## Game mô phỏng cuộc đời theo lựa chọn, hệ quả và ký ức

## 1. TẦM NHÌN SẢN PHẨM

### 1.1. High concept

Người chơi tạo một con người từ khi sinh ra, sống qua các giai đoạn của cuộc đời và chết.

Người chơi không điều khiển nhân vật theo kiểu di chuyển tự do. Thay vào đó, họ đưa ra:

* các quyết định lớn;
* các quyết định nhỏ;
* phản ứng trước sự kiện;
* cách đối xử với người khác;
* cách sử dụng thời gian;
* lựa chọn nghề nghiệp;
* lựa chọn tình yêu;
* cách xử lý tiền bạc;
* những việc tưởng như vô nghĩa ở hiện tại nhưng có thể tạo hậu quả hàng chục năm sau.

Mục tiêu không phải:

> "Tìm ending tốt nhất."

Mục tiêu là:

> "Sống một cuộc đời mà chính mình tạo ra."

---

# 2. NGUYÊN TẮC THIẾT KẾ CỐT LÕI

Game phải tuân thủ 7 nguyên tắc.

### P1 — Không có "đường ray" cố định

Không được thiết kế:

```text
Choice A → Ending A
Choice B → Ending B
```

thành cấu trúc chính.

Thay vào đó:

```text
Choice
  ↓
State change
  ↓
Event eligibility thay đổi
  ↓
Quan hệ thay đổi
  ↓
Cơ hội thay đổi
  ↓
Các lựa chọn tương lai thay đổi
```

---

### P2 — Quyết định nhỏ cũng có giá trị

Ví dụ:

> 9 tuổi: Mẹ rủ đi thăm bà.

Nếu đi:

```text
mother_relationship +1
grandmother_relationship +3
memory("last_trip_with_grandmother")
```

Nếu không đi:

```text
time_saved +1
mother_relationship -1
```

Ban đầu gần như không có gì xảy ra.

Nhưng 30 năm sau, sự kiện liên quan đến bà có thể kiểm tra memory đó.

---

### P3 — Không phải lựa chọn nào cũng phải có hậu quả

Đây là điều cực quan trọng.

Nếu:

> "Bạn ăn bánh mì hay phở?"

mà game cho hậu quả:

> "30 năm sau bạn mất việc vì ngày hôm đó ăn phở"

thì game trở nên giả tạo.

Hệ thống phải phân biệt:

```text
COSMETIC CHOICE
MINOR CHOICE
MEANINGFUL CHOICE
MAJOR CHOICE
LIFE-ALTERING CHOICE
```

---

### P4 — Không phải hậu quả nào cũng nhìn thấy ngay

Game cần trì hoãn consequence.

Ví dụ:

```text
Age 14
Bạn bảo vệ một người bạn.

↓

friendship +20

↓

Age 23
Bạn gặp khó khăn xin việc.

↓

Người bạn đó giới thiệu bạn vào công ty.
```

Người chơi nhận ra:

> "À, hóa ra chuyện năm 14 tuổi vẫn còn ảnh hưởng."

Đây là cảm giác cốt lõi cần tạo.

---

### P5 — Random không được biến game thành roulette

Random event phải bị giới hạn bởi:

```text
Age
Location
Socioeconomic status
Health
Relationships
Personality
Career
Past events
World state
```

Không được:

```text
random() → billionaire
```

một cách vô lý.

---

### P6 — Không có "best life"

Một đời:

```text
$10,000,000
2 children
perfect health
perfect marriage
100 happiness
```

không nhất thiết là tốt nhất.

Một đời khác:

```text
$80,000
single
one child
average health
strong friendships
```

có thể được nhân vật nhớ là hạnh phúc hơn.

---

### P7 — Người chơi phải có thể kể lại cuộc đời

Sau khi chơi xong, người chơi phải có cảm giác:

> "Để tôi kể bạn nghe chuyện đời tôi."

Đây là KPI thiết kế quan trọng hơn số lượng ending.

---

# 3. CẤU TRÚC MỘT LIFE RUN

Một run hoàn chỉnh:

```text
CHARACTER CREATION
        ↓
BIRTH
        ↓
EARLY CHILDHOOD
0–5
        ↓
CHILDHOOD
6–11
        ↓
ADOLESCENCE
12–17
        ↓
YOUNG ADULT
18–25
        ↓
ADULT
26–40
        ↓
MIDDLE AGE
41–60
        ↓
OLD AGE
61+
        ↓
DEATH
        ↓
LIFE SUMMARY
```

Không bắt buộc mọi nhân vật phải chết ở cùng độ tuổi.

---

# 4. CHARACTER CREATION

Người chơi chọn:

## 4.1. Giới tính

MVP:

```text
Male
Female
```

Sau đó có thể mở rộng hệ thống gender/identity nếu phù hợp với định hướng game.

---

## 4.2. Sinh ra ở đâu

Ví dụ:

```text
Urban
Suburban
Rural
```

---

## 4.3. Gia cảnh

Không nên cho người chơi chọn trực tiếp:

> "Gia đình giàu 100/100."

Thay vào đó tạo từ các biến.

```text
family_income
housing_quality
parent_education
family_size
financial_stability
social_capital
```

Sau đó engine phân loại thành:

```text
Very Poor
Poor
Lower Middle
Middle
Upper Middle
Rich
Very Rich
```

---

# 5. CHARACTER STATE

Đây là object quan trọng nhất của toàn game.

Ví dụ:

```typescript
interface CharacterState {
    id: string;

    age: number;
    ageMonths: number;

    gender: Gender;

    locationId: string;

    money: number;

    health: number;
    happiness: number;
    stress: number;

    education: EducationState;
    career: CareerState;

    personality: PersonalityState;

    skills: SkillState;

    relationships: RelationshipState[];

    family: FamilyMember[];

    memories: Memory[];

    traits: Trait[];

    goals: Goal[];

    reputation: ReputationState;

    inventory: InventoryItem[];

    statusEffects: StatusEffect[];

    statistics: LifeStatistics;
}
```

---

# 6. PERSONALITY SYSTEM

Không dùng một vài lựa chọn:

```text
Good
Bad
```

Mà dùng vector nhiều chiều.

Ví dụ:

```text
openness
conscientiousness
extraversion
agreeableness
neuroticism
ambition
risk_tolerance
empathy
discipline
curiosity
```

Mỗi giá trị:

```text
0 → 100
```

Ví dụ:

```text
empathy = 82
ambition = 64
risk_tolerance = 23
discipline = 71
```

Personality thay đổi dần theo:

```text
genetics
childhood
experience
relationships
trauma
success
failure
```

Không cho phép một lựa chọn làm:

```text
empathy 10 → 90
```

ngay lập tức trừ khi sự kiện cực lớn.

---

# 7. RELATIONSHIP SYSTEM

Mỗi NPC quan trọng là một object riêng.

```typescript
interface Relationship {
    npcId: string;

    closeness: number;
    trust: number;
    respect: number;
    conflict: number;
    dependence: number;

    interactionFrequency: number;

    relationshipType:
        | "parent"
        | "sibling"
        | "friend"
        | "partner"
        | "spouse"
        | "child"
        | "coworker"
        | "teacher"
        | "neighbor";

    importantMemories: string[];
}
```

Ví dụ:

```text
Minh
friendship:
82

trust:
91

respect:
75

conflict:
12
```

Không dùng một `friendship = 50` duy nhất.

Điều này cho phép:

> "Tôi rất thân với người này nhưng không còn tin họ."

---

# 8. MEMORY SYSTEM

Memory là thành phần cực quan trọng để tạo "hậu quả dài hạn".

```typescript
interface Memory {
    id: string;
    timestamp: GameDate;

    type: MemoryType;

    participants: string[];

    emotionalWeight: number;

    importance: number;

    tags: string[];

    sourceEventId: string;
}
```

Ví dụ:

```json
{
  "id": "mem_0291",
  "type": "family",
  "importance": 81,
  "emotionalWeight": 92,
  "tags": [
    "grandmother",
    "childhood",
    "regret"
  ]
}
```

Khi NPC chết hoặc một sự kiện tương tự xảy ra, game có thể kiểm tra memory.

---

# 9. EVENT ENGINE

Đây là "trái tim" kỹ thuật.

Mỗi event gồm:

```text
ID
TITLE
DESCRIPTION
TRIGGER CONDITIONS
WEIGHT
CHOICES
CONSEQUENCES
FOLLOW-UP EVENTS
COOLDOWN
TAGS
```

Ví dụ:

```json
{
  "id": "evt_child_friend_001",

  "title": "Your friend is being bullied",

  "conditions": {
    "age": {
      "min": 10,
      "max": 13
    },

    "relationship.friend.trust": {
      "min": 50
    }
  },

  "choices": [
    {
      "id": "help",
      "text": "Stand up for your friend",

      "effects": [
        {
          "type": "relationship",
          "target": "friend",
          "field": "trust",
          "value": 15
        }
      ]
    },

    {
      "id": "ignore",
      "text": "Stay out of it",

      "effects": [
        {
          "type": "relationship",
          "target": "friend",
          "field": "trust",
          "value": -10
        }
      ]
    }
  ]
}
```

---

# 10. EVENT SELECTION

Không phải cứ đủ condition là event xuất hiện.

Engine phải tính:

```text
Eligibility
×
Weight
×
Context
×
Recent history
×
Randomness
```

Ví dụ:

```typescript
score =
    baseWeight
    * ageFactor
    * personalityFactor
    * relationshipFactor
    * locationFactor
    * worldFactor
    * noveltyFactor;
```

Sau đó weighted random.

---

# 11. EVENT CATEGORIES

Mỗi event thuộc một category.

```text
LIFE
FAMILY
FRIENDSHIP
ROMANCE
SCHOOL
CAREER
MONEY
HEALTH
CRIME
ACCIDENT
TRAVEL
HOBBY
SOCIAL
POLITICS
TECHNOLOGY
CULTURE
PARENTING
AGING
DEATH
```

MVP chỉ cần:

```text
FAMILY
FRIENDSHIP
SCHOOL
ROMANCE
CAREER
MONEY
HEALTH
RANDOM
```

---

# 12. EVENT IMPORTANCE

Mỗi event:

```text
importance = 1–100
```

Phân loại:

```text
1–20
Flavour

21–40
Minor

41–60
Meaningful

61–80
Major

81–100
Life-changing
```

Flavour event chủ yếu làm thế giới sống động.

Life-changing event làm thay đổi trạng thái sâu.

---

# 13. DECISION TYPES

## Type A — Instant

```text
Bạn ăn sáng gì?
```

Tác động rất nhỏ.

---

## Type B — Social

```text
Bạn có xin lỗi bạn không?
```

Tác động relationship.

---

## Type C — Strategic

```text
Bạn đi học tiếp hay đi làm?
```

Tác động trajectory.

---

## Type D — Moral

```text
Bạn có nói thật không?
```

Tác động personality/reputation/relationship.

---

## Type E — Irreversible

```text
Bạn có kết hôn không?
```

Có thể thay đổi toàn bộ hệ thống sau đó.

---

# 14. CONSEQUENCE SYSTEM

Mỗi choice tạo effect.

```typescript
interface Effect {
    type: EffectType;

    target?: string;

    field?: string;

    value?: number;

    duration?: number;

    condition?: Condition;

    followUpEvent?: string;
}
```

Các effect type:

```text
STAT_CHANGE
RELATIONSHIP_CHANGE
MONEY_CHANGE
SKILL_CHANGE
TRAIT_ADD
TRAIT_REMOVE
MEMORY_ADD
STATUS_ADD
STATUS_REMOVE
UNLOCK_EVENT
LOCK_EVENT
CREATE_NPC
KILL_NPC
MOVE
CAREER_CHANGE
EDUCATION_CHANGE
GOAL_CHANGE
```

---

# 15. TEMPORARY VS PERMANENT EFFECT

Ví dụ:

```text
stress +20
duration = 3 months
```

khác:

```text
trait = "Trust Issues"
permanent
```

Engine phải hỗ trợ cả hai.

---

# 16. LIFE PATH

Không hard-code:

```text
doctor ending
lawyer ending
artist ending
```

Thay vào đó career path được tạo từ state.

Ví dụ:

```text
education
skills
connections
money
personality
experience
```

→ determine available careers.

Một người:

```text
education = low
social_skill = high
money = low
ambition = high
```

có thể mở:

```text
sales
entrepreneurship
service
management
```

trong khi:

```text
education = high
discipline = high
curiosity = high
```

có thể mở:

```text
medicine
research
engineering
academia
```

---

# 17. CAREER SYSTEM

Mỗi career:

```typescript
interface Career {
    id: string;

    requiredEducation: number;

    requiredSkills: SkillRequirement[];

    salaryRange: [number, number];

    stress: number;

    prestige: number;

    stability: number;

    socialExposure: number;
}
```

Các nghề không chỉ khác tiền.

Chúng ảnh hưởng:

```text
time
stress
health
relationships
location
social network
status
future opportunities
```

---

# 18. FAMILY GENERATION

NPC không được random hoàn toàn.

Khi sinh:

```text
child
+
parents
+
siblings
```

phải tạo network.

Ví dụ:

```text
Character
├── Father
├── Mother
├── Older Sister
└── Younger Brother
```

Khi lớn:

```text
Partner
└── Children
```

Mục tiêu cuối cùng là tạo:

> **family tree**

---

# 19. WORLD SIMULATION

Không nên mô phỏng cả thế giới.

Chỉ mô phỏng:

### Layer 1 — Character

Nhân vật chính.

### Layer 2 — Close Network

```text
parents
siblings
partner
children
best friends
boss
teachers
```

### Layer 3 — Abstract World

```text
economy
job market
technology
politics
housing
health system
```

Layer 3 dùng các biến tổng quát.

Điều này giảm workload cực mạnh.

---

# 20. TIME SYSTEM

MVP:

```text
1 decision ≈ several weeks/months
```

Không mô phỏng từng ngày.

Các mốc:

```text
Age
Year
Month
```

Event system dùng tuổi + khoảng thời gian.

Sau này có thể dùng:

```text
GameDate {
  year,
  month,
  day
}
```

nhưng không cần ngay từ đầu.

---

# 21. AGE GATING

Mỗi event có:

```text
minAge
maxAge
```

Ngoài ra:

```text
relationship
education
career
health
location
money
personality
previousEvents
```

Ví dụ event:

> "Apply to university"

chỉ hợp lệ:

```text
age = 17–21
high school completed
```

---

# 22. LIFE STAGE SYSTEM

Mỗi life stage có event pool riêng.

```text
Childhood:
    family 30%
    school 30%
    friendship 25%
    random 15%

Teen:
    school 25%
    friendship 20%
    romance 20%
    family 15%
    career 10%
    random 10%

Young Adult:
    career 30%
    romance 20%
    money 15%
    friendship 10%
    family 10%
    random 15%
```

Tỷ lệ chỉ là starting value.

Sau playtest phải điều chỉnh.

---

# 23. MAJOR MILESTONES

Một số event phải được đảm bảo có mặt:

```text
first day of school
graduation
first job
first serious relationship
leaving home
marriage opportunity
career crisis
parent aging
possible children
retirement
death
```

Nhưng cách chúng xảy ra phải thay đổi theo state.

---

# 24. RANDOM EVENTS

Ví dụ:

```text
sudden illness
unexpected gift
accident
meeting someone
job opportunity
lost wallet
new friendship
family conflict
inheritance
economic crisis
```

Điều kiện phải thực tế.

Ví dụ:

```text
inheritance
```

không random cho tất cả người chơi.

Cần:

```text
relative exists
relative dies
relationship >= X
inheritance enabled
```

---

# 25. HEALTH SYSTEM

Không mô phỏng y khoa quá chi tiết.

Chỉ cần:

```text
physicalHealth
mentalWellbeing
chronicConditions
injury
lifeExpectancyFactor
```

Health bị ảnh hưởng bởi:

```text
age
stress
money
lifestyle
random events
access to healthcare
```

---

# 26. HAPPINESS SYSTEM

Không được:

```text
happiness = average(all stats)
```

Hạnh phúc nên là state có inertia.

Ví dụ:

```text
happiness[t+1] =
    happiness[t] * 0.8
    + recentEvents * 0.1
    + relationships * 0.05
    + financialSecurity * 0.05
```

Có giới hạn và smoothing.

Người chơi không được thấy công thức.

---

# 27. SECRET STATE

Có các biến người chơi không được biết trực tiếp.

Ví dụ:

```text
loneliness
regret
burnout
social_pressure
self_worth
attachment
family_responsibility
```

Những biến này giúp event selection và narrative logic phong phú hơn.

---

# 28. NARRATIVE GENERATION

Không nên để AI tự viết toàn bộ game logic.

AI có thể hỗ trợ:

```text
dialogue variation
event description
life summary
NPC flavour text
localization draft
```

Nhưng:

```text
state
conditions
effects
relationships
economy
```

phải deterministic bằng code/data.

AI không được quyết định tùy tiện:

> "Vì bạn từng buồn nên tài khoản ngân hàng giảm 2.000 đô."

---

# 29. LIFE SUMMARY

Sau death:

```text
YOUR LIFE
```

Hiển thị:

```text
Born
Died
Career
Education
Relationships
Children
Wealth
Major achievements
Major failures
Important memories
Places lived
People remembered
```

Ví dụ:

```text
You lived for 78 years.

You changed careers 4 times.

You had 3 children.

You remained friends with Minh for 61 years.

You lost your company at 43.

You rebuilt your career at 47.

Your daughter visited you 212 times.

At 78, you died peacefully.

Your family remembered you as:
"A person who always came back."
```

---

# 30. EPITAPH / LIFE TITLE

Tạo title tự động.

Ví dụ:

```text
The Survivor
The Explorer
The Family Man
The Lonely Genius
The Opportunist
The Dreamer
The Failed Millionaire
The Teacher
The Wanderer
The Peacemaker
```

Không dựa vào ending cố định.

Dựa trên life statistics.

---

# 31. SHAREABLE LIFE CARD

Sau mỗi run:

```text
┌────────────────────────────┐
│       MY LIFE              │
│                            │
│ Born: 2004                 │
│ Died: 2082                 │
│                            │
│ Career: Engineer            │
│ Children: 2               │
│ Wealth: $421,000           │
│ Happiness: 81              │
│                            │
│ "The Peacemaker"            │
│                            │
│ Major choice:              │
│ Forgave my brother at 37.  │
│                            │
│ [ SHARE ]                  │
└────────────────────────────┘
```

Không đưa thông tin nhạy cảm hoặc identifier người chơi lên ảnh share.

---

# 32. USER INTERFACE

MVP nên là:

```text
┌─────────────────────────────────────┐
│ AGE 17                     MONEY     │
│                            $12,450   │
├─────────────────────────────────────┤
│                                     │
│        [ SCENE / CHARACTER ]        │
│                                     │
│ "Your father lost his job."        │
│                                     │
│ You can...                          │
│                                     │
│ [ Help him ]                        │
│ [ Stay silent ]                     │
│ [ Find work for him ]               │
│                                     │
├─────────────────────────────────────┤
│ Health  ████████░░                  │
│ Happiness ███████░░░                │
│                                     │
│ Relationships | Career | Memories   │
└─────────────────────────────────────┘
```

---

# 33. NAVIGATION

Các tab:

```text
LIFE
RELATIONSHIPS
FAMILY
CAREER
MEMORIES
STATISTICS
SETTINGS
```

Không mở quá nhiều UI cùng lúc.

---

# 34. SAVE SYSTEM

Mỗi run có:

```text
save_slot
character_state
world_state
event_history
rng_seed
version
```

Quan trọng nhất:

### RNG seed

Lưu seed để bug có thể tái hiện.

```text
runSeed = 918273645
```

Nếu tester báo:

> "Ở tuổi 37 xảy ra bug."

Developer có thể load đúng sequence.

---

# 35. EVENT LOG

Luôn lưu:

```text
eventId
date
choiceId
stateBefore
stateAfter
```

Không nhất thiết lưu toàn bộ snapshot mỗi frame.

Có thể:

```text
snapshot every major milestone
+
event journal
```

---

# 36. DEBUG MODE

Developer build phải có:

```text
Set Age
Set Money
Set Relationship
Add Trait
Trigger Event
Kill NPC
Create NPC
Teleport
Skip Year
View State
View Event Conditions
View RNG Seed
```

Đây là tính năng **bắt buộc**.

Không có debug tools, content testing sẽ cực kỳ đau đớn.

---

# 37. CONTENT FORMAT

Event không hard-code bằng UI.

Dùng:

```text
JSON
YAML
CSV
```

Ví dụ:

```text
/content
    /events
    /characters
    /careers
    /traits
    /items
    /locations
    /dialogue
```

Một designer có thể thêm event mà không sửa source code.

---

# 38. ĐỀ XUẤT TECH STACK

Với loại game này, mình khuyên:

### Engine

```text
Unity
```

hoặc

```text
Godot
```

Nếu mục tiêu là Steam PC và game thiên narrative/UI, cả hai đều phù hợp.

Nếu team ít người và bạn đã quen C#:

> **Unity + C#**

là lựa chọn thực dụng.

---

# 39. SOFTWARE ARCHITECTURE

Không viết tất cả trong một GameManager.

Đề xuất:

```text
Game
├── Core
│   ├── GameLoop
│   ├── GameClock
│   ├── SaveSystem
│   └── RandomSystem
│
├── Simulation
│   ├── CharacterSystem
│   ├── RelationshipSystem
│   ├── MemorySystem
│   ├── CareerSystem
│   ├── FamilySystem
│   ├── HealthSystem
│   └── WorldSystem
│
├── Narrative
│   ├── EventDatabase
│   ├── EventResolver
│   ├── ConditionEvaluator
│   ├── EffectExecutor
│   └── NarrativeGenerator
│
├── UI
│   ├── LifeScreen
│   ├── EventScreen
│   ├── RelationshipScreen
│   ├── CareerScreen
│   ├── MemoryScreen
│   └── SummaryScreen
│
└── Content
    ├── Events
    ├── Careers
    ├── Traits
    ├── Locations
    └── Dialogue
```

---

# 40. EVENT RESOLUTION PIPELINE

Mỗi turn:

```text
1. Advance time

2. Update temporary effects

3. Update relationships

4. Update career/education

5. Update health

6. Evaluate life milestones

7. Collect eligible events

8. Remove blocked events

9. Calculate event weights

10. Select event

11. Present event

12. Player chooses

13. Apply effects

14. Create memories

15. Schedule future consequences

16. Save
```

Đây là main gameplay loop.

---

# 41. FUTURE CONSEQUENCE QUEUE

Để xử lý hậu quả dài hạn:

```typescript
interface ScheduledEvent {
    triggerDate: GameDate;

    eventId: string;

    conditions: Condition[];

    priority: number;
}
```

Ví dụ:

```text
Age 14:
Helped friend.

Schedule:
age 22–30
friend_can_offer_job
```

Khi đến khoảng thời gian:

```text
check conditions
```

Nếu không còn phù hợp:

```text
cancel
```

Nếu phù hợp:

```text
trigger
```

---

# 42. EVENT CHAIN

Event có thể tạo event khác.

```text
EVENT A
 ↓
EVENT B
 ↓
EVENT C
```

Nhưng nên giới hạn depth.

Ví dụ:

```text
maxChainDepth = 5
```

để tránh narrative cascade không kiểm soát.

---

# 43. ANTI-EXPLOSION RULE

Không bao giờ cho event tạo vô hạn NPC hoặc relationship.

Mỗi category cần quota.

Ví dụ:

```text
closeFriends <= 8
coreNPCs <= 50
majorMemories <= 500
activeRelationships <= 100
```

NPC không quan trọng có thể được abstract hóa.

---

# 44. NPC IMPORTANCE TIERS

### Tier 1

Gia đình, partner, con.

Full simulation.

### Tier 2

Bạn thân, boss, teacher.

Medium simulation.

### Tier 3

Đồng nghiệp, hàng xóm.

Simplified state.

### Tier 4

Người gặp một lần.

Chỉ cần:

```text
name
role
event reference
```

Không cần tồn tại mãi trong simulation.

---

# 45. CONTENT TARGET CHO MVP

Không cần 10.000 event.

MVP:

```text
300–500 events
30 careers
30 traits
50 NPC archetypes
20 locations
100 relationship events
50 family events
50 school events
50 career events
50 romance events
50 random events
```

Nhưng mỗi event phải có nhiều điều kiện.

500 event tốt > 5.000 event nông.

---

# 46. CONTENT TARGET CHO FULL RELEASE

Có thể hướng đến:

```text
1,500–3,000 meaningful events
100+ careers
100+ traits/statuses
hundreds of NPC templates
hundreds of relationship interactions
multiple family structures
multiple socioeconomic conditions
```

Không cần viết hàng triệu ending.

---

# 47. REPLAYABILITY

Sau một run, game hỏi:

```text
START NEW LIFE
```

Mỗi run phải random:

```text
family
starting personality tendencies
location
siblings
early events
NPCs
economic conditions
```

Nhưng không random vô nghĩa.

---

# 48. CHỐNG SAVE-SCUM

Không ép người chơi không reload.

Thay vào đó:

### Casual

Có thể save/reload.

### Iron Life

Một đời duy nhất.

Có thể thêm:

```text
Iron Life
No reloading
Unique badge/stat
```

Điều này tăng replayability mà không làm game khó chịu.

---

# 49. DIFFICULTY

Không cần difficulty kiểu:

```text
Easy
Normal
Hard
```

MVP nên:

```text
Standard Life
```

Sau này:

```text
Long Life
Short Life
Iron Life
Chaos Mode
```

---

# 50. TẠO "WOW MOMENTS"

Mỗi run phải có ít nhất vài event đặc biệt.

Ví dụ:

```text
You haven't spoken to your brother in 17 years.

Today, he called.
```

Hoặc:

```text
At age 64, you unexpectedly met your childhood teacher.
```

Những khoảnh khắc này khiến người chơi nhớ game.

---

# 51. META-PROGRESSION

Không dùng progression làm mất ý nghĩa simulation.

Có thể unlock:

```text
new locations
new career pools
new event themes
new starting conditions
new life challenges
```

Nhưng không:

> "Chơi 10 lần để mở +50% money."

Nếu có meta progression, nên phục vụ **content**, không phá balance.

---

# 52. ARCHITECTURE CHO CONTENT TEAM

Designer không cần biết code.

Họ viết:

```text
Event ID
Title
Description
Age
Conditions
Choices
Effects
Tags
```

Programmer cung cấp condition/effect primitives.

Ví dụ designer có thể dùng:

```text
age >= 18
money >= 1000
relationship(friend_01).trust > 60
trait == ambitious
memory("childhood_loss")
```

---

# 53. VERSIONING EVENT

Mỗi event:

```text
schemaVersion
contentVersion
```

Ví dụ:

```text
evt_000182
v3
```

Nếu sửa data:

```text
migration
```

không làm save game cũ chết.

---

# 54. ANALYTICS

Khi game public, cần biết người chơi đang làm gì.

Thu thập **tối thiểu và tôn trọng quyền riêng tư**:

```text
run_started
run_completed
age_reached
event_seen
choice_selected
run_abandoned
death_age
```

Không cần thu thập nội dung cá nhân.

Các metric:

```text
Average run length
Average age reached
Most selected choices
Most abandoned age
Most common careers
Replay rate
```

---

# 55. FUNNEL

Theo dõi:

```text
Game launched
↓
First event
↓
Age 10
↓
Age 18
↓
Age 25
↓
Age 40
↓
Death
↓
New Life
```

Nếu 80% người chơi bỏ ở tuổi 12:

> vấn đề không phải marketing.

> **gameplay đang không đủ hấp dẫn.**

---

# 56. PLAYTEST KPI

Vertical Slice:

```text
10 người chơi
```

Mục tiêu:

```text
≥ 7 người muốn chơi tiếp
```

Public prototype:

```text
50–100 players
```

Mục tiêu:

```text
≥ 30% replay
```

Demo:

```text
500+ players
```

Theo dõi:

```text
completion
replay
session length
quit points
```

Đây là target nội bộ để ra quyết định, không phải tiêu chuẩn Steam.

---

# 57. VERTICAL SLICE

Không làm toàn game.

Chỉ:

```text
Age 0 → 25
```

Có:

```text
birth
family
school
friend
first crush
education
first job
first major decision
```

Khoảng:

```text
100 events
```

Mục tiêu:

> Người chơi phải muốn chơi lại ngay sau khi chết.

---

# 58. PRODUCTION PHASE 1 — PRE-PRODUCTION

Thời gian:

```text
2–4 tuần
```

Tạo:

```text
GDD
Technical Design Document
Event Schema
Character Schema
UI Wireframe
Art Direction
MVP scope
```

Không viết 1.000 event ở giai đoạn này.

---

# 59. PHASE 2 — TECH PROTOTYPE

Khoảng:

```text
4–8 tuần
```

Implement:

```text
Character
Time
State
Event engine
Choice
Effect
Relationship
Memory
Save/load
```

Chưa cần art đẹp.

---

# 60. PHASE 3 — VERTICAL SLICE

Khoảng:

```text
6–10 tuần
```

Làm hoàn chỉnh:

```text
Birth → 25
```

Có UI + art + sound cơ bản.

---

# 61. PHASE 4 — EXTERNAL TESTING

Đưa cho người ngoài team.

Không giải thích game quá nhiều.

Quan sát:

```text
Họ có hiểu không?
Họ có tò mò không?
Họ có đọc text không?
Họ có replay không?
Họ có kể lại một sự kiện không?
```

Một câu feedback cực giá trị:

> "Tôi muốn biết chuyện gì xảy ra tiếp theo."

---

# 62. PHASE 5 — FULL SIMULATION

Mở rộng:

```text
0 → death
```

thêm:

```text
career
marriage
children
aging
health
retirement
inheritance
death
```

---

# 63. PHASE 6 — POLISH

Thêm:

```text
animations
sound
music
transition
microinteraction
visual feedback
life summary
share card
```

---

# 64. ART DIRECTION

Mình không khuyên realism 3D.

Game này phù hợp:

> **2D illustrated / stylized UI**

Mỗi event có:

```text
background
character portrait
emotion
props
```

Không cần tạo asset riêng cho mọi event.

Có thể tái sử dụng:

```text
50 backgrounds
100 character portraits
200 props
```

→ tổ hợp được hàng nghìn cảnh.

---

# 65. CHARACTER ART

NPC có:

```text
base face
hair
clothes
age variant
emotion
```

Ví dụ cùng NPC:

```text
10 years old
18 years old
30 years old
50 years old
70 years old
```

Không cần vẽ hoàn toàn 5 nhân vật riêng nếu pipeline cho phép modular.

---

# 66. AUDIO

MVP:

```text
UI sounds
event transition
button sounds
ambient
light music
major event stingers
```

Không cần voice acting đầy đủ.

Narrative game có quá nhiều text; full voice sẽ tăng production cost cực mạnh.

---

# 67. LOCALIZATION

Text phải tách khỏi code.

```text
event_001.title
event_001.description
event_001.choice_1
```

Không hard-code tiếng Anh trong source.

MVP:

```text
English
Vietnamese
```

Full launch có thể mở rộng dựa trên dữ liệu người chơi.

---

# 68. STEAM STRATEGY

Không chờ game hoàn thành mới tạo store page.

Steam khuyến nghị đưa Coming Soon page lên khi bạn đã đủ sẵn sàng công khai game; page giúp xây audience và wishlist, và với sản phẩm mới cần có Coming Soon page công khai ít nhất 2 tuần trước release.

Khi có:

```text
logo
capsule
screenshots
short gameplay trailer
core feature set
```

→ đưa store page lên.

---

# 69. STEAM STORE PAGE

Page phải truyền đạt trong vài giây:

```text
LIVE A LIFE.
EVERY CHOICE CHANGES WHAT COMES NEXT.
```

Gameplay GIF/screenshot phải cho thấy:

```text
decision
consequence
relationships
life summary
```

Không dùng artwork đẹp nhưng không thể hiện gameplay làm hình ảnh chính.

---

# 70. TRAILER

Trailer 60–90 giây.

### 0–5s

Hook:

> "What if you could live an entire life?"

### 5–20s

Birth → childhood.

### 20–40s

Choices.

### 40–60s

Consequences.

### 60–75s

Several radically different lives.

### 75–90s

Life summary + title.

Ending:

> **You only get one life.**

---

# 71. WISHLIST MACHINE

Mọi video/social post phải dẫn về:

```text
Steam Wishlist
```

Không chỉ:

> "Follow us."

Mục tiêu:

```text
TikTok
YouTube
Reddit
Discord
Press
Creators
        ↓
Steam Page
        ↓
Wishlist
```

---

# 72. CONTENT MARKETING

Game này đặc biệt phù hợp short-form.

Các format:

### "I made the worst possible life."

### "One decision ruined 50 years."

### "I tried to become a billionaire."

### "I refused to talk to my father."

### "This random choice came back 30 years later."

### "Two people played the same game. Their lives were completely different."

Mỗi video phải cho thấy **actual gameplay**.

---

# 73. CREATOR STRATEGY

Trước demo lớn:

```text
send keys
```

cho:

```text
small streamers
medium YouTubers
TikTok creators
simulation creators
story-game creators
```

Không chỉ gửi cho các kênh khổng lồ.

Một creator nhỏ rất phù hợp đôi khi đem lại feedback tốt hơn một creator lớn.

---

# 74. COMMUNITY

Discord nên có:

```text
announcements
bug-reports
suggestions
life-stories
screenshots
showcase
```

Channel:

> `#my-life`

rất quan trọng.

Người chơi đăng:

> "Đây là cuộc đời tôi vừa tạo."

Community tự biến thành content.

---

# 75. DEMO DESIGN

Demo không nên đơn giản là:

> "Chapter 1 của full game."

Mà nên là:

```text
Birth → Age 25
```

với đủ hệ thống:

```text
family
friend
school
romance
career
money
memory
consequence
```

Người chơi phải cảm nhận được **toàn bộ concept**.

---

# 76. STEAM NEXT FEST

Steam tổ chức Next Fest 3 lần mỗi năm; các game chưa phát hành có demo chơi được có thể tham gia theo điều kiện của từng kỳ.

Tính đến hiện tại, Steam đã công bố:

```text
February 22 – March 1, 2027
June 14 – June 21, 2027
```

cho các kỳ Next Fest tương ứng.

Với dự án mới, **không nên cố nhảy vào Next Fest chỉ vì deadline**. Chọn kỳ mà demo tốt nhất.

Steam cũng yêu cầu demo phải thực sự playable và có các yêu cầu eligibility cụ thể; một game chỉ được xuất hiện ở Next Fest một lần, nên phải chọn thời điểm có chiến lược.

---

# 77. DEMO FEEDBACK

Trong menu demo phải có:

```text
PLAY
OPTIONS
FEEDBACK
DISCORD
QUIT
```

Steam cũng khuyến nghị đặt đường dẫn feedback ngay trong demo để người chơi dễ gửi phản hồi.

---

# 78. RELEASE PLAN

Không nên:

```text
Finish game
↓
Upload Steam
↓
Release
```

Mà:

```text
Prototype
↓
External test
↓
Steam Coming Soon
↓
Public Demo
↓
Content marketing
↓
Creator campaign
↓
Next Fest / demo event
↓
Polish
↓
Release
```

---

# 79. STEAM LAUNCH

Ở launch:

```text
Game releases
↓
Wishlist notification
↓
Creators publish videos
↓
Social campaign
↓
Community posts
↓
Player reviews
```

Steam cho biết người đã wishlist có thể được thông báo qua email khi game phát hành; launch cũng là lúc game xuất hiện trên các khu vực New Releases và có cơ hội được đề xuất ở các bề mặt khác tùy hiệu suất.

---

# 80. POST-LAUNCH

Đừng kết thúc sau release.

Ví dụ:

```text
Update 1
New family events

Update 2
New careers

Update 3
More romance

Update 4
New countries/locations

Update 5
Community requested events
```

Steam có Update Visibility Rounds để quảng bá các major updates; mỗi sản phẩm bắt đầu với một số visibility rounds và mỗi round có thể chạy tối đa 30 ngày theo các điều kiện của Steam.

---

# 81. SCOPE CONTROL

Đây là luật quan trọng nhất.

## Không làm trong MVP:

```text
open world
real-time movement
multiplayer
voice acting toàn bộ
AI NPC chat tự do
100 quốc gia
1000 nghề
10000 event
full 3D
economy simulation toàn cầu
```

Tất cả đều có thể làm sau.

---

# 82. MVP CHÍNH XÁC

MVP phải có:

```text
Character creation
Birth
Family
Childhood
Teenage
Education
Friendship
Romance
Career
Money
Health
Personality
Relationships
Memory
Random events
Consequences
Save/load
Life summary
Replay
```

Và chỉ cần:

```text
Birth → Age 25
```

---

# 83. DEFINITION OF DONE — MVP

MVP chỉ được coi là xong khi:

```text
[ ] Player tạo nhân vật
[ ] Game tạo gia đình
[ ] Player trải qua tuổi thơ
[ ] Có ít nhất 100 events
[ ] Có decisions
[ ] Decisions ảnh hưởng state
[ ] Relationships thay đổi
[ ] Memory được tạo
[ ] Consequences xuất hiện về sau
[ ] Player có thể học
[ ] Player có thể làm việc
[ ] Player có thể yêu
[ ] Save/load hoạt động
[ ] Có ít nhất 2 life outcomes khác biệt
[ ] Player chơi lại được
```

---

# 84. DEFINITION OF DONE — VERTICAL SLICE

```text
[ ] Birth → 25 hoàn chỉnh
[ ] Art hoàn chỉnh
[ ] UI hoàn chỉnh
[ ] Audio cơ bản
[ ] 100–200 events
[ ] 10+ careers
[ ] Family system
[ ] Relationship system
[ ] Memory system
[ ] Life summary
[ ] No major save corruption
[ ] 20+ người ngoài team test
```

---

# 85. DEFINITION OF DONE — RELEASE

```text
[ ] Full life simulation
[ ] Content QA
[ ] Save migration
[ ] Controller/mouse/keyboard
[ ] Resolution support
[ ] Localization
[ ] Crash reporting
[ ] Steam integration
[ ] Achievements nếu cần
[ ] Cloud save nếu cần
[ ] Store page
[ ] Trailer
[ ] Demo
[ ] Press kit
[ ] Creator keys
[ ] Community
[ ] Launch campaign
```

---

# 86. CẤU TRÚC REPOSITORY

Ví dụ Unity:

```text
LifeGame/
│
├── Assets/
│   ├── Scripts/
│   │   ├── Core/
│   │   ├── Simulation/
│   │   ├── Narrative/
│   │   ├── Save/
│   │   ├── UI/
│   │   └── Steam/
│   │
│   ├── Data/
│   │   ├── Events/
│   │   ├── Careers/
│   │   ├── Traits/
│   │   ├── Characters/
│   │   ├── Locations/
│   │   └── Localizations/
│   │
│   ├── Art/
│   ├── Audio/
│   ├── Prefabs/
│   └── Scenes/
│
├── Tests/
│   ├── Unit/
│   ├── Simulation/
│   ├── Narrative/
│   └── Save/
│
├── Tools/
│   ├── EventValidator/
│   ├── SaveInspector/
│   └── ContentImporter/
│
└── Docs/
    ├── GDD.md
    ├── TECH.md
    ├── EVENTS.md
    └── BALANCE.md
```

---

# 87. TESTING

Phải có unit tests cho:

```text
ConditionEvaluator
EffectExecutor
RelationshipSystem
MemorySystem
SaveSystem
EventSelector
CareerEligibility
```

Ví dụ:

```text
Given:
age = 18
education = high_school

When:
evaluate university event

Then:
eligible = true
```

---

# 88. SIMULATION TEST

Một test quan trọng:

```text
Generate 10,000 lives
```

Không có UI.

Sau đó kiểm tra:

```text
% who die before age 20
% who get married
% avg children
% avg wealth
% impossible states
```

Nếu:

```text
80% become billionaires
```

thì economy đang hỏng.

Nếu:

```text
50% marry at age 8
```

thì condition system hỏng.

Automated simulation test sẽ cực kỳ hữu ích.

---

# 89. CONTENT VALIDATOR

Tool phải kiểm tra:

```text
event ID duplicate
missing localization
invalid condition
invalid effect
unknown NPC
unknown trait
invalid age range
unreachable event
circular dependency
```

Một nút:

> **Validate All Content**

và trả:

```text
Errors: 4
Warnings: 17
```

---

# 90. BALANCE DASHBOARD

Developer dashboard:

```text
Average Happiness
Average Wealth
Average Lifespan
Marriage Rate
Children per Life
Career Distribution
Event Frequency
Death Causes
Top Choices
```

Generate 100k simulated lives trước mỗi major build.

---

# 91. ANTI-BUG APPROACH CHO NARRATIVE

Mỗi consequence phải có:

```text
sourceEvent
sourceChoice
timestamp
```

Ví dụ:

```text
job_offer_203
caused_by
help_friend_104
age 16
```

Sau này player hỏi:

> "Tại sao tôi được job này?"

Developer có thể trace:

```text
Age 14
↓
Helped Minh
↓
trust +15
↓
Minh entered company
↓
Age 27
↓
Job recommendation
```

Đây là **causal graph**.

---

# 92. CAUSAL GRAPH

Đây là thứ khiến game này khác biệt nhất về mặt kỹ thuật.

Mỗi major decision tạo một node:

```text
A
│
├── B
│   │
│   └── C
│
└── D
```

Không cần lưu toàn bộ branch tree.

Chỉ lưu:

```text
event
choice
effects
result
```

Khi phân tích life:

```text
What caused this outcome?
```

engine có thể truy ngược graph.

---

# 93. "WHY DID THIS HAPPEN?"

Đây nên là tính năng nâng cao.

Cuối game:

> **Why did I become an engineer?**

Game trả:

```text
At age 11:
You developed a strong curiosity trait.

At age 14:
Your science teacher encouraged you.

At age 17:
You chose science instead of business.

At age 20:
You received an engineering scholarship.

At age 23:
You accepted your first engineering job.
```

Người chơi sẽ cực thích tính năng này.

---

# 94. GAMEPLAY LOOP CUỐI CÙNG

Toàn bộ game có thể cô đọng thành:

```text
LIVE
 ↓
CHOOSE
 ↓
CHANGE
 ↓
REMEMBER
 ↓
CONSEQUENCE
 ↓
LIVE AGAIN
```

Đây là core loop.

---

# 95. MASTER PRODUCTION ROADMAP

## Month 1

```text
Design
Architecture
Schemas
Prototype event engine
```

## Month 2

```text
Character
Time
Relationships
Memory
Save
```

## Month 3

```text
Birth → Age 10
```

## Month 4

```text
Age 10 → 18
```

## Month 5

```text
Age 18 → 25
```

## Month 6

```text
Vertical Slice
External testing
```

Sau đây mới quyết định có full production hay không.

## Month 7–10

```text
Full life systems
```

## Month 11–14

```text
Content expansion
Art
Audio
UI
```

## Month 15–16

```text
QA
Balance
Localization
Demo
```

## Month 17+

```text
Steam marketing
Creators
Demo events
Launch preparation
```

Đây là khung tham chiếu, không phải cam kết rằng một solo developer sẽ hoàn thành đúng 17 tháng.

---

# 96. TEAM SIZE

### Solo

Có thể prototype.

Khó full production nhưng không bất khả thi nếu scope nhỏ.

### 2–3 người

Rất phù hợp:

```text
1 programmer
1 designer/writer
1 artist/generalist
```

### 4–6 người

Có thể làm commercial indie nghiêm túc:

```text
1–2 programmers
1 game designer
1 writer/content designer
1 artist
1 audio/QA part-time
```

---

# 97. NGUYÊN TẮC ĐỂ KHÔNG CHẾT VÌ CONTENT

Đừng viết:

```text
1000 endings
```

Viết:

```text
1000 events
```

và để engine kết hợp:

```text
event
+
state
+
personality
+
relationship
+
memory
+
world
```

Một event:

> "Your friend asks you for help."

có thể xuất hiện hàng trăm cách khác nhau tùy:

```text
ai là friend
mối quan hệ
tuổi
tình trạng tài chính
tâm trạng
quá khứ
địa điểm
```

Đây là cách biến **500–3.000 event thành một không gian trải nghiệm cực lớn**.

---

# 98. SUCCESS CRITERIA CỐT LÕI

Game thành công về mặt gameplay khi người chơi nói:

> "Tôi không thể tin lựa chọn hồi 14 tuổi lại dẫn đến chuyện này."

Game thành công về mặt replayability khi:

> "Để tôi chơi lại và thử cuộc đời khác."

Game thành công về mặt social khi:

> "Đây là cuộc đời tôi vừa sống."

Game thành công về mặt commercial khi:

```text
Player
↓
Story
↓
Share
↓
New player
↓
Wishlist
↓
Demo
↓
Purchase
↓
New story
```

---

# 99. PHIÊN BẢN ĐẦU TIÊN NÊN LÀM NGAY

Nếu bắt đầu coding hôm nay, **không được làm toàn bộ hệ thống**.

Task đầu tiên:

```text
1. Create Character
2. Generate Family
3. Age 0
4. Advance to Age 1
5. Generate an event
6. Present 2–4 choices
7. Apply effects
8. Save event
9. Advance time
10. Trigger another event
11. Show changed state
```

Sau đó test:

```text
Run A
→ choice X
→ result A

Run B
→ choice Y
→ result B
```

Nếu hai run bắt đầu tạo ra câu chuyện khác nhau một cách tự nhiên:

> **engine đang đi đúng hướng.**

Nếu tất cả cuối cùng vẫn quay lại cùng một kết quả:

> chưa có simulation thật.

---

# 100. MỤC TIÊU CUỐI CÙNG

Không đặt mục tiêu:

> "Game có 10^100 ending."

Hãy đặt:

> **"Không có hai cuộc đời nào cần phải giống nhau."**

Về mặt kỹ thuật, công thức của game là:

```text
FINITE CONTENT
        +
STATE MACHINE
        +
EVENT SYSTEM
        +
CAUSAL GRAPH
        +
RELATIONSHIPS
        +
MEMORIES
        +
CONTROLLED RANDOMNESS
        =
HUGE EMERGENT LIFE SPACE
```

Về mặt sản phẩm:

```text
LIFE
 ↓
DECISIONS
 ↓
CONSEQUENCES
 ↓
STORY
 ↓
SHARE
 ↓
NEW PLAYERS
```

Đó là architecture mình sẽ chọn để biến concept này thành một indie Steam thực sự thay vì một visual novel có rất nhiều ending.
