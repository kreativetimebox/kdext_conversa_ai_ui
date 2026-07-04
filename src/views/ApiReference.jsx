import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Copy, 
  Check, 
  Radio
} from 'lucide-react';

export default function ApiReference({ navigate, showToast }) {
  const [activeEndpoint, setActiveEndpoint] = useState('auth-login');
  const [clientTab, setClientTab] = useState('body'); // 'headers' | 'body'
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  // Form states for the Postman client
  const [formFields, setFormFields] = useState({});

  const endpoints = [
    {
      id: 'auth-login',
      method: 'POST',
      path: '/auth/login',
      title: 'User Login',
      desc: 'Authenticate a user and receive a JWT access token. The token should be stored and used for subsequent authenticated requests.',
      headers: [
        { key: 'Content-Type', value: 'application/json', required: true },
        { key: 'Accept', value: 'application/json', required: true }
      ],
      params: [
        { name: 'email', type: 'string', required: true, desc: "User's email address", default: 'varish.tomar1303@gmail.com' },
        { name: 'password', type: 'string', required: true, desc: "User's password", default: 'password123' }
      ],
      curl: `curl -X POST https://api.conversa.ai/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "email": "varish.tomar1303@gmail.com",
    "password": "password123"
  }'`,
      response: {
        status: '200 OK',
        body: {
          success: true,
          message: "Login successful! Redirecting to dashboard...",
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlZhcmlzaCBUb21hciIsImVtYWlsIjoidmFyaXNoLnRvbWFyMTMwM0BnbWFpbC5jb20iLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          user: {
            name: "Varish Tomar",
            email: "varish.tomar1303@gmail.com"
          }
        }
      }
    },
    {
      id: 'users-register',
      method: 'POST',
      path: '/users/register',
      title: 'User Registration',
      desc: 'Register a new developer account and generate standard rate limits.',
      headers: [
        { key: 'Content-Type', value: 'application/json', required: true }
      ],
      params: [
        { name: 'first_name', type: 'string', required: true, desc: 'First name of the user', default: 'Varish' },
        { name: 'last_name', type: 'string', required: true, desc: 'Last name of the user', default: 'Tomar' },
        { name: 'email', type: 'string', required: true, desc: 'Unique email address', default: 'varish.tomar1303@gmail.com' },
        { name: 'password', type: 'string', required: true, desc: 'Password string', default: 'password123' }
      ],
      curl: `curl -X POST https://api.conversa.ai/v1/users/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "first_name": "Varish",
    "last_name": "Tomar",
    "email": "varish.tomar1303@gmail.com",
    "password": "password123"
  }'`,
      response: {
        status: '201 Created',
        body: {
          message: "User registered successfully",
          user: {
            id: "usr_reg_103b412",
            first_name: "Varish",
            last_name: "Tomar",
            email: "varish.tomar1303@gmail.com",
            api_key: "sk_live_51MkJy4Adf7A6d2A1"
          }
        }
      }
    },
    {
      id: 'voice-tts',
      method: 'POST',
      path: '/voice/tts',
      title: 'Text to Speech Synthesis',
      desc: 'Synthesize input text into a high-quality neural voice audio stream. Returns audio metadata and static download endpoint URLs.',
      headers: [
        { key: 'X-API-Key', value: 'YOUR_API_KEY', required: true },
        { key: 'Content-Type', value: 'application/json', required: true }
      ],
      params: [
        { name: 'text', type: 'string', required: true, desc: 'Input text content to convert to speech', default: 'Hello, welcome to Conversa AI voice services.' },
        { name: 'voice_id', type: 'string', required: true, desc: 'Neural voice identifier code', default: 'en_male_neural_1' },
        { name: 'audio_format', type: 'string', required: false, desc: 'Output audio format (mp3, wav, ogg)', default: 'mp3' }
      ],
      curl: `curl -X POST https://api.conversa.ai/v1/voice/tts \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello, welcome to Conversa AI voice services.",
    "voice_id": "en_male_neural_1",
    "audio_format": "mp3"
  }'`,
      response: {
        status: '200 OK',
        body: {
          request_id: "req_tts_92ba01cd",
          status: "completed",
          audio_url: "https://api.conversa.ai/v1/storage/req_tts_92ba01cd.mp3",
          duration_seconds: 3.4,
          characters_count: 46,
          synthesized_at: "2026-06-16T09:12:00Z"
        }
      }
    },
    {
      id: 'voice-stt',
      method: 'POST',
      path: '/voice/stt',
      title: 'Speech to Text Transcription',
      desc: 'Transcribe uploaded audio file or streaming speech segments into high-fidelity structured text dialogue transcripts.',
      headers: [
        { key: 'X-API-Key', value: 'YOUR_API_KEY', required: true },
        { key: 'Content-Type', value: 'multipart/form-data', required: true }
      ],
      params: [
        { name: 'file', type: 'file', required: true, desc: 'Local binary audio file path to upload', default: 'audio_clip.wav' },
        { name: 'language', type: 'string', required: false, desc: 'Target audio language locale tag', default: 'en-US' },
        { name: 'speaker_diarization', type: 'string', required: false, desc: 'Identify and separate dialogue speakers (true, false)', default: 'true' }
      ],
      curl: `curl -X POST https://api.conversa.ai/v1/voice/stt \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "file=@audio_clip.wav" \\
  -F "language=en-US" \\
  -F "speaker_diarization=true"`,
      response: {
        status: '200 OK',
        body: {
          request_id: "req_stt_74ca03ed",
          status: "completed",
          filename: "audio_clip.wav",
          duration_seconds: 12.8,
          confidence: 0.992,
          transcript: "Hello, this is a transcribed speech log using Conversa STT engines.",
          speakers: [
            { speaker: "Speaker 1", start: 0.0, end: 4.5, text: "Hello, this is a transcribed speech log" },
            { speaker: "Speaker 1", start: 4.6, end: 12.8, text: "using Conversa STT engines." }
          ]
        }
      }
    }
  ];

  const currentEndpoint = endpoints.find(e => e.id === activeEndpoint) || endpoints[0];

  // Pre-fill form fields when active endpoint changes
  useEffect(() => {
    const fields = {};
    currentEndpoint.params.forEach(p => {
      fields[p.name] = p.default;
    });
    setFormFields(fields);
    setApiResponse(null);
  }, [activeEndpoint]);

  const handleFieldChange = (name, val) => {
    setFormFields(prev => ({ ...prev, [name]: val }));
  };

  const copyCode = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleSendRequest = () => {
    setIsSending(true);
    setApiResponse(null);
    
    // Simulate API request timing
    setTimeout(() => {
      setIsSending(false);
      
      // Customize response slightly if form fields changed
      let finalBody = { ...currentEndpoint.response.body };
      
      if (activeEndpoint === 'auth-login') {
        if (formFields['email'] !== currentEndpoint.params[0].default) {
          finalBody.user.email = formFields['email'];
          finalBody.user.name = formFields['email'].split('@')[0];
        }
      } else if (activeEndpoint === 'users-register') {
        if (formFields['email'] !== currentEndpoint.params[2].default) {
          finalBody.user.email = formFields['email'];
          finalBody.user.first_name = formFields['first_name'] || 'Varish';
          finalBody.user.last_name = formFields['last_name'] || 'Tomar';
        }
      } else if (activeEndpoint === 'voice-tts') {
        finalBody.request_id = "req_tts_" + Math.random().toString(36).substring(2, 10);
        finalBody.audio_url = `https://api.conversa.ai/v1/storage/${finalBody.request_id}.mp3`;
      } else if (activeEndpoint === 'voice-stt') {
        finalBody.request_id = "req_stt_" + Math.random().toString(36).substring(2, 10);
        finalBody.filename = formFields['file'] || 'audio_clip.wav';
      }

      setApiResponse({
        status: currentEndpoint.response.status,
        body: finalBody
      });
      showToast(`Response received: ${currentEndpoint.response.status}`, 'success');
    }, 1000);
  };

  return (
    <div style={styles.page}>
      {/* Back Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/documentation')} style={styles.backBtn} className="api-back-btn">
          <ArrowLeft size={16} /> Back to Documentation
        </button>
        <span style={styles.headerInfo}>Base URL: <code>https://api.conversa.ai/v1</code></span>
      </div>

      <div style={styles.layout} className="api-ref-layout-grid">
        {/* Sidebar Endpoints List */}
        <aside style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Endpoints</h3>
          <ul style={styles.list}>
            {endpoints.map((ep) => (
              <li key={ep.id}>
                <button 
                  onClick={() => setActiveEndpoint(ep.id)}
                  style={{
                    ...styles.endpointBtn,
                    ...(activeEndpoint === ep.id ? styles.endpointBtnActive : {})
                  }}
                  className="api-endpoint-btn"
                >
                  <span style={{
                    ...styles.methodBadge,
                    backgroundColor: ep.method === 'POST' ? 'rgba(37,99,235, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: ep.method === 'POST' ? 'var(--primary-light)' : 'var(--info)',
                    borderColor: ep.method === 'POST' ? 'rgba(37,99,235, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                  }}>
                    {ep.method}
                  </span>
                  <span style={styles.pathText}>{ep.path}</span>
                </button>
              </li>
            ))}
            
            {/* WebSocket Static Reference */}
            <li>
              <div style={styles.wsItem}>
                <span style={styles.wsBadge}>WS</span>
                <span style={styles.pathText}>/voice/stream</span>
              </div>
            </li>
          </ul>
        </aside>

        {/* API Details Area */}
        <main style={styles.mainContent}>
          <div className="animate-fade-in" key={activeEndpoint}>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>{currentEndpoint.title}</h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={styles.methodLabel}>{currentEndpoint.method}</span>
                <span style={styles.pathLabel}>{currentEndpoint.path}</span>
              </div>
            </div>
            
            <p style={styles.desc}>{currentEndpoint.desc}</p>
            <hr style={styles.divider} />

            {/* Request Schema Table */}
            <h3 style={styles.sectionHeader}>Request Parameters</h3>
            <table className="custom-table" style={styles.table}>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Presence</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {currentEndpoint.params.map((param) => (
                  <tr key={param.name}>
                    <td style={styles.fieldName}>{param.name}</td>
                    <td><code style={styles.codeBadge}>{param.type}</code></td>
                    <td>
                      {param.required ? (
                        <span style={styles.requiredBadge}>required</span>
                      ) : (
                        <span style={styles.optionalBadge}>optional</span>
                      )}
                    </td>
                    <td>{param.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Code Snippets Section */}
            <div style={styles.snippetsGrid} className="api-ref-snippets-grid">
              {/* cURL Example */}
              <div style={styles.snippetCol}>
                <h4 style={styles.snippetHeader}>cURL Example</h4>
                <div style={styles.codeBlockWrapper}>
                  <div style={styles.codeHeader}>
                    <span>bash</span>
                    <button onClick={() => copyCode(currentEndpoint.curl, 'cURL command')} style={styles.copyBtn}>
                      {copiedText === currentEndpoint.curl ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre style={styles.pre}>{currentEndpoint.curl}</pre>
                </div>
              </div>

              {/* Response Schema Example */}
              <div style={styles.snippetCol}>
                <h4 style={styles.snippetHeader}>Expected Response (200 OK)</h4>
                <div style={styles.codeBlockWrapper}>
                  <div style={styles.codeHeader}>
                    <span>JSON Schema</span>
                    <button onClick={() => copyCode(JSON.stringify(currentEndpoint.response.body, null, 2), 'Response Schema')} style={styles.copyBtn}>
                      {copiedText.includes('success') || copiedText.includes('request_id') ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre style={styles.pre}>{JSON.stringify(currentEndpoint.response.body, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Interactive API Tester Panel (Postman style) */}
            <div className="glass-card" style={styles.clientCard}>
              <div style={styles.clientHeader}>
                <div style={styles.clientTitleRow}>
                  <Radio size={16} color="var(--primary-light)" />
                  <h4 style={styles.clientTitle}>Postman Console API Tester</h4>
                </div>
                <div style={styles.clientTabs}>
                  <button 
                    onClick={() => setClientTab('body')} 
                    style={{...styles.clientTabBtn, ...(clientTab === 'body' ? styles.clientTabActive : {})}}
                  >
                    Body params
                  </button>
                  <button 
                    onClick={() => setClientTab('headers')} 
                    style={{...styles.clientTabBtn, ...(clientTab === 'headers' ? styles.clientTabActive : {})}}
                  >
                    Headers
                  </button>
                </div>
              </div>

              {/* Input Form Panel */}
              <div style={styles.clientConsole}>
                <div style={styles.requestUrlBar}>
                  <span style={styles.requestMethod}>{currentEndpoint.method}</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://api.conversa.ai/v1${currentEndpoint.path}`}
                    style={styles.requestUrlInput} 
                  />
                  <button 
                    onClick={handleSendRequest} 
                    disabled={isSending}
                    className="btn btn-primary" 
                    style={styles.sendBtn}
                  >
                    {isSending ? 'Sending...' : 'Send'} <Send size={14} />
                  </button>
                </div>

                {/* Tab Content */}
                <div style={styles.clientTabContent}>
                  {clientTab === 'body' ? (
                    <div style={styles.formGrid}>
                      {currentEndpoint.params.map((param) => (
                        <div key={param.name} className="form-group" style={{ marginBottom: '14px' }}>
                          <label className="form-label">
                            {param.name} {param.required && <span style={{ color: 'var(--error)' }}>*</span>}
                          </label>
                          {param.name === 'audio_format' ? (
                            <select 
                              value={formFields[param.name] || 'mp3'}
                              onChange={(e) => handleFieldChange(param.name, e.target.value)}
                              className="form-input"
                              style={{ background: 'var(--bg-main)' }}
                            >
                              <option value="mp3">mp3</option>
                              <option value="wav">wav</option>
                              <option value="ogg">ogg</option>
                            </select>
                          ) : param.name === 'speaker_diarization' ? (
                            <select 
                              value={formFields[param.name] || 'true'}
                              onChange={(e) => handleFieldChange(param.name, e.target.value)}
                              className="form-input"
                              style={{ background: 'var(--bg-main)' }}
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={formFields[param.name] || ''} 
                              onChange={(e) => handleFieldChange(param.name, e.target.value)}
                              className="form-input" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={styles.headersList}>
                      {currentEndpoint.headers.map((h) => (
                        <div key={h.key} style={styles.headerRow}>
                          <span style={styles.headerKey}>{h.key}</span>
                          <span style={styles.headerVal}>{h.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* API Output Terminal */}
                {(isSending || apiResponse) && (
                  <div style={styles.consoleOutput} className="animate-fade-in">
                    <div style={styles.consoleOutputHeader}>
                      <span>CONSOLE RESPONSE</span>
                      {apiResponse && (
                        <span style={{ 
                          color: apiResponse.status.includes('200') || apiResponse.status.includes('201') || apiResponse.status.includes('202') ? 'var(--success)' : 'var(--error)',
                          fontWeight: '600'
                        }}>
                          {apiResponse.status}
                        </span>
                      )}
                    </div>
                    <pre style={styles.consolePre}>
                      {isSending ? (
                        <div style={styles.terminalLoader}>
                          <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Executing request at endpoint...</span>
                        </div>
                      ) : (
                        JSON.stringify(apiResponse.body, null, 2)
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 'var(--max-width)',
    margin: '0 auto',
    padding: '30px 24px 80px 24px',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.92rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition)',
  },
  headerInfo: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '40px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarTitle: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    paddingLeft: '8px',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: 0,
    margin: 0,
  },
  endpointBtn: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '10px 8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    transition: 'var(--transition)',
  },
  endpointBtnActive: {
    background: 'rgba(15,23,42,0.04)',
    borderColor: 'var(--border-color)',
  },
  methodBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid transparent',
    minWidth: '50px',
    textAlign: 'center',
  },
  pathText: {
    fontSize: '0.88rem',
    fontFamily: 'monospace',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  wsItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 8px',
    opacity: 0.6,
  },
  wsBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(14,165,233, 0.15)',
    color: 'var(--secondary)',
    border: '1px solid rgba(14,165,233, 0.3)',
    minWidth: '50px',
    textAlign: 'center',
  },
  mainContent: {
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '2rem',
    color: 'var(--text-primary)',
  },
  methodLabel: {
    fontSize: '0.82rem',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'var(--primary-glow)',
    color: 'var(--primary-light)',
    border: '1px solid rgba(37,99,235, 0.3)',
  },
  pathLabel: {
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(15,23,42,0.03)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
  },
  desc: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border-color)',
    margin: '30px 0',
  },
  sectionHeader: {
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  table: {
    marginBottom: '40px',
  },
  fieldName: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  codeBadge: {
    fontFamily: 'monospace',
    color: 'var(--primary-light)',
    fontSize: '0.85rem',
  },
  requiredBadge: {
    color: 'var(--error)',
    fontSize: '0.78rem',
    fontWeight: '600',
    background: 'rgba(239,68,68,0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  optionalBadge: {
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
    fontWeight: '500',
    background: 'rgba(15,23,42,0.03)',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
  },
  snippetsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '48px',
  },
  snippetCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  snippetHeader: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  codeBlockWrapper: {
    background: '#eef4fd',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
    flex: '1',
  },
  codeHeader: {
    background: 'rgba(15,23,42,0.015)',
    borderBottom: '1px solid var(--border-color)',
    padding: '10px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
  },
  pre: {
    padding: '16px',
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    lineHeight: '1.5',
    color: 'var(--primary-light)',
    overflowX: 'auto',
  },
  clientCard: {
    padding: 0,
    overflow: 'hidden',
  },
  clientHeader: {
    background: 'rgba(15,23,42,0.02)',
    borderBottom: '1px solid var(--border-color)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  clientTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clientTitle: {
    fontSize: '1rem',
    color: 'var(--text-primary)',
  },
  clientTabs: {
    display: 'flex',
    gap: '8px',
  },
  clientTabBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: '500',
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'var(--transition)',
  },
  clientTabActive: {
    color: 'var(--text-primary)',
    background: 'rgba(15,23,42,0.05)',
  },
  clientConsole: {
    padding: '24px',
  },
  requestUrlBar: {
    display: 'flex',
    background: 'rgba(15,23,42,0.015)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  requestMethod: {
    background: 'rgba(37,99,235, 0.05)',
    color: 'var(--primary-light)',
    padding: '12px 18px',
    fontSize: '0.88rem',
    fontWeight: '700',
    borderRight: '1px solid var(--border-color)',
  },
  requestUrlInput: {
    flex: '1',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    padding: '0 16px',
  },
  sendBtn: {
    borderRadius: 0,
    padding: '0 24px',
  },
  clientTabContent: {
    marginBottom: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  headersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: 'rgba(15,23,42,0.01)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    fontSize: '0.88rem',
  },
  headerKey: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  },
  headerVal: {
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
  },
  consoleOutput: {
    background: '#eaf1fc',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  consoleOutputHeader: {
    background: 'rgba(15,23,42,0.01)',
    borderBottom: '1px solid var(--border-color)',
    padding: '10px 16px',
    fontSize: '0.78rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    display: 'flex',
    justifyContent: 'space-between',
  },
  consolePre: {
    padding: '16px',
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    color: '#34d399',
    overflowX: 'auto',
    minHeight: '120px',
  },
  terminalLoader: {
    display: 'flex',
    alignItems: 'center',
    height: '80px',
  }
};
