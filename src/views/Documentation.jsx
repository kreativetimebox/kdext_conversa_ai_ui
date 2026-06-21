import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldAlert, 
  ExternalLink,
  Code as CodeIcon,
  Globe,
  Settings
} from 'lucide-react';

export default function Documentation({ navigate, showToast }) {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleSidebarClick = (sectionId) => {
    if (sectionId === 'api-reference') {
      navigate('/api-reference');
    } else {
      setActiveSection(sectionId);
    }
  };

  const sidebarItems = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'authentication', label: 'Authentication' },
    { id: 'api-reference', label: 'API Reference', badge: 'NEW' },
    { id: 'code-examples', label: 'Code Examples' },
    { id: 'sdk-libraries', label: 'SDK Libraries' },
    { id: 'rate-limits', label: 'Rate Limits' },
    { id: 'error-handling', label: 'Error Handling' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.layout} className="docs-grid-layout">
        {/* Left Sidebar */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Documentation</h3>
          <ul style={styles.sidebarList}>
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button 
                  onClick={() => handleSidebarClick(item.id)}
                  style={{
                    ...styles.sidebarBtn,
                    ...(activeSection === item.id ? styles.sidebarBtnActive : {})
                  }}
                >
                  <span style={styles.sidebarBtnLabel}>{item.label}</span>
                  {item.badge && <span style={styles.newBadge}>{item.badge}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content Area */}
        <main style={styles.content}>
          {activeSection === 'getting-started' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>Getting Started</h1>
              <p style={styles.docLead}>
                Welcome to the Conversa AI Developer Portal. Integrate high-fidelity Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities into your stack in minutes.
              </p>

              <div style={styles.sectionDivider}></div>

              <h2 style={styles.subTitle}>Base URL</h2>
              <p style={styles.docText}>
                All secure HTTPS requests are relative to the following base endpoint:
              </p>
              
              <div style={styles.codeBlockWrapper}>
                <div style={styles.codeBlockHeader}>
                  <span>Base endpoint URL</span>
                  <button 
                    onClick={() => copyToClipboard('https://api.conversa.ai/v1', 'Base URL')} 
                    style={styles.copyBtn}
                    className="doc-copy-btn"
                  >
                    {copiedText === 'https://api.conversa.ai/v1' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre style={styles.preCode}>https://api.conversa.ai/v1</pre>
              </div>

              <h2 style={styles.subTitle}>Quick Start Workflow</h2>
              <div style={styles.stepsGrid}>
                <div style={styles.stepCard}>
                  <div style={styles.stepNum}>1</div>
                  <h4 style={styles.stepTitle}>Create Account</h4>
                  <p style={styles.stepDesc}>Register a developer account to start building speech integrations.</p>
                </div>
                <div style={styles.stepCard}>
                  <div style={styles.stepNum}>2</div>
                  <h4 style={styles.stepTitle}>Retrieve API Key</h4>
                  <p style={styles.stepDesc}>Generate a secure token inside your personal dashboard.</p>
                </div>
                <div style={styles.stepCard}>
                  <div style={styles.stepNum}>3</div>
                  <h4 style={styles.stepTitle}>Submit Audio/Text</h4>
                  <p style={styles.stepDesc}>Synthesize text to speech, or transcribe speech logs to text.</p>
                </div>
                <div style={styles.stepCard}>
                  <div style={styles.stepNum}>4</div>
                  <h4 style={styles.stepTitle}>Parse Response</h4>
                  <p style={styles.stepDesc}>Receive neural voice URLs or dialogue JSON outputs.</p>
                </div>
              </div>

              {/* Callouts */}
              <div style={styles.ctaBox} className="glass-card">
                <h4 style={styles.ctaBoxTitle}>Ready to start processing voice tools?</h4>
                <p style={styles.ctaBoxDesc}>Create your free account to get instant access to the API and developer dashboard tools.</p>
                <div style={styles.ctaBoxActions}>
                  <button onClick={() => navigate('/signup')} className="btn btn-primary">
                    Create Free Account
                  </button>
                  <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
                    View Dashboard
                  </button>
                </div>
              </div>

              <div style={styles.apiRefBox}>
                <div style={styles.apiRefTextSide}>
                  <h4 style={styles.apiRefBoxTitle}>Complete API Reference</h4>
                  <p style={styles.apiRefBoxDesc}>Explore our comprehensive API endpoint sandbox documentation with sample outputs.</p>
                </div>
                <button onClick={() => navigate('/api-reference')} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  View Full API Reference <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {activeSection === 'authentication' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>Authentication</h1>
              <p style={styles.docLead}>
                All API requests require authentication. Pass your private API key in the request headers.
              </p>

              <div style={styles.sectionDivider}></div>

              <h2 style={styles.subTitle}>Authorization Header</h2>
              <p style={styles.docText}>
                Authenticate by passing your key under the <code>X-API-Key</code> request header. Keep your keys secret: do not distribute keys in client-side applications.
              </p>

              <div style={styles.warningBox}>
                <ShieldAlert size={20} color="var(--warning)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Security Reminder:</strong> Your production secret keys authenticate requests. Do not share them on public version control platforms.
                </div>
              </div>

              <h2 style={styles.subTitle}>Example Request</h2>
              
              <div style={styles.codeBlockWrapper}>
                <div style={styles.codeBlockHeader}>
                  <span>cURL Command</span>
                  <button 
                    onClick={() => copyToClipboard('curl -X POST https://api.conversa.ai/v1/voice/tts \\\n  -H "X-API-Key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"text": "Hello, welcome to Conversa AI.", "voice_id": "en_male_neural_1"}\'', 'cURL Example')} 
                    style={styles.copyBtn}
                    className="doc-copy-btn"
                  >
                    {copiedText.includes('curl') ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre style={styles.preCode}>
{`curl -X POST https://api.conversa.ai/v1/voice/tts \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, welcome to Conversa AI.",
    "voice_id": "en_male_neural_1"
  }'`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'code-examples' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>Code Examples</h1>
              <p style={styles.docLead}>
                Quick integration snippets across multiple languages. Choose your environment:
              </p>

              <div style={styles.sectionDivider}></div>

              <h2 style={styles.subTitle}>Node.js / JavaScript</h2>
              <div style={styles.codeBlockWrapper}>
                <div style={styles.codeBlockHeader}>
                  <span>javascript (axios)</span>
                  <button 
                    onClick={() => copyToClipboard(`const axios = require('axios');

const payload = {
  text: "Hello, welcome to Conversa AI voice services.",
  voice_id: "en_male_neural_1",
  audio_format: "mp3"
};

axios.post('https://api.conversa.ai/v1/voice/tts', payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  }
}).then(response => {
  console.log('Audio URL:', response.data.audio_url);
}).catch(err => {
  console.error(err);
});`, 'JS Snippet')} 
                    style={styles.copyBtn}
                    className="doc-copy-btn"
                  >
                    {copiedText.includes('axios') ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre style={styles.preCode}>
{`const axios = require('axios');

const payload = {
  text: "Hello, welcome to Conversa AI voice services.",
  voice_id: "en_male_neural_1",
  audio_format: "mp3"
};

axios.post('https://api.conversa.ai/v1/voice/tts', payload, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  }
}).then(response => {
  console.log('Audio URL:', response.data.audio_url);
}).catch(err => {
  console.error(err);
});`}
                </pre>
              </div>
            </div>
          )}

          {activeSection === 'sdk-libraries' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>SDK Libraries</h1>
              <p style={styles.docLead}>
                Official libraries for language platforms. Install using your package manager:
              </p>

              <div style={styles.sectionDivider}></div>

              <div style={styles.sdkGrid}>
                {/* Node */}
                <div className="glass-card" style={styles.sdkCard}>
                  <div style={styles.sdkHeader}>
                    <CodeIcon size={20} color="var(--primary-light)" />
                    <h3 style={styles.sdkTitle}>Node.js SDK</h3>
                  </div>
                  <pre style={styles.preInstall}>npm install @conversa/node</pre>
                  <button onClick={() => showToast('Node SDK docs loading...', 'info')} style={styles.sdkLink} className="doc-sdk-link">
                    View Documentation <ExternalLink size={12} />
                  </button>
                </div>

                {/* Python */}
                <div className="glass-card" style={styles.sdkCard}>
                  <div style={styles.sdkHeader}>
                    <Globe size={20} color="var(--primary-light)" />
                    <h3 style={styles.sdkTitle}>Python SDK</h3>
                  </div>
                  <pre style={styles.preInstall}>pip install conversa-python</pre>
                  <button onClick={() => showToast('Python SDK docs loading...', 'info')} style={styles.sdkLink} className="doc-sdk-link">
                    View Documentation <ExternalLink size={12} />
                  </button>
                </div>

                {/* Ruby */}
                <div className="glass-card" style={styles.sdkCard}>
                  <div style={styles.sdkHeader}>
                    <Terminal size={20} color="var(--primary-light)" />
                    <h3 style={styles.sdkTitle}>Ruby SDK</h3>
                  </div>
                  <pre style={styles.preInstall}>gem install conversa</pre>
                  <button onClick={() => showToast('Ruby SDK docs loading...', 'info')} style={styles.sdkLink} className="doc-sdk-link">
                    View Documentation <ExternalLink size={12} />
                  </button>
                </div>

                {/* PHP */}
                <div className="glass-card" style={styles.sdkCard}>
                  <div style={styles.sdkHeader}>
                    <Settings size={20} color="var(--primary-light)" />
                    <h3 style={styles.sdkTitle}>PHP SDK</h3>
                  </div>
                  <pre style={styles.preInstall}>composer require conversa/php</pre>
                  <button onClick={() => showToast('PHP SDK docs loading...', 'info')} style={styles.sdkLink} className="doc-sdk-link">
                    View Documentation <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rate-limits' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>Rate Limits & Pricing</h1>
              <p style={styles.docLead}>
                Review limits based on your Conversa subscription tier.
              </p>

              <div style={styles.sectionDivider}></div>

              <div style={styles.sdkGrid}>
                {/* Free */}
                <div className="glass-card" style={styles.sdkCard}>
                  <h3 style={styles.sdkTitle}>Free Tier</h3>
                  <div style={styles.priceNum}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
                  <ul style={styles.limitList}>
                    <li>1,000 audio seconds/mo</li>
                    <li>5 requests/min limit</li>
                    <li>Community support</li>
                  </ul>
                </div>

                {/* Pro */}
                <div className="glass-card" style={{ ...styles.sdkCard, borderColor: 'var(--primary)' }}>
                  <h3 style={styles.sdkTitle}>Pro Plan</h3>
                  <div style={styles.priceNum}>$99 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
                  <ul style={styles.limitList}>
                    <li>50,000 audio seconds/mo</li>
                    <li>50 requests/min limit</li>
                    <li>Priority email support</li>
                  </ul>
                </div>

                {/* Enterprise */}
                <div className="glass-card" style={styles.sdkCard}>
                  <h3 style={styles.sdkTitle}>Enterprise</h3>
                  <div style={styles.priceNum}>Custom</div>
                  <ul style={styles.limitList}>
                    <li>Unlimited audio seconds</li>
                    <li>Custom rate limits</li>
                    <li>Dedicated support & SLAs</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'error-handling' && (
            <div className="animate-fade-in">
              <h1 style={styles.docTitle}>Error Handling</h1>
              <p style={styles.docLead}>
                Review returned standard HTTP status codes mapping API errors:
              </p>

              <div style={styles.sectionDivider}></div>

              <table className="custom-table" style={{ marginTop: '20px' }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Code Name</th>
                    <th>Reason / Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-success">200</span></td>
                    <td style={{ fontWeight: '600' }}>OK</td>
                    <td>Request was successful and data returned.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-danger">400</span></td>
                    <td style={{ fontWeight: '600' }}>Bad Request</td>
                    <td>Missing parameters, invalid audio file format or length.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-danger">401</span></td>
                    <td style={{ fontWeight: '600' }}>Unauthorized</td>
                    <td>Missing or invalid X-API-Key token.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-danger">429</span></td>
                    <td style={{ fontWeight: '600' }}>Too Many Requests</td>
                    <td>Rate limit was exceeded for your subscription level.</td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-danger">500</span></td>
                    <td style={{ fontWeight: '600' }}>Internal Server Error</td>
                    <td>Server encountered an error processing speech synthesis or transcription.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
    width: '100%',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '48px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sidebarTitle: {
    fontSize: '1.2rem',
    color: 'var(--text-primary)',
    fontWeight: '700',
    paddingLeft: '12px',
  },
  sidebarList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: 0,
    margin: 0,
  },
  sidebarBtn: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    fontSize: '0.92rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'var(--transition)',
  },
  sidebarBtnActive: {
    color: 'var(--text-primary)',
    background: 'rgba(255, 255, 255, 0.05)',
    fontWeight: '600',
  },
  sidebarBtnLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  newBadge: {
    fontSize: '0.65rem',
    background: 'var(--success)',
    color: '#000000',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '700',
    letterSpacing: '0.02em',
  },
  content: {
    minWidth: 0,
  },
  docTitle: {
    fontSize: '2.5rem',
    marginBottom: '12px',
    color: 'var(--text-primary)',
  },
  docLead: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
  },
  sectionDivider: {
    borderBottom: '1px solid var(--border-color)',
    margin: '32px 0',
  },
  subTitle: {
    fontSize: '1.5rem',
    color: 'var(--text-primary)',
    margin: '32px 0 16px 0',
  },
  docText: {
    fontSize: '0.98rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  codeBlockWrapper: {
    background: '#07060f',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '32px',
  },
  codeBlockHeader: {
    background: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid var(--border-color)',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    padding: '4px',
    borderRadius: '4px',
  },
  preCode: {
    padding: '16px',
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: 'var(--primary-light)',
    overflowX: 'auto',
    whiteSpace: 'pre',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    margin: '24px 0 40px 0',
  },
  stepCard: {
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '20px',
    position: 'relative',
  },
  stepNum: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'rgba(139, 92, 246, 0.1)',
  },
  stepTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  stepDesc: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  ctaBox: {
    padding: '32px',
    margin: '40px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ctaBoxTitle: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
  },
  ctaBoxDesc: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
  },
  ctaBoxActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  apiRefBox: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.03) 100%)',
    border: '1px solid var(--border-hover)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap',
  },
  apiRefTextSide: {
    flex: '1',
    minWidth: '240px',
  },
  apiRefBoxTitle: {
    fontSize: '1.15rem',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  apiRefBoxDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  warningBox: {
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  sdkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  sdkCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
  },
  sdkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sdkTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-primary)',
  },
  preInstall: {
    fontFamily: 'monospace',
    background: '#07060f',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '0.82rem',
    color: 'var(--primary-light)',
    overflowX: 'auto',
  },
  sdkLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'var(--transition)',
  },
  priceNum: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
  },
  limitList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  }
};
