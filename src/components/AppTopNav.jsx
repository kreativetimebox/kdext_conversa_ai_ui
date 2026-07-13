import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.svg';
import ThemeToggle from './ThemeToggle';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/chat', label: 'Converse' },
  { path: '/documents', label: 'Doc Chat' },
  { path: '/translate', label: 'Bhasha' },
  { path: '/services/hub', label: 'Vaani' },
  { path: '/history', label: 'History Logs' },
];

export default function AppTopNav({ navigate, currentPath, user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuLeaveTimer = useRef(null);

  const cleanPath = currentPath.toLowerCase().trim();

  const isActive = (path) => {
    if (path === '/chat') return cleanPath === '/chat' || cleanPath.startsWith('/chat/');
    if (path === '/services/hub') return cleanPath.startsWith('/services');
    return cleanPath === path;
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
    setMobileOpen(false);
  };

  const onMenuEnter = () => {
    if (menuLeaveTimer.current) clearTimeout(menuLeaveTimer.current);
    setMenuOpen(true);
  };
  const onMenuLeave = () => {
    menuLeaveTimer.current = setTimeout(() => setMenuOpen(false), 150);
  };

  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <nav style={styles.nav} className="app-topnav">
      <div style={styles.container} className="navbar-container">
        <motion.div
          onClick={() => go('/dashboard')}
          className="navbar-brand"
          style={styles.brandCol}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <img src={logo} alt="Conversa AI" style={{ width: '30px', height: '30px' }} />
          <span>Conversa AI</span>
        </motion.div>

        <div style={styles.links} className="nav-links-desktop">
          {NAV_ITEMS.map(({ path, label }) => (
            <button
              key={path}
              onClick={() => go(path)}
              style={{ ...styles.link, ...(isActive(path) ? styles.linkActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={styles.rightSection} className="auth-section-desktop">
          <ThemeToggle />

          <div style={styles.userMenuContainer} onMouseEnter={onMenuEnter} onMouseLeave={onMenuLeave}>
            <button style={styles.userMenuBtn}>
              <span style={styles.avatar}>{initial}</span>
              <ChevronDown size={14} style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  style={styles.dropdownMenu}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <a onMouseDown={() => go('/profile')} className="nav-item" style={styles.dropdownItem}>
                    <span className="nav-icon"><User size={18} /></span>
                    <span className="nav-label">Profile</span>
                  </a>
                  <a onMouseDown={() => go('/settings')} className="nav-item" style={styles.dropdownItem}>
                    <span className="nav-icon"><Settings size={18} /></span>
                    <span className="nav-label">Settings</span>
                  </a>
                  <button className="sign-out-btn" onMouseDown={onSignOut} style={styles.dropdownItem}>
                    <span className="nav-icon"><LogOut size={18} /></span>
                    <span className="nav-label">Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          style={styles.mobileToggle}
          className="mobile-menu-toggle-responsive"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            style={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            {NAV_ITEMS.map(({ path, label }) => (
              <a
                key={path}
                onClick={() => go(path)}
                className={`nav-item ${isActive(path) ? 'active' : ''}`}
                style={styles.mobileNavItem}
              >
                <span className="nav-label">{label}</span>
              </a>
            ))}
            <hr style={styles.mobileDivider} />
            <a onClick={() => go('/profile')} className="nav-item" style={styles.mobileNavItem}>
              <span className="nav-icon"><User size={18} /></span>
              <span className="nav-label">Profile</span>
            </a>
            <a onClick={() => go('/settings')} className="nav-item" style={styles.mobileNavItem}>
              <span className="nav-icon"><Settings size={18} /></span>
              <span className="nav-label">Settings</span>
            </a>
            <button className="sign-out-btn" onClick={onSignOut}>
              <span className="nav-icon"><LogOut size={18} /></span>
              <span className="nav-label">Sign Out</span>
            </button>
            <div style={styles.mobileThemeRow}>
              <span style={styles.mobileThemeLabel}>Theme</span>
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

const styles = {
  nav: {
    height: 'var(--navbar-height)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-navbar)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    flexShrink: 0,
    boxShadow: '0 4px 20px var(--shadow-color)',
  },
  container: {
    width: '100%',
    height: '100%',
    padding: '0 40px',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    columnGap: '16px',
    position: 'relative',
  },
  brandCol: {
    justifySelf: 'start',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  link: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 14px',
    fontSize: '0.92rem',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition)',
  },
  linkActive: {
    color: 'var(--primary-light)',
    background: 'var(--bg-subtle)',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    justifySelf: 'end',
    gap: '14px',
  },
  userMenuContainer: {
    position: 'relative',
  },
  userMenuBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: '30px',
    padding: '4px 10px 4px 4px',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    width: '200px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 10px 25px var(--shadow-color)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dropdownItem: {
    width: '100%',
  },
  mobileToggle: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px',
    gridColumn: '3',
    justifySelf: 'end',
  },
  mobileMenu: {
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    padding: '12px 24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
    boxShadow: '0 10px 20px var(--shadow-color)',
  },
  mobileNavItem: {
    cursor: 'pointer',
  },
  mobileDivider: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    margin: '8px 0',
  },
  mobileThemeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px solid var(--border-color)',
  },
  mobileThemeLabel: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
  },
};
