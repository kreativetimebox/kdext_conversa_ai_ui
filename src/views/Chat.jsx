import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, Volume2, Trash2, ChevronLeft, ChevronRight, ChevronDown, MoreVertical, Pencil, RefreshCw, AlertTriangle } from 'lucide-react';
import { chatCompletion, voiceSTT, voiceTTS, getConversationDetails, createConversation, addMessage, getConversations, deleteConversation, renameConversation } from '../services/api';
import { attachAudioLevelMeter } from '../utils/audioLevel';
import { detectLanguage, getDefaultVoiceForLanguage } from '../utils/detectLanguage';
import SiriOrb from '../components/SiriOrb';
import ParticleField from '../components/ParticleField';

// ── Error classification ───────────────────────────────────────────────────
// Detect a usage/rate limit so the UI can lock the composer instead of just
// painting another error bubble.
const isLimitError = (err) => {
  if (err?.status === 429) return true;
  const msg = (err?.message || '').toLowerCase();
  return /\b(limit|quota|exceeded|too many requests|insufficient|out of credit|rate[- ]?limit)\b/.test(msg);
};

// Detect context-length / token-limit errors from the backend.
const isContextLengthError = (err) => {
  const msg = (err?.message || '').toLowerCase();
  return /\b(context.?length|token.?limit|maximum.?context|too.?long|max.?tokens|context.?window)\b/.test(msg);
};

// Detect network / connectivity errors
const isNetworkError = (err) => {
  if (err?.name === 'TypeError') return true;
  const msg = (err?.message || '').toLowerCase();
  return /failed to fetch|networkerror|network request failed|net::err|load failed|fetch failed/i.test(msg);
};

// Turn any thrown error into a short, human-readable line — never the raw
// JSON / stack / "[object Object]" the backend or fetch layer produces.
const friendlyError = (err) => {
  if (isLimitError(err)) {
    return "You've reached your usage limit. Please upgrade your plan or try again later.";
  }
  if (isContextLengthError(err)) {
    return "This conversation has reached the maximum context limit. Please start a New Chat to continue.";
  }
  if (isNetworkError(err)) {
    return "No internet connection. Please check your network and try again.";
  }
  return 'Something went wrong while generating a response. Please try again.';
};

// ── Loop detection ─────────────────────────────────────────────────────────
// Detects if the AI is stuck repeating itself. Returns true when a 50+
// character substring appears 3+ times in the accumulated response.
const detectRepetitionLoop = (text) => {
  if (!text || text.length < 200) return false;
  // Check the last 600 characters for repeating patterns
  const tail = text.slice(-600);
  // Try pattern lengths from 50 to 150
  for (let pLen = 50; pLen <= 150; pLen += 10) {
    const pattern = tail.slice(-pLen);
    let count = 0;
    let idx = tail.indexOf(pattern);
    while (idx !== -1) {
      count++;
      if (count >= 3) return true;
      idx = tail.indexOf(pattern, idx + 1);
    }
  }
  return false;
};

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

// ── Markdown Renderer ──────────────────────────────────────────────────────
// Uses react-markdown + remark-gfm + remark-math + rehype-katex for full
// CommonMark + GFM + LaTeX math support.
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // ── Fenced code blocks ──
        code({ inline, className, children, ...props }) {
          const codeString = String(children).replace(/\n$/, '');
          if (!inline) {
            const langMatch = /language-(\w+)/.exec(className || '');
            const lang = langMatch ? langMatch[1] : 'Code';
            return (
              <div style={markdownStyles.codeBlock}>
                <div style={markdownStyles.codeHeader}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{lang}</span>
                  <CopyButton text={codeString} />
                </div>
                <pre style={markdownStyles.pre}><code {...props}>{codeString}</code></pre>
              </div>
            );
          }
          // ── Inline code ──
          return <code style={markdownStyles.inlineCode} {...props}>{children}</code>;
        },

        // ── Headings ──
        h1: ({ children }) => <h1 style={markdownStyles.h1}>{children}</h1>,
        h2: ({ children }) => <h2 style={markdownStyles.h2}>{children}</h2>,
        h3: ({ children }) => <h3 style={markdownStyles.h3}>{children}</h3>,
        h4: ({ children }) => <h4 style={markdownStyles.h4}>{children}</h4>,

        // ── Paragraphs ──
        p: ({ children }) => <p style={markdownStyles.p}>{children}</p>,

        // ── Links ──
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" style={markdownStyles.a}>
            {children}
          </a>
        ),

        // ── Lists ──
        ul: ({ children }) => <ul style={markdownStyles.ul}>{children}</ul>,
        ol: ({ children }) => <ol style={markdownStyles.ol}>{children}</ol>,
        li: ({ children }) => <li style={markdownStyles.li}>{children}</li>,

        // ── Blockquote ──
        blockquote: ({ children }) => <blockquote style={markdownStyles.blockquote}>{children}</blockquote>,

        // ── Horizontal rule ──
        hr: () => <hr style={markdownStyles.hr} />,

        // ── Tables (GFM) ──
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', marginTop: '8px', marginBottom: '8px' }}>
            <table style={markdownStyles.table}>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead style={markdownStyles.thead}>{children}</thead>,
        th: ({ children }) => <th style={markdownStyles.th}>{children}</th>,
        td: ({ children }) => <td style={markdownStyles.td}>{children}</td>,

        // ── Strong / Em ──
        strong: ({ children }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Styles for the markdown renderer
const markdownStyles = {
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
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    color: '#e4e4e7',
    lineHeight: 1.5,
  },
  inlineCode: {
    background: 'rgba(124, 58, 237, 0.12)',
    color: '#c084fc',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.88em',
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  },
  h1: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px' },
  h2: { fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', margin: '14px 0 6px' },
  h3: { fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '12px 0 4px' },
  h4: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '10px 0 4px' },
  p: { margin: '6px 0', lineHeight: 1.7, wordBreak: 'break-word' },
  a: { color: '#818cf8', textDecoration: 'underline', textUnderlineOffset: '2px' },
  ul: { paddingLeft: '20px', margin: '6px 0', listStyleType: 'disc' },
  ol: { paddingLeft: '20px', margin: '6px 0' },
  li: { margin: '4px 0', lineHeight: 1.6 },
  blockquote: {
    borderLeft: '3px solid rgba(124, 58, 237, 0.5)',
    paddingLeft: '14px',
    margin: '10px 0',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  hr: { border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0' },
  table: { borderCollapse: 'collapse', width: '100%', fontSize: '0.88rem' },
  thead: { background: 'rgba(15,23,42,0.06)' },
  th: {
    border: '1px solid var(--border-color)',
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  td: {
    border: '1px solid var(--border-color)',
    padding: '8px 12px',
    color: 'var(--text-secondary)',
  },
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
  const mountedRef = useRef(true);

  // Track mounted state to avoid setState after unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
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

  // Fully stop THIS button's playback: pause, free the blob URL, reset UI.
  const stopSelf = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (mountedRef.current) setIsPlaying(false);
  }, []);

  const handleSpeak = async () => {
    // If already playing, stop it
    if (isPlaying) {
      stopSelf();
      if (currentAudioRef.current?.owner === stopSelf) currentAudioRef.current = null;
      return;
    }

    if (!text?.trim()) return;

    // Immediately show the Stop state BEFORE the async call
    setIsPlaying(true);

    try {
      // Stop whichever bubble is currently speaking (resets its UI too).
      if (currentAudioRef.current?.stop) {
        currentAudioRef.current.stop();
      } else if (currentAudioRef.current?.pause) {
        currentAudioRef.current.pause(); // legacy shape, just in case
      }
      currentAudioRef.current = null;

      // Register ourselves as the current audio owner IMMEDIATELY
      // so the stop button works even during the TTS API call.
      currentAudioRef.current = { stop: stopSelf, owner: stopSelf };

      // Auto-detect the language of the response text so TTS speaks in the
      // correct language instead of always defaulting to English.
      const detectedLang = detectLanguage(text);
      const voice = getDefaultVoiceForLanguage(detectedLang);
      const blobUrl = await voiceTTS(apiKey, text, detectedLang, voice);

      // Check if we were stopped while waiting for TTS
      if (!mountedRef.current || currentAudioRef.current?.owner !== stopSelf) {
        URL.revokeObjectURL(blobUrl);
        return;
      }

      blobUrlRef.current = blobUrl;
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      currentAudioRef.current = { stop: stopSelf, owner: stopSelf };
      audio.play();
      audio.onended = () => {
        stopSelf();
        if (currentAudioRef.current?.owner === stopSelf) currentAudioRef.current = null;
      };
      audio.onerror = () => {
        stopSelf();
        if (currentAudioRef.current?.owner === stopSelf) currentAudioRef.current = null;
        showToast('Failed to play audio.', 'error');
      };
    } catch (err) {
      if (mountedRef.current) setIsPlaying(false);
      if (currentAudioRef.current?.owner === stopSelf) currentAudioRef.current = null;
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
      {isPlaying ? <StopCircle size={13} color="#a78bfa" /> : <Volume2 size={13} />}
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

  // Set when the backend reports a usage/rate limit — locks the composer and
  // shows a banner until the user reloads or the limit resets.
  const [limitReached, setLimitReached] = useState(false);
  // Set when the conversation exceeds the context/token limit
  const [contextLimitReached, setContextLimitReached] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer toggle only — always visible on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse toggle
  const [conversations, setConversations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Track whether we're in the middle of creating a conversation (prevents race condition)
  const [savingConversation, setSavingConversation] = useState(false);

  // Context menu state
  const [ctxMenuId, setCtxMenuId] = useState(null);
  // Rename state
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Auto-scroll control: when user scrolls up during streaming, pause auto-scroll
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const chatHistoryRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentAudioRef = useRef(null);
  const micLevelMeterRef = useRef(null);
  // Bumped on every new recording so a slow transcription from a PREVIOUS
  // recording can't append its (stale) text after a newer one has started.
  const voiceGenRef = useRef(0);
  // Same pattern for chat streams: bumped on submit AND on conversation
  // switch, so an in-flight stream can never write tokens into a different
  // conversation's messages after the user navigates away.
  const chatGenRef = useRef(0);

  const pathParts = currentPath ? currentPath.split('/') : [];
  const activeConversationId = pathParts.length > 2 ? pathParts[2] : null;

  useEffect(() => {
    // Invalidate + abort any in-flight stream: without this, a stream started
    // in the previous conversation keeps writing tokens into the newly loaded
    // message list at a stale index.
    chatGenRef.current += 1;
    abortControllerRef.current?.abort();
    // Reset context limit when switching conversations
    setContextLimitReached(false);
    setUserScrolledUp(false);
    setShowScrollBtn(false);

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
          // Scroll to show messages after loading (fixes bug-029)
          requestAnimationFrame(() => {
            if (chatHistoryRef.current) {
              chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
            }
          });
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
    setCtxMenuId(null);
    navigate(`/chat/${id}`);
  };

  // Fix bug-002: handleNewChat must reset state immediately rather than
  // relying on a route change (which no-ops when already on /chat).
  // Also clears input (fix bug-024).
  const handleNewChat = () => {
    setSidebarOpen(false);
    setCtxMenuId(null);
    // Abort any in-flight stream
    chatGenRef.current += 1;
    abortControllerRef.current?.abort();
    // Reset all state
    setMessages([]);
    setInput('');
    setIsTyping(false);
    setLimitReached(false);
    setContextLimitReached(false);
    setUserScrolledUp(false);
    setShowScrollBtn(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    // Navigate to /chat (if not already there, it triggers the effect;
    // if already there, the state resets above handle it)
    if (currentPath !== '/chat') {
      navigate('/chat');
    }
  };

  // Fix bug-020/021: After deleting the active conversation, clear messages
  // and navigate away so the deleted conversation can't be used.
  const handleDeleteConversation = async (e, id) => {
    if (e) e.stopPropagation();
    setCtxMenuId(null);
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
    try {
      await deleteConversation(apiKey, id);
      if (activeConversationId === id) {
        // Actively clear messages and navigate to new chat
        setMessages([]);
        setInput('');
        setIsTyping(false);
        navigate('/chat');
      }
      fetchConversations();
    } catch {
      showToast('Failed to delete conversation.', 'error');
    }
  };

  // Rename conversation
  const handleRenameConversation = async (id) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
    try {
      await renameConversation(apiKey, id, renameValue.trim());
      fetchConversations();
    } catch {
      showToast('Failed to rename conversation.', 'error');
    }
    setRenamingId(null);
  };

  // Smart auto-scroll: only scroll to bottom if user is near the bottom
  const scrollToBottom = useCallback(() => {
    if (userScrolledUp) return; // Don't force scroll if user scrolled up
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [userScrolledUp]);

  // Handle scroll events on the chat history container
  const handleChatScroll = useCallback(() => {
    const el = chatHistoryRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distFromBottom < 100;

    if (isNearBottom) {
      setUserScrolledUp(false);
      setShowScrollBtn(false);
    } else if (isTyping) {
      // Only mark as scrolled up if we're currently streaming
      setUserScrolledUp(true);
      setShowScrollBtn(true);
    } else {
      setShowScrollBtn(distFromBottom > 300);
    }
  }, [isTyping]);

  const handleScrollToLatest = () => {
    setUserScrolledUp(false);
    setShowScrollBtn(false);
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
        onSilence: () => {
          if (recorder.state !== 'inactive') recorder.stop();
          setIsRecording(false);
        },
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        const rawMime = recorder.mimeType || 'audio/webm';
        const mimeType = rawMime.split(';')[0].trim();
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
          const res = await voiceSTT(apiKey, file, null);
          if (gen !== voiceGenRef.current) return;
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

  const handleSubmit = async (e, retryContent = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const submitContent = retryContent || input.trim();
    if (!submitContent || isTyping || isRecording || limitReached || savingConversation) return;
    
    const userMsgContent = submitContent;
    const userMsg = { role: 'user', content: userMsgContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!retryContent) setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    // Reset scroll tracking for new message
    setUserScrolledUp(false);
    setShowScrollBtn(false);
    
    // Add empty assistant message placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    const assistantMsgIndex = newMessages.length;

    abortControllerRef.current = new AbortController();
    const gen = ++chatGenRef.current; // invalidated on conversation switch
    const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';

    // ── Prompt budget ────────────────────────────────────────────────────────
    const estTokens = (t) => Math.ceil((t || '').length / 3);
    const PROMPT_TOKEN_BUDGET = 5500;
    const priorTurns = [];
    let usedTokens = estTokens(userMsgContent);
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.isError || !m.content) continue;
      const cost = estTokens(m.content);
      if (usedTokens + cost > PROMPT_TOKEN_BUDGET) break;
      priorTurns.unshift({ role: m.role, content: m.content });
      usedTokens += cost;
    }
    const llmMessages = [...priorTurns, userMsg];

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
      const res = await chatCompletion(
        apiKey, llmMessages, null, true, 2048, abortControllerRef.current.signal
      );

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let hasFinished = false;

      try {
        while (!hasFinished) {
          const { done, value } = await reader.read();
          if (done) break;
          // Conversation switched while streaming — stop before writing tokens
          // into the newly loaded message list.
          if (gen !== chatGenRef.current) break;
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
            if (obj.error) {
              const e = obj.error;
              throw new Error(typeof e === 'string' ? e : (e.message || e.detail || JSON.stringify(e)));
            }
            if (obj.content) {
              const token = obj.content;
              assistantReply += token;

              // ── Loop detection (bug-010/011) ──
              if (detectRepetitionLoop(assistantReply)) {
                // Auto-abort the stream
                abortControllerRef.current?.abort();
                assistantReply += '\n\n⚠️ *Response was automatically stopped because a repetitive loop was detected.*';
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[assistantMsgIndex] = {
                    ...newMsgs[assistantMsgIndex],
                    content: assistantReply,
                    isError: true,
                  };
                  return newMsgs;
                });
                hasFinished = true;
                break;
              }

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
      } finally {
        // Release the HTTP connection on every exit path (error, abort,
        // conversation switch) — previously it dangled until GC.
        reader.cancel().catch(() => {});
      }
      setIsTyping(false);

      // Stream ended cleanly but the model returned nothing — remove the empty
      // placeholder instead of leaving a blank AI bubble on screen.
      if (!assistantReply && gen === chatGenRef.current) {
        setMessages(prev => prev.filter((_, i) => i !== assistantMsgIndex));
        showToast('No response was generated. Please try again.', 'warning');
      }

      // Save assistant message or create new conversation
      if (assistantReply) {
        if (activeConversationId) {
          try {
            await addMessage(apiKey, activeConversationId, 'assistant', assistantReply);
            fetchConversations(); // refresh sidebar timestamps
          } catch (err) {
            console.error("Failed to save assistant message to db:", err);
            showToast('Reply shown but could not be saved to history.', 'warning');
          }
        } else {
          // Fix bug-019: Block further sends during conversation creation
          setSavingConversation(true);
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
            showToast('This chat could not be saved to history.', 'warning');
          } finally {
            setSavingConversation(false);
          }
        }
      }

    } catch (err) {
      setIsTyping(false);

      // User hit Stop (or switched conversation): keep whatever streamed,
      // save the partial reply, and don't paint an error bubble.
      if (err.name === 'AbortError') {
        // Fix bug-013: preserve messages on abort
        if (assistantReply && activeConversationId && gen === chatGenRef.current) {
          try {
            await addMessage(apiKey, activeConversationId, 'assistant', assistantReply);
          } catch (errDb) {
            console.error("Failed to save stopped reply:", errDb);
          }
        } else if (!assistantReply && gen === chatGenRef.current) {
          // Stopped before a single token arrived — drop the empty assistant
          // placeholder so it doesn't linger as a blank AI bubble.
          setMessages(prev => prev.filter((_, i) => i !== assistantMsgIndex));
        }
        return;
      }

      // The conversation was switched out from under this stream — don't write
      // an error bubble into the newly-loaded (different) message list.
      if (gen !== chatGenRef.current) return;

      // Usage/rate limit: lock the composer
      if (isLimitError(err)) {
        setLimitReached(true);
      }

      // Context length error: show inline banner
      if (isContextLengthError(err)) {
        setContextLimitReached(true);
      }

      // Real error: keep any partial content above the error note
      const errorText = friendlyError(err);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[assistantMsgIndex] = {
          ...newMsgs[assistantMsgIndex],
          content: assistantReply ? `${assistantReply}\n\n${errorText}` : errorText,
          isError: true
        };
        return newMsgs;
      });
    }
  };

  // Retry handler: resend the last user message
  const handleRetry = () => {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        // Remove the failed response and resend
        const lastUserContent = messages[i].content;
        setMessages(prev => prev.slice(0, i));
        setTimeout(() => handleSubmit(null, lastUserContent), 50);
        return;
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenuId) return;
    const close = () => setCtxMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [ctxMenuId]);

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
            const isActive = activeConversationId === cid;
            return (
              <div
                key={cid}
                onClick={() => handleSelectConversation(cid)}
                className="chat-history-item"
                style={{
                  ...styles.historyItemRow,
                  ...(isActive ? styles.historyItemActive : {}),
                }}
              >
                {renamingId === cid ? (
                  <input
                    className="chat-history-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameConversation(cid)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameConversation(cid);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span style={{
                    ...styles.historyItemTitle,
                    ...(isActive ? { color: 'var(--primary-light)', fontWeight: 600 } : {}),
                  }}>
                    {c.title || 'Untitled'}
                  </span>
                )}
                <div className="chat-history-item-menu" style={{ position: 'relative' }}>
                  <button
                    className="chat-history-ctx-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCtxMenuId(ctxMenuId === cid ? null : cid);
                    }}
                    title="More options"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {ctxMenuId === cid && (
                    <div className="chat-history-ctx-menu" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => {
                        setRenamingId(cid);
                        setRenameValue(c.title || '');
                        setCtxMenuId(null);
                      }}>
                        <Pencil size={14} /> Rename
                      </button>
                      <button className="danger" onClick={(e) => handleDeleteConversation(e, cid)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    })
  );

  return (
    <div style={styles.container}>
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div style={styles.sidebarHeader}>
          <button onClick={handleNewChat} className="btn btn-primary" style={styles.newChatBtn}>
            New Chat
          </button>
        </div>
        <div style={styles.sidebarList}>
          {historyList}
        </div>
      </aside>
      {/* Desktop sidebar collapse toggle */}
      <button
        className="chat-sidebar-collapse-btn"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        style={{ left: sidebarCollapsed ? 0 : 280 }}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      {sidebarOpen && <div className="chat-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="chat-container" style={{ height: '100%', flex: 1, minHeight: 0, position: 'relative' }}>
        <ParticleField level={micLevel} active={isRecording} />
        <button className="chat-history-toggle" onClick={() => setSidebarOpen(true)}>
          History
        </button>
        <div
          className="chat-history"
          ref={chatHistoryRef}
          onScroll={handleChatScroll}
          style={{ position: 'relative', zIndex: 1 }}
        >
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
              <div key={index} className={`chat-bubble-wrapper ${msg.role} no-animate`}>
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
                      <MarkdownRenderer content={msg.content} />
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

                  {/* Retry button for failed messages */}
                  {msg.isError && index === messages.length - 1 && !isTyping && (
                    <button className="chat-retry-btn" onClick={handleRetry}>
                      <RefreshCw size={13} /> Retry
                    </button>
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

        {/* Scroll-to-latest button (bug-028) */}
        {showScrollBtn && (
          <button className="scroll-to-bottom-btn" onClick={handleScrollToLatest}>
            <ChevronDown size={14} /> Scroll to latest
          </button>
        )}

        {isRecording && messages.length > 0 && (
          <div style={styles.floatingOrbRow}>
            <SiriOrb size={120} level={micLevel} active={isRecording} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Listening…</span>
          </div>
        )}

        <div className="chat-input-area">
          {/* Context limit banner (enhancement) */}
          {contextLimitReached && (
            <div className="chat-context-limit-banner">
              <AlertTriangle size={16} />
              This conversation has reached the maximum context limit. Please start a New Chat to continue.
            </div>
          )}
          {limitReached && (
            <div style={styles.limitBanner}>
              You've reached your usage limit. Chat is temporarily disabled — please upgrade your plan or try again later.
            </div>
          )}
          <div className="chat-input-wrapper" style={limitReached || contextLimitReached ? { opacity: 0.6 } : undefined}>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={limitReached || contextLimitReached}
              style={{
                ...styles.actionBtn,
                cursor: (limitReached || contextLimitReached) ? 'not-allowed' : 'pointer',
                color: isRecording ? '#ef4444' : 'var(--text-muted)',
                transform: isRecording ? `scale(${1 + micLevel * 0.35})` : 'scale(1)',
                boxShadow: isRecording ? `0 0 ${8 + micLevel * 24}px ${2 + micLevel * 6}px rgba(239, 68, 68, 0.45)` : 'none',
                transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out, color 0.2s ease',
              }}
              title={isRecording ? "Stop Recording" : "Voice Input via STT"}
            >
              {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
            </button>
            
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={limitReached ? "Usage limit reached" : contextLimitReached ? "Context limit reached — start a New Chat" : isRecording ? "Listening..." : "Message Conversa AI..."}
              rows={1}
              disabled={isRecording || limitReached || contextLimitReached}
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
                disabled={!input.trim() || isRecording || limitReached || contextLimitReached || savingConversation}
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

      {/* Responsive Chat Hero title */}
      <style>{`
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
    height: '100%',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
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
    transition: 'all 0.15s ease',
  },
  historyItemActive: {
    background: 'var(--bg-subtle)',
    borderLeft: '3px solid var(--primary-light)',
    paddingLeft: '9px',
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
  limitBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    borderRadius: '10px',
    padding: '10px 14px',
    marginBottom: '10px',
    fontSize: '0.82rem',
    fontWeight: 500,
    textAlign: 'center',
  }
};
