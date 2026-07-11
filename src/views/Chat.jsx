import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, Volume2, Trash2 } from 'lucide-react';
import { chatCompletion, voiceSTT, voiceTTS, getConversationDetails, createConversation, addMessage, getConversations, deleteConversation } from '../services/api';
import { attachAudioLevelMeter } from '../utils/audioLevel';
import SiriOrb from '../components/SiriOrb';
import ParticleField from '../components/ParticleField';

const getHistoryGroup = (updatedAtStr) => {
  if (!updatedAtStr) return 'Older';
  const updatedDate = new Date(updatedAtStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const compareDate = new Date(updatedDate.getFullYear(), updatedDate.getMonth(), updatedDate.getDate());
  const diffDays = Math.floor((today.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  return 'Older';
};

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Code</span>
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
          ? <><CheckCircle2 size={13} color="#16a34a" /> <span>Copied</span></>
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

const SpeakButton = ({ text, apiKey, showToast,currentAudioRef, }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  // Stop playback if this button's component unmounts (e.g. user navigates
  // away to another page while audio is still playing)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);
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
if (currentAudioRef.current) {
  currentAudioRef.current.pause();
  currentAudioRef.current.currentTime = 0;
}
      const blobUrl = await voiceTTS(apiKey, text, 'en', 'divya');
      blobUrlRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      currentAudioRef.current = audio;
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
        background: isPlaying ? 'rgba(124, 58, 237,0.15)' : undefined,
        borderColor: isPlaying ? 'rgba(124, 58, 237,0.3)' : undefined,
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
  // Live mic volume (0-1) while recording, drives the Siri-style reactive orb.
  const [micLevel, setMicLevel] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer toggle only — always visible on desktop
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentAudioRef = useRef(null);
  const micLevelMeterRef = useRef(null);
  // Bumped on every new recording so a slow transcription from a PREVIOUS
  // recording can't append its (stale) text after a newer one has started.
  const voiceGenRef = useRef(0);

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

  const fetchConversations = async () => {
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
    setLoadingHistory(true);
    try {
      const res = await getConversations(apiKey);
      if (res && Array.isArray(res)) {
        setConversations(res);
      } else if (res && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      showToast('Failed to load chat history.', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectConversation = (id) => {
    setSidebarOpen(false);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setSidebarOpen(false);
    navigate('/chat');
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
    try {
      await deleteConversation(apiKey, id);
      if (activeConversationId === id) {
        navigate('/chat');
      }
      fetchConversations();
    } catch {
      showToast('Failed to delete conversation.', 'error');
    }
  };

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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone recording is not supported in this browser. A secure HTTPS connection is required in production.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];
      const gen = ++voiceGenRef.current;

      micLevelMeterRef.current = attachAudioLevelMeter(stream, {
        onLevel: setMicLevel,
        silenceTimeoutMs: 3500,
        // Act on this closure's own `recorder`/`stream` directly rather than
        // through the stopRecording() wrapper — that reads `mediaRecorder`/
        // `isRecording` state as of THIS render (still null/false here,
        // since the setters below haven't applied yet), so calling it from
        // this later async callback would silently no-op on stale state.
        onSilence: () => {
          if (recorder.state !== 'inactive') recorder.stop();
          setIsRecording(false);
        },
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        // MediaRecorder.mimeType includes codec params (e.g. "audio/webm;codecs=opus")
        // but the STT server only accepts the bare base type. Strip codec suffix.
        const rawMime = recorder.mimeType || 'audio/webm';
        const mimeType = rawMime.split(';')[0].trim(); // → "audio/webm"
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm'
                  : mimeType.includes('ogg')  ? 'ogg'
                  : mimeType.includes('mp4')  ? 'mp4'
                  : 'wav';
        const file = new File([audioBlob], `voice_input.${ext}`, { type: mimeType });
        
        setIsTyping(true);
        showToast('Transcribing voice...', 'info');
        
        try {
          const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
          // Use gateway-proxied STT endpoint (/api/voice/stt → engine :8002/v1/stt)
          const res = await voiceSTT(apiKey, file, null);
          // Discard if a newer recording started while this one transcribed —
          // otherwise the previous recording's text lands as the current one.
          if (gen !== voiceGenRef.current) return;
          // Gateway returns { text, language, words[] }
          const transcript = res?.text || res?.detail || '';
          if (transcript) {
            setInput(prev => prev + (prev ? ' ' : '') + transcript);
            showToast('Voice transcribed successfully.', 'success');
          } else {
            showToast('No speech detected. Please try again.', 'warning');
          }
        } catch (err) {
          if (gen !== voiceGenRef.current) return;
          showToast(err.message || 'Failed to transcribe voice.', 'error');
        } finally {
          if (gen === voiceGenRef.current) setIsTyping(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (micLevelMeterRef.current) {
          micLevelMeterRef.current.stop();
          micLevelMeterRef.current = null;
        }
        setMicLevel(0);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showToast('Microphone access was blocked. Please allow microphone permissions in your browser/site settings.', 'error');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        showToast('No microphone found. Please connect a microphone and try again.', 'error');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        showToast('Microphone is busy. Close other apps/tabs using the mic and try again.', 'error');
      } else {
        showToast('Microphone access denied or unavailable.', 'error');
      }
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
          let obj = null;
          try {
            obj = JSON.parse(data);
          } catch (jsonErr) {
            continue; // skip malformed SSE fragments
          }
          // Surface upstream errors instead of silently dropping them
          // (a throw here must NOT be caught by the JSON-parse handler).
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
              fetchConversations();
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

  const historyList = loadingHistory ? (
    <div style={styles.historyEmptyState}>Loading conversations…</div>
  ) : conversations.length === 0 ? (
    <div style={styles.historyEmptyState}>No conversations yet — start a new chat to see it here.</div>
  ) : (
    ['Today', 'Yesterday', 'Previous 7 Days', 'Older'].map((group) => {
      const items = conversations
        .filter(c => getHistoryGroup(c.updated_at || c.created_at) === group)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      if (items.length === 0) return null;
      return (
        <div key={group} style={styles.historyGroup}>
          <div style={styles.historyGroupLabel}>{group}</div>
          {items.map((c) => {
            const cid = c.conversation_id || c.id;
            return (
              <div
                key={cid}
                onClick={() => handleSelectConversation(cid)}
                className="chat-history-item"
                style={{
                  ...styles.historyItemRow,
                  ...(activeConversationId === cid ? styles.historyItemActive : {}),
                }}
              >
                <span style={styles.historyItemTitle}>{c.title || 'Untitled'}</span>
                <button
                  onClick={(e) => handleDeleteConversation(e, cid)}
                  style={styles.historyDeleteBtn}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      );
    })
  );

  return (
    <div style={styles.container}>
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={styles.sidebarHeader}>
          <button onClick={handleNewChat} className="btn btn-primary" style={styles.newChatBtn}>
            New Chat
          </button>
        </div>
        <div style={styles.sidebarList}>
          {historyList}
        </div>
      </aside>
      {sidebarOpen && <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="chat-container" style={{ height: 'auto', flex: 1, minHeight: 0, position: 'relative' }}>
        <ParticleField level={micLevel} active={isRecording} />
        <button className="chat-history-toggle" onClick={() => setSidebarOpen(true)}>
          History
        </button>
        <div className="chat-history" style={{ position: 'relative', zIndex: 1 }}>
          {messages.length === 0 ? (
  <div style={styles.emptyState}>
    <div
      style={{
        marginBottom: '20px',
        borderRadius: '50%',
        boxShadow: isRecording
          ? `0 0 ${24 + micLevel * 60}px ${6 + micLevel * 16}px var(--primary-glow)`
          : '0 0 30px 4px var(--primary-glow)',
        transition: 'box-shadow 0.15s ease-out',
      }}
    >
      <SiriOrb size={160} level={micLevel} active={isRecording} />
    </div>

    <h2
      style={{
        fontSize: "2rem",
        color: "var(--text-primary)",
        fontWeight: 600,
      }}
    >
      How can I help you today?
    </h2>
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
                            currentAudioRef={currentAudioRef}
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

        {isRecording && messages.length > 0 && (
          <div style={styles.floatingOrbRow}>
            <SiriOrb size={120} level={micLevel} active={isRecording} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Listening…</span>
          </div>
        )}

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                ...styles.actionBtn,
                color: isRecording ? '#ef4444' : 'var(--text-muted)',
                transform: isRecording ? `scale(${1 + micLevel * 0.35})` : 'scale(1)',
                boxShadow: isRecording ? `0 0 ${8 + micLevel * 24}px ${2 + micLevel * 6}px rgba(239, 68, 68, 0.45)` : 'none',
                transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out, color 0.2s ease',
              }}
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

      {/* Pulse Animation for mic and responsive Chat Hero title */}
      <style>{`
        @keyframes customPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pulse { animation: customPulse 1.5s infinite ease-in-out; }

        .chat-hero-title {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.02em;
          text-align: center;
        }
        @media (max-width: 768px) {
          .chat-hero-title {
            font-size: 1.8rem;
            margin-bottom: 8px;
          }
        }
        @media (max-width: 480px) {
          .chat-hero-title {
            font-size: 1.5rem;
            margin-bottom: 6px;
          }
        }
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
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
  },
  newChatBtn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.9rem',
  },
  sidebarList: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '12px',
  },
  historyEmptyState: {
    padding: '32px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  historyGroup: {
    marginBottom: '20px',
  },
  historyGroupLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    padding: '0 8px',
    marginBottom: '6px',
  },
  historyItemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    marginBottom: '4px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  historyItemActive: {
    background: 'var(--bg-subtle)',
    color: 'var(--primary-light)',
  },
  historyItemTitle: {
    flex: 1,
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyDeleteBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 'auto 0',
    textAlign: 'center',
    padding: '0 20px',
  },
  floatingOrbRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '4px 0 12px',
    flexShrink: 0,
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(124, 58, 237, 0.1)',
    border: '1px solid rgba(124, 58, 237, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 0 40px rgba(124, 58, 237, 0.15)',
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
    border: '1px solid rgba(15,23,42,0.1)',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#2d2d2d',
    padding: '6px 12px',
    borderBottom: '1px solid rgba(15,23,42,0.05)',
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
    color: 'var(--text-muted)',
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
