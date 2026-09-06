import type { ActiveEvent, UICharacterState } from '../hooks/useGameEngine';

interface EventScreenProps {
  event: ActiveEvent;
  character: UICharacterState;
  onChoice: (choiceId: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  FAMILY: '👨‍👩‍👧', SCHOOL: '🎓', FRIENDSHIP: '🤝', ROMANCE: '💕',
  CAREER: '💼', MONEY: '💰', HEALTH: '⚕️', LIFE: '✨',
  RANDOM: '🎲', CRIME: '⚠️', HOBBY: '🎨', SOCIAL: '🌐',
  ACCIDENT: '🚨', TRAVEL: '✈️',
};

const DECISION_LABELS: Record<string, string> = {
  INSTANT: 'Tức thì',
  SOCIAL: 'Xã hội',
  STRATEGIC: 'Chiến lược',
  MORAL: 'Đạo đức',
  IRREVERSIBLE: 'Không thể đổi lại',
};

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'];

const importanceLabel = (n: number) => {
  if (n >= 81) return { label: 'Thay đổi cuộc đời', cls: 'importance-lifechanging' };
  if (n >= 61) return { label: 'Quan trọng', cls: 'importance-major' };
  if (n >= 41) return { label: 'Có ý nghĩa', cls: 'importance-meaningful' };
  return { label: 'Nhỏ', cls: '' };
};

export function EventScreen({ event, character, onChoice }: EventScreenProps) {
  const imp = importanceLabel(event.importance);
  const catEmoji = CATEGORY_EMOJI[event.category] ?? '📍';
  const isIrreversible = event.decisionType === 'IRREVERSIBLE';
  const isMoral = event.decisionType === 'MORAL';

  return (
    <div className="event-screen">
      {/* Main event column */}
      <div className="event-main-col">

        {/* Event card */}
        <div className={`event-card ${event.importance >= 81 ? 'glow-important' : ''}`}>
          {/* Visual header */}
          <div className="event-image-placeholder">
            <span style={{ fontSize: '4rem', position: 'relative', zIndex: 1 }}>{catEmoji}</span>
            <span className={`event-category-badge badge cat-${event.category}`}>
              {event.category}
            </span>
          </div>

          <div className="event-content">
            {/* Meta */}
            <div className="event-meta">
              <span className={`event-importance ${imp.cls}`}>{imp.label}</span>
              <span className={`event-type-badge badge dtype-${event.decisionType}`}>
                {DECISION_LABELS[event.decisionType] ?? event.decisionType}
              </span>
              {isIrreversible && (
                <span className="badge badge--rose">⚠️ Không thể hủy</span>
              )}
            </div>

            {/* Title */}
            <h1 className="event-title">{event.title}</h1>

            {/* Description */}
            <p className="event-description">{event.description}</p>
          </div>
        </div>

        {/* Choices */}
        <div className="choices-section">
          <p className="choices-label">
            {isMoral ? '⚖️ Bạn sẽ làm gì?' :
             isIrreversible ? '🔒 Quyết định không thể đổi lại' :
             'Bạn chọn gì?'}
          </p>
          {event.choices.map((choice, i) => (
            <button
              key={choice.id}
              id={`choice-${choice.id}`}
              className="choice-btn"
              onClick={() => onChoice(choice.id)}
              title={isIrreversible ? 'Quyết định này không thể thay đổi' : undefined}
            >
              <span className="choice-btn-letter">{CHOICE_LETTERS[i] ?? String.fromCharCode(65 + i)}</span>
              {choice.text}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="event-sidebar">
        {/* Personality snapshot */}
        <div className="panel-card">
          <div className="panel-card-title">
            <span className="panel-card-title-icon">🎭</span>
            Tính cách
          </div>
          <div className="personality-grid">
            {(Object.entries(character.personality) as [string, number][]).map(([key, val]) => (
              <PersonalityBar key={key} axis={key} value={val} />
            ))}
          </div>
        </div>

        {/* Recent memories */}
        {character.memories.length > 0 && (
          <div className="panel-card">
            <div className="panel-card-title">
              <span className="panel-card-title-icon">📖</span>
              Ký ức gần đây
            </div>
            {character.memories.slice(0, 3).map(mem => (
              <div key={mem.id} style={{ marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-gold)', marginBottom: '4px' }}>
                  {mem.age} tuổi
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-narrative)' }}>
                  {mem.description.length > 80 ? mem.description.slice(0, 80) + '…' : mem.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Traits */}
        {character.traits.length > 0 && (
          <div className="panel-card">
            <div className="panel-card-title">
              <span className="panel-card-title-icon">✦</span>
              Tính cách đặc trưng
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {character.traits.map(t => (
                <span key={t} className="badge badge--violet">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Personality Bar ───────────────────────────────────────────────────────────

const AXIS_LABELS: Record<string, string> = {
  openness: 'Cởi mở',
  conscientiousness: 'Kỷ luật',
  extraversion: 'Hướng ngoại',
  agreeableness: 'Hòa đồng',
  neuroticism: 'Lo âu',
  ambition: 'Tham vọng',
  risk_tolerance: 'Mạo hiểm',
  empathy: 'Đồng cảm',
  discipline: 'Tự giác',
  curiosity: 'Tò mò',
};

const AXIS_COLORS: Record<string, string> = {
  openness: '#a78bfa',
  conscientiousness: '#60a5fa',
  extraversion: '#34d399',
  agreeableness: '#fbbf24',
  neuroticism: '#f87171',
  ambition: '#f59e0b',
  risk_tolerance: '#fc8181',
  empathy: '#f472b6',
  discipline: '#38bdf8',
  curiosity: '#4ade80',
};

function PersonalityBar({ axis, value }: { axis: string; value: number }) {
  const color = AXIS_COLORS[axis] ?? 'var(--color-teal)';
  return (
    <div className="personality-item">
      <span className="personality-item-label">{AXIS_LABELS[axis] ?? axis}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div className="personality-item-bar" style={{ flex: 1 }}>
          <div className="personality-item-fill" style={{ width: `${value}%`, background: color }} />
        </div>
        <span className="personality-item-value">{value}</span>
      </div>
    </div>
  );
}
