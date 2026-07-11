import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Percent, 
  Calendar, 
  Bell
} from 'lucide-react';

export default function SystemStatus({ showToast }) {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    showToast(`Subscribed ${email} to system status notifications!`, 'success');
    setEmail('');
  };

  const services = [
    { name: 'TTS Neural Synthesis API', status: 'Operational' },
    { name: 'STT Transcription API', status: 'Operational' },
    { name: 'Voice Training & Custom Models', status: 'Operational' },
    { name: 'Developer Portal Dashboard', status: 'Operational' },
    { name: 'File Storage Bucket', status: 'Operational' }
  ];

  const incidents = [
    { title: 'Scheduled Database Maintenance', date: '2026-05-12', duration: '45 minutes', impact: 'None (Failover Active)', status: 'Resolved' },
    { title: 'Minor API Voice Storage Slowdown', date: '2026-04-20', duration: '20 minutes', impact: 'Degraded Performance', status: 'Resolved' }
  ];

  return (
    <div style={styles.page} className="animate-fade-in">
      <div style={styles.container}>
        {/* Banner */}
        <div style={styles.heroBanner}>
          <div style={styles.greenDot}></div>
          <h1 style={styles.heroTitle}>All Systems Operational</h1>
          <p style={styles.heroSub}>As of June 16, 2026 at 09:12:00 UTC</p>
        </div>

        {/* Metrics Grid */}
        <div style={styles.metricsGrid}>
          <div className="glass-card" style={styles.metricCard}>
            <div style={styles.metricIconBox}>
              <Clock size={20} color="var(--primary-light)" />
            </div>
            <div>
              <div style={styles.metricVal}>142ms</div>
              <div style={styles.metricLabel}>Average Response Time</div>
            </div>
          </div>
          
          <div className="glass-card" style={styles.metricCard}>
            <div style={styles.metricIconBox}>
              <CheckCircle size={20} color="var(--success)" />
            </div>
            <div>
              <div style={styles.metricVal}>99.8%</div>
              <div style={styles.metricLabel}>Success Rate</div>
            </div>
          </div>

          <div className="glass-card" style={styles.metricCard}>
            <div style={styles.metricIconBox}>
              <Percent size={20} color="var(--primary-light)" />
            </div>
            <div>
              <div style={styles.metricVal}>99.97%</div>
              <div style={styles.metricLabel}>Uptime (30 days)</div>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div style={styles.section}>
          <h2 style={styles.secTitle}>Service Status</h2>
          <div style={styles.servicesList}>
            {services.map((s, idx) => (
              <div key={idx} style={styles.serviceItem}>
                <span style={styles.serviceName}>{s.name}</span>
                <span style={styles.statusLabel}>
                  <span style={styles.statusDot}></span>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div style={styles.section}>
          <h2 style={styles.secTitle}>Upcoming Maintenance</h2>
          <div className="glass-card" style={styles.maintenanceCard}>
            <div style={styles.maintHeader}>
              <Calendar size={18} color="var(--warning)" />
              <h4 style={styles.maintTitle}>Planned Database Migration</h4>
              <span className="badge badge-pending">Low Impact</span>
            </div>
            <p style={styles.maintDesc}>
              We will be upgrading our database cluster infrastructure. Brief API timeouts may occur during DNS failover window.
            </p>
            <div style={styles.maintTime}>
              Scheduled: <strong>June 20, 2026, 02:00 - 04:00 UTC</strong>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div style={styles.section}>
          <h2 style={styles.secTitle}>Recent Incidents</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Incident details</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inc.title}</td>
                    <td>{inc.date}</td>
                    <td>{inc.duration}</td>
                    <td><span className="badge badge-success">{inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stay Updated Subscriber */}
        <div style={styles.subscribeCard} className="glass-card">
          <div style={styles.subLeft}>
            <Bell size={24} color="var(--primary-light)" />
            <div>
              <h4 style={styles.subTitle}>Stay Updated</h4>
              <p style={styles.subDesc}>Get automatic email notifications when system status alerts or maintenance changes occur.</p>
            </div>
          </div>
          <form onSubmit={handleSubscribe} className="status-sub-form" style={styles.subForm}>
            <input 
              type="email" 
              placeholder="you@email.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input" 
              style={styles.subInput}
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: '100%',
    paddingBottom: '80px',
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  heroBanner: {
    background: 'rgba(16, 185, 129, 0.04)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  greenDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 12px var(--success)',
  },
  heroTitle: {
    fontSize: '1.8rem',
    color: 'var(--text-primary)',
  },
  heroSub: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '48px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
  },
  metricIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'rgba(15,23,42,0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  metricLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  section: {
    marginBottom: '48px',
  },
  secTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    marginBottom: '20px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '10px',
  },
  servicesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(15,23,42,0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
  },
  serviceName: {
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  statusLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem',
    color: 'var(--success)',
    fontWeight: '600',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--success)',
    boxShadow: '0 0 6px var(--success)',
  },
  maintenanceCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  maintHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  maintTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  maintDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  maintTime: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  subscribeCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '32px',
    gap: '24px',
    flexWrap: 'wrap',
    background: 'radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.05) 0%, rgba(15,23,42,0.01) 100%)',
  },
  subLeft: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    flex: '1',
    minWidth: '260px',
  },
  subTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  subForm: {
    // Defined dynamically via index.css (.status-sub-form)
  },
  subInput: {
    flex: '1',
    padding: '10px 14px',
  }
};
