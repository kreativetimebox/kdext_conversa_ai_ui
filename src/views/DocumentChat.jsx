import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Copy, CheckCircle2, User, Bot, StopCircle, FileText, X,
  Loader2, RefreshCw, Paperclip, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  referenceDocument, documentChat, parseDocumentRequestId,
  createConversation, addMessage,
} from '../services/api';

// Same lightweight markdown rendering approach as Chat.jsx (bold + newlines).
const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, i, arr) => {
    const lineWithBold = line.split(/\*\*(.*?)\*\*/g).map((chunk, j) => {
      if (j % 2 === 1) return <strong key={j} style={{ color: 'var(--text-primary)' }}>{chunk}</strong>;
      return chunk;
    });
    return (
      <React.Fragment key={i}>
        {lineWithBold}
        {i < arr.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={styles.msgActionBtn} title="Copy response">
      {copied
        ? <><CheckCircle2 size={13} color="#16a34a" /> <span>Copied</span></>
        : <><Copy size={13} /> <span>Copy</span></>}
    </button>
  );
};

export default function DocumentChat({ user, showToast }) {
  const [docInput, setDocInput] = useState('');
  const [doc, setDoc] = useState(null);            // { request_id, filename, pages, characters, preview, status }
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const attachDocument = async (refresh = false) => {
    const requestId = parseDocumentRequestId(docInput) || doc?.request_id;
    if (!requestId) {
      showToast('Paste a document request id or its full OCR URL.', 'warning');
      return;
    }
    setLoadingDoc(true);
    try {
      const summary = await referenceDocument(apiKey, requestId, refresh);
      setDoc(summary);
      setMessages([]);
      setConversationId(null);
      setPreviewOpen(false);
      showToast(
        `Document loaded — ${summary.characters.toLocaleString()} characters scanned. Ask away!`,
        'success'
      );
    } catch (err) {
      // 409 = OCR scan still running; 404 = unknown id; 422 = empty scan
      showToast(err.message || 'Failed to load document.', 'error');
    } finally {
      setLoadingDoc(false);
    }
  };

  const detachDocument = () => {
    setDoc(null);
    setMessages([]);
    setConversationId(null);
    setDocInput('');
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim() || isTyping || !doc) return;

    const question = input.trim();
    // Prior turns (role/content only) so the model keeps multi-question context.
    // The document itself is injected server-side — never resent from here.
    const history = messages
      .filter(m => !m.isError && m.content)
      .map(m => ({ role: m.role, content: m.content }));

    const newMessages = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    const assistantMsgIndex = newMessages.length;

    abortControllerRef.current = new AbortController();

    let assistantReply = '';
    try {
      const res = await documentChat(apiKey, doc.request_id, question, history, true);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let rawBody = '';   // full response text, for non-SSE fallback below
      let hasFinished = false;

      while (!hasFinished) {
        const { done, value } = await reader.read();
        if (done) break;
        const decoded = dec.decode(value, { stream: true });
        rawBody += decoded;
        buf += decoded;
        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            hasFinished = true;
            break;
          }
          let obj = null;
          try {
            obj = JSON.parse(data);
          } catch (jsonErr) {
            continue;
          }
          if (obj.error) throw new Error(obj.error);
          if (obj.content) {
            const token = obj.content;
            assistantReply += token;
            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[assistantMsgIndex] = {
                ...newMsgs[assistantMsgIndex],
                content: (newMsgs[assistantMsgIndex]?.content || '') + token,
              };
              return newMsgs;
            });
          }
        }
      }

      // Nothing streamed as SSE — the backend may have answered with plain
      // JSON (non-streaming shape). Fall back before declaring failure, and
      // if it's still empty, say so explicitly instead of leaving a blank
      // bubble with no explanation.
      if (!assistantReply && rawBody.trim()) {
        try {
          const data = JSON.parse(rawBody);
          assistantReply =
            data?.choices?.[0]?.message?.content ||
            data?.content ||
            '';
          if (!assistantReply && (data?.error || data?.message || data?.detail)) {
            throw new Error(data.error || data.message || data.detail);
          }
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) {
            throw new Error(`Unexpected response from server: ${rawBody.slice(0, 200)}`);
          }
          throw parseErr;
        }
        if (assistantReply) {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[assistantMsgIndex] = { ...newMsgs[assistantMsgIndex], content: assistantReply };
            return newMsgs;
          });
        }
      }
      if (!assistantReply) {
        throw new Error('The AI returned an empty response. Please try again.');
      }
      setIsTyping(false);

      // Persist client-side via /conversations, like Chat.jsx (documentChat
      // sends persist:false so the gateway doesn't double-save).
      if (assistantReply) {
        try {
          if (conversationId) {
            await addMessage(apiKey, conversationId, 'user', question);
            await addMessage(apiKey, conversationId, 'assistant', assistantReply);
          } else {
            const title = `Doc: ${doc.filename || doc.request_id}`.substring(0, 80);
            const conv = await createConversation(apiKey, title, 'document', [
              { role: 'user', content: question },
              { role: 'assistant', content: assistantReply },
            ]);
            if (conv && (conv.conversation_id || conv.id)) {
              setConversationId(conv.conversation_id || conv.id);
            }
          }
        } catch (err) {
          console.error('Failed to save document chat:', err);
        }
      }
    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[assistantMsgIndex] = {
          ...newMsgs[assistantMsgIndex],
          content: `Error: ${err.message || 'Failed to reach the document assistant.'}`,
          isError: true,
        };
        return newMsgs;
      });
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDocInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      attachDocument();
    }
  };

  // ── No document attached yet — reference input hero ────────────────────────
  if (!doc) {
    return (
      <div className="page-container animate-fade-in" style={styles.heroWrapper}>
        <div className="glass-card" style={styles.heroCard}>
          <div style={styles.heroIconCircle}>
            <FileText size={34} color="var(--primary-light)" />
          </div>
          <h1 style={styles.heroTitle}>Chat with a Document</h1>
          <p style={styles.heroSubtitle}>
            Paste a scanned document reference — the request id or the full OCR
            URL — and ask anything about its contents.
          </p>

          <div style={styles.heroInputRow}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="e.g. 6a4e6ba1246e… or https://apiocr.dexaitech.com/v1/requests/…"
              value={docInput}
              onChange={(e) => setDocInput(e.target.value)}
              onKeyDown={handleDocInputKeyDown}
              disabled={loadingDoc}
            />
            <button
              className="btn btn-primary"
              style={styles.attachBtn}
              onClick={() => attachDocument()}
              disabled={loadingDoc || !docInput.trim()}
            >
              {loadingDoc
                ? <><Loader2 size={16} className="doc-spin" /> Loading…</>
                : <><Paperclip size={16} /> Attach</>}
            </button>
          </div>

          <div style={styles.heroHint}>
            The document is fetched and scanned server-side — answers come only
            from what was extracted from it.
          </div>
        </div>

        <style>{`
          @keyframes docSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .doc-spin { animation: docSpin 1s linear infinite; }
        `}</style>
      </div>
    );
  }

  // ── Document attached — chat surface ────────────────────────────────────────
  return (
    <div style={styles.container}>
      <div className="chat-container" style={{ height: 'auto', flex: 1, minHeight: 0, position: 'relative' }}>

        {/* Attached document chip */}
        <div style={styles.docBar}>
          <div className="glass-card" style={styles.docChip}>
            <div style={styles.docChipIcon}>
              <FileText size={18} color="var(--primary-light)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.docChipTitle}>
                {doc.filename || doc.request_id}
              </div>
              <div style={styles.docChipMeta}>
                {doc.pages ? `${doc.pages} page${doc.pages > 1 ? 's' : ''} · ` : ''}
                {doc.characters.toLocaleString()} characters scanned
              </div>
            </div>
            <button
              onClick={() => setPreviewOpen(o => !o)}
              style={styles.docChipBtn}
              title={previewOpen ? 'Hide preview' : 'Show preview'}
            >
              {previewOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => attachDocument(true)}
              style={styles.docChipBtn}
              title="Re-fetch document from OCR"
              disabled={loadingDoc}
            >
              <RefreshCw size={15} className={loadingDoc ? 'doc-spin' : ''} />
            </button>
            <button
              onClick={detachDocument}
              style={{ ...styles.docChipBtn, color: 'rgba(239, 68, 68, 0.7)' }}
              title="Remove document"
            >
              <X size={16} />
            </button>
          </div>
          {previewOpen && (
            <div className="glass-card" style={styles.docPreview}>
              {doc.preview}{doc.characters > doc.preview.length ? '…' : ''}
            </div>
          )}
        </div>

        <div className="chat-history" style={{ position: 'relative', zIndex: 1 }}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.heroIconCircle}>
                <FileText size={30} color="var(--primary-light)" />
              </div>
              <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Ask anything about this document
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                e.g. “Summarize it”, “What is the total amount?”, “List the key dates”
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`chat-bubble-wrapper ${msg.role} animate-fade-in`}>
                {msg.role === 'assistant' && (
                  <div style={styles.avatarAi}>
                    <Bot size={18} color="#fff" />
                  </div>
                )}

                <div className={`chat-bubble ${msg.role}`} style={msg.isError ? { borderColor: 'var(--error)' } : {}}>
                  {msg.role === 'user' ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  ) : (
                    <div>
                      {renderMarkdown(msg.content)}
                      {isTyping && index === messages.length - 1 && (
                        <span style={styles.cursor}></span>
                      )}
                    </div>
                  )}

                  {msg.role === 'assistant' && !msg.isError && msg.content && (!isTyping || index !== messages.length - 1) && (
                    <div style={styles.bubbleActions}>
                      <CopyButton text={msg.content} />
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div style={styles.avatarUser}>
                    <User size={18} color="#fff" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${doc.filename || 'this document'}…`}
              rows={1}
            />

            {isTyping ? (
              <button
                className="chat-send-btn"
                style={{ background: 'var(--text-muted)' }}
                onClick={() => abortControllerRef.current?.abort()}
                title="Stop Generating"
              >
                <StopCircle size={18} />
              </button>
            ) : (
              <button
                className="chat-send-btn"
                onClick={handleSubmit}
                disabled={!input.trim()}
              >
                <Send size={18} />
              </button>
            )}
          </div>
          <div style={styles.footerText}>
            Answers come only from the scanned document. Verify important information.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes docSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .doc-spin { animation: docSpin 1s linear infinite; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
  },
  heroWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  heroCard: {
    width: '100%',
    maxWidth: '620px',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  heroIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(124, 58, 237, 0.1)',
    border: '1px solid rgba(124, 58, 237, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 0 30px rgba(124, 58, 237, 0.15)',
  },
  heroTitle: {
    fontSize: '1.9rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '10px',
    letterSpacing: '-0.02em',
  },
  heroSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '28px',
    maxWidth: '460px',
  },
  heroInputRow: {
    display: 'flex',
    gap: '10px',
    width: '100%',
    flexWrap: 'wrap',
  },
  attachBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 18px',
    whiteSpace: 'nowrap',
  },
  heroHint: {
    marginTop: '18px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  docBar: {
    padding: '12px 16px 0',
    flexShrink: 0,
    zIndex: 2,
  },
  docChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
  },
  docChipIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(124, 58, 237, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docChipTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  docChipMeta: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  docChipBtn: {
    background: 'transparent',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'var(--transition)',
  },
  docPreview: {
    marginTop: '8px',
    padding: '14px 16px',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    whiteSpace: 'pre-wrap',
    maxHeight: '160px',
    overflowY: 'auto',
    lineHeight: 1.5,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 'auto 0',
    textAlign: 'center',
    padding: '0 20px',
  },
  avatarAi: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, #0891b2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
    marginTop: '12px',
    boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(15,23,42,0.1)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '12px',
    flexShrink: 0,
    marginTop: '12px',
  },
  bubbleActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  msgActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(15,23,42,0.05)',
    border: '1px solid rgba(15,23,42,0.1)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  cursor: {
    display: 'inline-block',
    width: '8px',
    height: '16px',
    background: 'var(--primary-light)',
    marginLeft: '4px',
    verticalAlign: 'middle',
    animation: 'blink 1s step-end infinite',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '12px',
  },
};
