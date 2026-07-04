import React, { useState, useRef, useEffect } from 'react';
import { ArrowRightLeft, Volume2, Copy, Sparkles, CheckCircle2, Globe, ChevronDown, Zap, RotateCcw, Search, Bot } from 'lucide-react';
import { translateText, voiceTTS, getWsBaseUrl } from '../services/api';

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

  const wsRef = useRef(null);
  const seqRef = useRef(0);
  const debounceTimerRef = useRef(null);
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
          if (msg.id !== seqRef.current) return;

          if (msg.type === 'delta') {
            setIsTranslating(true);
            setTranslatedText(prev => prev + msg.content);
          } else if (msg.type === 'done') {
            const cur = latestRef.current;
            setTranslatedText(msg.translation);
            setIsTranslating(false);
            if (msg.source_lang && cur.sourceLang === 'auto') {
              setDetectedLang(msg.source_lang);
            }

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
        clearInterval(pingTimerRef.current);
        wsRef.current = null;
        if (!shouldReconnectRef.current) return; // component unmounted / key changed
        if (ev.code === 4401) {
          showToast('Live translation unauthorized (bad key).', 'error');
          return;
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
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [apiKey]);

  // Live translation effect triggered on typing
  useEffect(() => {
    clearTimeout(debounceTimerRef.current);

    // ONLY auto-translate on typing if Live Mode is selected
    if (engine !== 'live') {
      return;
    }

    if (!sourceText.trim()) {
      setTranslatedText('');
      setDetectedLang(null);
      setIsTranslating(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      seqRef.current += 1;
      const currentSeq = seqRef.current;
      setDetectedLang(null);

      // Live Mode uses the streaming WebSocket with the 'llm' backend engine
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        setTranslatedText('');
        setIsTranslating(true);
        wsRef.current.send(JSON.stringify({
          type: 'translate',
          id: currentSeq,
          text: sourceText.trim(),
          target_lang: targetLang,
          engine: 'llm'
        }));
      } else {
        // Fallback to HTTP translation
        setIsTranslating(true);
        setTranslatedText('');
        try {
          const res = await translateText(apiKey, sourceText.trim(), sourceLang === 'auto' ? null : sourceLang, targetLang, 'llm');
          if (currentSeq !== seqRef.current) return;

          const result = res?.translation || res?.translated_text || res?.result || '';
          const detected = res?.source_lang || res?.detected_language || null;

          setTranslatedText(result);
          setIsTranslating(false);
          if (detected && sourceLang === 'auto') {
            setDetectedLang(detected);
          }

          const sLangName = sourceLang === 'auto'
            ? (detected ? (LANGUAGES.find(l => l.code === detected)?.name || detected) : 'Auto')
            : LANGUAGES.find(l => l.code === sourceLang)?.name;

          setHistory(prev => {
            if (prev.length > 0 && prev[0].source === sourceText && prev[0].result === result) {
              return prev;
            }
            return [{
              id: Date.now(),
              source: sourceText,
              result,
              sLang: sLangName,
              tLang: LANGUAGES.find(l => l.code === targetLang)?.name,
              sFlag: sourceLang === 'auto' ? '🔍' : LANGUAGES.find(l => l.code === sourceLang)?.flag,
              tFlag: LANGUAGES.find(l => l.code === targetLang)?.flag,
              engine: 'live',
            }, ...prev].slice(0, 10);
          });
        } catch (err) {
          if (currentSeq === seqRef.current) {
            setIsTranslating(false);
            showToast(err.message || 'Translation failed.', 'error');
          }
        }
      }
    }, 350); // 350ms debounce as per live translation guide

    return () => clearTimeout(debounceTimerRef.current);
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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
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
        .stream-cursor {
          display: inline-block;
          width: 2px;
          height: 1.1em;
          background: var(--primary);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: streamBlink 0.8s steps(2) infinite;
        }
        @keyframes streamBlink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        @media (max-width: 768px) {
          .translate-page { padding: 20px 14px 40px !important; }
          .translate-panels { flex-direction: column !important; }
          .translate-panel-divider { width: 100% !important; height: 1px !important; }
          .translate-history-texts { grid-template-columns: 1fr !important; }
          .lang-dropdown-btn { min-width: 150px !important; }
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
        <div style={styles.engineToggle}>
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
        </div>
      </div>

      {/* Main Translation Card */}
      <div style={styles.card}>

        {/* Language selector bar */}
        <div style={styles.langBar}>
          {/* Source language */}
          <div style={styles.langSide}>
            <LangDropdown
              value={sourceLang}
              onChange={setSourceLang}
              options={LANGUAGES}
              placeholder="Detect Language"
            />
            {detectedLang && sourceLang === 'auto' && (
              <div style={styles.detectedBadge}>
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
        <div style={styles.textPanels} className="translate-panels">
          {/* Source panel */}
          <div style={styles.panel}>
            <textarea
              className="translate-textarea"
              style={styles.textarea}
              placeholder="Enter text to translate... (Ctrl+Enter to translate)"
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxChars}
              rows={8}
              dir="auto"
            />
            <div style={styles.panelFooter}>
              <span style={{
                fontSize: '0.8rem',
                color: charCount > maxChars * 0.9 ? '#f59e0b' : '#64748b',
              }}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {sourceText && (
                  <button onClick={handleClear} style={styles.iconActionBtn} title="Clear">
                    <RotateCcw size={14} />
                  </button>
                )}
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
              </div>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={styles.panelDivider} className="translate-panel-divider" />

          {/* Target panel */}
          <div style={{ ...styles.panel, background: 'rgba(37,99,235,0.03)' }}>
            <div className="translate-textarea" style={{ ...styles.textarea, overflowY: 'auto', cursor: 'default' }}>
              {translatedText ? (
                // Show streamed tokens AS they arrive — never hide them behind a
                // loading state. A blinking cursor marks an in-flight stream.
                <span dir="auto" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                  {translatedText}
                  {isTranslating && <span className="stream-cursor" />}
                </span>
              ) : isTranslating ? (
                <div style={styles.loadingState}>
                  <div style={styles.loadingDots}>
                    <span /><span /><span />
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

        {/* Loading bars animation */}
        <style>{`
          @keyframes translateLoading {
            0% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0.3; transform: scale(0.8); }
          }
          .translate-loading-dot:nth-child(1) { animation: translateLoading 1.2s ease-in-out infinite; }
          .translate-loading-dot:nth-child(2) { animation: translateLoading 1.2s ease-in-out 0.2s infinite; }
          .translate-loading-dot:nth-child(3) { animation: translateLoading 1.2s ease-in-out 0.4s infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>

      {/* Tips bar */}
      <div style={styles.tipsBar}>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {engine === 'live' 
            ? '💡 Typing automatically translates using live WebSockets stream' 
            : '💡 Press Ctrl+Enter or click Translate to submit text'}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          Engine: <span style={{ 
            color: engine === 'live' ? '#0ea5e9' : engine === 'api' ? '#16a34a' : '#3b82f6', 
            fontWeight: '600' 
          }}>
            {engine === 'live' ? 'Live Mode (Stream)' : engine === 'api' ? 'Google API (Fast)' : 'AI Model (Nuanced)'}
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
                <div style={styles.historyTexts} className="translate-history-texts">
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
  textPanels: {
    display: 'flex',
    minHeight: '280px',
  },
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  panelDivider: {
    width: '1px',
    background: 'linear-gradient(180deg, transparent, rgba(37,99,235,0.3), transparent)',
    flexShrink: 0,
  },
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
  loadingDots: {
    display: 'flex',
    gap: '8px',
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
  historyTexts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
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
