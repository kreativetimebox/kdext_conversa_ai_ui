import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('conversa_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('conversa_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <motion.button
      onClick={toggleTheme}
      aria-label="Toggle dark and light theme"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={styles.toggle}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={styles.iconWrap}
        >
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

const styles = {
  toggle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
