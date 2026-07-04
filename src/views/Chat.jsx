import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, Volume2 } from 'lucide-react';
import { chatCompletion, voiceSTT, voiceTTS, getConversationDetails, createConversation, addMessage } from '../services/api';

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

const CopyButton = ({ text, variant = 'icon' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  if (variant === 'action') {
    return (
      <button onClick={handleCopy} style={styles.msgActionBtn} title="Copy response">
        {copied
          ? <><CheckCircle2 size={13} color="#22c55e" /> <span>Copied</span></>
          : <><Copy size={13} /> <span>Copy</span></>}
      </button>
    );
  }
  return (
    <button onClick={handleCopy} style={styles.copyBtn} title="Copy code">
      {copied ? <CheckCircle2 size={14} color="var(--success)" /> : <Copy size={14} />}
    </button>
  );
};

const SpeakButton = ({ text, apiKey, showToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  const handleSpeak = async () => {
    // If already playing, stop it
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    if (!text?.trim()) return;
    setIsPlaying(true);

    try {
      // Revoke previous blob URL to free memory
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      const blobUrl = await voiceTTS(apiKey, text, 'en', 'divya');
      blobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        audioRef.current = null;
        showToast('Failed to play audio.', 'error');
      };
    } catch (err) {
      setIsPlaying(false);
      showToast(err.message || 'Speech synthesis failed.', 'error');
    }
  };

  return (
    <button
      onClick={handleSpeak}
      style={{
        ...styles.msgActionBtn,
        color: isPlaying ? '#a78bfa' : undefined,
        background: isPlaying ? 'rgba(139,92,246,0.15)' : undefined,
        borderColor: isPlaying ? 'rgba(139,92,246,0.3)' : undefined,
      }}
      title={isPlaying ? 'Stop speaking' : 'Speak response'}
    >
      <Volume2 size={13} color={isPlaying ? '#a78bfa' : undefined} />
      <span>{isPlaying ? 'Stop' : 'Speak'}</span>
    </button>
  );
};

export default function Chat({ user, showToast, currentPath, navigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  const pathParts = currentPath ? currentPath.split('/') : [];
  const activeConversationId = pathParts.length > 2 ? pathParts[2] : null;

  useEffect(() => {
    const loadConversation = async () => {
      if (activeConversationId) {
        setIsTyping(true);
        try {
          const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
          const res = await getConversationDetails(apiKey, activeConversationId);
          if (res && res.messages) {
            setMessages(res.messages);
          } else {
            setMessages([]);
          }
        } catch (err) {
          showToast('Failed to load conversation history.', 'error');
        } finally {
          setIsTyping(false);
        }
      } else {
        setMessages([]);
      }
    };
    loadConversation();
  }, [activeConversationId, user]);

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
        const mimeType = recorder.mimeType || 'audio/wav';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('ogg') ? 'ogg' : 'wav';
        const file = new File([audioBlob], `voice_input.${ext}`, { type: mimeType });
        
        setIsTyping(true);
        showToast('Transcribing voice...', 'info');
        
        try {
          const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
          // Use gateway-proxied STT endpoint (/api/voice/stt → engine :8002/v1/stt)
          const res = await voiceSTT(apiKey, file, null);
          // Gateway returns { text, language, words[] }
          const transcript = res?.text || res?.detail || '';
          if (transcript) {
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
            showToast('Voice transcribed successfully.', 'success');
          } else {
            showToast('No speech detected. Please try again.', 'warning');
          }
        } catch (err) {
          showToast(err.message || 'Failed to transcribe voice.', 'error');
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
    
    const userMsgContent = input.trim();
    const userMsg = { role: 'user', content: userMsgContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    
    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    const assistantMsgIndex = newMessages.length;

    abortControllerRef.current = new AbortController();
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';

    // Persist user message immediately if conversation exists
    if (activeConversationId) {
      try {
        await addMessage(apiKey, activeConversationId, 'user', userMsgContent);
      } catch (err) {
        console.error("Failed to save user message to db:", err);
      }
    }

    let assistantReply = "";
    try {
      const res = await chatCompletion(apiKey, newMessages, 'gemini-3.1-pro', true);
      
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let hasFinished = false;
      
      while (!hasFinished) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            hasFinished = true;
            break;
          }
          try {
            const obj = JSON.parse(data);
            if (obj.error) throw new Error(obj.error);
            if (obj.content) {
              const token = obj.content;
              assistantReply += token;
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

      // Save assistant message or create new conversation
      if (assistantReply) {
        if (activeConversationId) {
          try {
            await addMessage(apiKey, activeConversationId, 'assistant', assistantReply);
          } catch (err) {
            console.error("Failed to save assistant message to db:", err);
          }
        } else {
          try {
            const title = userMsgContent.substring(0, 30) + (userMsgContent.length > 30 ? '...' : '');
            const seededMessages = [
              { role: 'user', content: userMsgContent },
              { role: 'assistant', content: assistantReply }
            ];
            const conv = await createConversation(apiKey, title, 'chat', seededMessages);
            if (conv && (conv.conversation_id || conv.id)) {
              navigate(`/chat/${conv.conversation_id || conv.id}`);
            }
          } catch (err) {
            console.error("Failed to create conversation:", err);
          }
        }
      }

    } catch (err) {
      const errorText = `Error: ${err.message || 'Failed to connect to AI engine.'}`;
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[assistantMsgIndex] = {
          ...newMsgs[assistantMsgIndex],
          content: errorText,
          isError: true
        };
        return newMsgs;
      });
      setIsTyping(false);

      // If active conversation and we got an error, save the error message as assistant response
      if (activeConversationId && errorText) {
        try {
          await addMessage(apiKey, activeConversationId, 'assistant', errorText);
        } catch (errDb) {
          console.error("Failed to save error response to db:", errDb);
        }
      }
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
                  
                  {msg.role === 'assistant' && !msg.isError && msg.content && (
                    <div style={styles.bubbleActions}>
                      {!isTyping || index !== messages.length - 1 ? (
                        <>
                          <CopyButton text={msg.content} variant="action" />
                          <SpeakButton
                            text={msg.content}
                            apiKey={user?.api_key || sessionStorage.getItem('api_key') || 'demo'}
                            showToast={showToast}
                          />
                        </>
                      ) : null}
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
    gap: '6px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  msgActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
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
