/**
 * useGameEngine — React hook that bridges the headless engine to React state.
 * Single source of truth: all state lives in the engine, React renders it.
 */

import { useCallback, useRef, useState } from 'react';

// ─── Lightweight in-React game state (no engine coupling yet) ────────────────
// Phase 3: UI binding scaffolding — the actual engine import will be wired
// once the full build pipeline resolves workspace symlinks.

export type GamePhase =
  | 'menu'
  | 'character_creation'
  | 'playing'
  | 'wow_moment'
  | 'life_summary';

export interface EventChoice {
  id: string;
  text: string;
}

export interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  importance: number;
  decisionType: string;
  choices: EventChoice[];
  isWowMoment?: boolean;
}

export interface NPC {
  npcId: string;
  name: string;
  relationshipType: string;
  closeness: number;
  trust: number;
  respect: number;
  conflict: number;
  dependence: number;
  tier: number;
}

export interface Memory {
  id: string;
  age: number;
  description: string;
  type: string;
  tags: string[];
  emotionalWeight: number;
  importance: number;
}

export interface UICharacterState {
  name: string;
  age: number;
  gender: string;
  location: string;
  money: number;
  health: number;
  happiness: number;
  stress: number;
  education: number;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    ambition: number;
    risk_tolerance: number;
    empathy: number;
    discipline: number;
    curiosity: number;
  };
  currentCareer: string | null;
  relationships: NPC[];
  memories: Memory[];
  traits: string[];
  lifeEvents: string[];
  stats: {
    turnsPlayed: number;
    choicesMade: number;
    wowMomentsEncountered: number;
  };
}

export interface GameEngineState {
  phase: GamePhase;
  character: UICharacterState;
  activeEvent: ActiveEvent | null;
  pendingWowEvent: ActiveEvent | null;
}

// ─── Initial character template ───────────────────────────────────────────────
function createInitialCharacter(name: string, gender: string, location: string): UICharacterState {
  return {
    name,
    age: 0,
    gender,
    location,
    money: location === 'urban' ? 5000 : location === 'suburban' ? 3000 : 2000,
    health: 80,
    happiness: 60,
    stress: 10,
    education: 0,
    personality: {
      openness: 45 + Math.floor(Math.random() * 30),
      conscientiousness: 40 + Math.floor(Math.random() * 30),
      extraversion: 35 + Math.floor(Math.random() * 40),
      agreeableness: 45 + Math.floor(Math.random() * 30),
      neuroticism: 30 + Math.floor(Math.random() * 30),
      ambition: 40 + Math.floor(Math.random() * 35),
      risk_tolerance: 35 + Math.floor(Math.random() * 40),
      empathy: 40 + Math.floor(Math.random() * 35),
      discipline: 35 + Math.floor(Math.random() * 35),
      curiosity: 45 + Math.floor(Math.random() * 30),
    },
    currentCareer: null,
    relationships: [
      { npcId: 'mother', name: 'Mẹ', relationshipType: 'parent', closeness: 75, trust: 80, respect: 70, conflict: 5, dependence: 60, tier: 1 },
      { npcId: 'father', name: 'Ba', relationshipType: 'parent', closeness: 65, trust: 70, respect: 65, conflict: 10, dependence: 40, tier: 1 },
    ],
    memories: [],
    traits: [],
    lifeEvents: [],
    stats: {
      turnsPlayed: 0,
      choicesMade: 0,
      wowMomentsEncountered: 0,
    },
  };
}

// ─── Events pool for demo gameplay ───────────────────────────────────────────
const DEMO_EVENTS: ActiveEvent[] = [
  {
    id: 'evt_birth_welcome',
    title: 'Chào đời',
    description: 'Tiếng khóc đầu tiên của bạn vang lên trong phòng sinh. Thế giới bắt đầu từ khoảnh khắc này.',
    category: 'LIFE',
    importance: 100,
    decisionType: 'INSTANT',
    isWowMoment: true,
    choices: [{ id: 'cry_loud', text: 'Khóc thật to — bạn đã đến!' }],
  },
  {
    id: 'evt_child_first_day_school',
    title: 'Ngày đầu tiên đi học',
    description: 'Sáng nay, lần đầu tiên bạn khoác chiếc cặp mới và bước vào lớp học. Mọi thứ đều lạ lẫm và hơi đáng sợ.',
    category: 'SCHOOL',
    importance: 80,
    decisionType: 'SOCIAL',
    choices: [
      { id: 'excited_join', text: 'Hào hứng tự giới thiệu bản thân với cả lớp' },
      { id: 'shy_observe', text: 'Ngồi yên lặng một góc, quan sát các bạn' },
    ],
  },
  {
    id: 'evt_child_parents_argue',
    title: 'Ba mẹ cãi nhau',
    description: 'Đêm khuya, qua vách tường mỏng, bạn nghe tiếng ba mẹ tranh cãi gay gắt. Bạn nằm ôm chăn, không biết phải làm gì.',
    category: 'FAMILY',
    importance: 65,
    decisionType: 'MORAL',
    choices: [
      { id: 'hide_under_blanket', text: 'Kéo chăn trùm đầu và cố ngủ quên đi' },
      { id: 'go_comfort_mom', text: "Bước ra ôm mẹ và nói 'Con yêu mẹ'" },
      { id: 'tell_them_stop', text: 'Bước ra khóc và xin ba mẹ đừng cãi nhau nữa' },
    ],
  },
  {
    id: 'evt_child_discover_hobby',
    title: 'Khám phá sở thích đặc biệt',
    description: 'Bạn tình cờ thử một hoạt động mới và cảm thấy say mê một cách lạ thường — như thể điều này được sinh ra dành cho bạn.',
    category: 'HOBBY',
    importance: 55,
    decisionType: 'STRATEGIC',
    isWowMoment: true,
    choices: [
      { id: 'pursue_drawing', text: 'Vẽ tranh — bạn không thể ngừng lại' },
      { id: 'pursue_music', text: 'Học nhạc cụ — bạn muốn chơi mãi không thôi' },
      { id: 'pursue_sport', text: 'Thể thao — bạn không mệt chút nào' },
      { id: 'pursue_coding', text: 'Máy tính — bạn có thể lập trình mấy giờ liền' },
    ],
  },
  {
    id: 'evt_teen_first_crush',
    title: 'Rung động đầu đời',
    description: 'Bạn nhận ra mình thích một người trong lớp. Tim đập nhanh mỗi khi họ nhìn sang.',
    category: 'ROMANCE',
    importance: 65,
    decisionType: 'SOCIAL',
    isWowMoment: true,
    choices: [
      { id: 'confess_feelings', text: 'Viết thư tỏ tình gửi cho họ' },
      { id: 'admire_from_afar', text: 'Âm thầm ngắm nhìn từ xa, không dám nói' },
      { id: 'tell_best_friend', text: 'Kể cho bạn thân nghe và nhờ tư vấn' },
    ],
  },
  {
    id: 'evt_teen_high_school_choice',
    title: 'Chọn trường cấp 3',
    description: 'Sau khi tốt nghiệp cấp 2, bạn phải quyết định sẽ vào trường THPT nào. Đây là quyết định định hướng cả con đường học vấn.',
    category: 'SCHOOL',
    importance: 85,
    decisionType: 'IRREVERSIBLE',
    choices: [
      { id: 'chuyên_academic', text: 'Thi vào trường chuyên — học nặng nhưng mở nhiều cửa' },
      { id: 'regular_school', text: 'Trường phổ thông bình thường — cân bằng học và sống' },
      { id: 'vocational_school', text: 'Trường nghề — học kỹ năng thực tế và đi làm sớm' },
    ],
  },
  {
    id: 'evt_teen_friend_bully',
    title: 'Bảo vệ bạn bè',
    description: 'Bạn thân của bạn đang bị một nhóm học sinh cá biệt chặn đường bắt nạt. Bạn là người duy nhất chứng kiến.',
    category: 'FRIENDSHIP',
    importance: 65,
    decisionType: 'MORAL',
    isWowMoment: true,
    choices: [
      { id: 'stand_up_friend', text: 'Lao vào can ngăn và đứng ra bảo vệ bạn' },
      { id: 'run_call_teacher', text: 'Chạy đi tìm giáo viên hoặc bảo vệ' },
      { id: 'walk_away_afraid', text: 'Sợ hãi bước đi và làm như không thấy' },
    ],
  },
  {
    id: 'evt_teen_university_entrance_exam',
    title: 'Kỳ thi đại học',
    description: "Kỳ thi tuyển sinh đại học — được gọi là 'một kỳ thi quyết định cả đời'. Phòng thi yên lặng đến ngột ngạt.",
    category: 'SCHOOL',
    importance: 92,
    decisionType: 'IRREVERSIBLE',
    isWowMoment: true,
    choices: [
      { id: 'high_score_university', text: 'Làm bài tốt — đủ điểm vào đại học top' },
      { id: 'ok_score_local', text: 'Điểm tạm — vào được đại học địa phương' },
      { id: 'fail_exam', text: 'Thi trượt — phải nghĩ lại kế hoạch' },
    ],
  },
  {
    id: 'evt_adult_first_job',
    title: 'Công việc chính thức đầu tiên',
    description: 'Bạn được nhận vào vị trí toàn thời gian đầu tiên trong sự nghiệp. Cảm giác vừa hào hứng vừa hoang mang.',
    category: 'CAREER',
    importance: 88,
    decisionType: 'STRATEGIC',
    isWowMoment: true,
    choices: [
      { id: 'throw_in_100_percent', text: 'Nỗ lực 100%, muốn chứng tỏ năng lực ngay từ đầu' },
      { id: 'learn_the_ropes_slowly', text: 'Quan sát và học từ từ, không vội vã' },
    ],
  },
  {
    id: 'evt_adult_serious_relationship',
    title: 'Mối quan hệ nghiêm túc',
    description: 'Bạn đã qua lại với một người một thời gian và cảm thấy đây có thể là điều thật sự. Đã đến lúc định nghĩa mối quan hệ.',
    category: 'ROMANCE',
    importance: 82,
    decisionType: 'STRATEGIC',
    isWowMoment: true,
    choices: [
      { id: 'commit_fully', text: 'Cam kết nghiêm túc — bạn sẵn sàng đầu tư vào mối này' },
      { id: 'keep_casual', text: 'Còn sớm để nghiêm túc — cứ tự nhiên đi' },
      { id: 'end_it', text: 'Nhận ra đây không phải người phù hợp, kết thúc nhẹ nhàng' },
    ],
  },
  {
    id: 'evt_adult_career_crisis',
    title: 'Khủng hoảng nghề nghiệp',
    description: 'Bạn đang làm công việc ổn định nhưng cảm thấy trống rỗng. Sáng đến cơ quan, tối về nhà, và lặp lại — là đây rồi sao?',
    category: 'CAREER',
    importance: 80,
    decisionType: 'STRATEGIC',
    isWowMoment: true,
    choices: [
      { id: 'take_risk_pivot', text: 'Bỏ việc và theo đuổi điều mình thực sự muốn' },
      { id: 'stay_learn_adapt', text: 'Tìm ý nghĩa trong công việc hiện tại và nâng cao kỹ năng' },
      { id: 'side_hustle', text: 'Giữ công việc nhưng bắt đầu dự án phụ ngoài giờ' },
    ],
  },
];

// Age milestones (approximate)
const AGE_MILESTONES: Record<string, number> = {
  'evt_birth_welcome': 0,
  'evt_child_first_day_school': 6,
  'evt_child_parents_argue': 8,
  'evt_child_discover_hobby': 9,
  'evt_teen_first_crush': 13,
  'evt_teen_high_school_choice': 15,
  'evt_teen_friend_bully': 14,
  'evt_teen_university_entrance_exam': 18,
  'evt_adult_first_job': 22,
  'evt_adult_serious_relationship': 24,
  'evt_adult_career_crisis': 25,
};

// ─── Effect helpers ───────────────────────────────────────────────────────────
type PersonalityKey = keyof UICharacterState['personality'];

function applyChoiceEffects(
  char: UICharacterState,
  eventId: string,
  choiceId: string
): UICharacterState {
  const newChar = structuredClone(char);

  // Advance age based on event
  const targetAge = AGE_MILESTONES[eventId] ?? char.age;
  if (targetAge > newChar.age) {
    newChar.age = targetAge;
  }

  // Choice-specific effects (simplified — engine handles real ones)
  const effects = CHOICE_EFFECTS[`${eventId}::${choiceId}`] ?? [];
  for (const eff of effects) {
    switch (eff.type) {
      case 'personality':
        (newChar.personality[eff.key as PersonalityKey] as number) = Math.min(100,
          Math.max(0, (newChar.personality[eff.key as PersonalityKey] as number) + eff.delta));
        break;
      case 'stat':
        if (eff.key === 'health') newChar.health = Math.min(100, Math.max(0, newChar.health + eff.delta));
        if (eff.key === 'happiness') newChar.happiness = Math.min(100, Math.max(0, newChar.happiness + eff.delta));
        if (eff.key === 'stress') newChar.stress = Math.min(100, Math.max(0, newChar.stress + eff.delta));
        if (eff.key === 'money') newChar.money = Math.max(0, newChar.money + eff.delta);
        if (eff.key === 'education') newChar.education = Math.min(100, Math.max(0, newChar.education + eff.delta));
        break;
      case 'trait':
        if (!newChar.traits.includes(eff.key)) newChar.traits.push(eff.key);
        break;
      case 'career':
        newChar.currentCareer = eff.key;
        newChar.money += eff.delta;
        break;
      case 'memory': {
        const mem: Memory = {
          id: `${eventId}_${choiceId}_${Date.now()}`,
          age: newChar.age,
          description: eff.key,
          type: eff.memoryType ?? 'misc',
          tags: eff.tags ?? [],
          emotionalWeight: eff.weight ?? 50,
          importance: eff.importance ?? 50,
        };
        newChar.memories.unshift(mem);
        break;
      }
      case 'npc': {
        const existing = newChar.relationships.find(r => r.npcId === eff.key);
        if (!existing) {
          newChar.relationships.push({
            npcId: eff.key,
            name: eff.name ?? 'Người quen',
            relationshipType: eff.relType ?? 'friend',
            closeness: 40, trust: 35, respect: 40, conflict: 5, dependence: 20,
            tier: 2,
          });
        }
        break;
      }
    }
  }

  newChar.lifeEvents.push(eventId);
  newChar.stats.turnsPlayed++;
  newChar.stats.choicesMade++;

  return newChar;
}

// Simplified effects table for demo (engine does the real work)
const CHOICE_EFFECTS: Record<string, Array<{
  type: string; key: string; delta: number;
  memoryType?: string; tags?: string[]; weight?: number; importance?: number;
  name?: string; relType?: string;
}>> = {
  'evt_birth_welcome::cry_loud': [
    { type: 'memory', key: 'Khoảnh khắc chào đời.', delta: 0, memoryType: 'milestone', tags: ['birth', 'beginning'], weight: 50, importance: 100 },
  ],
  'evt_child_first_day_school::excited_join': [
    { type: 'personality', key: 'extraversion', delta: 3 },
    { type: 'memory', key: 'Ngày đầu tiên đến trường — đứa trẻ đầy hào hứng.', delta: 0, memoryType: 'school', tags: ['first_day_school', 'milestone'], weight: 60, importance: 90 },
    { type: 'npc', key: 'npc_first_friend', delta: 0, name: 'Bạn học đầu tiên', relType: 'friend' },
  ],
  'evt_child_first_day_school::shy_observe': [
    { type: 'personality', key: 'neuroticism', delta: 2 },
    { type: 'memory', key: 'Ngày đầu tiên đến trường — đứa trẻ nhút nhát ngồi góc lớp.', delta: 0, memoryType: 'school', tags: ['first_day_school', 'milestone'], weight: 30, importance: 90 },
  ],
  'evt_child_discover_hobby::pursue_drawing': [
    { type: 'personality', key: 'openness', delta: 4 },
    { type: 'memory', key: 'Khám phá ra niềm đam mê hội họa.', delta: 0, memoryType: 'hobby', tags: ['art', 'passion', 'discovery'], weight: 75, importance: 55 },
  ],
  'evt_child_discover_hobby::pursue_music': [
    { type: 'personality', key: 'openness', delta: 4 },
    { type: 'memory', key: 'Khám phá ra tâm hồn âm nhạc.', delta: 0, memoryType: 'hobby', tags: ['music', 'passion', 'discovery'], weight: 75, importance: 55 },
  ],
  'evt_child_discover_hobby::pursue_sport': [
    { type: 'stat', key: 'health', delta: 8 },
    { type: 'memory', key: 'Khám phá ra đam mê thể thao.', delta: 0, memoryType: 'hobby', tags: ['sports', 'passion', 'discovery'], weight: 65, importance: 55 },
  ],
  'evt_teen_first_crush::confess_feelings': [
    { type: 'personality', key: 'risk_tolerance', delta: 4 },
    { type: 'memory', key: 'Lần đầu tiên dũng cảm tỏ tình.', delta: 0, memoryType: 'romance', tags: ['first_crush', 'confession'], weight: 85, importance: 65 },
    { type: 'stat', key: 'happiness', delta: 8 },
  ],
  'evt_teen_friend_bully::stand_up_friend': [
    { type: 'personality', key: 'agreeableness', delta: 3 },
    { type: 'memory', key: 'Dũng cảm đứng ra bảo vệ người bạn bị bắt nạt.', delta: 0, memoryType: 'friendship', tags: ['protected_friend_youth', 'loyalty'], weight: 90, importance: 85 },
    { type: 'stat', key: 'happiness', delta: 5 },
  ],
  'evt_teen_friend_bully::walk_away_afraid': [
    { type: 'personality', key: 'neuroticism', delta: 4 },
    { type: 'memory', key: 'Bỏ mặc người bạn trong lúc nguy hiểm — điều mà bạn sẽ không quên.', delta: 0, memoryType: 'regret', tags: ['abandoned_friend', 'regret'], weight: -70, importance: 65 },
    { type: 'stat', key: 'happiness', delta: -8 },
  ],
  'evt_teen_high_school_choice::chuyên_academic': [
    { type: 'stat', key: 'education', delta: 15 },
    { type: 'personality', key: 'discipline', delta: 5 },
    { type: 'stat', key: 'stress', delta: 15 },
  ],
  'evt_teen_high_school_choice::vocational_school': [
    { type: 'personality', key: 'conscientiousness', delta: 4 },
    { type: 'stat', key: 'money', delta: 500 },
  ],
  'evt_teen_university_entrance_exam::high_score_university': [
    { type: 'stat', key: 'education', delta: 20 },
    { type: 'stat', key: 'happiness', delta: 15 },
    { type: 'memory', key: 'Vượt qua kỳ thi đại học với thành tích xuất sắc.', delta: 0, memoryType: 'achievement', tags: ['university_exam', 'success', 'milestone'], weight: 90, importance: 92 },
  ],
  'evt_teen_university_entrance_exam::fail_exam': [
    { type: 'stat', key: 'happiness', delta: -20 },
    { type: 'personality', key: 'neuroticism', delta: 6 },
    { type: 'memory', key: 'Thi trượt đại học — một bước ngoặt buộc phải nhìn lại mọi thứ.', delta: 0, memoryType: 'tragedy', tags: ['university_exam', 'failure', 'turning_point'], weight: -85, importance: 92 },
  ],
  'evt_adult_first_job::throw_in_100_percent': [
    { type: 'stat', key: 'money', delta: 3000 },
    { type: 'stat', key: 'stress', delta: 15 },
    { type: 'personality', key: 'ambition', delta: 4 },
    { type: 'memory', key: 'Ngày đầu tiên làm việc toàn thời gian — dồn toàn lực.', delta: 0, memoryType: 'career', tags: ['first_real_job', 'milestone'], weight: 75, importance: 88 },
  ],
  'evt_adult_serious_relationship::commit_fully': [
    { type: 'stat', key: 'happiness', delta: 15 },
    { type: 'memory', key: 'Lần đầu tiên thực sự cam kết với một ai đó.', delta: 0, memoryType: 'romance', tags: ['serious_relationship', 'commitment', 'milestone'], weight: 85, importance: 82 },
    { type: 'npc', key: 'npc_partner', delta: 0, name: 'Người yêu', relType: 'romantic_partner' },
  ],
  'evt_adult_career_crisis::take_risk_pivot': [
    { type: 'personality', key: 'risk_tolerance', delta: 5 },
    { type: 'personality', key: 'ambition', delta: 4 },
    { type: 'stat', key: 'money', delta: -2000 },
    { type: 'memory', key: 'Từ bỏ sự ổn định để đuổi theo điều mình thực sự muốn.', delta: 0, memoryType: 'career', tags: ['career_pivot', 'brave_choice'], weight: 50, importance: 80 },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGameEngine() {
  const eventQueueRef = useRef<ActiveEvent[]>([...DEMO_EVENTS]);
  const eventIndexRef = useRef(0);

  const [state, setState] = useState<GameEngineState>({
    phase: 'menu',
    character: createInitialCharacter('', '', ''),
    activeEvent: null,
    pendingWowEvent: null,
  });

  // Start a new game
  const startGame = useCallback((name: string, gender: string, location: string) => {
    const char = createInitialCharacter(name, gender, location);
    eventIndexRef.current = 0;
    const firstEvent = eventQueueRef.current[0] ?? null;
    const isWow = firstEvent?.isWowMoment ?? false;
    setState({
      phase: isWow ? 'wow_moment' : 'playing',
      character: char,
      activeEvent: firstEvent,
      pendingWowEvent: isWow ? firstEvent : null,
    });
  }, []);

  // Make a choice
  const makeChoice = useCallback((choiceId: string) => {
    setState(prev => {
      if (!prev.activeEvent) return prev;
      const updatedChar = applyChoiceEffects(prev.character, prev.activeEvent.id, choiceId);

      // Advance to next event
      eventIndexRef.current += 1;
      const nextEvent = eventQueueRef.current[eventIndexRef.current] ?? null;

      if (!nextEvent) {
        // End of demo — show life summary
        return { ...prev, character: updatedChar, phase: 'life_summary', activeEvent: null, pendingWowEvent: null };
      }

      const isWow = nextEvent.isWowMoment ?? false;
      updatedChar.stats.wowMomentsEncountered += isWow ? 1 : 0;

      return {
        phase: isWow ? 'wow_moment' : 'playing',
        character: updatedChar,
        activeEvent: nextEvent,
        pendingWowEvent: isWow ? nextEvent : null,
      };
    });
  }, []);

  // Dismiss wow overlay and continue playing
  const continueAfterWow = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'playing',
      pendingWowEvent: null,
    }));
  }, []);

  const returnToMenu = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'menu' }));
  }, []);

  const goToCreation = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'character_creation' }));
  }, []);

  return {
    state,
    startGame,
    makeChoice,
    continueAfterWow,
    returnToMenu,
    goToCreation,
  };
}
