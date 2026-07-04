import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Type, Monitor, Eye, Layout } from 'lucide-react';

export default function Settings({ user, showToast }) {
  const [theme, setTheme] = useState('dark');
  const [textSize, setTextSize] = useState('medium');
  const [animations, setAnimations] = useState(true);

  // Apply settings to document when they change (Mocking the actual CSS variable overrides for now)
  useEffect(() => {
    // In a real app, this would append a class to document.body
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg-main', '#0f172a');
      document.documentElement.style.setProperty('--text-primary', '#0f172a');
      document.documentElement.style.setProperty('--text-secondary', '#475569');
      document.documentElement.style.setProperty('--bg-card', 'rgba(0, 0, 0, 0.03)');
    } else if (theme === 'contrast') {
      document.documentElement.style.setProperty('--bg-main', '#000000');
      document.documentElement.style.setProperty('--text-primary', '#ffffff');
      document.documentElement.style.setProperty('--text-secondary', '#1e293b');
      document.documentElement.style.setProperty('--primary', '#ffff00');
      document.documentElement.style.setProperty('--primary-light', '#ffff00');
    } else {
      // Default dark theme (reset)
      document.documentElement.style.removeProperty('--bg-main');
      document.documentElement.style.removeProperty('--text-primary');
      document.documentElement.style.removeProperty('--text-secondary');
      document.documentElement.style.removeProperty('--bg-card');
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--primary-light');
    }
  }, [theme]);

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
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <h2 style={styles.title}>Preferences</h2>
        <p style={styles.sub}>Customize your Conversa AI workspace</p>
      </div>

      <div style={styles.card} className="glass-card">
        
        {/* Theme Settings */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Layout size={18} color="var(--primary-light)" />
            <h3 style={styles.sectionTitle}>Appearance & Theme</h3>
          </div>
          <div style={styles.optionsGrid}>
            <button 
              style={{...styles.optionCard, ...(theme === 'dark' ? styles.optionActive : {})}}
              onClick={() => setTheme('dark')}
            >
              <Moon size={24} color={theme === 'dark' ? 'var(--primary-light)' : 'var(--text-muted)'} />
              <div style={styles.optionLabel}>Dark Mode</div>
              <div style={styles.optionDesc}>Default sleek dark theme</div>
            </button>
            <button 
              style={{...styles.optionCard, ...(theme === 'light' ? styles.optionActive : {})}}
              onClick={() => setTheme('light')}
            >
              <Sun size={24} color={theme === 'light' ? 'var(--primary-light)' : 'var(--text-muted)'} />
              <div style={styles.optionLabel}>Light Mode</div>
              <div style={styles.optionDesc}>Clean and bright interface</div>
            </button>
            <button 
              style={{...styles.optionCard, ...(theme === 'contrast' ? styles.optionActive : {})}}
              onClick={() => setTheme('contrast')}
            >
              <Eye size={24} color={theme === 'contrast' ? 'var(--primary-light)' : 'var(--text-muted)'} />
              <div style={styles.optionLabel}>High Contrast</div>
              <div style={styles.optionDesc}>Maximum readability</div>
            </button>
          </div>
        </div>

        <hr style={styles.divider} />

        {/* Accessibility */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Type size={18} color="var(--secondary)" />
            <h3 style={styles.sectionTitle}>Accessibility</h3>
          </div>
          
          <div style={styles.formRow}>
            <div style={styles.formLabel}>
              <div>Text Size</div>
              <div style={styles.formDesc}>Adjust global typography scale</div>
            </div>
            <div style={styles.btnGroup}>
              <button 
                style={{...styles.toggleBtn, ...(textSize === 'small' ? styles.toggleActive : {})}}
                onClick={() => setTextSize('small')}
              >Small</button>
              <button 
                style={{...styles.toggleBtn, ...(textSize === 'medium' ? styles.toggleActive : {})}}
                onClick={() => setTextSize('medium')}
              >Medium</button>
              <button 
                style={{...styles.toggleBtn, ...(textSize === 'large' ? styles.toggleActive : {})}}
                onClick={() => setTextSize('large')}
              >Large</button>
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formLabel}>
              <div>Reduce Motion</div>
              <div style={styles.formDesc}>Disable UI animations and transitions</div>
            </div>
            <label style={styles.switch}>
              <input type="checkbox" checked={!animations} onChange={(e) => setAnimations(!e.target.checked)} style={styles.switchInput} />
              <span style={{...styles.slider, ...(!animations ? styles.sliderChecked : {})}}></span>
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

const styles = {
  container: {
    padding: '32px 40px',
    height: '100%',
    overflowY: 'auto',
    maxWidth: '900px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  card: {
    padding: '32px',
    borderRadius: '16px',
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
    background: 'rgba(15,23,42,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'center',
  },
  optionActive: {
    background: 'rgba(37,99,235, 0.08)',
    borderColor: 'var(--primary)',
    boxShadow: '0 0 15px rgba(37,99,235, 0.1)',
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
    borderTop: '1px solid rgba(15,23,42,0.05)',
    margin: '32px 0',
  },
  formRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid rgba(15,23,42,0.02)',
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
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '8px',
    padding: '4px',
    border: '1px solid var(--border-color)',
  },
  toggleBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'var(--transition)',
  },
  toggleActive: {
    background: 'rgba(15,23,42,0.1)',
    color: 'var(--text-primary)',
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
    background: 'rgba(15,23,42,0.1)',
    transition: '.4s',
    borderRadius: '24px',
  },
  sliderChecked: {
    background: 'var(--primary)',
  },
  footer: {
    marginTop: '32px',
    display: 'flex',
    justifyContent: 'flex-end',
  }
};
