import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, RefreshCw } from 'lucide-react';
import { chatCompletion, speechToText } from '../services/api';

// Simple Markdown Renderer
const renderMarkdown = (text) => {
  if (!text) return null;
  
  // Very basic regex markdown parser for demonstration
  // Handles bold, code blocks, and newlines
  const parts = [];
  let currentIndex = 0;
  
  // Find code blocks
  const codeBlockRegex = /```([\s\S]*?)```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push({ type: 'text', content: text.slice(currentIndex, match.index) });
    }
    parts.push({ type: 'code', content: match[1].trim() });
    currentIndex = match.index + match[0].length;
  }
  
  if (currentIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(currentIndex) });
  }

  return parts.map((part, index) => {
    if (part.type === 'code') {
      return (
        <div key={index} style={styles.codeBlock}>
          <div style={styles.codeHeader}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Code</span>
            <CopyButton text={part.content} />
          </div>
          <pre style={styles.pre}><code>{part.content}</code></pre>
        </div>
      );
    }
    
    // Parse bold and newlines within text
    const textParts = part.content.split('\n').map((line, i) => {
      // Bold
      const lineWithBold = line.split(/\*\*(.*?)\*\*/g).map((chunk, j) => {
        if (j % 2 === 1) return <strong key={j} style={{ color: 'var(--text-primary)' }}>{chunk}</strong>;
        return chunk;
      });
      
      return (
        <React.Fragment key={i}>
          {lineWithBold}
          {i < part.content.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });

    return <span key={index} style={{ wordBreak: 'break-word' }}>{textParts}</span>;
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
    <button onClick={handleCopy} style={styles.copyBtn} title="Copy code">
      {copied ? <CheckCircle2 size={14} color="var(--success)" /> : <Copy size={14} />}
    </button>
  );
};

export default function Chat({ user, showToast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const file = new File([audioBlob], 'voice_input.wav', { type: 'audio/wav' });
        
        setIsTyping(true);
        showToast('Transcribing voice...', 'info');
        
        try {
          const res = await speechToText(user?.api_key || 'demo', file, 'auto');
          if (res && res.detail) {
            setInput(prev => prev + (prev ? ' ' : '') + res.detail);
            showToast('Voice transcribed successfully.', 'success');
          }
        } catch (err) {
          showToast('Failed to transcribe voice.', 'error');
        } finally {
          setIsTyping(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      showToast('Microphone access denied or unavailable.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim() || isTyping || isRecording) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    
    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    const assistantMsgIndex = newMessages.length;

    abortControllerRef.current = new AbortController();

    try {
      const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
      const res = await chatCompletion(apiKey, newMessages, 'gemini-3.1-pro', true);
      
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            setIsTyping(false);
            return;
          }
          try {
            const obj = JSON.parse(data);
            if (obj.error) throw new Error(obj.error);
            if (obj.content) {
              const token = obj.content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[assistantMsgIndex] = {
                  ...newMsgs[assistantMsgIndex],
                  content: (newMsgs[assistantMsgIndex]?.content || "") + token
                };
                return newMsgs;
              });
            }
          } catch (jsonErr) {
            // Log warning or skip invalid JSON
          }
        }
      }
      setIsTyping(false);

    } catch (err) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[assistantMsgIndex] = {
          ...newMsgs[assistantMsgIndex],
          content: `Error: ${err.message || 'Failed to connect to AI engine.'}`,
          isError: true
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

  return (
    <div style={styles.container}>
      <div className="chat-container">
        <div className="chat-history">
          {messages.length === 0 ? (
            <div style={styles.emptyState} className="animate-fade-in">
              <div style={styles.logoCircle}>
                <Bot size={40} color="var(--primary-light)" />
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                How can I help you today?
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Start a conversation or choose a suggestion below.
              </p>
              
              <div style={styles.suggestionGrid}>
                {[
                  { title: "Generate TTS Script", desc: "Write a script for voice synthesis" },
                  { title: "Analyze audio logs", desc: "Summarize call center transcriptions" },
                  { title: "Write a React component", desc: "For a dashboard interface" },
                  { title: "Translate document", desc: "English to Spanish (Latin America)" }
                ].map((s, i) => (
                  <button 
                    key={i} 
                    style={styles.suggestionCard}
                    onClick={() => setInput(s.title + " - " + s.desc)}
                    className="glass-card-hover glass-card"
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                  </button>
                ))}
              </div>
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
                  
                  {msg.role === 'assistant' && !isTyping && !msg.isError && (
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
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              style={{ ...styles.actionBtn, color: isRecording ? '#ef4444' : 'var(--text-muted)' }}
              title={isRecording ? "Stop Recording" : "Voice Input via STT"}
            >
              {isRecording ? <StopCircle size={20} className={isRecording ? 'pulse' : ''} /> : <Mic size={20} />}
            </button>
            
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Message Conversa AI..."}
              rows={1}
              disabled={isRecording}
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
                disabled={!input.trim() || isRecording}
              >
                <Send size={18} />
              </button>
            )}
          </div>
          <div style={styles.footerText}>
            Conversa AI can make mistakes. Verify important information.
          </div>
        </div>
      </div>
      
      {/* Pulse Animation for mic */}
      <style>{`
        @keyframes customPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pulse { animation: customPulse 1.5s infinite ease-in-out; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '0 20px',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)',
  },
  suggestionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    width: '100%',
    maxWidth: '800px',
  },
  suggestionCard: {
    textAlign: 'left',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
  },
  avatarAi: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, #ec4899 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
    marginTop: '12px',
    boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
  },
  avatarUser: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
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
    gap: '8px',
    marginTop: '12px',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    transition: 'var(--transition)',
    marginRight: '8px',
  },
  codeBlock: {
    background: '#1e1e1e',
    borderRadius: '8px',
    marginTop: '12px',
    marginBottom: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#2d2d2d',
    padding: '6px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  pre: {
    padding: '12px',
    margin: 0,
    overflowX: 'auto',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    color: '#e4e4e7',
  },
  copyBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
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
  }
};
