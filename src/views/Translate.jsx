import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Volume2, Copy, Sparkles, CheckCircle2, Globe, ChevronDown, Zap, X, Search, Bot, Mic, MicOff, StopCircle, Loader2 } from 'lucide-react';
import { translateText, voiceTTS, voiceSTT, getWsBaseUrl } from '../services/api';
import { logEvent } from '../utils/logger';

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
function LangDropdown({ value, onChange, options, placeholder = 'Select Language', align = 'left' }) {
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
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.95rem',
          fontWeight: '600',
          width: '220px',
          height: '44px',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          outline: 'none',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.4rem', lineHeight: 1 }}>
          {selected?.flag === '🔍' ? <Search size={20} color="var(--primary)" /> : (selected?.flag || '🌐')}
        </span>
        <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-primary)' }}>{selected?.name || placeholder}</span>
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
          left: align === 'left' ? 0 : 'auto',
          right: align === 'right' ? 0 : 'auto',
          zIndex: 999,
          background: 'var(--bg-card)',
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
                  color: 'var(--text-muted)',
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
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  borderLeft: lang.code === value ? '3px solid #2563eb' : '3px solid transparent',
                }}
                onMouseEnter={e => { if (lang.code !== value) e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; }}
                onMouseLeave={e => { if (lang.code !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>
                  {lang.flag === '🔍' ? <Search size={16} color="var(--primary)" /> : lang.flag}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: lang.code === value ? '700' : '500', color: lang.code === value ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                    {lang.name}
                  </div>
                  {lang.region && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>{lang.region}</div>
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
  const [engine, setEngine] = useState('live');
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copiedSource, setCopiedSource] = useState(false);
  // TTS phase per panel: 'idle' | 'loading' (request in flight) | 'playing'.
  // The explicit loading phase keeps the button honest while the audio file
  // is being generated — audio can never start with the button showing idle.
  const [srcTts, setSrcTts] = useState('idle');
  const [outTts, setOutTts] = useState('idle');
  // Bumped on every TTS stop/start so a response arriving after Stop is
  // discarded instead of playing with no visible Stop control.
  const ttsGenRef = useRef(0);
  const audioRef = useRef(null); // tracks the current TTS Audio object so we can stop it on unmount
  const [wsConnected, setWsConnected] = useState(false);

  // ── Voice mode state ──────────────────────────────────────────────────────
  // Voice mode uses the SAME /ws/translate socket as text Live Mode (wsRef).
  // The browser records mic audio in short complete segments, POSTs each to
  // the STT endpoint, then sends the transcript into wsRef for LLM translation.
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const voiceActiveRef = useRef(false);  // ref so async callbacks see latest value
  const voiceMediaRecorderRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const voiceCycleTimerRef = useRef(null);
  // Silence auto-stop: mirrors Google Translate — mic turns off on its own
  // after a pause in speech, instead of only stopping on manual click.
  const voiceAudioCtxRef = useRef(null);
  const voiceAnalyserRef = useRef(null);
  const voiceSilenceRafRef = useRef(null);
  const voiceSilenceStartRef = useRef(null);
  // Segment STT calls run in parallel, so a slow chunk must not let a later
  // chunk's text land first: each chunk takes a sequence number and results
  // are buffered, then appended in order — but only up to a bounded wait, so
  // one slow chunk (common on CPU STT) can't stall everything behind it.
  const voiceChunkSeqRef = useRef(0);   // next seq to assign to a recorded chunk
  const voiceFlushSeqRef = useRef(0);   // next seq allowed to append
  const voicePendingChunksRef = useRef({});  // seq -> transcript ('' = silent/failed)
  const voiceGapTimerRef = useRef(null);     // watchdog for a stuck/slow chunk
  // Language detected by the FIRST chunk when source is 'auto' — pinned and
  // sent as a hint for every later chunk, so the engine skips a full
  // language-detection pass per chunk (any of its ~99 languages still works;
  // only the redundant re-detection is skipped).
  const voiceDetectedLangRef = useRef(null);
  // How many STT uploads are in flight. If the server is slower than real
  // time, chunks otherwise pile up and the visible delay grows every second —
  // beyond the cap we drop the chunk and stay live instead of drifting.
  const voiceInflightRef = useRef(0);
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

  // ── Client-side translation cache ──────────────────────────────────────────
  // Live Mode re-requests the same (engine, target, text) constantly: the
  // instant pass re-fires while typing pauses/resumes, the refine pass re-runs
  // when the effect's deps change without the text changing, and re-typed text
  // repeats earlier requests verbatim. Serving those from a small LRU makes
  // them instant and skips the network round-trip entirely.
  const translationCacheRef = useRef(new Map());
  const CACHE_MAX = 200;
  const cacheKey = (kind, target, text) => `${kind}|${target}|${text}`;
  const cacheGet = (kind, target, text) =>
    translationCacheRef.current.get(cacheKey(kind, target, text));
  const cacheSet = (kind, target, text, translation) => {
    if (!translation) return;
    const m = translationCacheRef.current;
    const k = cacheKey(kind, target, text);
    if (m.has(k)) m.delete(k); // re-insert so Map order stays LRU
    m.set(k, translation);
    if (m.size > CACHE_MAX) m.delete(m.keys().next().value);
  };
  // Remembers each in-flight WS request's text/target so the 'done' frame can
  // be written into the cache (the response itself doesn't echo the input).
  const reqMetaRef = useRef({});

  const pushHistory = (cur, translation, detectedCode = null) => {
    const sLangName = cur.sourceLang === 'auto'
      ? (detectedCode ? (LANGUAGES.find(l => l.code === detectedCode)?.name || detectedCode) : 'Auto')
      : LANGUAGES.find(l => l.code === cur.sourceLang)?.name;
    setHistory(prev => {
      if (prev.length > 0 && prev[0].source === cur.sourceText && prev[0].result === translation) {
        return prev;
      }
      return [{
        id: Date.now(),
        source: cur.sourceText,
        result: translation,
        sLang: sLangName,
        tLang: LANGUAGES.find(l => l.code === cur.targetLang)?.name,
        sFlag: cur.sourceLang === 'auto' ? '🔍' : LANGUAGES.find(l => l.code === cur.sourceLang)?.flag,
        tFlag: LANGUAGES.find(l => l.code === cur.targetLang)?.flag,
        engine: cur.engine,
      }, ...prev].slice(0, 10);
    });
  };

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
            const meta = reqMetaRef.current[msg.id];
            delete reqMetaRef.current[msg.id];
            if (meta && msg.translation) {
              cacheSet(kind, meta.target, meta.text, msg.translation);
            }
            const cur = latestRef.current;
            setTranslatedText(msg.translation);
            setIsTranslating(false);
            if (msg.source_lang && cur.sourceLang === 'auto') {
              setDetectedLang(msg.source_lang);
            }
            // Instant subtitle passes update the panel only — history records
            // just the refined (pause) translations, not every keystroke.
            if (kind === 'api') return;

            pushHistory(cur, msg.translation, msg.source_lang);
          } else if (msg.type === 'error') {
            delete reqEngineRef.current[msg.id];
            delete reqMetaRef.current[msg.id];
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
        logEvent('error', 'Translate WebSocket closed', { code: ev.code, reason: ev.reason || '(no reason)' })
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
      // Stop any in-progress TTS audio so it doesn't keep playing after
      // the user navigates to another page.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [apiKey]);

  // ── Voice: send transcript through the EXISTING /ws/translate socket ────────
  // Reuses the same wsRef that text Live Mode uses. The existing ws.onmessage
  // handler already processes delta/done/error frames → target panel updates.
  const sendVoiceTranslation = async (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    // Read languages through latestRef — this function is called from
    // MediaRecorder callbacks whose closures were captured when recording
    // started, so `targetLang` from the render scope can be stale.
    const target = latestRef.current.targetLang;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Socket down: reconnect for the NEXT segment, but translate THIS one
      // over HTTP instead of silently dropping it.
      connectWs();
      seqRef.current += 1;
      const id = seqRef.current;
      setIsTranslating(true);
      try {
        const cur = latestRef.current;
        const res = await translateText(apiKey, trimmed, cur.sourceLang === 'auto' ? null : cur.sourceLang, target, 'llm');
        const result = res?.translation || res?.translated_text || res?.result || '';
        if (id < lastAppliedIdRef.current) return;
        lastAppliedIdRef.current = id;
        if (result) {
          setTranslatedText(result);
          cacheSet('llm', target, trimmed, result);
        }
      } catch (err) {
        console.warn('Voice HTTP translate fallback failed:', err);
      } finally {
        setIsTranslating(false);
      }
      return;
    }
    seqRef.current += 1;
    const id = seqRef.current;
    reqEngineRef.current[id] = 'llm';
    reqMetaRef.current[id] = { text: trimmed, target };
    freshStreamRef.current = true;
    setIsTranslating(true);
    wsRef.current.send(JSON.stringify({
      type: 'translate',
      id,
      text: trimmed,
      target_lang: target,
      engine: 'llm',
    }));
  };

  // ── Voice recording handlers ──────────────────────────────────────────────
  // Records mic audio in short complete segments. Each segment is a full
  // valid audio file (stop/restart creates new headers). The complete blob is
  // POSTed to /api/voice/stt, and the returned transcript text is sent into
  // the existing /ws/translate socket for instant LLM translation.

  // How long each mic segment is. Shorter = lower speech→text latency but
  // more requests and slightly worse STT accuracy. This is a hard latency
  // floor — no transcript can exist before a segment completes. With STT on
  // GPU (sub-second per chunk) 1.2s keeps subtitles snappy; go back toward
  // 2000 if the STT engine ever runs on CPU.
  const VOICE_SEGMENT_MS = 1200;
  // How quiet counts as "silence" (0 = dead silent, 1 = max volume) and how
  // long that silence must last before we auto-stop the mic.
  const SILENCE_THRESHOLD = 0.02;
  const SILENCE_DURATION_MS = 1500;

  // Pick a MediaRecorder mime type the browser actually supports. Hardcoding
  // 'audio/webm' makes the MediaRecorder constructor THROW on Safari / some
  // WebViews (which only do audio/mp4), which silently killed voice mode on
  // those clients. Feature-detect and fall back so it works everywhere.
  const pickVoiceMime = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      for (const t of candidates) {
        if (MediaRecorder.isTypeSupported(t)) return t;
      }
    }
    return ''; // let the browser choose its default
  };
  // Throttle STT-error toasts so a persistent failure doesn't spam every 2s.
  const voiceSttErrShownRef = useRef(0);
  // Translate only the recent tail of the transcript. Sending the whole
  // session transcript made every request slower than the last as the text
  // grew — with a capped tail, translation latency stays constant no matter
  // how long the session runs.
  const VOICE_CONTEXT_CHARS = 600;
  const voiceTranslateTail = (text) => {
    if (text.length <= VOICE_CONTEXT_CHARS) return text;
    const tail = text.slice(-VOICE_CONTEXT_CHARS);
    const cut = tail.indexOf(' ');
    return cut > 0 ? tail.slice(cut + 1) : tail; // don't start mid-word
  };

  // Longest we'll hold finished chunks waiting for an earlier slow one before
  // giving up on it and moving on — keeps subtitles flowing on slow CPU STT.
  const VOICE_MAX_GAP_WAIT_MS = 1200;

  // Append every consecutive completed chunk (in seq order) to the transcript
  // and fire one translation for the combined new text. If a later chunk is
  // ready but an earlier one is still missing, wait only VOICE_MAX_GAP_WAIT_MS
  // for it, then skip it — a single slow STT call must NOT freeze the stream
  // (the old behaviour, which made live translation crawl on CPU STT).
  const flushVoiceChunks = () => {
    const pending = voicePendingChunksRef.current;
    // Drop anything already behind the flush pointer (e.g. a skipped laggard
    // that arrived late) so it can't leak.
    for (const k of Object.keys(pending)) {
      if (Number(k) < voiceFlushSeqRef.current) delete pending[k];
    }

    const parts = [];
    while (Object.prototype.hasOwnProperty.call(pending, voiceFlushSeqRef.current)) {
      const t = pending[voiceFlushSeqRef.current];
      delete pending[voiceFlushSeqRef.current];
      voiceFlushSeqRef.current += 1;
      if (t) parts.push(t);
    }

    if (parts.length) {
      setVoiceTranscript(prev => {
        const accumulated = prev ? `${prev} ${parts.join(' ')}` : parts.join(' ');
        setSourceText(accumulated);
        sendVoiceTranslation(voiceTranslateTail(accumulated));
        return accumulated;
      });
    }

    // Watchdog: later chunks are waiting on a missing earlier one. Don't stall
    // indefinitely — after a bounded wait, skip the laggard and flush the rest.
    clearTimeout(voiceGapTimerRef.current);
    if (Object.keys(pending).length > 0) {
      voiceGapTimerRef.current = setTimeout(() => {
        if (
          !Object.prototype.hasOwnProperty.call(pending, voiceFlushSeqRef.current) &&
          Object.keys(pending).length > 0
        ) {
          voiceFlushSeqRef.current += 1; // give up on the slow/missing chunk
          flushVoiceChunks();
        }
      }, VOICE_MAX_GAP_WAIT_MS);
    }
  };

  const startRecordingCycle = (stream) => {
    if (!voiceActiveRef.current || !stream.active) return;

    const chunks = [];
    const mime = pickVoiceMime();
    let mr;
    try {
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (err) {
      // No supported recorder config — tell the user instead of dying silently.
      console.error('MediaRecorder init failed:', err);
      showToast('Voice recording is not supported in this browser.', 'error');
      stopVoiceRecording();
      return;
    }
    voiceMediaRecorderRef.current = mr;
    // Use whatever type the recorder actually settled on for the blob/upload,
    // so the extension and Content-Type match the real audio.
    const actualType = mr.mimeType || mime || 'audio/webm';
    // Base type WITHOUT the ";codecs=..." parameter for the upload — some STT
    // backends validate on an exact content-type match and reject the
    // parameterised form that plain 'audio/webm' would have passed.
    const uploadType = actualType.split(';')[0].trim() || 'audio/webm';
    const ext = uploadType.includes('mp4') ? 'mp4' : uploadType.includes('ogg') ? 'ogg' : 'webm';

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mr.onstop = async () => {
      // Build a complete audio blob from this segment (declare the clean base
      // type so the multipart upload's Content-Type has no codecs parameter).
      const blob = new Blob(chunks, { type: uploadType });
      // Only process if still actively recording
      if (voiceActiveRef.current) {
        // Start next cycle immediately (don't wait for STT response)
        startRecordingCycle(stream);

        // Claim this chunk's position in the transcript before the async STT
        // call, so out-of-order completions can't scramble the word order.
        const seq = voiceChunkSeqRef.current++;

        // POST to STT in parallel. This MUST be the synchronous /api/voice/stt
        // proxy (voiceSTT) — the gateway's /speech-to-text runs in async-queue
        // mode and only returns {job_id, status:"queued"}, never a transcript,
        // so using it here made voice mode silently produce nothing.
        // Backpressure: if 2 uploads are already in flight the server can't
        // keep up — drop this chunk rather than queue it, so the stream stays
        // pinned to real time instead of drifting further behind forever.
        if (blob.size > 500 && voiceInflightRef.current < 2) {
          voiceInflightRef.current += 1;
          try {
            const curLang = latestRef.current.sourceLang;
            // Pin the first auto-detected language as the hint for later
            // chunks — skips per-chunk language detection on the engine.
            const langHint = curLang === 'auto'
              ? voiceDetectedLangRef.current
              : curLang;
            const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: uploadType });
            const res = await voiceSTT(apiKey, file, langHint);
            const text = res?.text || res?.detail || res?.transcript || '';
            if (res?.language && latestRef.current.sourceLang === 'auto' && !voiceDetectedLangRef.current) {
              voiceDetectedLangRef.current = res.language;
              setDetectedLang(res.language);
            }
            voicePendingChunksRef.current[seq] = text.trim();
          } catch (err) {
            // Surface the failure (throttled) — a swallowed STT error is
            // exactly what makes voice mode look "not working" with no clue.
            console.warn('Voice STT chunk failed:', err);
            voicePendingChunksRef.current[seq] = ''; // advance past failed chunk
            const now = Date.now();
            if (now - voiceSttErrShownRef.current > 4000) {
              voiceSttErrShownRef.current = now;
              showToast(`Transcription failed: ${err?.message || 'STT service error'}`, 'error');
            }
          } finally {
            voiceInflightRef.current -= 1;
          }
        } else {
          if (blob.size > 500) {
            console.debug('Voice chunk dropped — STT backlog at cap, staying real-time');
          }
          voicePendingChunksRef.current[seq] = ''; // silent/dropped chunk, keep order moving
        }
        flushVoiceChunks();
      }
    };

    mr.start();
    // Stop after the segment window → onstop fires → complete file → restart
    voiceCycleTimerRef.current = setTimeout(() => {
      if (mr.state === 'recording') {
        mr.stop();
      }
    }, VOICE_SEGMENT_MS);
  };
  const startSilenceDetection = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      voiceAudioCtxRef.current = audioCtx;
      voiceAnalyserRef.current = analyser;
      voiceSilenceStartRef.current = null;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!voiceActiveRef.current) return;

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        if (rms < SILENCE_THRESHOLD) {
          if (voiceSilenceStartRef.current === null) {
            voiceSilenceStartRef.current = Date.now();
          } else if (Date.now() - voiceSilenceStartRef.current > SILENCE_DURATION_MS) {
            stopVoiceRecording();
            return;
          }
        } else {
          voiceSilenceStartRef.current = null;
        }

        voiceSilenceRafRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('Silence detection setup failed:', err);
    }
  };

  const stopSilenceDetection = () => {
    if (voiceSilenceRafRef.current) {
      cancelAnimationFrame(voiceSilenceRafRef.current);
      voiceSilenceRafRef.current = null;
    }
    if (voiceAudioCtxRef.current) {
      try { voiceAudioCtxRef.current.close(); } catch (_) {}
      voiceAudioCtxRef.current = null;
    }
    voiceAnalyserRef.current = null;
    voiceSilenceStartRef.current = null;
  };
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

      // Make sure the existing translate WS is connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWs();
      }

      // Reset output + chunk ordering state
      setVoiceTranscript('');
      setSourceText('');
      setTranslatedText('');
      setIsTranslating(false);
      voiceChunkSeqRef.current = 0;
      voiceFlushSeqRef.current = 0;
      voicePendingChunksRef.current = {};
      voiceDetectedLangRef.current = null;
      voiceInflightRef.current = 0;

      voiceActiveRef.current = true;
      setVoiceActive(true);
      showToast('🎙️ Voice translation active — speak now', 'info');

      // Start the record → STT → translate cycle
      startRecordingCycle(stream);
       // Auto-stop the mic after a pause in speech (like Google Translate)
      startSilenceDetection(stream);
    } catch (err) {
      let msg = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError') {
        msg = 'Microphone access blocked. Allow it in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone found. Connect one and try again.';
      }
      showToast(msg, 'error');
      logEvent('error', 'Voice translate mic error', { errorName: err.name, error: err.message })
    }
  };

  const stopVoiceRecording = () => {
    voiceActiveRef.current = false;
    setVoiceActive(false);
    stopSilenceDetection();
    clearTimeout(voiceCycleTimerRef.current);
    clearTimeout(voiceGapTimerRef.current);
    if (voiceMediaRecorderRef.current &&
        voiceMediaRecorderRef.current.state !== 'inactive') {
      try { voiceMediaRecorderRef.current.stop(); } catch (_) {}
    }
    voiceMediaRecorderRef.current = null;
    if (voiceStreamRef.current) {
      voiceStreamRef.current.getTracks().forEach(t => t.stop());
      voiceStreamRef.current = null;
    }
    setIsTranslating(false);
    showToast('Recording stopped.', 'success');
  };

  
  useEffect(() => {
    return () => {
      voiceActiveRef.current = false;
      stopSilenceDetection();
      clearTimeout(voiceCycleTimerRef.current);
      if (voiceMediaRecorderRef.current) {
        try { voiceMediaRecorderRef.current.stop(); } catch (_) {}
      }
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach(t => t.stop());
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
      reqMetaRef.current[id] = { text: wsText, target: latestRef.current.targetLang };
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

    // Serve a repeat request straight from the cache: apply it as if it were
    // the newest response so older in-flight replies can't overwrite it.
    const applyCached = (cached) => {
      seqRef.current += 1;
      lastAppliedIdRef.current = seqRef.current;
      freshStreamRef.current = false;
      setTranslatedText(cached);
      setIsTranslating(false);
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
        const result = res?.translation || res?.translated_text || res?.result || '';
        if (result) cacheSet('api', cur.targetLang, httpText, result);
        if (id < lastAppliedIdRef.current) return;
        lastAppliedIdRef.current = id;
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
      // Prefer the refined LLM result if this exact text was already
      // translated (better quality than a fresh instant pass), else reuse a
      // previous instant result — either way, no network round-trip.
      const cached = cacheGet('llm', latestRef.current.targetLang, latestText)
        || cacheGet('api', latestRef.current.targetLang, latestText);
      if (cached) {
        applyCached(cached);
        return;
      }
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
      const refineText = latestRef.current.sourceText.trim();
      if (!refineText) return;
      const cachedLlm = cacheGet('llm', latestRef.current.targetLang, refineText);
      if (cachedLlm) {
        applyCached(cachedLlm);
        pushHistory(latestRef.current, cachedLlm);
        return;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendOverWs('llm', refineText);
      }
    }, 900);

    return () => {
      clearTimeout(debounceTimerRef.current);
      clearTimeout(graceTimerRef.current);
    };
  }, [sourceText, targetLang, engine, sourceLang, apiKey]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    const activeEngine = engine === 'live' ? 'llm' : engine;

    // Repeat of an already-translated text → answer from cache, no request.
    const cached = cacheGet(activeEngine, targetLang, sourceText.trim());
    if (cached) {
      seqRef.current += 1;
      lastAppliedIdRef.current = seqRef.current;
      setTranslatedText(cached);
      setIsTranslating(false);
      pushHistory(latestRef.current, cached, detectedLang);
      return;
    }

    setIsTranslating(true);
    setTranslatedText('');
    setDetectedLang(null);
    seqRef.current += 1;
    const currentSeq = seqRef.current;

    try {
      const res = await translateText(apiKey, sourceText.trim(), sourceLang === 'auto' ? null : sourceLang, targetLang, activeEngine);
      const result = res?.translation || res?.translated_text || res?.result || '';
      if (result) cacheSet(activeEngine, targetLang, sourceText.trim(), result);
      if (currentSeq !== seqRef.current) return;

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
        logEvent('error', 'Translation request failed', { error: err.message, targetLang });
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

  const handleCopySource = () => {
    if (!sourceText) return;
    navigator.clipboard.writeText(sourceText);
    setCopiedSource(true);
    setTimeout(() => setCopiedSource(false), 2000);
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
    setDetectedLang(null);
  };

  // Stops whichever panel's audio is playing/generating and resets both.
  const stopSpeaking = () => {
    ttsGenRef.current += 1; // invalidates any TTS request still in flight
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSrcTts('idle');
    setOutTts('idle');
  };

  // Shared TTS playback for both panels (source + translation), Google
  // Translate style: clicking the speaker while loading or playing stops it.
  const speakText = async (text, lang, setPhase, phase) => {
    if (phase !== 'idle') {
      stopSpeaking();
      return;
    }
    if (!text?.trim()) return;
    stopSpeaking();
    const gen = ++ttsGenRef.current;
    setPhase('loading');
    try {
      // Edge TTS via /api/voice/tts streams audio back immediately (the
      // gateway's /text-to-speech is an async queued job with no instant URL).
      const blobUrl = await voiceTTS(apiKey, text, lang);
      // User pressed stop (or started the other panel) while generating —
      // discard the late audio instead of playing it with the button idle.
      if (gen !== ttsGenRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      const done = () => {
        URL.revokeObjectURL(blobUrl);
        if (gen !== ttsGenRef.current) return;
        audioRef.current = null;
        setPhase('idle');
      };
      audio.onended = done;
      audio.onerror = done;
      await audio.play();
      if (gen === ttsGenRef.current) setPhase('playing');
    } catch (err) {
      if (gen !== ttsGenRef.current) return; // cancelled by the user
      showToast(err.message || 'Failed to synthesize speech.', 'error');
      setPhase('idle');
    }
  };

  const handleSpeak = () => speakText(translatedText, targetLang, setOutTts, outTts);
  const handleSpeakSource = () => speakText(
    sourceText,
    sourceLang === 'auto' ? (detectedLang || 'en') : sourceLang,
    setSrcTts,
    srcTts,
  );

  const handleKeyDown = (e) => {
    // Live Mode translates automatically — no manual submit shortcut needed.
    if (engine !== 'live' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleTranslate();
    }
  };

  const charCount = sourceText.length;
  const maxChars = 5000;

  return (
    <div className="page-container animate-fade-in translate-page">
      {/* Dropdown animation */}
      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Google-Translate-style circular icon buttons (theme colors kept) */
        .tr-circle-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .tr-circle-btn:hover {
          background: rgba(37,99,235,0.10);
          color: var(--primary);
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
        @media (max-width: 600px) {
          .translate-lang-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .translate-swap-btn {
            align-self: center !important;
            margin: 4px 0 !important;
            transform: rotate(90deg) !important;
          }
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
      <div className="page-header" style={{ ...styles.header, marginBottom: undefined }}>
        <div>
          <h1 className="page-title">Neural Translation</h1>
          <p className="page-subtitle">Powered by AI • Supports 25+ languages • Real-time translation</p>
        </div>

        
      </div>

      {/* Main Translation Card */}
      <div style={styles.card}>

        {/* Language selector bar */}
        <div style={styles.langBar} className="translate-lang-bar">
          {/* Source language */}
          <div style={styles.langSide} className="translate-lang-side translate-lang-side-left">
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
            className="translate-swap-btn"
          >
            <ArrowRightLeft size={18} color="#3b82f6" />
          </button>

          {/* Target language */}
          <div style={{ ...styles.langSide, justifyContent: 'flex-end' }} className="translate-lang-side translate-lang-side-right">
            <LangDropdown
              value={targetLang}
              onChange={setTargetLang}
              options={TARGET_LANGUAGES}
              placeholder="Target Language"
              align="right"
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), transparent)' }} />

        {/* Text areas */}
        <div className="translate-text-panels">
          {/* Source panel — Google Translate layout: text with a ✕ clear in
              the top corner, mic + speaker + copy along the bottom-left,
              char count + status on the bottom-right. */}
          <div style={styles.panel}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <textarea
                className="translate-textarea"
                style={{ ...styles.textarea, paddingRight: '52px' }}
                placeholder="Type or tap the mic to speak — translation appears instantly..."
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={maxChars}
                rows={8}
                dir="auto"
              />
              {sourceText && (
                <button
                  onClick={handleClear}
                  className="tr-circle-btn"
                  title="Clear text"
                  style={{ position: 'absolute', top: '14px', right: '12px' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <div style={styles.panelFooter}>
              {/* Bottom-left: mic, listen, copy — like Google Translate */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={voiceActive ? stopVoiceRecording : startVoiceRecording}
                  title={voiceActive ? 'Stop recording' : 'Translate by voice'}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: voiceActive
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: voiceActive
                      ? '0 0 0 5px rgba(239,68,68,0.2), 0 4px 12px rgba(239,68,68,0.4)'
                      : '0 4px 12px rgba(37,99,235,0.35)',
                    animation: voiceActive ? 'voicePulse 1.4s ease-in-out infinite' : 'none',
                  }}
                >
                  {voiceActive ? <MicOff size={18} color="#fff" /> : <Mic size={18} color="#fff" />}
                </button>
                {sourceText && (
                  <>
                    <button
                      onClick={handleSpeakSource}
                      className="tr-circle-btn"
                      title={srcTts === 'idle' ? 'Listen' : srcTts === 'loading' ? 'Cancel' : 'Stop'}
                    >
                      {srcTts === 'loading'
                        ? <Loader2 size={17} color="#2563eb" style={{ animation: 'spin 0.8s linear infinite' }} />
                        : srcTts === 'playing'
                        ? <StopCircle size={17} color="#2563eb" />
                        : <Volume2 size={17} />}
                    </button>
                    <button onClick={handleCopySource} className="tr-circle-btn" title="Copy text">
                      {copiedSource ? <CheckCircle2 size={17} color="#16a34a" /> : <Copy size={17} />}
                    </button>
                  </>
                )}
              </div>
              {/* Bottom-right: char count + live status / translate button */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto' }}>
                {engine !== 'voice' && (
                  <span style={{
                    fontSize: '0.8rem',
                    color: charCount > maxChars * 0.9 ? '#f59e0b' : '#64748b',
                  }}>
                    {charCount.toLocaleString()} / {maxChars.toLocaleString()}
                  </span>
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
            <div style={styles.panelFooter}>
              {/* Bottom-left: listen — mirrors Google Translate's output panel */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minHeight: '40px' }}>
                {translatedText && (
                  <button
                    onClick={handleSpeak}
                    className="tr-circle-btn"
                    title={outTts === 'idle' ? 'Listen' : outTts === 'loading' ? 'Cancel' : 'Stop'}
                  >
                    {outTts === 'loading'
                      ? <Loader2 size={17} color="#2563eb" style={{ animation: 'spin 0.8s linear infinite' }} />
                      : outTts === 'playing'
                      ? <StopCircle size={17} color="#2563eb" />
                      : <Volume2 size={17} />}
                  </button>
                )}
              </div>
              {/* Bottom-right: copy */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginLeft: 'auto' }}>
                {translatedText && (
                  <button onClick={handleCopy} className="tr-circle-btn" title="Copy translation">
                    {copied ? <CheckCircle2 size={17} color="#16a34a" /> : <Copy size={17} />}
                  </button>
                )}
              </div>
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
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {engine === 'live'
            ? '💡 Translates instantly while you type — AI refines it when you pause'
            : engine === 'voice'
            ? '💡 Speak naturally — each ~2 s of audio is transcribed and translated live'
            : '💡 Press Ctrl+Enter or click Translate to submit text'}
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {engine === 'live' && (
            <span title={wsConnected ? 'Streaming connected' : 'Stream offline — using standard translation'} style={{
              width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
              background: wsConnected ? '#16a34a' : '#d97706',
              boxShadow: wsConnected ? '0 0 6px rgba(22,163,74,0.6)' : 'none',
            }} />
          )}
          {engine === 'voice' && (
            <span title={wsConnected ? 'Voice stream connected' : 'Voice stream offline'} style={{
              width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
              background: wsConnected ? '#16a34a' : '#d97706',
              boxShadow: wsConnected ? '0 0 6px rgba(22,163,74,0.6)' : 'none',
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
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
              Recent Translations ({history.length})
            </h3>
          </div>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} className="glass-card" style={styles.historyItem}>
                <div style={styles.historyLangRow}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '1.1rem' }}>
                    {item.sFlag === '🔍' ? <Search size={14} color="var(--primary)" /> : item.sFlag}
                  </span>
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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
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
    color: 'var(--text-muted)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    gap: '4px',
  },
  engineBtnActive: {
    background: 'rgba(37,99,235,0.15)',
    color: 'var(--primary-light)',
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
    color: 'var(--success)',
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
    color: 'var(--text-primary)',
    // Larger reading size, like Google Translate's input/output panels
    fontSize: '1.2rem',
    lineHeight: '1.65',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    minHeight: '220px',
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
    color: 'var(--text-secondary)',
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
    color: 'var(--text-secondary)',
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
    color: 'var(--text-secondary)',
    fontWeight: '600',
  },
  historyTexts: {},
  historySource: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
    fontStyle: 'italic',
  },
  historyResult: {
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    margin: 0,
    lineHeight: 1.5,
    fontWeight: '500',
  },
};
