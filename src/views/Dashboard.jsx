import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Copy, Check, Eye, EyeOff, Trash2, FileText, TrendingUp, Volume2, Activity,
  ArrowRight, BookOpen, History, Shield, CreditCard, X, Mic, Timer, BarChart2, Globe
} from 'lucide-react';
<<<<<<< HEAD
import { getProfile, getConversations } from '../services/api';
=======
import { getProfile } from '../services/api';
import ConstellationField from '../components/ConstellationField';
>>>>>>> e63b984c077b1491350cd57fa6f611ce6c7db1d4

export default function Dashboard({ 
  navigate, user, apiKeys, setApiKeys, historyData = [], toasts, showToast 
}) {
  const [copiedKey, setCopiedKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [profile, setProfile] = useState(user);
  
  const [realHistoryData, setRealHistoryData] = useState([]);
  
  const [timeFilter, setTimeFilter] = useState('30d');
  const [selectedApiKey, setSelectedApiKey] = useState('all');
  const [hoveredBar, setHoveredBar] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = sessionStorage.getItem('access_token');
      if (token) {
        try {
          const profileData = await getProfile(token);
          setProfile(profileData);

          if (profileData && profileData.api_key) {
            const logsData = await getConversations(profileData.api_key);
            const finalLogs = Array.isArray(logsData) ? logsData : (logsData?.items || logsData?.data || []);
            setRealHistoryData(finalLogs.length > 0 ? finalLogs : historyData);
          }
        } catch (e) {
          console.error("Failed to load dashboard data from API:", e);
          setRealHistoryData(historyData); 
        }
      }
    };
    fetchDashboardData();
  }, [user, historyData]);
  
  const displayKeys = apiKeys.map((k, index) => {
    if (index === 0 && profile?.api_key) return { ...k, key: profile.api_key };
    return k;
  });

  const chartData = useMemo(() => {
    const now = new Date();
    let aggregated = {};
    let realDataExists = false;

    realHistoryData.forEach((item) => {
      if (selectedApiKey !== 'all' && item.api_key && item.api_key !== selectedApiKey) return;

      const itemDate = new Date(item.submitted || item.created_at || item.updated_at || now);
      let label = '';

      if (timeFilter === '24h') {
        const diffHours = Math.floor((now - itemDate) / (1000 * 60 * 60));
        if (diffHours <= 24) label = `${itemDate.getHours()}:00`;
      } else if (timeFilter === '30d') {
        const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) label = itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeFilter === 'monthly') {
        label = itemDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }

      if (label) {
        realDataExists = true;
        if (!aggregated[label]) aggregated[label] = { tts: 0, stt: 0, trans: 0, total: 0 };
        
        if (item.type === 'Text to Speech') aggregated[label].tts += 1;
        else if (item.type === 'Speech to Text') aggregated[label].stt += 1;
        else if (item.type === 'Translation' || item.mode === 'translate') aggregated[label].trans += 1;
        else aggregated[label].trans += 1;

        aggregated[label].total += 1;
      }
    });

    if (!realDataExists) {
      const m = selectedApiKey === 'all' ? 1 : 0.4; 
      if (timeFilter === '24h') {
        return [
          { label: '04:00', stt: Math.ceil(2 * m), tts: Math.ceil(4 * m), trans: Math.ceil(3 * m), total: Math.ceil(9 * m) },
          { label: '08:00', stt: Math.ceil(8 * m), tts: Math.ceil(5 * m), trans: Math.ceil(6 * m), total: Math.ceil(19 * m) },
        ];
      } else if (timeFilter === '30d') {
        return [
          { label: 'Week 1', stt: Math.ceil(20 * m), tts: Math.ceil(35 * m), trans: Math.ceil(25 * m), total: Math.ceil(80 * m) },
          { label: 'Week 2', stt: Math.ceil(45 * m), tts: Math.ceil(50 * m), trans: Math.ceil(40 * m), total: Math.ceil(135 * m) },
        ];
      } else {
        return [
          { label: 'May', stt: Math.ceil(120 * m), tts: Math.ceil(140 * m), trans: Math.ceil(90 * m), total: Math.ceil(350 * m) },
        ];
      }
    }
    return Object.keys(aggregated).map(key => ({ label: key, ...aggregated[key] }));
  }, [realHistoryData, timeFilter, selectedApiKey]);

  const dynamicTotal = chartData.reduce((acc, curr) => acc + curr.total, 0);
  const dynamicTTS = chartData.reduce((acc, curr) => acc + (curr.tts || 0), 0);
  const dynamicSTT = chartData.reduce((acc, curr) => acc + (curr.stt || 0), 0);
  const dynamicTrans = chartData.reduce((acc, curr) => acc + (curr.trans || 0), 0);

  let rawMax = Math.max(...chartData.map(d => d.total), 10);
  const maxChartValue = Math.ceil(rawMax / 10) * 10; 

  const toggleKeyVisibility = (id) => setApiKeys(prev => prev.map(k => k.id === id ? { ...k, visible: !k.visible } : k));
  
  const copyKeyToClipboard = (key, id) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    showToast('API Key copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleCreateKey = (e) => {
    e.preventDefault();
    if (!newKeyName) return;
    const newKeyObj = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      key: `fl_live_${Math.random().toString(36).substring(2, 18).toUpperCase()}`,
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
    if (apiKeys.length <= 1) return showToast('You must keep at least one active API key.', 'error');
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast(`API Key "${name}" deleted.`, 'info');
  };

  return (
<<<<<<< HEAD
    <div className="page-container animate-fade-in dashboard-page" style={styles.page}>
      <div className="page-header" style={styles.header}>
        <h1 className="page-title" style={styles.title}>Dashboard</h1>
        <p className="page-subtitle" style={styles.sub}>Manage your API keys and monitor usage analytics.</p>
=======
    <div className="page-container animate-fade-in dashboard-page">
      <ConstellationField />
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Manage your API keys and monitor speech synthesis/transcription usage.</p>
>>>>>>> e63b984c077b1491350cd57fa6f611ce6c7db1d4
      </div>

      <div className="glass-card" style={{ ...styles.card, padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={20} color="var(--primary-light)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Analytics Filters</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            value={selectedApiKey} 
            onChange={(e) => setSelectedApiKey(e.target.value)}
            className="form-input"
            style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', minWidth: '200px' }}
          >
            <option value="all">All API Keys</option>
            {displayKeys.map(k => <option key={k.id} value={k.key}>{k.name}</option>)}
          </select>
          <div style={styles.filterGroup}>
            <button onClick={() => setTimeFilter('24h')} style={{ ...styles.filterBtn, ...(timeFilter === '24h' ? styles.filterBtnActive : {}) }}>24 Hours</button>
            <button onClick={() => setTimeFilter('30d')} style={{ ...styles.filterBtn, ...(timeFilter === '30d' ? styles.filterBtnActive : {}) }}>30 Days</button>
            <button onClick={() => setTimeFilter('monthly')} style={{ ...styles.filterBtn, ...(timeFilter === 'monthly' ? styles.filterBtnActive : {}) }}>Monthly</button>
          </div>
        </div>
      </div>

      <div className="dashboard-stats-grid" style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}><span style={styles.statLabel}>Total Requests</span><Activity size={18} color="var(--primary-light)" /></div>
          <div style={styles.statVal}>{dynamicTotal}</div>
          <div style={styles.statBottom}><span style={styles.statSubText}>Filtered total</span></div>
        </div>
        
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}><span style={styles.statLabel}>Translation</span><Globe size={18} color="#8b5cf6" /></div>
          <div style={styles.statVal}>{dynamicTrans}</div>
          <div style={styles.statBottom}><span style={{ ...styles.statSubText, color: '#8b5cf6' }}>Live translation requests</span></div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}><span style={styles.statLabel}>Text to Speech</span><Volume2 size={18} color="var(--primary-light)" /></div>
          <div style={styles.statVal}>{dynamicTTS}</div>
          <div style={styles.statBottom}><span style={styles.statSubText}>Speech generation jobs</span></div>
        </div>
        
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statTop}><span style={styles.statLabel}>Speech to Text</span><TrendingUp size={18} color="var(--success)" /></div>
          <div style={styles.statVal}>{dynamicSTT}</div>
          <div style={styles.statBottom}><span style={{ ...styles.statSubText, color: 'var(--success)' }}>Audio transcribing jobs</span></div>
        </div>
      </div>

      <div className="glass-card" style={{ ...styles.card, marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BarChart2 size={20} color="var(--primary-light)" />
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Usage Trends</h3>
        </div>

        <div style={styles.chartWrapper}>
          <div style={styles.yAxis}>
            <span>{maxChartValue}</span>
            <span>{Math.ceil(maxChartValue / 2)}</span>
            <span>0</span>
          </div>

          <div style={styles.chartArea}>
            <div style={{ ...styles.gridLine, top: 0 }}></div>
            <div style={{ ...styles.gridLine, top: '50%' }}></div>
            <div style={{ ...styles.gridLine, bottom: '28px', borderTopStyle: 'solid' }}></div>

            <div style={styles.chartBars}>
              {chartData.map((d, idx) => {
                const heightPercent = Math.min((d.total / maxChartValue) * 100, 100);
                return (
                  <div key={idx} style={styles.barCol} onMouseEnter={() => setHoveredBar(idx)} onMouseLeave={() => setHoveredBar(null)}>
                    <div style={{ ...styles.barTooltip, opacity: hoveredBar === idx ? 1 : 0, bottom: `${Math.max(heightPercent, 5) + 15}%` }}>
                      <div>Total: <strong>{d.total}</strong></div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                        TTS: {d.tts} | STT: {d.stt} | Trans: {d.trans}
                      </div>
                    </div>
                    <div style={styles.barTrack}>
                      <div style={{ ...styles.barFill, height: `${Math.max(heightPercent, 5)}%` }} />
                    </div>
                    <span style={styles.barLabel}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={styles.leftCol}>
          <div className="glass-card" style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>API Keys</h3>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={styles.newKeyBtn}><Plus size={14} /> New Key</button>
            </div>
            <div style={styles.keysList}>
              {displayKeys.map((k) => (
                <div key={k.id} style={styles.keyRow} className="dashboard-key-row">
                  <div style={styles.keyMeta}>
                    <div style={styles.keyNameRow}>
                      <span style={styles.keyName}>{k.name}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{k.status}</span>
                    </div>
                    <div style={styles.keyStringRow}><code style={styles.keyCode}>{k.visible ? k.key : `${k.key.substring(0, 10)}****************`}</code></div>
                    <div style={styles.keyCreated}>Created: {k.created}</div>
                  </div>
                  <div style={styles.keyActions} className="dashboard-key-actions">
                    <button onClick={() => toggleKeyVisibility(k.id)} style={styles.iconBtn} title="Toggle Visibility">{k.visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    <button onClick={() => copyKeyToClipboard(k.key, k.id)} style={styles.iconBtn} title="Copy Key">{copiedKey === k.id ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}</button>
                    <button onClick={() => handleDeleteKey(k.id, k.name)} style={{...styles.iconBtn, color: 'rgba(239, 68, 68, 0.6)'}} title="Delete Key"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={styles.rightCol}>
          <div className="glass-card" style={styles.card}>
            <h3 style={{...styles.cardTitle, marginBottom: '16px'}}>Quick Actions</h3>
            <div className="dashboard-actions-grid" style={{ display: 'grid', gap: '16px' }}>
              <div onClick={() => navigate('/documentation')} style={styles.actionItem} className="glass-card-hover">
                <BookOpen size={18} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>API Docs</div>
                  <div style={styles.actionDesc}>View integration guides</div>
                </div>
              </div>
              <div onClick={() => navigate('/history')} style={styles.actionItem} className="glass-card-hover">
                <History size={18} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>History</div>
                  <div style={styles.actionDesc}>All processed tasks</div>
                </div>
              </div>
              <div onClick={() => navigate('/documentation')} style={styles.actionItem} className="glass-card-hover">
                <Shield size={18} color="var(--primary-light)" />
                <div>
                  <div style={styles.actionTitle}>Usage Analytics</div>
                  <div style={styles.actionDesc}>Monitor API keys metrics</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={styles.card}>
            <h3 style={{...styles.cardTitle, marginBottom: '16px'}}>Subscription &amp; Billing</h3>
            <div style={styles.planBanner}>
              <div style={styles.planHeader}>
                <span style={{ fontWeight: '700', fontSize: '1rem' }}>Free Plan</span>
                <span style={styles.planLimit}>10,000s / month</span>
              </div>
              <div style={styles.progressContainer}>
                <div style={styles.progressLabels}><span>Usage this month</span><span>-- / 10,000s used</span></div>
                <div style={styles.progressBarBg}>
                  <div style={{...styles.progressBarFill, width: `5%`}}></div>
                </div>
              </div>
              <button onClick={() => showToast('Starting Pro upgrade wizard (simulated)...', 'success')} className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>Upgrade to Pro</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
<<<<<<< HEAD
  page: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '40px 24px 80px 24px', width: '100%', height: '100%', overflowY: 'auto' },
  header: { marginBottom: '24px' },
  title: { fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '8px' },
  sub: { fontSize: '0.92rem', color: 'var(--text-secondary)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' },
  statCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal: { fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' },
  statBottom: { fontSize: '0.78rem', color: 'var(--text-secondary)' },
  statSubText: { fontSize: '0.78rem' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { padding: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  cardTitle: { fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: '700' },
  filterGroup: { display: 'flex', background: 'rgba(15,23,42,0.04)', borderRadius: '8px', padding: '3px', gap: '2px' },
  filterBtn: { background: 'transparent', border: 'none', padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500' },
  filterBtnActive: { background: 'var(--primary)', color: '#ffffff', fontWeight: '600' },
  chartWrapper: { display: 'flex', height: '220px', marginTop: '20px', gap: '16px' },
  yAxis: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '28px', color: 'var(--text-muted)', fontSize: '0.75rem', minWidth: '25px', textAlign: 'right', fontWeight: '500' },
  chartArea: { flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  gridLine: { position: 'absolute', left: 0, right: 0, borderTop: '1px dashed var(--border-color)', opacity: 0.6, zIndex: 0 },
  chartBars: { display: 'flex', width: '100%', height: 'calc(100% - 28px)', alignItems: 'flex-end', justifyContent: 'space-around', gap: '12px', zIndex: 1 },
  barCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', flex: 1, position: 'relative', cursor: 'pointer' },
  barTrack: { width: '32px', height: '100%', background: 'rgba(15,23,42,0.03)', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', background: 'linear-gradient(180deg, var(--primary-light), var(--primary))', borderRadius: '6px', transition: 'height 0.4s ease' },
  barLabel: { position: 'absolute', bottom: '-24px', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: '500' },
  barTooltip: { position: 'absolute', background: 'rgba(15,23,42,0.95)', color: '#fff', fontSize: '0.75rem', padding: '8px 12px', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'opacity 0.2s, bottom 0.3s ease', pointerEvents: 'none', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  newKeyBtn: { padding: '6px 12px', fontSize: '0.82rem' },
  keysList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  keyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(15,23,42,0.01)', border: '1px solid var(--border-color)', borderRadius: '10px', gap: '16px', flexWrap: 'wrap' },
  keyMeta: { flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' },
  keyNameRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  keyName: { fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)' },
  keyCode: { fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--primary-light)', wordBreak: 'break-all' },
  keyCreated: { fontSize: '0.75rem', color: 'var(--text-muted)' },
  keyActions: { display: 'flex', gap: '8px' },
  iconBtn: { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' },
  actionItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'rgba(15,23,42,0.01)', transition: 'var(--transition)', textAlign: 'left' },
  actionTitle: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-primary)' },
  actionDesc: { fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' },
  planBanner: { display: 'flex', flexDirection: 'column', gap: '16px' },
  planHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  planLimit: { fontSize: '0.82rem', color: 'var(--text-muted)' },
  progressContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' },
  progressBarBg: { width: '100%', height: '8px', background: 'rgba(15,23,42,0.04)', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'linear-gradient(to right, var(--primary), var(--secondary))', borderRadius: '4px', transition: 'width 0.4s ease' }
};
=======

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
    background: 'rgba(124, 58, 237, 0.08)',
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
    width: '100%',
    height: '100dvh',
    background: 'var(--bg-overlay)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    zIndex: 200,
  },
  modal: {
    width: '100%',
    maxWidth: '400px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.14)',
    maxHeight: '90vh',
    overflowY: 'auto',
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
>>>>>>> e63b984c077b1491350cd57fa6f611ce6c7db1d4
