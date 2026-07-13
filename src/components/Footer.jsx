import React from 'react';
import logo from '../assets/logo.svg';
import { Volume2 } from 'lucide-react';

export default function Footer({ navigate }) {
  return (
    <footer style={{ ...styles.footer, position: 'relative', overflow: 'hidden' }}>
      <div className="hero-net-overlay" style={{ opacity: 0.5 }} />
      <div style={{ ...styles.container, position: 'relative', zIndex: 1 }}>
        <div style={styles.grid}>
          {/* Logo & Description */}
          <div style={styles.brandCol} className="footer-brand-col-responsive">
            <div onClick={() => navigate('/')} style={{ ...styles.logo, cursor: 'pointer' }}>
              <img src={logo} alt="Conversa AI" style={{ width: '32px', height: '32px' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Conversa AI</span>
            </div>
            <p style={styles.desc}>
              AI-powered speech synthesis and voice transcribing for modern businesses and applications. Secure, fast, and compliant.
            </p>
          </div>

          {/* Links Column 1: Product */}
          <div style={styles.linksCol}>
            <h4 style={styles.title}>Product</h4>
            <ul style={styles.list}>
              <li><button onClick={() => navigate('/services/hub')} style={styles.link} className="footer-link-hover">Voice Tools</button></li>
              <li><button onClick={() => navigate('/translate')} style={styles.link} className="footer-link-hover">Translate</button></li>
              <li><button onClick={() => navigate('/chat')} style={styles.link} className="footer-link-hover">AI Chat</button></li>
              <li><button onClick={() => navigate('/documentation')} style={styles.link} className="footer-link-hover">API Docs</button></li>
              <li><button onClick={() => navigate('/')} style={styles.link} className="footer-link-hover">Pricing Plan</button></li>
            </ul>
          </div>

          {/* Links Column 2: Support */}
          <div style={styles.linksCol}>
            <h4 style={styles.title}>Support</h4>
            <ul style={styles.list}>
              <li><button onClick={() => navigate('/help-center')} style={styles.link} className="footer-link-hover">Help Center</button></li>
              <li><button onClick={() => navigate('/contact')} style={styles.link} className="footer-link-hover">Contact Sales</button></li>
              <li><button onClick={() => navigate('/system-status')} style={styles.link} className="footer-link-hover">System Status</button></li>
              <li><button onClick={() => navigate('/about-us')} style={styles.link} className="footer-link-hover">About Us</button></li>
            </ul>
          </div>

          {/* Links Column 3: Legal */}
          <div style={styles.linksCol}>
            <h4 style={styles.title}>Legal</h4>
            <ul style={styles.list}>
              <li><button style={styles.link} className="footer-link-hover">Privacy Policy</button></li>
              <li><button style={styles.link} className="footer-link-hover">Terms of Service</button></li>
              <li><button style={styles.link} className="footer-link-hover">Security Compliance</button></li>
              <li><button style={styles.link} className="footer-link-hover">GDPR Regulations</button></li>
            </ul>
          </div>
        </div>

        <div style={styles.bottom}>
          <div style={styles.copyright}>
            © {new Date().getFullYear()} Conversa AI. All rights reserved. Built with precision.
          </div>
          <div style={styles.bottomLinks}>
            <span style={styles.statusDot}></span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-footer)',
    padding: '64px 0 32px 0',
    marginTop: 'auto',
    width: '100%',
    boxShadow: '0 -8px 24px var(--shadow-color)',
  },
  container: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '0 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '40px',
    marginBottom: '48px',
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoIcon: {
    background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)',
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  desc: {
    fontSize: '0.9rem',
    maxWidth: '320px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
  },
  linksCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    letterSpacing: '0.02em',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: 0,
    margin: 0,
  },
  link: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: 0,
    textAlign: 'left',
    transition: 'var(--transition)',
  },
  bottom: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  copyright: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  bottomLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 8px var(--success)',
  }
};

