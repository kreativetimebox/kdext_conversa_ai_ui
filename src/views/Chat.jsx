import React, { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, Volume2 } from 'lucide-react';
import { chatCompletion, voiceSTT, voiceTTS, getConversationDetails, createConversation, addMessage } from '../services/api';
import { logEvent } from '../utils/logger';

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
      logEvent('error', 'TTS speak failed', { error: err.message });
    }
  };

  return (
    <button
      onClick={handleSpeak}
      style={{
        ...styles.msgActionBtn,
        color: isPlaying ? '#3b82f6' : undefined,
        background: isPlaying ? 'rgba(37,99,235,0.15)' : undefined,
        borderColor: isPlaying ? 'rgba(37,99,235,0.3)' : undefined,
      }}
      title={isPlaying ? 'Stop speaking' : 'Speak response'}
    >
      <Volume2 size={13} color={isPlaying ? '#3b82f6' : undefined} />
      <span>{isPlaying ? 'Stop' : 'Speak'}</span>
    </button>
  );
};

export default function Chat({ user, showToast, currentPath, navigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const currentAudioRef = useRef(null);
  // Bumped on every new recording so a slow transcription from a PREVIOUS
  // recording can't append its (stale) text after a newer one has started.
  const voiceGenRef = useRef(0);
  // Refs mirroring recording state so async callbacks (RAF silence loop)
  // always see the current values, not the ones captured at closure time.
  const mediaRecorderRef = useRef(null);
  const isRecordingRef = useRef(false);
  // Silence auto-stop (Claude-style voice input): the mic listens while the
  // user speaks and turns itself off after a pause, no manual stop needed.
  const silenceAudioCtxRef = useRef(null);
  const silenceRafRef = useRef(null);
  const silenceStartRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const recordingStartRef = useRef(0);

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

  // How quiet counts as "silence" (0 = dead silent, 1 = max volume), how long
  // that silence must last after speech before auto-stop, and how long to wait
  // if the user never says anything at all.
  const SILENCE_THRESHOLD = 0.02;
  const SILENCE_AFTER_SPEECH_MS = 1800;
  const NO_SPEECH_TIMEOUT_MS = 8000;

  const stopSilenceDetection = () => {
    if (silenceRafRef.current) {
      cancelAnimationFrame(silenceRafRef.current);
      silenceRafRef.current = null;
    }
    if (silenceAudioCtxRef.current) {
      try { silenceAudioCtxRef.current.close(); } catch { /* already closed */ }
      silenceAudioCtxRef.current = null;
    }
    silenceStartRef.current = null;
  };

  // Watches mic volume and auto-stops the recording once the user has spoken
  // and then gone quiet — the same hands-free feel as Claude's voice input.
  const startSilenceDetection = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      silenceAudioCtxRef.current = audioCtx;
      silenceStartRef.current = null;
      hasSpokenRef.current = false;
      recordingStartRef.current = 0;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!isRecordingRef.current) return;
        // Stamp the start time on the first tick (not in the outer function,
        // which the react-hooks purity lint treats as render scope).
        if (!recordingStartRef.current) recordingStartRef.current = Date.now();

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        if (rms >= SILENCE_THRESHOLD) {
          hasSpokenRef.current = true;
          silenceStartRef.current = null;
        } else if (hasSpokenRef.current) {
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          } else if (Date.now() - silenceStartRef.current > SILENCE_AFTER_SPEECH_MS) {
            stopRecording();
            return;
          }
        } else if (Date.now() - recordingStartRef.current > NO_SPEECH_TIMEOUT_MS) {
          // Never spoke — don't leave the mic on forever.
          stopRecording();
          return;
        }

        silenceRafRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      // Silence detection is an enhancement — recording still works with a
      // manual stop if the AudioContext can't be created.
      console.warn('Silence detection setup failed:', err);
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
          logEvent('error', 'STT transcription failed', { error: err.message });
        } finally {
          if (gen === voiceGenRef.current) setIsTyping(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);
      // Auto-stop once the user finishes speaking (hands-free, Claude-style)
      startSilenceDetection(stream);
    } catch (err) {
      console.error('Microphone error:', err);
       logEvent('error', 'Microphone access failed', { errorName: err.name, error: err.message });
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
    // Read through refs — this is also called from the silence-detection RAF
    // loop, whose closure captured stale state values.
    if (mediaRecorderRef.current && isRecordingRef.current) {
      isRecordingRef.current = false;
      stopSilenceDetection();
      try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  };

  // Release the mic and audio context if the user navigates away mid-recording.
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopSilenceDetection();
      if (mediaRecorderRef.current) {
        try { mediaRecorderRef.current.stop(); } catch { /* already stopped */ }
        mediaRecorderRef.current = null;
      }
    };
  }, []);

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
            }
          } catch (err) {
            console.error("Failed to create conversation:", err);
          }
        }
      }

    } catch (err) {
      const errorText = `Error: ${err.message || 'Failed to connect to AI engine.'}`;
      logEvent('error', 'Chat completion failed', { error: err.message, conversationId: activeConversationId });
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
  <div style={styles.emptyState}>
    <img
      src={logo}
      alt="Conversa AI"
      style={{
        width: "64px",
        height: "64px",
        marginBottom: "20px",
      }}
    />

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

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              style={{ ...styles.actionBtn, color: isRecording ? '#ef4444' : 'var(--text-muted)' }}
              title={isRecording ? "Stop recording (stops automatically when you pause)" : "Dictate — mic stops when you finish speaking"}
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
    margin: 'auto 0',
    textAlign: 'center',
    padding: '0 20px',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(37,99,235, 0.1)',
    border: '1px solid rgba(37,99,235, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 0 40px rgba(37,99,235, 0.15)',
  },

  avatarAi: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, #0ea5e9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    flexShrink: 0,
    marginTop: '12px',
    boxShadow: '0 0 10px rgba(37,99,235, 0.3)',
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
