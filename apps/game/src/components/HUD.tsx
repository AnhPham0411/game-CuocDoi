import type { UICharacterState } from '../hooks/useGameEngine';

// ─── HUD ─────────────────────────────────────────────────────────────────────
interface HUDProps { char: UICharacterState; }

const STAT_ICONS = {
  health: '❤️',
  happiness: '😊',
  stress: '⚡',
  education: '🎓',
};

export function HUD({ char }: HUDProps) {
  const formatMoney = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
  };

  return (
    <header className="hud">
      <div className="hud-title-wrap">
        <span className="hud-title">LIFE</span>
        <span className="hud-subtitle">Mô Phỏng Cuộc Đời</span>
      </div>

      <div className="hud-stats">
        <HUDStat icon={STAT_ICONS.health} label="Sức khỏe" value={char.health} color="health" />
        <HUDStat icon={STAT_ICONS.happiness} label="Hạnh phúc" value={char.happiness} color="happiness" />
        <HUDStat icon={STAT_ICONS.stress} label="Stress" value={char.stress} color="stress" />
        <HUDStat icon={STAT_ICONS.education} label="Học vấn" value={char.education} color="education" />
      </div>

      <div className="hud-char">
        <span className="hud-age-badge">
          🎂 {char.age === 0 ? 'Sơ sinh' : `${char.age} tuổi`}
        </span>
        <span className="hud-money">
          💰 ₫{formatMoney(char.money)}
        </span>
        {char.name && (
          <span className="hud-char-name" title={char.name}>
            👤 {char.name}
          </span>
        )}
      </div>
    </header>
  );
}

function HUDStat({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="hud-stat">
      <span style={{ fontSize: '0.9rem', lineHeight: 1 }} aria-hidden="true">{icon}</span>
      <div className="hud-stat-info">
        <span className="hud-stat-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <div className="hud-stat-bar">
            <div
              className={`hud-stat-fill hud-stat-fill--${color}`}
              style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
          </div>
          <span className="hud-stat-value">{Math.round(value)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Tabs ──────────────────────────────────────────────────────────
type Tab = 'event' | 'relationships' | 'family' | 'career' | 'memories' | 'statistics';

interface NavTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'event', label: 'Cuộc đời', icon: '🌟' },
  { id: 'relationships', label: 'Quan hệ', icon: '💛' },
  { id: 'family', label: 'Gia đình', icon: '🏠' },
  { id: 'career', label: 'Sự nghiệp', icon: '💼' },
  { id: 'memories', label: 'Ký ức', icon: '📖' },
  { id: 'statistics', label: 'Thống kê', icon: '📊' },
];

export function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="nav-tabs" role="tablist">
      {TABS.map(tab => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          className={`nav-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="nav-tab-icon" aria-hidden="true">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export type { Tab };
