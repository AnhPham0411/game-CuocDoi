import type { UICharacterState } from '../hooks/useGameEngine';
import { useState } from 'react';

// ─── Relationships Tab ────────────────────────────────────────────────────────

const REL_EMOJI: Record<string, string> = {
  parent: '👨‍👩‍👧', sibling: '👫', friend: '🤝', partner: '💑',
  spouse: '💍', child: '👶', coworker: '💼', teacher: '📚',
  neighbor: '🏠', rival: '⚔️', romantic_interest: '💘',
  romantic_partner: '💕', mentor: '🧠', acquaintance: '👋',
};

const RELATIONSHIP_AXIS_COLORS = {
  closeness: '#4ade80',
  trust: '#60a5fa',
  respect: '#fbbf24',
  conflict: '#f87171',
  dependence: '#a78bfa',
};

export function RelationshipsTab({ character }: { character: UICharacterState }) {
  if (character.relationships.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💛</div>
        <p className="empty-state-text">Cuộc đời của bạn đang bắt đầu — những mối quan hệ sẽ hình thành theo từng lựa chọn.</p>
      </div>
    );
  }

  return (
    <div className="tab-panel">
      <h2 className="tab-panel-title">
        <span>💛 Mối quan hệ</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>{character.relationships.length} người</span>
      </h2>
      <div className="relationship-list">
        {character.relationships.map(npc => (
          <div key={npc.npcId} className="relationship-item">
            <div className="relationship-header">
              <div className="relationship-avatar" aria-hidden="true">
                {REL_EMOJI[npc.relationshipType] ?? '👤'}
              </div>
              <div>
                <div className="relationship-name">{npc.name}</div>
                <div className="relationship-type">{npc.relationshipType}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className="badge badge--teal" style={{ fontSize: '0.6rem' }}>Tier {npc.tier}</span>
              </div>
            </div>
            <div className="relationship-axes">
              {(Object.keys(RELATIONSHIP_AXIS_COLORS) as Array<keyof typeof RELATIONSHIP_AXIS_COLORS>).map(axis => (
                <div key={axis} className="relationship-axis">
                  <div className="relationship-axis-meter">
                    <div
                      className="relationship-axis-fill"
                      style={{
                        height: `${npc[axis]}%`,
                        background: RELATIONSHIP_AXIS_COLORS[axis],
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="relationship-axis-label">{AXIS_SHORT[axis]}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)' }}>{npc[axis]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AXIS_SHORT: Record<string, string> = {
  closeness: 'Gần', trust: 'Tin', respect: 'Tôn', conflict: 'Mâu', dependence: 'Phụ',
};

// ─── Family Tab ───────────────────────────────────────────────────────────────

export function FamilyTab({ character }: { character: UICharacterState }) {
  const family = character.relationships.filter(r =>
    ['parent', 'sibling', 'child', 'spouse'].includes(r.relationshipType)
  );

  return (
    <div className="tab-panel">
      <h2 className="tab-panel-title">
        <span>🏠 Gia đình</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>{family.length} thành viên</span>
      </h2>
      {family.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <p className="empty-state-text">Gia đình sẽ xuất hiện khi cuộc đời tiến triển.</p>
        </div>
      ) : (
        <div className="relationship-list">
          {family.map(mem => (
            <div key={mem.npcId} className="relationship-item">
              <div className="relationship-header">
                <div className="relationship-avatar">{REL_EMOJI[mem.relationshipType] ?? '👤'}</div>
                <div>
                  <div className="relationship-name">{mem.name}</div>
                  <div className="relationship-type">{mem.relationshipType}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <MiniStat label="Gần gũi" value={mem.closeness} color="#4ade80" />
                <MiniStat label="Tin tưởng" value={mem.trust} color="#60a5fa" />
                <MiniStat label="Mâu thuẫn" value={mem.conflict} color="#f87171" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ height: '4px', background: 'var(--color-surface-1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '2px' }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

// ─── Career Tab ───────────────────────────────────────────────────────────────

const CAREERS_DATA = [
  { id: 'career_doctor', title: 'Bác sĩ', category: 'healthcare', stress: 75, prestige: 90, stability: 85, salaryMin: 4000, salaryMax: 15000, reqEdu: 'Đại học', eligible: false },
  { id: 'career_engineer_software', title: 'Kỹ sư phần mềm', category: 'technology', stress: 55, prestige: 70, stability: 80, salaryMin: 3000, salaryMax: 12000, reqEdu: 'Đại học', eligible: false },
  { id: 'career_teacher', title: 'Giáo viên', category: 'education', stress: 60, prestige: 55, stability: 85, salaryMin: 1500, salaryMax: 4000, reqEdu: 'Đại học', eligible: true },
  { id: 'career_entrepreneur', title: 'Doanh nhân', category: 'business', stress: 85, prestige: 75, stability: 20, salaryMin: 0, salaryMax: 50000, reqEdu: 'Không yêu cầu', eligible: true },
  { id: 'career_artist', title: 'Nghệ sĩ / Designer', category: 'creative', stress: 50, prestige: 55, stability: 35, salaryMin: 800, salaryMax: 8000, reqEdu: 'Không yêu cầu', eligible: true },
  { id: 'career_sales_rep', title: 'Nhân viên kinh doanh', category: 'business', stress: 65, prestige: 45, stability: 50, salaryMin: 1500, salaryMax: 8000, reqEdu: 'Không yêu cầu', eligible: true },
  { id: 'career_musician', title: 'Nhạc sĩ / Ca sĩ', category: 'creative', stress: 60, prestige: 65, stability: 25, salaryMin: 0, salaryMax: 25000, reqEdu: 'Không yêu cầu', eligible: true },
];

const CAREER_STAT_COLORS = {
  stress: '#f87171',
  prestige: '#fbbf24',
  stability: '#4ade80',
};

export function CareerTab({ character }: { character: UICharacterState }) {
  return (
    <div className="tab-panel">
      <h2 className="tab-panel-title">
        <span>💼 Sự nghiệp & Định hướng</span>
      </h2>
      {character.currentCareer && (
        <div className="panel-card" style={{ marginBottom: 'var(--space-5)', borderColor: 'rgba(212, 168, 85, 0.4)', background: 'var(--color-gold-dim)' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
            Nghề hiện tại
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {character.currentCareer}
          </div>
        </div>
      )}
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Nghề khả dụng (dựa trên kỹ năng và học vấn)
      </div>
      <div className="career-grid">
        {CAREERS_DATA.map(career => (
          <div key={career.id} className={`career-card ${career.eligible ? 'eligible' : ''}`} id={`career-${career.id}`}>
            <div className="career-card-title">{career.title}</div>
            <div className="career-card-cat">{career.category} · {career.reqEdu}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-money)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              ₫{career.salaryMin.toLocaleString()} – ₫{career.salaryMax.toLocaleString()}/tháng
            </div>
            <div className="career-card-stats">
              {(['stress', 'prestige', 'stability'] as const).map(stat => (
                <div key={stat} className="career-stat">
                  <span className="career-stat-label">
                    {stat === 'stress' ? 'Áp lực' : stat === 'prestige' ? 'Uy tín' : 'Ổn định'}
                  </span>
                  <div className="career-stat-bar">
                    <div
                      className="career-stat-fill"
                      style={{ width: `${career[stat]}%`, background: CAREER_STAT_COLORS[stat] }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {!career.eligible && (
              <div style={{ marginTop: 'var(--space-3)', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                ⚠️ Chưa đủ điều kiện học vấn / kỹ năng
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Memories Tab ─────────────────────────────────────────────────────────────

const MEMORY_EMOJI: Record<string, string> = {
  family: '🏠', childhood: '🌱', school: '📚', friendship: '🤝',
  romance: '💕', career: '💼', tragedy: '💔', achievement: '🏆',
  milestone: '🌟', regret: '😔', misc: '📍', life: '✨',
  trauma: '⚡', loss: '🕯️', hobby: '🎨', sport: '⚽',
};

export function MemoriesTab({ character, explainOutcome }: { character: UICharacterState; explainOutcome?: (id: string) => any[] }) {
  const [explaining, setExplaining] = useState<string | null>(null);

  if (character.memories.length === 0) {
    return (
      <div className="tab-panel">
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <p className="empty-state-text">Mỗi lựa chọn sẽ khắc một ký ức vào tâm trí bạn.</p>
        </div>
      </div>
    );
  }

  const renderExplanation = (mem: { id: string; sourceEventId: string }) => {
    if (!explainOutcome || explaining !== mem.id) return null;
    // Query by the event that created this memory, not the memory's own id —
    // CausalGraphTracker.explain() indexes nodes by eventId/choiceId/tags,
    // never by a memory id, so passing mem.id here always returned an empty
    // chain (button did nothing, no error — silently broken).
    const steps = explainOutcome(mem.sourceEventId);
    if (!steps || steps.length === 0) return null;
    
    return (
      <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--color-gold)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}>Chuỗi sự kiện dẫn đến ký ức này:</div>
        <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          {steps.map((step, idx) => (
            <li key={idx}>Tuổi {step.atAge}: {step.title} — <i>{step.choiceText}</i></li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="tab-panel">
      <h2 className="tab-panel-title">
        <span>📖 Dòng thời gian ký ức</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>{character.memories.length} kỷ niệm</span>
      </h2>
      <div className="memories-timeline">
        {character.memories.map(mem => (
          <div key={mem.id} className="memory-item">
            <div className="memory-age">
              {MEMORY_EMOJI[mem.type] ?? '📍'} {mem.age} tuổi
            </div>
            <div className="memory-description">{mem.description}</div>
            {mem.tags.length > 0 && (
              <div className="memory-tags">
                {mem.tags.map(tag => (
                  <span key={tag} className="memory-tag">{tag}</span>
                ))}
              </div>
            )}
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <EmotionBar weight={mem.emotionalWeight} />
              {explainOutcome && (
                <button 
                  style={{ fontSize: '0.65rem', background: 'none', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '2px 6px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                  onClick={() => setExplaining(explaining === mem.id ? null : mem.id)}
                >
                  Vì sao?
                </button>
              )}
            </div>
            {renderExplanation(mem)}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionBar({ weight }: { weight: number }) {
  const color = weight > 0 ? '#4ade80' : weight < -50 ? '#f87171' : '#94a3b8';
  const label = weight > 60 ? '😊 Tích cực' : weight < -50 ? '😔 Tiêu cực' : '😐 Trung tính';
  return (
    <span style={{ fontSize: '0.65rem', color, fontWeight: 500 }}>{label}</span>
  );
}

// ─── Statistics Tab ───────────────────────────────────────────────────────────

export function StatisticsTab({ character }: { character: UICharacterState }) {
  const p = character.personality;

  return (
    <div className="tab-panel">
      <h2 className="tab-panel-title">
        <span>📊 Thống kê cuộc đời</span>
      </h2>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatBigCard label="Tuổi hiện tại" value={`${character.age}`} icon="🎂" />
        <StatBigCard label="Ký ức tích lũy" value={`${character.memories.length}`} icon="📖" />
        <StatBigCard label="Quan hệ" value={`${character.relationships.length}`} icon="💛" />
        <StatBigCard label="Lựa chọn đã đưa ra" value={`${character.stats.choicesMade}`} icon="🎯" />
        <StatBigCard label="Khoảnh khắc wow" value={`${character.stats.wowMomentsEncountered}`} icon="✨" />
        <StatBigCard label="Tài sản" value={`₫${character.money.toLocaleString()}`} icon="💰" />
      </div>

      <div className="panel-card">
        <div className="panel-card-title">🎭 Vector Tính cách</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {(Object.entries(p) as [keyof typeof PERSONALITY_AXIS_COLORS, number][]).map(([axis, val]) => (
            <div key={axis} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', minWidth: '100px' }}>
                {AXIS_LABELS[axis] ?? axis}
              </span>
              <div style={{ flex: 1, height: '6px', background: 'var(--color-surface-1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${val}%`, background: PERSONALITY_AXIS_COLORS[axis] ?? 'var(--color-teal)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', minWidth: '28px', textAlign: 'right' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBigCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="stat-big-card">
      <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>{icon}</div>
      <div className="stat-big-number">{value}</div>
      <div className="stat-big-label">{label}</div>
    </div>
  );
}

const AXIS_LABELS: Record<string, string> = {
  openness: 'Cởi mở', conscientiousness: 'Kỷ luật', extraversion: 'Hướng ngoại',
  agreeableness: 'Hòa đồng', neuroticism: 'Lo âu', ambition: 'Tham vọng',
  risk_tolerance: 'Mạo hiểm', empathy: 'Đồng cảm', discipline: 'Tự giác', curiosity: 'Tò mò',
};

const PERSONALITY_AXIS_COLORS: Record<string, string> = {
  openness: '#a78bfa', conscientiousness: '#60a5fa', extraversion: '#34d399',
  agreeableness: '#fbbf24', neuroticism: '#f87171', ambition: '#f59e0b',
  risk_tolerance: '#fc8181', empathy: '#f472b6', discipline: '#38bdf8', curiosity: '#4ade80',
};
