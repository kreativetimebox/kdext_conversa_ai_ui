import { useState, useEffect } from 'react';
import { Type, Layout } from 'lucide-react';
import ConstellationField from '../../components/ConstellationField';
import { THEMES, normalizeTheme, applyTheme } from '../../utils/themeSystem';

export default function Settings({ showToast }) {
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem('conversa_theme')));
  const [textSize, setTextSize] = useState('medium');
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event) => setTheme(normalizeTheme(event.detail));
    window.addEventListener('conversa-theme-change', handleThemeChange);
    return () => window.removeEventListener('conversa-theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (textSize === 'large') {
      document.documentElement.style.setProperty('font-size', '18px');
    } else if (textSize === 'small') {
      document.documentElement.style.setProperty('font-size', '14px');
    } else {
      document.documentElement.style.removeProperty('font-size');
    }
  }, [textSize]);

  const saveSettings = () => {
    showToast('Preferences saved successfully', 'success');
  };

  return (
    <div className="page-container animate-fade-in settings-page">
      <ConstellationField />
      <div className="page-header">
        <h1 className="page-title">Preferences</h1>
        <p className="page-subtitle">Customize your Conversa AI workspace</p>
      </div>

      <div style={styles.card} className="glass-card">
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Layout size={18} color="var(--primary-light)" />
            <h3 style={styles.sectionTitle}>Appearance & Theme</h3>
          </div>
          <div style={styles.optionsGrid}>
            {THEMES.map(({ id, label, Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  style={{ ...styles.optionCard, ...(active ? styles.optionActive : {}) }}
                  onClick={() => setTheme(id)}
                  className={`glass-card-hover theme-preview-card theme-preview-${id}`}
                  aria-pressed={active}
                >
                  <Icon size={24} color={active ? 'var(--primary-light)' : 'var(--text-secondary)'} />
                  <div style={styles.optionLabel}>{label}</div>
                  <div style={styles.optionDesc}>{themeDescriptions[id]}</div>
                </button>
              );
            })}
          </div>
        </div>

        <hr style={styles.divider} />

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Type size={18} color="var(--secondary)" />
            <h3 style={styles.sectionTitle}>Accessibility</h3>
          </div>

          <div style={styles.formRow} className="settings-form-row">
            <div style={styles.formLabel}>
              <div>Text Size</div>
              <div style={styles.formDesc}>Adjust global typography scale</div>
            </div>
            <div style={styles.btnGroup}>
              <button
                style={{ ...styles.toggleBtn, ...(textSize === 'small' ? styles.toggleActive : {}) }}
                onClick={() => setTextSize('small')}
              >Small</button>
              <button
                style={{ ...styles.toggleBtn, ...(textSize === 'medium' ? styles.toggleActive : {}) }}
                onClick={() => setTextSize('medium')}
              >Medium</button>
              <button
                style={{ ...styles.toggleBtn, ...(textSize === 'large' ? styles.toggleActive : {}) }}
                onClick={() => setTextSize('large')}
              >Large</button>
            </div>
          </div>

          <div style={styles.formRow} className="settings-form-row">
            <div style={styles.formLabel}>
              <div>Reduce Motion</div>
              <div style={styles.formDesc}>Disable UI animations and transitions</div>
            </div>
            <label style={styles.switch}>
              <input type="checkbox" checked={!animations} onChange={(e) => setAnimations(!e.target.checked)} style={styles.switchInput} />
              <span style={{ ...styles.slider, ...(!animations ? styles.sliderChecked : {}) }}>
                <span style={{ ...styles.sliderThumb, ...(!animations ? styles.sliderThumbChecked : {}) }}></span>
              </span>
            </label>
          </div>
        </div>

        <div style={styles.footer}>
          <button className="btn btn-primary" onClick={saveSettings} style={{ padding: '10px 24px' }}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

const themeDescriptions = {
  'aurora-violet': 'White-purple Capium inspired glow',
  'midnight-ocean': 'Deep blue SaaS dashboard atmosphere',
  'sunset-ember': 'Warm orange and pink glass accents',
  'emerald-frost': 'Green and cyan luminous workspace',
};

const styles = {
  card: {
    padding: '32px',
    borderRadius: '24px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    fontWeight: '600',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  optionCard: {
    background: 'var(--glass)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'center',
    backdropFilter: 'blur(30px)',
  },
  optionActive: {
    borderColor: 'var(--border-focus)',
    boxShadow: '0 0 0 1px var(--border-focus), 0 24px 70px var(--glow)',
  },
  optionLabel: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  optionDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    margin: '32px 0',
  },
  formRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid var(--border-color)',
  },
  formLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  formDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
  },
  btnGroup: {
    display: 'flex',
    background: 'var(--glass)',
    borderRadius: '999px',
    padding: '4px',
    border: '1px solid var(--border-color)',
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'var(--transition)',
  },
  toggleActive: {
    background: 'var(--gradient)',
    color: '#ffffff',
    boxShadow: '0 10px 28px var(--glow)',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px',
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--glass-strong)',
    transition: '.4s',
    borderRadius: '24px',
    border: '1px solid var(--border-color)',
  },
  sliderChecked: {
    background: 'var(--gradient)',
  },
  sliderThumb: {
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '2px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  sliderThumbChecked: {
    transform: 'translateX(24px)',
  },
  footer: {
    marginTop: '32px',
    display: 'flex',
    justifyContent: 'flex-end',
  }
};

