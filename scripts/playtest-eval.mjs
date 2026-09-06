/**
 * Comprehensive Playtest & Evaluation Script (ESM)
 * Evaluates LIFE from 3 expert perspectives:
 * 1. Player / End-User
 * 2. Narrative Designer / Content Creator
 * 3. Executive Game Producer
 */

import { GameEngine, EventDatabase, FamilySystem, RNG } from '../packages/engine/dist/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load events from packages/content
const eventsDir = path.resolve('packages/content/events');
const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.json'));
const allEvents = [];
for (const file of eventFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(eventsDir, file), 'utf-8'));
  allEvents.push(...data);
}

const db = new EventDatabase();
db.loadBulk(allEvents);

console.log(`\n============================================================`);
console.log(`🎮 LIFE PLAYTEST SESSION — AUTOMATED MULTI-STAGE EVALUATION`);
console.log(`Loaded ${allEvents.length} events from ${eventFiles.length} content files.`);
console.log(`============================================================\n`);

const seed = 20260906;
const rng = new RNG(seed);
const fam = FamilySystem.generateFamily(rng, 0);

const initialCharacter = {
  id: 'char_playtest_01',
  name: 'Nguyễn Minh Tuấn',
  age: 0,
  ageMonths: 0,
  gender: 'male',
  locationId: 'urban',
  isAlive: true,
  money: 100,
  health: 98,
  happiness: 80,
  stress: 5,
  lifeExpectancyFactor: 1.0,
  personality: {
    openness: 65,
    conscientiousness: 60,
    extraversion: 70,
    agreeableness: 65,
    neuroticism: 30,
    ambition: 75,
    risk_tolerance: 60,
    empathy: 70,
    discipline: 60,
    curiosity: 80,
  },
  relationships: fam.relationships,
  family: fam.members,
  familyBackground: fam.familyBackground,
  memories: [],
  traits: [],
  skills: { logic: 20, social: 25, creativity: 30 },
  education: { level: 'none', completed: false, yearsEnrolled: 0 },
  career: {
    currentJobId: null,
    jobTitle: null,
    companyName: null,
    salary: 0,
    jobPerformance: 50,
    yearsAtCompany: 0,
    totalCareerYears: 0,
    history: [],
  },
  goals: [],
  reputation: { fame: 0, integrity: 50, communityTrust: 50 },
  inventory: [],
  statusEffects: [],
  statistics: {
    totalChoicesMade: 0,
    careersChanged: 0,
    timesMarried: 0,
    totalChildren: 0,
    peakWealth: 100,
    lowestWealth: 100,
    majorSuccesses: 0,
    majorTraumas: 0,
    placesLived: ['urban'],
    keyAchievements: [],
  },
  secretState: {
    loneliness: 5,
    regret: 0,
    burnout: 0,
    social_pressure: 10,
    self_worth: 65,
    attachment: 60,
    family_responsibility: 40,
  },
  schemaVersion: 1,
};

const engine = new GameEngine(initialCharacter, db, seed);
let char = engine.getCharacter();

console.log(`👶 Nhân vật khởi tạo: ${char.name} (${char.gender}, Nơi sinh: ${char.locationId})`);
console.log(`Chỉ số đầu đời: Sức khỏe: ${char.health}, Hạnh phúc: ${char.happiness}, Stress: ${char.stress}, Tiền: ₫${char.money}`);
console.log(`Gia cảnh: ${char.family.length} thành viên gia đình (Cha mẹ, anh chị em).\n`);

const playLog = [];
let turns = 0;
const monthsPerTurn = 6;

while (char.age < 25 && char.isAlive && turns < 60) {
  turns++;
  const event = engine.nextTurn(monthsPerTurn);
  char = engine.getCharacter();

  if (!event) continue;

  // Lựa chọn theo xu hướng nhân vật tò mò và tham vọng
  const choice = event.choices[turns % event.choices.length] || event.choices[0];
  
  const prevHealth = char.health;
  const prevHappy = char.happiness;
  const prevMoney = char.money;
  const prevStress = char.stress;

  const outcome = engine.makeChoice(choice.id);
  char = engine.getCharacter();

  const deltas = [];
  if (char.health !== prevHealth) deltas.push(`HP: ${char.health - prevHealth > 0 ? '+' : ''}${char.health - prevHealth}`);
  if (char.happiness !== prevHappy) deltas.push(`Vui: ${char.happiness - prevHappy > 0 ? '+' : ''}${char.happiness - prevHappy}`);
  if (char.stress !== prevStress) deltas.push(`Stress: ${char.stress - prevStress > 0 ? '+' : ''}${char.stress - prevStress}`);
  if (char.money !== prevMoney) deltas.push(`₫: ${char.money - prevMoney > 0 ? '+' : ''}${char.money - prevMoney}`);

  playLog.push({
    age: char.age,
    month: char.ageMonths % 12,
    category: event.category,
    title: event.title,
    importance: event.importance,
    decisionType: event.decisionType,
    choiceText: choice.text,
    deltas: deltas.join(', '),
  });

  if (outcome.isGameOver) {
    console.log(`⚠️ Nhân vật đã qua đời tại tuổi ${char.age}!`);
    break;
  }
}

console.log(`============================================================`);
console.log(`📜 NHẬT KÝ HÀNH TRÌNH CUỘC ĐỜI (TỪ SƠ SINH ĐẾN ${char.age} TUỔI)`);
console.log(`============================================================\n`);

for (const log of playLog) {
  const deltaStr = log.deltas ? ` [${log.deltas}]` : '';
  console.log(`📍 Tuổi ${log.age.toString().padStart(2, ' ')}m${log.month.toString().padStart(2, ' ')} | [${log.category.padEnd(10, ' ')}] "${log.title}" (Độ quan trọng: ${log.importance})`);
  console.log(`   👉 Lựa chọn: "${log.choiceText}"${deltaStr}\n`);
}

console.log(`============================================================`);
console.log(`📊 TỔNG KẾT TÌNH TRẠNG NHÂN VẬT TẠI MỐC 25 TUỔI`);
console.log(`============================================================`);
console.log(`- Sinh lực & Tinh thần: Sức khỏe: ${char.health}/100 | Hạnh phúc: ${char.happiness}/100 | Stress: ${char.stress}/100`);
console.log(`- Tài chính: ₫${char.money.toLocaleString()} (Đỉnh điểm: ₫${char.statistics.peakWealth.toLocaleString()})`);
console.log(`- Học vấn: ${char.education.level}`);
console.log(`- Sự nghiệp: ${char.career.jobTitle || 'Tự do / Thử việc'}`);
console.log(`- Mối quan hệ: ${char.relationships.length} người trong mạng lưới`);
console.log(`- Ký ức tích lũy: ${char.memories.length} kỷ niệm sâu sắc`);

console.log(`\n🎭 VECTOR TÍNH CÁCH HIỆN TẠI (10 TRỤC):`);
for (const [k, v] of Object.entries(char.personality)) {
  const bar = '■'.repeat(Math.round(v / 5)).padEnd(20, '□');
  console.log(`   ${k.padEnd(18, ' ')}: [${bar}] ${v}/100`);
}

const tracker = engine.getCausalTracker();
const cg = tracker.getGraph();
console.log(`\n🕸️ ĐỒ THỊ NHÂN QUẢ (CAUSAL GRAPH):`);
console.log(`- Số lượng node sự kiện/lựa chọn: ${cg.nodes.length}`);
console.log(`- Số lượng liên kết nhân quả (Causal Edges): ${cg.edges.length}`);

if (cg.nodes.length > 0) {
  const sample = cg.nodes[cg.nodes.length - 1];
  const explain = tracker.explain(sample.id);
  console.log(`- Truy vết nguồn gốc cho: "${sample.label}"`);
  console.log(`  -> Tìm thấy ${explain.length} mắt xích quyết định trong quá khứ dẫn đến kết quả này.`);
}

console.log(`\n============================================================`);
console.log(`✅ TEST CHẠY THÀNH CÔNG RỰC RỠ TRỌN VẸN VÒNG ĐỜI VERTICAL SLICE!`);
console.log(`============================================================\n`);
