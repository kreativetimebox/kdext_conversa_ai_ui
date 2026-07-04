import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Activity, Copy, CheckCircle2, Shield, Calendar, CreditCard } from 'lucide-react';
import { getProfile } from '../../services/api';

export default function Profile({ user, showToast }) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        try {
          const data = await getProfile(token);
          setProfile(data);
        } catch (e) {
          console.error("Failed to load profile:", e);
        }
      }
    };
    fetchProfile();
  }, [user]);
  
  const handleCopyKey = () => {
    const key = profile?.api_key || user?.api_key;
    if (key) {
      navigator.clipboard.writeText(key);
      setCopiedKey(true);
      showToast('API Key copied to clipboard', 'success');
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <h2 style={styles.title}>Account Profile</h2>
        <p style={styles.sub}>Manage your personal information and API credentials</p>
      </div>

      <div style={styles.grid}>
        {/* Left Column: Personal Info */}
        <div style={styles.col}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Personal Information</h3>
            </div>
            
            <div style={styles.profileHeader}>
              <div style={styles.avatarLarge}>
                <User size={32} color="#fff" />
              </div>
              <div>
                <div style={styles.userName}>{profile?.email?.split('@')[0] || 'User'}</div>
                <div style={styles.userRole}>Developer Plan</div>
              </div>
            </div>

            <div style={styles.infoGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.infoBox}>
                <Mail size={16} color="var(--text-muted)" />
                <span>{profile?.email || user?.email || 'No email provided'}</span>
              </div>
            </div>

            <div style={styles.infoGroup}>
              <label style={styles.label}>Account ID</label>
              <div style={styles.infoBox}>
                <Shield size={16} color="var(--text-muted)" />
                <span>ID: {profile?.user_id || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Billing & Plan</h3>
            </div>
            <div style={styles.planBox}>
              <div style={styles.planTop}>
                <div style={styles.planName}>Developer Tier</div>
                <div style={styles.planPrice}>$0 / month</div>
              </div>
              <p style={styles.planDesc}>Free tier access to core conversational API models.</p>
              <button className="btn btn-outline" style={{ width: '100%', marginTop: '16px' }} onClick={() => showToast('Plans are handled in Sandbox mode', 'info')}>
                <CreditCard size={16} />
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Credentials & Usage */}
        <div style={styles.col}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>API Credentials</h3>
              <Shield size={18} color="var(--success)" />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Your secret API key. Do not share this key or expose it in client-side code.
            </p>
            
            <div style={styles.keyBox}>
              <div style={styles.keyLabel}>
                <Key size={14} />
                Secret Key
              </div>
              <div style={styles.keyDisplay}>
                <code style={styles.keyCode}>
                  {profile?.api_key 
                    ? profile.api_key.substring(0, 12) + '••••••••••••••••' 
                    : 'fl_live_AX45••••••••••••••••'}
                </code>
                <button style={styles.copyBtn} onClick={handleCopyKey} title="Copy Key">
                  {copiedKey ? <CheckCircle2 size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Current Usage</h3>
              <Activity size={18} color="var(--info)" />
            </div>
            
            <div style={styles.usageItem}>
              <div style={styles.usageTop}>
                <span style={styles.usageLabel}>Total API Processing (Requests)</span>
                <span style={styles.usageValue}>{profile?.total_processing || 0}</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${Math.min((profile?.total_processing || 0) / 100 * 100, 100)}%`, background: 'var(--primary)'}}></div>
              </div>
            </div>

            <div style={styles.usageItem}>
              <div style={styles.usageTop}>
                <span style={styles.usageLabel}>Total Failed Requests</span>
                <span style={styles.usageValue}>{profile?.total_failed || 0}</span>
              </div>
              <div style={styles.progressBarBg}>
                <div style={{...styles.progressBarFill, width: `${Math.min((profile?.total_failed || 0) / 20 * 100, 100)}%`, background: 'var(--secondary)'}}></div>
              </div>
            </div>
          </div>
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
    maxWidth: '1200px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  card: {
    padding: '24px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(15,23,42,0.05)',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, #0ea5e9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(37,99,235, 0.3)',
  },
  userName: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    textTransform: 'capitalize',
  },
  userRole: {
    fontSize: '0.9rem',
    color: 'var(--primary-light)',
    marginTop: '4px',
  },
  infoGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '8px',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(15,23,42,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  keyBox: {
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  keyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: 'rgba(15,23,42,0.02)',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  keyDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
  },
  keyCode: {
    fontSize: '1rem',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    letterSpacing: '1px',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  usageItem: {
    marginBottom: '20px',
  },
  usageTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  usageLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  usageValue: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(15,23,42,0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
  },
  planBox: {
    background: 'rgba(37,99,235, 0.05)',
    border: '1px solid rgba(37,99,235, 0.2)',
    borderRadius: '8px',
    padding: '20px',
  },
  planTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  planName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--primary-light)',
  },
  planPrice: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  planDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  }
};
