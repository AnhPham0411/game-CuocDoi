import type { ActiveEvent } from '../hooks/useGameEngine';
import { useState } from 'react';

interface WowMomentProps {
  event: ActiveEvent;
  onContinue: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  FAMILY: '👨‍👩‍👧', SCHOOL: '🎓', FRIENDSHIP: '🤝', ROMANCE: '💕',
  CAREER: '💼', MONEY: '💰', HEALTH: '⚕️', LIFE: '✨',
  RANDOM: '🎲', CRIME: '⚠️', HOBBY: '🎨', SOCIAL: '🌐',
};

export function WowMomentOverlay({ event, onContinue }: WowMomentProps) {
  const icon = CATEGORY_EMOJI[event.category] ?? '🌟';

  return (
    <div className="wow-overlay" role="dialog" aria-modal="true" aria-label="Khoảnh khắc đặc biệt">
      {/* Particle rings effect */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${i * 200}px`, height: `${i * 200}px`,
            borderRadius: '50%',
            border: `1px solid rgba(212, 168, 85, ${0.06 / i})`,
            animation: `wowRing ${2 + i * 0.5}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <div className="wow-card">
        <div className="wow-label">✦ Khoảnh khắc đặc biệt ✦</div>
        <div className="wow-icon" role="img" aria-label={event.category}>
          {icon}
        </div>
        <h2 className="wow-title">{event.title}</h2>
        <p className="wow-description">{event.description}</p>
        <button
          id="wow-continue-btn"
          className="wow-continue"
          onClick={onContinue}
        >
          Tiếp tục →
        </button>
      </div>

      <style>{`
        @keyframes wowRing {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Menu Screen ─────────────────────────────────────────────────────────────

interface MenuScreenProps {
  onStartNew: () => void;
}

export function MenuScreen({ onStartNew }: MenuScreenProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--space-8)',
      gap: 'var(--space-8)',
      textAlign: 'center',
    }}>
      {/* Background rings */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {[300, 500, 700].map((size, i) => (
          <div key={size} style={{
            position: 'absolute', top: '40%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${size}px`, height: `${size}px`,
            borderRadius: '50%',
            border: `1px solid rgba(212, 168, 85, ${0.04 - i * 0.01})`,
          }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-narrative)',
          fontSize: '5rem',
          fontWeight: 300,
          color: 'var(--color-gold-light)',
          textShadow: '0 0 60px rgba(212, 168, 85, 0.3)',
          letterSpacing: '0.15em',
          lineHeight: 1,
          marginBottom: 'var(--space-4)',
        }}>
          LIFE
        </div>
        <div style={{
          fontFamily: 'var(--font-narrative)',
          fontSize: '1.1rem',
          color: 'var(--color-text-muted)',
          fontStyle: 'italic',
          fontWeight: 300,
          marginBottom: 'var(--space-8)',
          maxWidth: '400px',
          lineHeight: 1.6,
        }}>
          Sống một cuộc đời hoàn toàn là của bạn — qua lựa chọn, hệ quả và ký ức.
        </div>
        <button
          id="menu-start-btn"
          className="creation-submit"
          style={{ maxWidth: '240px', margin: '0 auto' }}
          onClick={onStartNew}
        >
          Bắt đầu cuộc đời mới
        </button>

        <div style={{ marginTop: 'var(--space-8)', fontSize: '0.65rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Vertical Slice · Giai đoạn sơ sinh → 25 tuổi
        </div>
      </div>
    </div>
  );
}

// ─── Life Summary Screen ──────────────────────────────────────────────────────

interface LifeSummaryProps {
  character: ReturnType<typeof import('../hooks/useGameEngine').useGameEngine>['state']['character'];
  onRestart: () => void;
  explainOutcome?: (id: string) => any[];
}

export function LifeSummaryScreen({ character, onRestart, explainOutcome }: LifeSummaryProps) {
  const [explaining, setExplaining] = useState<string | null>(null);

  const topMemories = [...character.memories]
    .sort((a, b) => Math.abs(b.emotionalWeight) - Math.abs(a.emotionalWeight))
    .slice(0, 5);

  const dominantTrait = Object.entries(character.personality)
    .sort(([, a], [, b]) => b - a)[0];

  const traitLabel: Record<string, string> = {
    openness: 'Cởi mở', conscientiousness: 'Kỷ luật', extraversion: 'Hướng ngoại',
    agreeableness: 'Hòa đồng', neuroticism: 'Hay lo âu', ambition: 'Tham vọng',
    risk_tolerance: 'Mạo hiểm', empathy: 'Giàu lòng trắc ẩn', discipline: 'Tự giác', curiosity: 'Tò mò',
  };

  const traitName = dominantTrait ? traitLabel[dominantTrait[0]] ?? 'đặc biệt' : 'đặc biệt';
  const epitaph = `${character.name} — một người ${traitName} ${character.memories.length > 3 ? 'với kho ký ức phong phú' : 'đang bắt đầu hành trình'}.`;

  return (
    <div className="summary-screen">
      <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.6s ease' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📜</div>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--color-gold)', marginBottom: 'var(--space-4)' }}>
          Kết thúc chương đầu
        </div>
        <p className="summary-epitaph">{epitaph}</p>
      </div>

      {topMemories.length > 0 && (
        <div className="panel-card" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="panel-card-title">📖 Những ký ức đáng nhớ nhất</div>
          {topMemories.map(mem => (
            <div key={mem.id} style={{ marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-gold)' }}>{mem.age} tuổi</div>
                {explainOutcome && (
                  <button 
                    style={{ fontSize: '0.65rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 6px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                    onClick={() => setExplaining(explaining === mem.id ? null : mem.id)}
                  >
                    Vì sao?
                  </button>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-narrative)', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
                {mem.description}
              </div>
              {explainOutcome && explaining === mem.id && (() => {
                // Query by the event that created this memory, not the
                // memory's own id — see the matching fix in Tabs.tsx's
                // MemoriesTab for why explainOutcome(mem.id) always returned
                // an empty chain (silently broken: no visible change, no error).
                const steps = explainOutcome(mem.sourceEventId);
                if (!steps || steps.length === 0) return null;
                return (
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--color-gold)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Chuỗi sự kiện dẫn đến ký ức này:</div>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {steps.map((step: any, idx: number) => (
                        <li key={idx}>Tuổi {step.atAge}: {step.title} — <i>{step.choiceText}</i></li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid" style={{ width: '100%', maxWidth: '600px' }}>
        <div className="stat-big-card">
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🎯</div>
          <div className="stat-big-number">{character.stats.choicesMade}</div>
          <div className="stat-big-label">Lựa chọn đưa ra</div>
        </div>
        <div className="stat-big-card">
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>✨</div>
          <div className="stat-big-number">{character.stats.wowMomentsEncountered}</div>
          <div className="stat-big-label">Khoảnh khắc wow</div>
        </div>
        <div className="stat-big-card">
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>💛</div>
          <div className="stat-big-number">{character.relationships.length}</div>
          <div className="stat-big-label">Người thân quen</div>
        </div>
      </div>

      <button
        id="restart-game-btn"
        className="creation-submit"
        style={{ maxWidth: '240px' }}
        onClick={onRestart}
      >
        Sống lại từ đầu
      </button>
    </div>
  );
}
