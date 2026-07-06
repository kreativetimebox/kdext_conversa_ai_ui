import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Volume2, Copy, Sparkles, CheckCircle2, Globe, ChevronDown, Zap, RotateCcw, Search, Bot, Mic, MicOff } from 'lucide-react';
import { translateText, voiceTTS, getWsBaseUrl, getVoiceTranslateWsUrl } from '../services/api';

const LANGUAGES = [
  { code: 'auto', name: 'Detect Language', flag: '🔍', region: '' },
  { code: 'en', name: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', region: 'Europe' },
  { code: 'fr', name: 'French', flag: '🇫🇷', region: 'Europe' },
  { code: 'de', name: 'German', flag: '🇩🇪', region: 'Europe' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', region: 'Europe' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', region: 'Americas' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', region: 'Europe' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', region: 'Asia' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', region: 'Asia' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', region: 'Asia' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', region: 'Middle East' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', region: 'South Asia' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', region: 'South Asia' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳', region: 'South Asia' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳', region: 'South Asia' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳', region: 'South Asia' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰', region: 'South Asia' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', region: 'Middle East' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', region: 'Europe' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', region: 'Europe' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪', region: 'Europe' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', region: 'Asia' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', region: 'Asia' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', region: 'Asia' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾', region: 'Asia' },
];

const TARGET_LANGUAGES = LANGUAGES.filter(l => l.code !== 'auto');

// Custom searchable language dropdown
function LangDropdown({ value, onChange, options, placeholder = 'Select Language' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find(l => l.code === value);

  const filtered = options.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (code) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="lang-dropdown-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: open ? 'rgba(37,99,235,0.12)' : 'rgba(15,23,42,0.05)',
          border: `1.5px solid ${open ? 'rgba(37,99,235,0.5)' : 'rgba(15,23,42,0.12)'}`,
          borderRadius: '12px',
          color: '#0f172a',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: '600',
          minWidth: '210px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          outline: 'none',
        }}
      >
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{selected?.flag || '🌐'}</span>
        <span style={{ flex: 1, textAlign: 'left', color: '#0f172a' }}>{selected?.name || placeholder}</span>
        <ChevronDown
          size={16}
          color="#3b82f6"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          zIndex: 999,
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1.5px solid rgba(37,99,235,0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px rgba(15,23,42,0.16), 0 0 0 1px rgba(37,99,235,0.1)',
          width: '280px',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          animation: 'dropdownFadeIn 0.15s ease-out',
        }}>
          {/* Search bar */}
          <div style={{ padding: '12px', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15,23,42,0.06)', borderRadius: '8px', padding: '8px 12px' }}>
              <Search size={14} color="#475569" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search language..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0f172a',
                  fontSize: '0.85rem',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Language list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '8px 0' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No languages found
              </div>
            )}
            {filtered.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  width: '100%',
                  background: lang.code === value ? 'rgba(37,99,235,0.15)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  borderLeft: lang.code === value ? '3px solid #2563eb' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (lang.code !== value) e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; }}
                onMouseLeave={e => { if (lang.code !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: lang.code === value ? '700' : '500', color: lang.code === value ? '#3b82f6' : '#0f172a' }}>
                    {lang.name}
                  </div>
                  {lang.region && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>{lang.region}</div>
                  )}
                </div>
                {lang.code === value && (
                  <CheckCircle2 size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Translate({ user, showToast }) {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [detectedLang, setDetectedLang] = useState(null);
  const [engine, setEngine] = useState('api');
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // ── Voice mode state ──────────────────────────────────────────────────────
  const [voiceActive, setVoiceActive] = useState(false);   // mic is recording
  const [voiceTranscript, setVoiceTranscript] = useState(''); // running STT text
  const [voiceWsConnected, setVoiceWsConnected] = useState(false);
  const voiceWsRef = useRef(null);
  const voiceMediaRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceShouldReconnectRef = useRef(false);
  const voiceReconnectTimerRef = useRef(null);
  const voiceReconnectDelayRef = useRef(1000);
  // ─────────────────────────────────────────────────────────────────────────

  const wsRef = useRef(null);
  const seqRef = useRef(0);
  // True until the first delta of the current request arrives — the previous
  // translation stays visible while typing (subtitle-style) and is replaced,
  // not blanked, when the new stream starts.
  const freshStreamRef = useRef(false);
  const debounceTimerRef = useRef(null);
  // Instant (subtitle) pass bookkeeping: throttle timer, last-fire time, and
  // which engine each request id used ('api' instant vs 'llm' refine).
  const instantTimerRef = useRef(null);
  // Polls briefly for the socket to reconnect before falling back to the
  // slow HTTP endpoint — see RECONNECT_GRACE_MS below.
  const graceTimerRef = useRef(null);
  const lastInstantRef = useRef(0);
  // Tracks the id of the most recent response actually applied to the UI —
  // NOT the id of the most recently sent request. See ws.onmessage below for
  // why the distinction matters.
  const lastAppliedIdRef = useRef(0);
  const reqEngineRef = useRef({});
  const wsToastShownRef = useRef(false);
  const pingTimerRef = useRef(null);
  const reconnectDelayRef = useRef(1000);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);

  // ws.onmessage is created once per connection, so it must read the CURRENT
  // input state through a ref — otherwise history entries and language badges
  // are built from the stale values captured when the socket connected.
  const latestRef = useRef({});
  latestRef.current = { sourceText, sourceLang, targetLang, engine };

  const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';

  const getWsUrl = (key) => `${getWsBaseUrl()}/ws/translate?api_key=${encodeURIComponent(key)}`;

  const connectWs = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsUrlStr = getWsUrl(apiKey);
      const ws = new WebSocket(wsUrlStr);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        reconnectDelayRef.current = 1000;
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'pong') return;
          // Accept anything newer than what's already applied — NOT only a
          // response matching the single most-recently-sent request. While
          // typing continuously, a new instant-pass request fires roughly
          // every 200ms; if any response takes even a little longer than
          // that to come back, a newer request is already in flight by the
          // time it arrives. Requiring an exact id match meant EVERY
          // response got discarded as "stale" for as long as typing kept
          // outrunning the round-trip time — freezing the panel on old text
          // for seconds, not milliseconds. `id < lastAppliedIdRef` still
          // rejects genuinely out-of-order/old arrivals; `id ===` is kept
          // (not just `>`) so multiple 'delta' chunks of the same in-flight
          // stream keep landing.
          if (msg.id < lastAppliedIdRef.current) return;
          lastAppliedIdRef.current = msg.id;

          if (msg.type === 'delta') {
            setIsTranslating(true);
            if (freshStreamRef.current) {
              // First token of a new stream replaces the previous translation.
              freshStreamRef.current = false;
              setTranslatedText(msg.content);
            } else {
              setTranslatedText(prev => prev + msg.content);
            }
          } else if (msg.type === 'done') {
            const kind = reqEngineRef.current[msg.id] || 'llm';
            delete reqEngineRef.current[msg.id];
            const cur = latestRef.current;
            setTranslatedText(msg.translation);
            setIsTranslating(false);
            if (msg.source_lang && cur.sourceLang === 'auto') {
              setDetectedLang(msg.source_lang);
            }
            // Instant subtitle passes update the panel only — history records
            // just the refined (pause) translations, not every keystroke.
            if (kind === 'api') return;

            const sLangName = cur.sourceLang === 'auto'
              ? (msg.source_lang ? (LANGUAGES.find(l => l.code === msg.source_lang)?.name || msg.source_lang) : 'Auto')
              : LANGUAGES.find(l => l.code === cur.sourceLang)?.name;

            setHistory(prev => {
              if (prev.length > 0 && prev[0].source === cur.sourceText && prev[0].result === msg.translation) {
                return prev;
              }
              return [{
                id: Date.now(),
                source: cur.sourceText,
                result: msg.translation,
                sLang: sLangName,
                tLang: LANGUAGES.find(l => l.code === cur.targetLang)?.name,
                sFlag: cur.sourceLang === 'auto' ? '🔍' : LANGUAGES.find(l => l.code === cur.sourceLang)?.flag,
                tFlag: LANGUAGES.find(l => l.code === cur.targetLang)?.flag,
                engine: cur.engine,
              }, ...prev].slice(0, 10);
            });
          } else if (msg.type === 'error') {
            setIsTranslating(false);
            showToast(msg.message || 'Streaming translation error.', 'error');
          }
        } catch (err) {
          console.error('WS parsing error:', err);
        }
      };

      ws.onclose = (ev) => {
        setWsConnected(false);
        clearInterval(pingTimerRef.current);
        wsRef.current = null;
        if (!shouldReconnectRef.current) return; // component unmounted / key changed
        console.warn('live-translate socket closed', ev.code, ev.reason || '(no reason)');
        if (ev.code === 4401) {
          showToast('Live translation unauthorized (bad key).', 'error');
          return;
        }
        // Explain server-reported failures once (not on every retry tick).
        if (ev.reason && !wsToastShownRef.current) {
          wsToastShownRef.current = true;
          showToast(`Live stream unavailable: ${ev.reason}. Using instant fallback.`, 'error');
        }
        reconnectTimerRef.current = setTimeout(connectWs, reconnectDelayRef.current);
        reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 15000);
      };

      ws.onerror = () => {
        // ws.close will trigger auto-reconnect
      };
    } catch (e) {
      console.error('WS connect failed:', e);
    }
  };

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectWs();
    return () => {
      // Stop the reconnect loop BEFORE closing, or onclose re-opens the socket
      // after unmount and leaks connections + state updates.
      shouldReconnectRef.current = false;
      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingTimerRef.current);
      // instantTimerRef isn't cleared on every keystroke (see the typing
      // effect below) so it needs an explicit clear here on true unmount.
      clearTimeout(instantTimerRef.current);
      instantTimerRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [apiKey]);

  // ── Voice WebSocket: connect to /ws/voice-translate ───────────────────────
  const connectVoiceWs = () => {
    if (voiceWsRef.current &&
        (voiceWsRef.current.readyState === WebSocket.OPEN ||
         voiceWsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      const ws = new WebSocket(getVoiceTranslateWsUrl(apiKey));
      voiceWsRef.current = ws;

      ws.onopen = () => {
        setVoiceWsConnected(true);
        voiceReconnectDelayRef.current = 1000;
        // Send config frame with the current target language
        ws.send(JSON.stringify({ type: 'config', target_lang: targetLang }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'pong') return;
          if (msg.type === 'transcript') {
            setVoiceTranscript(msg.text || '');
          } else if (msg.type === 'delta') {
            setIsTranslating(true);
            setTranslatedText(prev => prev + (msg.content || ''));
          } else if (msg.type === 'done') {
            setTranslatedText(msg.translation || '');
            setIsTranslating(false);
          } else if (msg.type === 'error') {
            setIsTranslating(false);
            showToast(msg.message || 'Voice translation error.', 'error');
          }
        } catch (err) {
          console.error('voice-WS parse error:', err);
        }
      };

      ws.onclose = (ev) => {
        setVoiceWsConnected(false);
        voiceWsRef.current = null;
        if (!voiceShouldReconnectRef.current) return;
        if (ev.code === 4401) {
          showToast('Voice translation unauthorized (bad key).', 'error');
          return;
        }
        voiceReconnectTimerRef.current = setTimeout(
          connectVoiceWs,
          voiceReconnectDelayRef.current
        );
        voiceReconnectDelayRef.current = Math.min(
          voiceReconnectDelayRef.current * 2, 15000
        );
      };

      ws.onerror = () => {};
    } catch (e) {
      console.error('Voice WS connect failed:', e);
    }
  };

  // When target language changes while voice WS is open, re-send config
  useEffect(() => {
    if (voiceWsRef.current && voiceWsRef.current.readyState === WebSocket.OPEN) {
      voiceWsRef.current.send(JSON.stringify({ type: 'config', target_lang: targetLang }));
    }
  }, [targetLang]);

  // ── Voice recording handlers ──────────────────────────────────────────────
  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone not supported in this browser.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { autoGainControl: false, noiseSuppression: true, echoCancellation: true },
      });
      voiceStreamRef.current = stream;

      // Ensure voice WS is connected
      voiceShouldReconnectRef.current = true;
      connectVoiceWs();

      // Reset output
      setVoiceTranscript('');
      setTranslatedText('');
      setIsTranslating(false);

      // MediaRecorder fires ondataavailable every 2 s → send binary chunk
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      voiceMediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0 &&
            voiceWsRef.current &&
            voiceWsRef.current.readyState === WebSocket.OPEN) {
          voiceWsRef.current.send(e.data);
        }
      };

      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(2000); // timeslice = 2000 ms
      setVoiceActive(true);
      showToast('🎙️ Voice translation active — speak now', 'info');
    } catch (err) {
      let msg = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError') {
        msg = 'Microphone access blocked. Allow it in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone found. Connect one and try again.';
      }
      showToast(msg, 'error');
    }
  };

  const stopVoiceRecording = () => {
    if (voiceMediaRecorderRef.current &&
        voiceMediaRecorderRef.current.state !== 'inactive') {
      voiceMediaRecorderRef.current.stop();
    }
    voiceMediaRecorderRef.current = null;
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(t => t.stop());
      voiceStreamRef.current = null;
    }
    // Keep WS open briefly so last chunk's translation can arrive, then close
    setTimeout(() => {
      voiceShouldReconnectRef.current = false;
      clearTimeout(voiceReconnectTimerRef.current);
      if (voiceWsRef.current) {
        voiceWsRef.current.close();
        voiceWsRef.current = null;
      }
      setVoiceWsConnected(false);
    }, 3000);
    setVoiceActive(false);
    setIsTranslating(false);
    showToast('Recording stopped.', 'success');
  };

  // Cleanup voice resources on unmount or engine switch away from 'voice'
  useEffect(() => {
    if (engine !== 'voice' && voiceActive) {
      stopVoiceRecording();
    }
  }, [engine]);

  useEffect(() => {
    return () => {
      voiceShouldReconnectRef.current = false;
      clearTimeout(voiceReconnectTimerRef.current);
      if (voiceMediaRecorderRef.current) {
        try { voiceMediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (voiceWsRef.current) {
        voiceWsRef.current.close();
      }
    };
  }, []);

  // Live typing → two-tier subtitle translation:
  //   1) INSTANT pass: throttled fast ('api') translation on every keystroke —
  //      full results in ~200-400ms, so the panel updates while you type.
  //   2) REFINE pass: when typing pauses, a higher-quality LLM translation
  //      streams in and replaces the instant one.
  // A single LLM request per keystroke can never feel like subtitles — its
  // time-to-first-token alone is longer than the gap between keystrokes.
  useEffect(() => {
    clearTimeout(debounceTimerRef.current);
    clearTimeout(graceTimerRef.current);
    // instantTimerRef is intentionally NOT cleared here on every keystroke —
    // this effect re-runs on every sourceText change, and clearing it
    // unconditionally meant a continuously-typing user (gaps shorter than
    // the remaining throttle wait) kept cancelling and rescheduling the
    // pending fire, so it could go several seconds without ever actually
    // firing — the translation would sit stale with no feedback until
    // typing paused. It's only cancelled below, on genuine resets.

    // ONLY auto-translate on typing if Live Mode is selected
    if (engine !== 'live') {
      clearTimeout(instantTimerRef.current);
      instantTimerRef.current = null;
      return;
    }

    if (!sourceText.trim()) {
      clearTimeout(instantTimerRef.current);
      instantTimerRef.current = null;
      setTranslatedText('');
      setDetectedLang(null);
      setIsTranslating(false);
      return;
    }

    const text = sourceText.trim();

    // If the socket dropped, reconnect right away so streaming resumes.
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectWs();
    }

    const sendOverWs = (wsEngine, wsText) => {
      seqRef.current += 1;
      const id = seqRef.current;
      reqEngineRef.current[id] = wsEngine;
      // Mark as translating for BOTH engines, not just 'llm' — otherwise the
      // instant pass swaps the text in with no visible feedback at all.
      setIsTranslating(true);
      if (wsEngine === 'llm') {
        freshStreamRef.current = true;
      }
      wsRef.current.send(JSON.stringify({
        type: 'translate',
        id,
        text: wsText,
        target_lang: latestRef.current.targetLang,
        engine: wsEngine,
      }));
    };

    const httpInstant = async (httpText) => {
      seqRef.current += 1;
      const id = seqRef.current;
      setIsTranslating(true);
      try {
        const cur = latestRef.current;
        const res = await translateText(apiKey, httpText, cur.sourceLang === 'auto' ? null : cur.sourceLang, cur.targetLang, 'api');
        // Same "accept anything newer than what's applied" rule as
        // ws.onmessage — an exact seqRef match would discard this response
        // the moment any newer request had been sent, even if it's still
        // the freshest one to actually come back.
        if (id < lastAppliedIdRef.current) return;
        lastAppliedIdRef.current = id;
        const result = res?.translation || res?.translated_text || res?.result || '';
        if (result) setTranslatedText(result);
        const detected = res?.source_lang || res?.detected_language || null;
        if (detected && cur.sourceLang === 'auto') setDetectedLang(detected);
        setIsTranslating(false);
      } catch {
        // instant pass is best-effort; the refine pass will still land
        setIsTranslating(false);
      }
    };

    // 1) instant subtitle pass — throttled: fires at most once every
    // INSTANT_MS, using the LATEST text at the moment it actually fires
    // (not the text from whenever it was scheduled), so a fire deferred by
    // continuous typing still translates what's currently on screen.
    const INSTANT_MS = 200;
    // If the socket isn't OPEN at this exact instant, don't fall back to the
    // HTTP endpoint right away — it re-authenticates from scratch on every
    // call (unlike the WebSocket, which only pays that cost once, at
    // connect time), so it's much slower. A brief grace window lets an
    // in-progress reconnect (usually fast) land first.
    const RECONNECT_GRACE_MS = 300;
    const RECONNECT_POLL_MS = 50;
    const fireInstant = () => {
      lastInstantRef.current = Date.now();
      const latestText = latestRef.current.sourceText.trim();
      if (!latestText) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendOverWs('api', latestText);
        return;
      }
      const graceDeadline = Date.now() + RECONNECT_GRACE_MS;
      const waitForSocketOrFallback = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          sendOverWs('api', latestText);
          return;
        }
        if (Date.now() >= graceDeadline) {
          httpInstant(latestText);
          return;
        }
        graceTimerRef.current = setTimeout(waitForSocketOrFallback, RECONNECT_POLL_MS);
      };
      waitForSocketOrFallback();
    };

    // Only schedule/fire if nothing is already pending — a keystroke that
    // arrives while a throttled fire is already queued just rides along
    // with it instead of pushing it back further.
    if (!instantTimerRef.current) {
      const since = Date.now() - lastInstantRef.current;
      if (since >= INSTANT_MS) {
        fireInstant();
      } else {
        instantTimerRef.current = setTimeout(() => {
          instantTimerRef.current = null;
          fireInstant();
        }, INSTANT_MS - since);
      }
    }

    // 2) refinement pass — after the user pauses, stream the LLM translation
    debounceTimerRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendOverWs('llm', latestRef.current.sourceText.trim());
      }
    }, 900);

    return () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(graceTimerRef.current);
    };
  }, [sourceText, targetLang, engine, sourceLang, apiKey]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setTranslatedText('');
    setDetectedLang(null);
    seqRef.current += 1;
    const currentSeq = seqRef.current;

    const activeEngine = engine === 'live' ? 'llm' : engine;

    try {
      const res = await translateText(apiKey, sourceText.trim(), sourceLang === 'auto' ? null : sourceLang, targetLang, activeEngine);
      if (currentSeq !== seqRef.current) return;

      const result = res?.translation || res?.translated_text || res?.result || '';
      const detected = res?.source_lang || res?.detected_language || null;

      setTranslatedText(result);
      if (detected && sourceLang === 'auto') {
        setDetectedLang(detected);
      }

      const sLangName = sourceLang === 'auto'
        ? (detected ? (LANGUAGES.find(l => l.code === detected)?.name || detected) : 'Auto')
        : LANGUAGES.find(l => l.code === sourceLang)?.name;

      setHistory(prev => [{
        id: Date.now(),
        source: sourceText,
        result,
        sLang: sLangName,
        tLang: LANGUAGES.find(l => l.code === targetLang)?.name,
        sFlag: sourceLang === 'auto' ? '🔍' : LANGUAGES.find(l => l.code === sourceLang)?.flag,
        tFlag: LANGUAGES.find(l => l.code === targetLang)?.flag,
        engine,
      }, ...prev].slice(0, 10));

    } catch (err) {
      if (currentSeq === seqRef.current) {
        showToast(err.message || 'Translation failed. Please check your connection.', 'error');
      }
    } finally {
      if (currentSeq === seqRef.current) {
        setIsTranslating(false);
      }
    }
  };

  const handleSwap = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      setSourceText(translatedText);
      setTranslatedText('');
    } else {
      if (detectedLang) {
        setSourceLang(targetLang);
        setTargetLang(detectedLang);
      } else {
        setSourceLang(targetLang);
        setTargetLang('en');
      }
      setSourceText(translatedText);
      setTranslatedText('');
    }
    setDetectedLang(null);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setDetectedLang(null);
  };

  const handleSpeak = async () => {
    if (!translatedText) return;
    setIsPlaying(true);
    try {
      // Edge TTS via /api/voice/tts streams audio back immediately (the
      // gateway's /text-to-speech is an async queued job with no instant URL).
      const blobUrl = await voiceTTS(apiKey, translatedText, targetLang);
      const audio = new Audio(blobUrl);
      const done = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(blobUrl);
      };
      audio.onended = done;
      audio.onerror = done;
      await audio.play();
    } catch (err) {
      showToast(err.message || 'Failed to synthesize speech.', 'error');
      setIsPlaying(false);
    }
  };

  const handleKeyDown = (e) => {
    // Live Mode translates automatically — no manual submit shortcut needed.
    if (engine !== 'live' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleTranslate();
    }
  };

  const charCount = sourceText.length;
  const maxChars = 5000;

  return (
    <div style={styles.container} className="animate-fade-in translate-page">
      {/* Dropdown animation */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .translate-textarea::-webkit-scrollbar { width: 4px; }
        .translate-textarea::-webkit-scrollbar-track { background: transparent; }
        .translate-textarea::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.3); border-radius: 2px; }
        @media (max-width: 768px) {
          .translate-page { padding: 20px 14px 40px !important; }
          .translate-page h1 { font-size: 1.35rem !important; }
          .translate-page h1 + p { margin-left: 0 !important; font-size: 0.8rem !important; }
          .translate-text-panels { flex-direction: column !important; }
          .translate-panel-divider { width: 100% !important; height: 1px !important; }
          .translate-history-texts { grid-template-columns: 1fr !important; }
          .lang-dropdown-btn { min-width: 140px !important; flex: 1; width: 100% !important; }
          .translate-engine-toggle { width: 100%; }
          .translate-engine-toggle button { flex: 1; justify-content: center; padding: 8px 8px !important; font-size: 0.78rem !important; }
        }
        @media (max-width: 500px) {
          .translate-lang-side {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .translate-detected-badge {
            width: 100% !important;
            text-align: center !important;
            box-sizing: border-box !important;
            white-space: normal !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <Globe size={28} color="#2563eb" style={{ verticalAlign: 'middle', marginRight: '12px' }} />
            Neural Translation
          </h1>
          <p style={styles.sub}>Powered by AI • Supports 25+ languages • Real-time translation</p>
        </div>

        {/* Engine Toggle */}
        <div style={styles.engineToggle} className="translate-engine-toggle">
          <button
            onClick={() => setEngine('api')}
            style={{ ...styles.engineBtn, ...(engine === 'api' ? styles.engineBtnActive : {}) }}
          >
            <Zap size={14} style={{ marginRight: '6px' }} />
            Google API
            <span style={{ ...styles.badge, background: engine === 'api' ? '#16a34a' : '#94a3b8' }}>Fast</span>
          </button>
          <button
            onClick={() => setEngine('llm')}
            style={{ ...styles.engineBtn, ...(engine === 'llm' ? styles.engineBtnActive : {}) }}
          >
            <Sparkles size={14} style={{ marginRight: '6px' }} />
            AI Model
            <span style={{ ...styles.badge, background: engine === 'llm' ? '#2563eb' : '#94a3b8' }}>Nuanced</span>
          </button>
          <button
            onClick={() => setEngine('live')}
            style={{ 
              ...styles.engineBtn, 
              ...(engine === 'live' ? {
                background: 'rgba(14,165,233,0.15)',
                color: '#38bdf8',
                boxShadow: '0 2px 8px rgba(14,165,233,0.2)',
              } : {}) 
            }}
          >
            <Bot size={14} style={{ marginRight: '6px' }} />
            Live Mode
            <span style={{ ...styles.badge, background: engine === 'live' ? '#0ea5e9' : '#94a3b8' }}>Stream</span>
          </button>
          <button
            onClick={() => setEngine('voice')}
            style={{
              ...styles.engineBtn,
              ...(engine === 'voice' ? {
                background: 'rgba(239,68,68,0.12)',
                color: '#f87171',
                boxShadow: '0 2px 8px rgba(239,68,68,0.18)',
              } : {})
            }}
          >
            <Mic size={14} style={{ marginRight: '6px' }} />
            Voice
            <span style={{ ...styles.badge, background: engine === 'voice' ? '#ef4444' : '#94a3b8' }}>Live</span>
          </button>
        </div>
      </div>

      {/* Main Translation Card */}
      <div style={styles.card}>

        {/* Language selector bar */}
        <div style={styles.langBar}>
          {/* Source language */}
          <div style={styles.langSide} className="translate-lang-side">
            <LangDropdown
              value={sourceLang}
              onChange={setSourceLang}
              options={LANGUAGES}
              placeholder="Detect Language"
            />
            {detectedLang && sourceLang === 'auto' && (
              <div style={styles.detectedBadge} className="translate-detected-badge">
                Detected: {LANGUAGES.find(l => l.code === detectedLang)?.flag} {LANGUAGES.find(l => l.code === detectedLang)?.name || detectedLang}
              </div>
            )}
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={isTranslating}
            style={styles.swapBtn}
            title="Swap languages"
          >
            <ArrowRightLeft size={18} color="#3b82f6" />
          </button>

          {/* Target language */}
          <div style={styles.langSide}>
            <LangDropdown
              value={targetLang}
              onChange={setTargetLang}
              options={TARGET_LANGUAGES}
              placeholder="Target Language"
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)' }} />

        {/* Text areas */}
        <div className="translate-text-panels">
          {/* Source panel */}
          <div style={styles.panel}>
            {engine === 'voice' ? (
              // ── Voice mode: mic UI + live transcript display ──────────────
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '24px', gap: '20px', minHeight: '200px',
              }}>
                {/* Mic button */}
                <button
                  onClick={voiceActive ? stopVoiceRecording : startVoiceRecording}
                  title={voiceActive ? 'Stop recording' : 'Start recording'}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: voiceActive
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: voiceActive
                      ? '0 0 0 8px rgba(239,68,68,0.2), 0 8px 24px rgba(239,68,68,0.4)'
                      : '0 8px 24px rgba(37,99,235,0.4)',
                    transition: 'all 0.3s ease',
                    animation: voiceActive ? 'voicePulse 1.4s ease-in-out infinite' : 'none',
                  }}
                >
                  {voiceActive
                    ? <MicOff size={32} color="#fff" />
                    : <Mic size={32} color="#fff" />}
                </button>

                {/* Status label */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  color: voiceActive ? '#ef4444' : '#64748b',
                }}>
                  {voiceActive && (
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'streamBlink 0.8s steps(2) infinite',
                      display: 'inline-block',
                    }} />
                  )}
                  {voiceActive ? 'Recording — speak now…' : 'Tap the mic to start'}
                </div>

                {/* Live transcript */}
                {voiceTranscript && (
                  <div style={{
                    width: '100%', background: 'rgba(37,99,235,0.05)',
                    border: '1px solid rgba(37,99,235,0.15)',
                    borderRadius: '12px', padding: '14px 18px',
                    fontSize: '0.95rem', lineHeight: '1.6',
                    color: '#1e293b', whiteSpace: 'pre-wrap',
                  }} dir="auto">
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: 600 }}>TRANSCRIPT</span>
                    {voiceTranscript}
                  </div>
                )}

                {/* WS status */}
                <div style={{ fontSize: '0.75rem', color: voiceWsConnected ? '#16a34a' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: voiceWsConnected ? '#16a34a' : '#94a3b8', display: 'inline-block' }} />
                  {voiceWsConnected ? 'Stream connected' : 'Stream offline'}
                </div>
              </div>
            ) : (
              // ── Text / Live mode: normal editable textarea ────────────────
              <textarea
                className="translate-textarea"
                style={styles.textarea}
                placeholder={engine === 'live'
                  ? 'Start typing — translation appears instantly as you write...'
                  : 'Enter text to translate... (Ctrl+Enter to translate)'}
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxChars}
                rows={8}
                dir="auto"
              />
            )}
            <div style={styles.panelFooter}>
              {engine !== 'voice' && (
                <span style={{
                  fontSize: '0.8rem',
                  color: charCount > maxChars * 0.9 ? '#f59e0b' : '#64748b',
                }}>
                  {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {engine !== 'voice' && sourceText && (
                  <button onClick={handleClear} style={styles.iconActionBtn} title="Clear">
                    <RotateCcw size={14} />
                  </button>
                )}
                {engine === 'live' ? (
                  // Live Mode translates automatically as you type — show a
                  // status chip instead of a manual Translate button.
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: 'rgba(14,165,233,0.10)',
                    color: '#0284c7', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: isTranslating ? '#0ea5e9' : '#16a34a',
                      animation: isTranslating ? 'streamBlink 0.8s steps(2) infinite' : 'none',
                    }} />
                    {isTranslating ? 'Translating live…' : 'Live — just type'}
                  </span>
                ) : engine === 'voice' ? null : (
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating || !sourceText.trim()}
                    style={{
                      ...styles.translateBtn,
                      opacity: isTranslating || !sourceText.trim() ? 0.5 : 1,
                      cursor: isTranslating || !sourceText.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isTranslating ? (
                      <>
                        <span style={styles.spinner} />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Globe size={15} style={{ marginRight: '6px' }} />
                        Translate
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Vertical divider */}
          <div className="translate-panel-divider" />

          {/* Target panel */}
          <div style={{ ...styles.panel, background: 'rgba(37,99,235,0.03)' }}>
            <div className="translate-textarea" style={{ ...styles.textarea, overflowY: 'auto', cursor: 'default' }}>
              {translatedText ? (
                // Show existing text AS-IS while a newer translation is in
                // flight — never blank/replace it. A small reload-style spinner
                // appended after the text is the only sign something's updating.
                <span dir="auto" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {translatedText}
                  {isTranslating && <span style={styles.inlineSpinner} />}
                </span>
              ) : isTranslating ? (
                <div style={styles.loadingState}>
                  <div className="translate-loading-wave">
                    <div className="translate-loading-bar" />
                    <div className="translate-loading-bar" />
                    <div className="translate-loading-bar" />
                    <div className="translate-loading-bar" />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Translating...</p>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Translation will appear here...</span>
              )}
            </div>
            <div style={{ ...styles.panelFooter, justifyContent: 'flex-end' }}>
              {translatedText && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSpeak} disabled={isPlaying} style={styles.iconActionBtn} title="Listen">
                    <Volume2 size={14} color={isPlaying ? '#2563eb' : 'currentColor'} />
                  </button>
                  <button onClick={handleCopy} style={styles.iconActionBtn} title="Copy translation">
                    {copied ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading bars animation + voice pulse */}
        <style>{`
          .translate-loading-wave {
            width: 80px;
            height: 32px;
            display: flex;
            justify-content: center;
            align-items: flex-end;
          }
          .translate-loading-bar {
            width: 6px;
            height: 6px;
            margin: 0 3px;
            background-color: var(--primary);
            border-radius: 3px;
            animation: translate-loading-wave-animation 1s ease-in-out infinite;
          }
          .translate-loading-bar:nth-child(2) { animation-delay: 0.1s; }
          .translate-loading-bar:nth-child(3) { animation-delay: 0.2s; }
          .translate-loading-bar:nth-child(4) { animation-delay: 0.3s; }
          @keyframes translate-loading-wave-animation {
            0%   { height: 6px; }
            50%  { height: 26px; }
            100% { height: 6px; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes voicePulse {
            0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 8px 24px rgba(239,68,68,0.4); }
            70%  { box-shadow: 0 0 0 16px rgba(239,68,68,0), 0 8px 24px rgba(239,68,68,0.4); }
            100% { box-shadow: 0 0 0 0 rgba(239,68,68,0), 0 8px 24px rgba(239,68,68,0.4); }
          }
        `}</style>
      </div>

      {/* Tips bar */}
      <div style={styles.tipsBar}>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {engine === 'live'
            ? '💡 Translates instantly while you type — AI refines it when you pause'
            : engine === 'voice'
            ? '💡 Speak naturally — each ~2 s of audio is transcribed and translated live'
            : '💡 Press Ctrl+Enter or click Translate to submit text'}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {engine === 'live' && (
            <span title={wsConnected ? 'Streaming connected' : 'Stream offline — using standard translation'} style={{
              width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
              background: wsConnected ? '#16a34a' : '#d97706',
              boxShadow: wsConnected ? '0 0 6px rgba(22,163,74,0.6)' : 'none',
            }} />
          )}
          {engine === 'voice' && (
            <span title={voiceWsConnected ? 'Voice stream connected' : 'Voice stream offline'} style={{
              width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
              background: voiceWsConnected ? '#16a34a' : '#d97706',
              boxShadow: voiceWsConnected ? '0 0 6px rgba(22,163,74,0.6)' : 'none',
            }} />
          )}
          Engine: <span style={{
            color: engine === 'live' ? '#0ea5e9' : engine === 'voice' ? '#f87171' : engine === 'api' ? '#16a34a' : '#3b82f6',
            fontWeight: '600'
          }}>
            {engine === 'live'
              ? (wsConnected ? 'Live Mode (Stream)' : 'Live Mode (offline — fallback)')
              : engine === 'voice'
              ? (voiceActive ? '🎙️ Voice (Recording)' : 'Voice (Ready)')
              : engine === 'api' ? 'Google API (Fast)' : 'AI Model (Nuanced)'}
          </span>
        </span>
      </div>

      {/* Translation History */}
      {history.length > 0 && (
        <div style={styles.historySection} className="animate-fade-in">
          <div style={styles.historyHeader}>
            <h3 style={{ color: '#475569', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
              Recent Translations ({history.length})
            </h3>
          </div>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} className="glass-card" style={styles.historyItem}>
                <div style={styles.historyLangRow}>
                  <span style={{ fontSize: '1.1rem' }}>{item.sFlag}</span>
                  <span style={styles.historyLangName}>{item.sLang}</span>
                  <ArrowRightLeft size={12} color="#64748b" />
                  <span style={{ fontSize: '1.1rem' }}>{item.tFlag}</span>
                  <span style={styles.historyLangName}>{item.tLang}</span>
                  <span style={{
                    marginLeft: 'auto',
                    background: item.engine === 'live' ? 'rgba(14,165,233,0.15)' : item.engine === 'llm' ? 'rgba(37,99,235,0.15)' : 'rgba(34,197,94,0.15)',
                    color: item.engine === 'live' ? '#38bdf8' : item.engine === 'llm' ? '#3b82f6' : '#16a34a',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {item.engine === 'live' ? 'LIVE' : item.engine === 'llm' ? 'AI' : 'API'}
                  </span>
                </div>
                <div className="translate-history-texts">
                  <p style={styles.historySource}>"{item.source.substring(0, 120)}{item.source.length > 120 ? '...' : ''}"</p>
                  <p style={styles.historyResult}>{item.result.substring(0, 120)}{item.result.length > 120 ? '...' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '32px 40px 60px',
    height: '100%',
    overflowY: 'auto',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  title: {
    fontSize: '2rem',
    color: '#0f172a',
    marginBottom: '8px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
  },
  sub: {
    color: '#64748b',
    fontSize: '0.9rem',
    marginLeft: '40px',
  },
  engineToggle: {
    display: 'flex',
    background: 'rgba(15,23,42,0.03)',
    borderRadius: '14px',
    padding: '4px',
    border: '1px solid rgba(15,23,42,0.08)',
    gap: '4px',
  },
  engineBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    padding: '9px 16px',
    color: '#64748b',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    gap: '4px',
  },
  engineBtnActive: {
    background: 'rgba(37,99,235,0.15)',
    color: '#60a5fa',
    boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
  },
  badge: {
    marginLeft: '6px',
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  card: {
    background: 'rgba(15,23,42,0.02)',
    border: '1px solid rgba(15,23,42,0.08)',
    borderRadius: '20px',
    overflow: 'visible',
    boxShadow: '0 20px 60px rgba(15,23,42,0.10)',
  },
  langBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    gap: '16px',
    flexWrap: 'wrap',
  },
  langSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '200px',
  },
  detectedBadge: {
    fontSize: '0.75rem',
    color: '#16a34a',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: '8px',
    padding: '4px 10px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  swapBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    background: 'rgba(37,99,235,0.08)',
    border: '1.5px solid rgba(37,99,235,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    flexShrink: 0,
  },
  textPanels: {},
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  panelDivider: {},
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '24px',
    color: '#0f172a',
    fontSize: '1.05rem',
    lineHeight: '1.7',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    minHeight: '200px',
  },
  panelFooter: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(15,23,42,0.05)',
    gap: '12px',
  },
  iconActionBtn: {
    background: 'rgba(15,23,42,0.05)',
    border: '1px solid rgba(15,23,42,0.1)',
    color: '#475569',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    width: '34px',
    height: '34px',
  },
  translateBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #1d4ed8 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    padding: '9px 20px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(29,78,216,0.4)',
    transition: 'all 0.2s ease',
    gap: '4px',
  },
  inlineSpinner: {
    display: 'inline-block',
    width: '13px',
    height: '13px',
    marginLeft: '8px',
    verticalAlign: 'middle',
    border: '2px solid rgba(37,99,235,0.2)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginRight: '8px',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '180px',
    gap: '16px',
  },
  tipsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 4px',
    marginTop: '8px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  kbd: {
    background: 'rgba(15,23,42,0.08)',
    border: '1px solid rgba(15,23,42,0.12)',
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#475569',
  },
  historySection: {
    marginTop: '40px',
  },
  historyHeader: {
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyItem: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRadius: '14px',
  },
  historyLangRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  historyLangName: {
    fontSize: '0.8rem',
    color: '#475569',
    fontWeight: '600',
  },
  historyTexts: {},
  historySource: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  historyResult: {
    fontSize: '0.9rem',
    color: '#1e293b',
    margin: 0,
    lineHeight: 1.5,
    fontWeight: '500',
  },
};
