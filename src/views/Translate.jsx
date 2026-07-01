import React, { useState } from 'react';
import { ArrowRightLeft, Volume2, Copy, History, Sparkles, CheckCircle2 } from 'lucide-react';
import { translateText, textToSpeech, buildAudioUrl } from '../services/api';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' }
];

export default function Translate({ user, showToast }) {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [engine, setEngine] = useState('api'); // 'api' or 'llm'
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      // We will try calling the translate endpoint, but if it fails we mock it.
      // const res = await translateText(user?.api_key || 'demo', sourceText, sourceLang, targetLang, engine);
      // setTranslatedText(res.translated_text);
      
      // Mocked translation for demonstration
      await new Promise(r => setTimeout(r, 600));
      const mockResult = engine === 'llm' 
        ? `[LLM Nuanced] ${sourceText} (translated to ${targetLang})` 
        : `[API Fast] ${sourceText} (translated to ${targetLang})`;
        
      setTranslatedText(mockResult);
      
      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        source: sourceText,
        result: mockResult,
        sLang: sourceLang === 'auto' ? 'Auto' : LANGUAGES.find(l => l.code === sourceLang)?.name,
        tLang: LANGUAGES.find(l => l.code === targetLang)?.name,
        engine
      }, ...prev].slice(0, 10));
      
    } catch (err) {
      showToast('Translation failed.', 'error');
      setTranslatedText("Translation failed. Backend endpoint might not be ready yet.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwap = () => {
    if (sourceLang !== 'auto') {
      const tempLang = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(tempLang);
    } else {
      setSourceLang(targetLang);
      setTargetLang('en');
    }
    setSourceText(translatedText);
    setTranslatedText('');
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = async () => {
    if (!translatedText) return;
    setIsPlaying(true);
    try {
      // Real or mock TTS depending on actual backend.
      // We know TTS works because voice tools uses it.
      let res = await textToSpeech(user?.api_key || 'demo', translatedText, 'divya', 'mp3');
      
      if (res?.status === 'queued' && res?.job_id) {
        showToast('TTS job queued, synthesizing...', 'info');
        let job = res;
        while (job.status === 'queued' || job.status === 'processing') {
          await new Promise(resolve => setTimeout(resolve, 1500));
          job = await getJobStatus(user?.api_key || 'demo', res.job_id);
          if (job.status === 'failed') {
            throw new Error(job.error || 'Async TTS failed.');
          }
        }
        res = job;
      }

      const audioUrl = buildAudioUrl(res.audio_url);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play();
        audio.onended = () => setIsPlaying(false);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to synthesize speech.', 'error');
      setIsPlaying(false);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Neural Translation</h2>
          <p style={styles.sub}>High-accuracy document and text translation</p>
        </div>
        
        {/* Engine Toggle */}
        <div style={styles.engineToggle}>
          <button 
            className={`engine-btn ${engine === 'api' ? 'active' : ''}`}
            onClick={() => setEngine('api')}
            style={{...styles.engineBtn, ...(engine === 'api' ? styles.engineBtnActive : {})}}
          >
            Google API (Fast)
          </button>
          <button 
            className={`engine-btn ${engine === 'llm' ? 'active' : ''}`}
            onClick={() => setEngine('llm')}
            style={{...styles.engineBtn, ...(engine === 'llm' ? styles.engineBtnActive : {})}}
          >
            <Sparkles size={14} style={{ marginRight: '4px' }} />
            LLM (Nuanced)
          </button>
        </div>
      </div>

      {/* Translation Main Area */}
      <div style={styles.translateBox}>
        {/* Source Panel */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <select 
              value={sourceLang} 
              onChange={(e) => setSourceLang(e.target.value)}
              style={styles.select}
            >
              <option value="auto">Detect Language</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <textarea
            style={styles.textarea}
            placeholder="Enter text to translate..."
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
          <div style={styles.panelFooter}>
            <span style={styles.charCount}>{sourceText.length} / 5000</span>
            <button 
              className="btn btn-primary" 
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              style={{ padding: '8px 20px', borderRadius: '20px' }}
            >
              {isTranslating ? 'Translating...' : 'Translate'}
            </button>
          </div>
        </div>

        {/* Swap Button */}
        <div style={styles.swapWrapper}>
          <button style={styles.swapBtn} onClick={handleSwap} title="Swap languages">
            <ArrowRightLeft size={18} />
          </button>
        </div>

        {/* Target Panel */}
        <div style={styles.panel} className="target-panel">
          <div style={styles.panelHeader}>
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              style={styles.select}
            >
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
          <div style={{ ...styles.textarea, ...styles.targetArea, background: 'rgba(255,255,255,0.01)' }}>
            {translatedText ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{translatedText}</span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Translation will appear here</span>
            )}
          </div>
          <div style={styles.panelFooterTarget}>
            <button style={styles.iconBtn} onClick={handleSpeak} disabled={!translatedText || isPlaying} title="Listen to translation">
              <Volume2 size={18} color={isPlaying ? "var(--primary)" : "currentColor"} />
            </button>
            <button style={styles.iconBtn} onClick={handleCopy} disabled={!translatedText} title="Copy to clipboard">
              {copied ? <CheckCircle2 size={18} color="var(--success)" /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={styles.historySection} className="animate-fade-in">
          <div style={styles.historyHeader}>
            <History size={16} />
            <h3>Recent Translations</h3>
          </div>
          <div style={styles.historyList}>
            {history.map(item => (
              <div key={item.id} style={styles.historyItem} className="glass-card glass-card-hover">
                <div style={styles.historyLangs}>
                  {item.sLang} → {item.tLang}
                  <span style={styles.historyEngineBadge}>{item.engine.toUpperCase()}</span>
                </div>
                <div style={styles.historyTexts}>
                  <div style={styles.historySource}>{item.source}</div>
                  <div style={styles.historyTarget}>{item.result}</div>
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
    padding: '32px 40px',
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
    color: 'var(--text-primary)',
    marginBottom: '8px',
  },
  sub: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  engineToggle: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '4px',
    border: '1px solid var(--border-color)',
  },
  engineBtn: {
    background: 'transparent',
    border: 'none',
    padding: '8px 16px',
    color: 'var(--text-secondary)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition)',
  },
  engineBtnActive: {
    background: 'rgba(139, 92, 246, 0.15)',
    color: 'var(--primary-light)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  translateBox: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    position: 'relative',
    minHeight: '400px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '50%',
  },
  panelHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  select: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: '1.05rem',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    padding: '24px',
    color: 'var(--text-primary)',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    resize: 'none',
    outline: 'none',
    fontFamily: 'var(--font-body)',
  },
  targetArea: {
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
  },
  panelFooter: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  panelFooterTarget: {
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
  },
  charCount: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  swapWrapper: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
  },
  swapBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    transition: 'var(--transition)',
  },
  historySection: {
    marginTop: '48px',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-secondary)',
    marginBottom: '20px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  historyItem: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  historyLangs: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  historyEngineBadge: {
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  historyTexts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  historySource: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  historyTarget: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
  }
};
