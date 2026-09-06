import { useState } from 'react';

interface CharacterCreationProps {
  onStart: (name: string, gender: string, location: string) => void;
  onBack: () => void;
}

const GENDERS = [
  { id: 'male', label: 'Nam' },
  { id: 'female', label: 'Nữ' },
  { id: 'nonbinary', label: 'Phi nhị nguyên' },
];

const LOCATIONS = [
  { id: 'rural', label: 'Nông thôn', desc: 'Gần gũi thiên nhiên, cộng đồng gắn kết' },
  { id: 'suburban', label: 'Ngoại ô', desc: 'Yên tĩnh, cân bằng giữa phố và quê' },
  { id: 'urban', label: 'Thành phố lớn', desc: 'Nhiều cơ hội, nhiều cạm bẫy' },
];

export function CharacterCreation({ onStart, onBack }: CharacterCreationProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');

  const canStart = name.trim().length >= 1 && gender && location;

  return (
    <div className="creation-screen">
      <div className="creation-hero">
        <h1 className="creation-hero-title">Cuộc đời của bạn bắt đầu từ đây</h1>
        <p className="creation-hero-subtitle">
          Mỗi lựa chọn sẽ định hình con người bạn trở thành
        </p>
      </div>

      <div className="creation-form">
        {/* Name */}
        <div className="creation-section">
          <div className="creation-section-label">Tên của bạn</div>
          <input
            id="character-name-input"
            type="text"
            placeholder="Nhập tên nhân vật..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={24}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(212,168,85,0.5)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
          />
        </div>

        {/* Gender */}
        <div className="creation-section">
          <div className="creation-section-label">Giới tính</div>
          <div className="creation-options">
            {GENDERS.map(g => (
              <button
                key={g.id}
                id={`gender-${g.id}`}
                className={`creation-option ${gender === g.id ? 'selected' : ''}`}
                onClick={() => setGender(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="creation-section">
          <div className="creation-section-label">Nơi sinh ra</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {LOCATIONS.map(loc => (
              <button
                key={loc.id}
                id={`location-${loc.id}`}
                className={`creation-option ${location === loc.id ? 'selected' : ''}`}
                onClick={() => setLocation(loc.id)}
                style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <span style={{ fontWeight: 600 }}>{loc.label}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 400 }}>{loc.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          id="start-game-btn"
          className="creation-submit"
          disabled={!canStart}
          onClick={() => canStart && onStart(name.trim(), gender, location)}
          style={{ opacity: canStart ? 1 : 0.5, cursor: canStart ? 'pointer' : 'not-allowed' }}
        >
          Bắt đầu cuộc đời →
        </button>

        <button
          onClick={onBack}
          style={{
            marginTop: 'var(--space-3)',
            width: '100%',
            padding: 'var(--space-2)',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
        >
          ← Quay lại
        </button>
      </div>
    </div>
  );
}
