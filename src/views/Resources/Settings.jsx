import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Type, Monitor, Eye, Layout } from 'lucide-react';

export default function Settings({ user, showToast }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('conversa_theme') || 'light');
  const [textSize, setTextSize] = useState('medium');
  const [animations, setAnimations] = useState(true);

  // Apply settings to document when they change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('conversa_theme', theme);
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
    <div className="page-container animate-fade-in settings-page">
      <div className="page-header">
        <h1 className="page-title">Preferences</h1>
        <p className="page-subtitle">Customize your Conversa AI workspace</p>
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
              style={{
                ...styles.optionCard, 
                ...styles.lightPreview, 
                ...(theme === 'light' ? styles.lightPreviewActive : {})
              }}
              onClick={() => setTheme('light')}
              className="glass-card-hover"
            >
              <Sun size={24} color={theme === 'light' ? '#2563eb' : '#64748b'} />
              <div style={{...styles.optionLabel, color: '#0f172a'}}>Light Mode</div>
              <div style={{...styles.optionDesc, color: '#475569'}}>Clean and bright interface</div>
            </button>
            <button 
              style={{
                ...styles.optionCard, 
                ...styles.darkPreview, 
                ...(theme === 'dark' ? styles.darkPreviewActive : {})
              }}
              onClick={() => setTheme('dark')}
              className="glass-card-hover"
            >
              <Moon size={24} color={theme === 'dark' ? '#3b82f6' : '#94a3b8'} />
              <div style={{...styles.optionLabel, color: '#f8fafc'}}>Dark Mode</div>
              <div style={{...styles.optionDesc, color: '#94a3b8'}}>Default sleek dark theme</div>
            </button>
            <button 
              style={{
                ...styles.optionCard, 
                ...styles.contrastPreview, 
                ...(theme === 'contrast' ? styles.contrastPreviewActive : {})
              }}
              onClick={() => setTheme('contrast')}
              className="glass-card-hover"
            >
              <Eye size={24} color={theme === 'contrast' ? '#ffff00' : '#ffffff'} />
              <div style={{...styles.optionLabel, color: '#ffffff'}}>High Contrast</div>
              <div style={{...styles.optionDesc, color: '#ffff00'}}>Maximum readability</div>
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
          
          <div style={styles.formRow} className="settings-form-row">
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

          <div style={styles.formRow} className="settings-form-row">
            <div style={styles.formLabel}>
              <div>Reduce Motion</div>
              <div style={styles.formDesc}>Disable UI animations and transitions</div>
            </div>
            <label style={styles.switch}>
              <input type="checkbox" checked={!animations} onChange={(e) => setAnimations(!e.target.checked)} style={styles.switchInput} />
              <span style={{...styles.slider, ...(!animations ? styles.sliderChecked : {})}}>
                <span style={{...styles.sliderThumb, ...(!animations ? styles.sliderThumbChecked : {})}}></span>
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

const styles = {
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
  darkPreview: {
    background: '#1e293b',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  darkPreviewActive: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 15px rgba(59,130,246,0.25)',
  },
  lightPreview: {
    background: '#ffffff',
    borderColor: 'rgba(15,23,42,0.08)',
  },
  lightPreviewActive: {
    borderColor: '#2563eb',
    boxShadow: '0 0 15px rgba(37,99,235,0.15)',
  },
  contrastPreview: {
    background: '#121212',
    borderColor: '#ffffff',
  },
  contrastPreviewActive: {
    borderColor: '#ffff00',
    boxShadow: '0 0 15px rgba(255,255,0,0.3)',
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
  sliderThumb: {
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '3px',
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
