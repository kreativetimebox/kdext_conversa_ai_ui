import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  Volume2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  X,
  Code,
  Mic
} from 'lucide-react';
import ConstellationField from '../components/ConstellationField';

export default function History({ historyData, showToast }) {
  const [activeTab, setActiveTab] = useState('voice-logs'); // 'overview' | 'voice-logs'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Stats calculators
  const totalRequests = historyData.length;
  const completedCount = historyData.filter(d => d.status === 'Completed').length;
  const pendingCount = historyData.filter(d => d.status === 'Pending').length;
  const failedCount = historyData.filter(d => d.status === 'Failed').length;

  const ttsCount = historyData.filter(d => d.type === 'Text to Speech').length;
  const sttCount = historyData.filter(d => d.type === 'Speech to Text').length;
  const totalSeconds = historyData.reduce((acc, d) => acc + (parseFloat(d.time) || 0), 0).toFixed(1);

  // Filters logic
  const filteredData = historyData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || 
                        (typeFilter === 'tts' && item.type === 'Text to Speech') ||
                        (typeFilter === 'stt' && item.type === 'Speech to Text');
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDownload = (name) => {
    // Generate dummy JSON file download
    const dummyJSON = {
      filename: name,
      parsed_at: new Date().toISOString(),
      confidence_score: 0.995,
      extracted_data: {
        account_name: "Varish Tomar",
        extracted_fields: 24,
        status: "verified"
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dummyJSON, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${name.split('.')[0]}_extracted.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Downloaded parsed data for ${name}`, 'success');
  };

  return (
    <div className="page-container animate-fade-in history-page">
      <ConstellationField />
      <div className="page-header">
        <h1 className="page-title">Processing History</h1>
        <p className="page-subtitle">View and track all your speech synthesis and voice transcribing activities.</p>
      </div>

      {/* Tabs */}
      <div className="tab-list">
        <button 
          onClick={() => setActiveTab('voice-logs')} 
          className={`tab-btn ${activeTab === 'voice-logs' ? 'active' : ''}`}
        >
          Voice Logs
        </button>
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Overview
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div style={styles.overviewTab} className="animate-fade-in">
          {/* Stats Summary cards */}
          <div style={styles.summaryGrid}>
            <div className="glass-card" style={styles.summaryCard}>
              <div style={styles.summaryNum}>{totalRequests}</div>
              <div style={styles.summaryLabel}>Total Requests</div>
            </div>
            <div className="glass-card" style={styles.summaryCard}>
              <div style={{...styles.summaryNum, color: 'var(--success)'}}>{completedCount}</div>
              <div style={styles.summaryLabel}>Conversions Processed</div>
            </div>
            <div className="glass-card" style={styles.summaryCard}>
              <div style={{...styles.summaryNum, color: 'var(--primary-light)'}}>{totalSeconds}s</div>
              <div style={styles.summaryLabel}>Audio Duration Processed</div>
            </div>
          </div>

          <h3 style={{...styles.secTitle, marginTop: '40px'}}>Voice Categories</h3>
          <div style={styles.categoriesGrid}>
            <div className="glass-card" style={styles.catCard}>
              <div style={styles.catVal}>{ttsCount}</div>
              <div style={styles.catName}>Text to Speech</div>
            </div>
            <div className="glass-card" style={styles.catCard}>
              <div style={styles.catVal}>{sttCount}</div>
              <div style={styles.catName}>Speech to Text</div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Logs Tab */}
      {activeTab === 'voice-logs' && (
        <div className="animate-fade-in">
          {/* Filters Bar */}
          <div style={styles.filtersBar} className="history-filters-bar">
            {/* Search Bar */}
            <div style={styles.searchWrapper} className="history-search-wrapper">
              <Search size={16} color="var(--text-muted)" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
                className="history-search-input"
              />
            </div>

            {/* Dropdown 1: Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={styles.filterSelect}
              className="history-filter-select"
            >
              <option value="all">All Types</option>
              <option value="tts">Text to Speech</option>
              <option value="stt">Speech to Text</option>
            </select>

            {/* Dropdown 2: Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
              className="history-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Table list */}
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th>Audio Duration</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.filenameCell}>
                      {item.type === 'Text to Speech' ? (
                        <Volume2 size={16} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                      ) : (
                        <Mic size={16} color="var(--secondary)" style={{ flexShrink: 0 }} />
                      )}
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.name}</span>
                    </td>
                    <td>{item.type}</td>
                    <td>{item.submitted}</td>
                    <td>
                      <div style={styles.timeCell}>
                        <Clock size={12} color="var(--text-muted)" />
                        <span>{item.time}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        item.status === 'Completed' ? 'badge-success' : 
                        item.status === 'Pending' ? 'badge-pending' : 'badge-danger'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={styles.actionsCell}>
                        <button onClick={() => setSelectedDoc(item)} style={styles.rowBtn} className="history-row-btn" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => handleDownload(item.name)} 
                          disabled={item.status !== 'Completed'}
                          style={{...styles.rowBtn, opacity: item.status === 'Completed' ? 1 : 0.4}} 
                          className="history-row-btn"
                          title="Download JSON"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={styles.noDataCell}>
                      No voice history records found matching current query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDoc && (
        <div style={styles.modalOverlay}>
          <div className="glass-card animate-fade-in" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Audio Job Details</h3>
              <button onClick={() => setSelectedDoc(null)} style={styles.modalCloseBtn} className="history-modal-close-btn">
                <X size={18} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.metaGrid} className="history-meta-grid">
                <div>
                  <span style={styles.metaLabel}>Filename</span>
                  <div style={styles.metaVal}>{selectedDoc.name}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Service Type</span>
                  <div style={styles.metaVal}>{selectedDoc.type}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Submitted At</span>
                  <div style={styles.metaVal}>{selectedDoc.submitted}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Audio Duration</span>
                  <div style={styles.metaVal}>{selectedDoc.time}</div>
                </div>
              </div>

              <div style={styles.jsonSection}>
                <div style={styles.jsonHeader}>
                  <Code size={14} color="var(--primary-light)" />
                  <span>EXTRACTED JSON DATA</span>
                </div>
                <pre style={styles.jsonPre}>
{`{
  "request_id": "req_${selectedDoc.id}",
  "status": "${selectedDoc.status.toLowerCase()}",
  "metadata": {
    "filename": "${selectedDoc.name}",
    "duration_seconds": ${parseFloat(selectedDoc.time)},
    "engine_version": "conversa-neural-v1.4"
  },
  "result": {
    "text": "${selectedDoc.type === 'Text to Speech' ? 'Sample synthesized speech transcript output...' : 'Extracted transcript from speech file...'}",
    "language": "en-US",
    "confidence_rating": 0.995
  }
}`}
                </pre>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setSelectedDoc(null)} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Close
              </button>
              <button 
                onClick={() => { handleDownload(selectedDoc.name); setSelectedDoc(null); }} 
                disabled={selectedDoc.status !== 'Completed'}
                className="btn btn-primary" 
                style={{ padding: '8px 16px', opacity: selectedDoc.status === 'Completed' ? 1 : 0.4 }}
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {


  overviewTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  summaryCard: {
    padding: '32px 24px',
    textAlign: 'center',
  },
  summaryNum: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  secTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  catCard: {
    padding: '24px',
    textAlign: 'center',
  },
  catVal: {
    fontSize: '1.8rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    marginBottom: '4px',
  },
  catName: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  filtersBar: {
    display: 'flex',
    gap: '14px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '240px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 38px',
    background: 'rgba(15,23,42,0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'var(--transition)',
  },
  filterSelect: {
    padding: '10px 16px',
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '150px',
  },
  filenameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  timeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  actionsCell: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  rowBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
  },
  noDataCell: {
    padding: '32px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
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
    maxWidth: '500px',
    padding: '28px',
    boxShadow: '0 20px 40px rgba(15,23,42,0.14)',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
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
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: '0.92rem',
    color: 'var(--text-primary)',
    marginTop: '4px',
    wordBreak: 'break-word',
    fontWeight: '500',
  },
  jsonSection: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  jsonHeader: {
    background: 'rgba(15,23,42,0.01)',
    borderBottom: '1px solid var(--border-color)',
    padding: '8px 12px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
  },
  jsonPre: {
    margin: 0,
    padding: '12px',
    background: 'var(--bg-subtle)',
    color: 'var(--success)',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    maxHeight: '180px',
    overflowY: 'auto',
    lineHeight: '1.4',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
  }
};
