import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { THEMES, applyTheme, normalizeTheme } from '../utils/themeSystem';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => normalizeTheme(localStorage.getItem('conversa_theme')));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event) => setTheme(normalizeTheme(event.detail));
    window.addEventListener('conversa-theme-change', handleThemeChange);
    return () => window.removeEventListener('conversa-theme-change', handleThemeChange);
  }, []);

  return (
    <div style={styles.switcher} role="radiogroup" aria-label="Theme selector">
      {THEMES.map(({ id, label, Icon }) => {
        const active = theme === id;
        return (
          <motion.button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-label={`Use ${label} theme`}
            aria-checked={active}
            role="radio"
            title={label}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`theme-switcher-btn ${active ? 'active' : ''}`}
            style={styles.option}
          >
            <Icon size={16} />
            <span style={styles.srOnly}>{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}


const styles = {
  switcher: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px',
    borderRadius: '999px',
    border: '1px solid var(--border-color)',
    background: 'var(--glass)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 30px var(--shadow-color)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
  },
  option: {
    width: '34px',
    height: '34px',
    borderRadius: '999px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
};

