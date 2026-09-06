import type { UICharacterState } from '../hooks/useGameEngine';

// ─── HUD ─────────────────────────────────────────────────────────────────────
interface HUDProps { char: UICharacterState; }

export function HUD({ char }: HUDProps) {
  const formatMoney = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` :
    n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`;

  return (
    <div className="hud">
      <span className="hud-title">LIFE</span>

      <div className="hud-stats">
        <HUDStat label="Sức khỏe" value={char.health} color="health" />
        <HUDStat label="Hạnh phúc" value={char.happiness} color="happiness" />
        <HUDStat label="Stress" value={char.stress} color="stress" />
        <HUDStat label="Học vấn" value={char.education} color="education" />
      </div>

      <div className="hud-char">
        <span className="hud-age-badge">
          {char.age === 0 ? 'Sơ sinh' : `${char.age} tuổi`}
        </span>
        <span className="hud-money">₫{formatMoney(char.money)}</span>
        {char.name && (
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {char.name}
          </span>
        )}
      </div>
    </div>
  );
}

function HUDStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="hud-stat">
      <span className="hud-stat-label">{label}</span>
      <div className="hud-stat-bar">
        <div
          className={`hud-stat-fill hud-stat-fill--${color}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <span className="hud-stat-value">{Math.round(value)}</span>
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
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export type { Tab };
