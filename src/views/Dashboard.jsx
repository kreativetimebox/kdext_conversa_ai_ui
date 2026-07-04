import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Trash2,
  FileText, 
  TrendingUp, 
  Volume2, 
  Activity,
  ArrowRight,
  BookOpen,
  History,
  Shield,
  CreditCard,
  X,
  Mic
} from 'lucide-react';
import { getProfile } from '../services/api';

export default function Dashboard({ 
  navigate, 
  user,
  apiKeys, 
  setApiKeys, 
  historyData, 
  toasts, 
  showToast 
}) {
  const [copiedKey, setCopiedKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
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
  
  // Calculate voice processing counts dynamically from historyData
  const ttsCount = historyData.filter(d => d.type === 'Text to Speech').length;
  const sttCount = historyData.filter(d => d.type === 'Speech to Text').length;
  const totalRequests = profile?.total_processing || (ttsCount + sttCount);
  
  // Calculate total seconds processed
  const totalSeconds = historyData.reduce((acc, d) => {
    const secs = parseFloat(d.time) || 0;
    return acc + secs;
  }, 0).toFixed(1);

  const displayKeys = apiKeys.map((k, index) => {
    if (index === 0 && profile?.api_key) {
      return { ...k, key: profile.api_key };
    }
    return k;
  });

  const toggleKeyVisibility = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  };

  const copyKeyToClipboard = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    showToast('API Key copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleCreateKey = (e) => {
    e.preventDefault();
    if (!newKeyName) return;

    const keyHash = Math.random().toString(36).substring(2, 18).toUpperCase();
    const newKeyObj = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `fl_live_${keyHash}`,
      status: 'Active',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      visible: false
    };

    setApiKeys(prev => [...prev, newKeyObj]);
    setIsModalOpen(false);
    setNewKeyName('');
    showToast(`API Key "${newKeyName}" generated!`, 'success');
  };

  const handleDeleteKey = (id, name) => {
    if (apiKeys.length <= 1) {
      showToast('You must keep at least one active API key.', 'error');
      return;
    }
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast(`API Key "${name}" deleted.`, 'info');
  };

  return (
    <div style={styles.page} className="animate-fade-in dashboard-page">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.sub}>Manage your API keys and monitor speech synthesis/transcription usage.</p>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Total Requests */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Total Requests</span>
            <Activity size={18} color="var(--primary-light)" />
          </div>
          <div style={styles.statVal}>{totalRequests}</div>
          <div style={styles.statBottom}>
            <span style={styles.statSubText}>All time requests</span>
          </div>
        </div>

        {/* Audio Seconds */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Audio Seconds</span>
            <TrendingUp size={18} color="var(--primary-light)" />
          </div>
          <div style={styles.statVal}>{totalSeconds}s</div>
          <div style={styles.statBottom}>
            <span style={styles.statSubText}>
              Total duration processed
            </span>
          </div>
        </div>

        {/* Text to Speech */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Text to Speech</span>
            <Volume2 size={18} color="var(--primary-light)" />
          </div>
          <div style={styles.statVal}>{ttsCount}</div>
          <div style={styles.statBottom}>
            <span style={styles.statSubText}>{ttsCount} speech generation jobs</span>
          </div>
        </div>

        {/* Speech to Text */}
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>Speech to Text</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <div style={styles.statVal}>{sttCount}</div>
          <div style={styles.statBottom}>
            <span style={styles.statSubText} style={{ color: 'var(--success)' }}>
              {sttCount} audio transcribing jobs
            </span>
          </div>
        </div>
      </div>

      <div className="dash-grid-two-columns">
        {/* Left Col: API Keys & Recent Actions */}
        <div style={styles.leftCol}>
          {/* API Keys Card */}
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>API Keys</h3>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={styles.newKeyBtn}>
                <Plus size={14} /> New Key
              </button>
            </div>
            
            <div style={styles.keysList}>
              {displayKeys.map((k) => (
                <div key={k.id} style={styles.keyRow} className="dashboard-key-row">
                  <div style={styles.keyMeta}>
                    <div style={styles.keyNameRow}>
                      <span style={styles.keyName}>{k.name}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {k.status}
                      </span>
                    </div>
                    <div style={styles.keyStringRow}>
                      <code style={styles.keyCode}>
                        {k.visible ? k.key : `${k.key.substring(0, 10)}****************`}
                      </code>
                    </div>
                    <div style={styles.keyCreated}>Created: {k.created}</div>
                  </div>
                  
                  <div style={styles.keyActions} className="dashboard-key-actions">
                    <button onClick={() => toggleKeyVisibility(k.id)} style={styles.iconBtn} className="dashboard-icon-btn" title="Toggle Visibility">
                      {k.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => copyKeyToClipboard(k.key, k.id)} style={styles.iconBtn} className="dashboard-icon-btn" title="Copy Key">
                      {copiedKey === k.id ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                    </button>
                    <button onClick={() => handleDeleteKey(k.id, k.name)} style={{...styles.iconBtn, color: 'rgba(239, 68, 68, 0.6)'}} className="dashboard-icon-btn" title="Delete Key">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Recent Activity</h3>
              <button onClick={() => navigate('/history')} style={styles.viewAllBtn}>
                View All <ArrowRight size={14} />
              </button>
            </div>
            
            <div style={styles.activityList}>
              {historyData.slice(0, 3).map((act, idx) => (
                <div key={act.id || idx} style={styles.activityRow}>
                  <div style={styles.activityIconWrapper}>
                    {act.type === 'Text to Speech' ? (
                      <Volume2 size={16} color="var(--primary-light)" />
                    ) : (
                      <Mic size={16} color="var(--secondary)" />
                    )}
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={styles.activityName}>
                      {act.type} processed - <span style={{ color: 'var(--text-primary)' }}>{act.name}</span>
                    </div>
                    <div style={styles.activityTime}>{act.submitted}</div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>{act.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Usage progress */}
        <div style={styles.rightCol}>
          {/* Quick Actions */}
          <div className="glass-card" style={styles.card}>
            <h3 style={{...styles.cardTitle, marginBottom: '16px'}}>Quick Actions</h3>
            <div className="dashboard-actions-grid">
              <div onClick={() => navigate('/documentation')} style={styles.actionItem} className="glass-card-hover">
                <BookOpen size={20} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>API Docs</div>
                  <div style={styles.actionDesc}>View integration guides</div>
                </div>
              </div>
              
              <div onClick={() => navigate('/history')} style={styles.actionItem} className="glass-card-hover">
                <History size={20} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>History</div>
                  <div style={styles.actionDesc}>All processed tasks</div>
                </div>
              </div>

              <div onClick={() => navigate('/documentation')} style={styles.actionItem} className="glass-card-hover">
                <Shield size={20} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>Usage Analytics</div>
                  <div style={styles.actionDesc}>Monitor API keys metrics</div>
                </div>
              </div>

              <div onClick={() => showToast('Upgrades to Pro plan are currently managed on sandbox mode', 'info')} style={styles.actionItem} className="glass-card-hover">
                <CreditCard size={20} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>Upgrade Plan</div>
                  <div style={styles.actionDesc}>Unlock speech capacities</div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Usage */}
          <div className="glass-card" style={styles.card}>
            <h3 style={{...styles.cardTitle, marginBottom: '16px'}}>Subscription &amp; Billing</h3>
            <div style={styles.planBanner}>
              <div style={styles.planHeader}>
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>Free Plan</span>
                <span style={styles.planLimit}>10,000s / month</span>
              </div>
              
              {/* Progress bar */}
              <div style={styles.progressContainer}>
                <div style={styles.progressLabels}>
                  <span>Usage this month</span>
                  <span>{totalSeconds}s / 10,000s used</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div 
                    style={{
                      ...styles.progressBarFill, 
                      width: `${Math.min((parseFloat(totalSeconds) / 10000) * 100, 100)}%`
                    }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={() => showToast('Starting Pro upgrade wizard (simulated)...', 'success')}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '10px' }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Key Modal overlay */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in dashboard-modal-container" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create API Key</h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateKey}>
              <div className="form-group">
                <label className="form-label">Key Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Production Client Access"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="form-input" 
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    width: '100%',
    height: '100%',
    overflowY: 'auto',
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
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statVal: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  statBottom: {
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
  },
  statSubText: {
    fontSize: '0.78rem',
  },
  twoColLayout: {},
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
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
  },
  cardTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
  },
  newKeyBtn: {
    padding: '6px 12px',
    fontSize: '0.82rem',
  },
  viewAllBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary-light)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  keysList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  keyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(15,23,42,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  keyMeta: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  keyNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  keyName: {
    fontWeight: '600',
    fontSize: '0.92rem',
    color: 'var(--text-primary)',
  },
  keyCode: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: 'var(--primary-light)',
    wordBreak: 'break-all',
  },
  keyCreated: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  keyActions: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 14px',
    background: 'rgba(15,23,42,0.005)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
  },
  activityIconWrapper: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(37,99,235, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityName: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  activityTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  actionsGrid: {},
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    background: 'rgba(15,23,42,0.01)',
    transition: 'var(--transition)',
    textAlign: 'left',
  },
  actionTitle: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  actionDesc: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  planBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  planHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLimit: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
  },
  progressBarBg: {
    width: '100%',
    height: '8px',
    background: 'rgba(15,23,42,0.04)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.14)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px',
  }
};
