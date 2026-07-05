import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Mic,
  Sparkles,
  Trash2,
  ArrowLeft,
  Play,
  Square,
  Upload,
  File,
  Copy,
  Loader2,
  Download,
  User,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { textToSpeech, getVoices, getDemoVoices, speechToText, demoSTT, buildAudioUrl, getJobStatus } from '../services/api';
import AudioReviewPanel from '../components/AudioReviewPanel';

// ─── Available Voices Fallback ─────────────────────────────────────────────────
const FALLBACK_VOICES = [
  { id: 'divya',        name: 'Divya',        gender: 'female', style: 'Monotone, fast',       language: 'multilingual', model: 'indic_parler' },
  { id: 'sita',         name: 'Sita',         gender: 'female', style: 'Calm, slow',            language: 'multilingual', model: 'indic_parler' },
  { id: 'meera',        name: 'Meera',        gender: 'female', style: 'Expressive, warm',      language: 'multilingual', model: 'indic_parler' },
  { id: 'priya',        name: 'Priya',        gender: 'female', style: 'Clear, professional',   language: 'multilingual', model: 'indic_parler' },
  { id: 'rohit',        name: 'Rohit',        gender: 'male',   style: 'Calm, neutral',         language: 'multilingual', model: 'indic_parler' },
  { id: 'arjun',        name: 'Arjun',        gender: 'male',   style: 'Deep, slow',            language: 'multilingual', model: 'indic_parler' },
  { id: 'vikram',       name: 'Vikram',       gender: 'male',   style: 'Confident, expressive', language: 'multilingual', model: 'indic_parler' },
  { id: 'amir',         name: 'Amir',         gender: 'male',   style: 'Clear, slightly fast',  language: 'multilingual', model: 'indic_parler' },
  { id: 'en_speaker_6', name: 'Bark Female 1', gender: 'female', style: 'Clear, neutral',         language: 'english',      model: 'bark' },
  { id: 'en_speaker_9', name: 'Bark Female 2', gender: 'female', style: 'Clear, expressive',      language: 'english',      model: 'bark' },
  { id: 'en_speaker_3', name: 'Bark Female 3', gender: 'female', style: 'Soft, warm',             language: 'english',      model: 'bark' },
  { id: 'en_speaker_1', name: 'Bark Male 1',   gender: 'male',   style: 'Clear, slow',            language: 'english',      model: 'bark' },
];

const STT_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
];

const TTS_LANGUAGES = [
  {
    category: 'Indic Languages',
    langs: [
      { code: 'hi', name: 'Hindi (हिंदी)' },
      { code: 'ta', name: 'Tamil (தமிழ்)' },
      { code: 'te', name: 'Telugu (తెలుగు)' },
      { code: 'bn', name: 'Bengali (বাংলা)' },
      { code: 'mr', name: 'Marathi (मराठी)' },
      { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
      { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
      { code: 'ml', name: 'Malayalam (മലയാളം)' },
      { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
      { code: 'ur', name: 'Urdu (اردو)' },
      { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
      { code: 'as', name: 'Assamese (অসমীয়া)' },
      { code: 'sa', name: 'Sanskrit (संस्कृतम्)' },
    ]
  },
  {
    category: 'Global / Non-Indic Languages',
    langs: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish (Español)' },
      { code: 'fr', name: 'French (Français)' },
      { code: 'de', name: 'German (Deutsch)' },
      { code: 'it', name: 'Italian (Italiano)' },
      { code: 'ja', name: 'Japanese (日本語)' },
      { code: 'ko', name: 'Korean (한국어)' },
      { code: 'pt', name: 'Portuguese (Português)' },
      { code: 'ru', name: 'Russian (Русский)' },
      { code: 'zh', name: 'Chinese (中文)' },
      { code: 'ar', name: 'Arabic (العربية)' },
      { code: 'tr', name: 'Turkish (Türkçe)' },
    ]
  }
];

const CHAR_LIMIT = 500;

export default function VoiceTools({ showToast, defaultSubView = 'hub', user, setHistoryData }) {
  const [subView, setSubView] = useState(defaultSubView);

  // ── TTS State ──────────────────────────────────────────────────────────────
  const [text, setText] = useState('');
  const [ttsLanguage, setTtsLanguage] = useState('hi');
  const [selectedVoice, setSelectedVoice] = useState('divya');
  const [audioFormat, setAudioFormat] = useState('wav');
  const [voices, setVoices] = useState(FALLBACK_VOICES);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // ── STT State ──────────────────────────────────────────────────────────────
  const [sttMode, setSttMode] = useState('record'); // 'record' | 'upload'
  const [sttState, setSttState] = useState('idle');  // 'idle' | 'recording' | 'reviewing' | 'transcribing' | 'completed'
  const [recordingTime, setRecordingTime] = useState(0);
  const [reviewBlob, setReviewBlob] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState(null);
  const [resultTab, setResultTab] = useState('text'); // 'text' | 'timeline'
  const [sttLanguage, setSttLanguage] = useState('en');
  const [sttError, setSttError] = useState('');
  const [ttsError, setTtsError] = useState('');
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ── Deep-link sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    setSubView(defaultSubView);
    setSttState('idle');
    setReviewBlob(null);
    setTranscriptResult(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setSttError('');
    setTtsError('');
  }, [defaultSubView]);

  // ── Dynamic Voice Fetching ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        let data;
        if (user?.api_key) {
          data = await getVoices(user.api_key);
        } else {
          data = await getDemoVoices();
        }
        if (data?.voices && data.voices.length > 0) {
          setVoices(data.voices);
          // Set to first voice if selected voice is not in the list
          const exists = data.voices.some(v => v.id === selectedVoice);
          if (!exists) {
            setSelectedVoice(data.voices[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load dynamic voices, using fallbacks.', err);
      }
    };
    fetchVoices();
  }, [user]);

  // ── Sync Selected Voice with Language Category ──────────────────────────────
  useEffect(() => {
    const isIndicLanguage = (langCode) => {
      const indicGroup = TTS_LANGUAGES.find(g => g.category === 'Indic Languages');
      return indicGroup?.langs.some(l => l.code === langCode) || false;
    };
    const isIndic = isIndicLanguage(ttsLanguage);
    const validVoices = voices.filter(v => {
      const isBarkVoice = v.model === 'bark' || v.id.startsWith('en_speaker');
      return isIndic ? !isBarkVoice : isBarkVoice;
    });

    if (validVoices.length > 0) {
      const isSelectedValid = validVoices.some(v => v.id === selectedVoice);
      if (!isSelectedValid) {
        setSelectedVoice(validVoices[0].id);
      }
    }
  }, [ttsLanguage, voices, selectedVoice]);

  // ── Recording timer ──────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (sttState === 'recording') {
      timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [sttState]);

  // ── TTS: Convert to Speech ─────────────────────────────────────────────────
  const handleConvertToSpeech = async () => {
    if (!text.trim()) {
      showToast('Please enter some text to synthesize.', 'error');
      return;
    }
    if (text.length > CHAR_LIMIT) {
      showToast(`Character limit of ${CHAR_LIMIT} exceeded.`, 'error');
      return;
    }
    if (!user?.api_key) {
      showToast('No API key found. Please log in again.', 'error');
      return;
    }

    setIsSynthesizing(true);
    setTtsError('');
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);

    try {
      // Prepend language prefix to selected speaker voice as gateway routes
      const voiceParam = `${ttsLanguage}-${selectedVoice}`;
      let data = await textToSpeech(user.api_key, text.trim(), voiceParam, audioFormat);

      if (data?.status === 'queued' && data?.job_id) {
        showToast('TTS job queued, synthesizing...', 'info');
        let job = data;
        // Cap polling so a stuck job can't spin this UI forever.
        const deadline = Date.now() + 180000;
        while (job.status === 'queued' || job.status === 'processing') {
          if (Date.now() > deadline) {
            throw new Error('TTS job timed out after 3 minutes. Please try again.');
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          job = await getJobStatus(user.api_key, data.job_id);
          if (job.status === 'failed') {
            throw new Error(job.error || 'Async TTS synthesis failed on worker.');
          }
          if (job.queue_position) {
            setTtsError(''); // clear any stale error while waiting in queue
          }
        }
        data = job;
      }

      if (!data?.audio_url) {
        throw new Error('No audio URL returned by server.');
      }

      // Build absolute URL from server base
      const fullAudioUrl = buildAudioUrl(data.audio_url);
      setAudioUrl(fullAudioUrl);
      setAudioBlob(data);
      showToast('✅ Audio synthesized successfully!', 'success');

      // Auto-play audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 200);

      // Log to history log
      if (setHistoryData) {
        const entry = {
          id: Date.now(),
          name: data.audio_url.split('/').pop() || `tts.${audioFormat}`,
          type: 'Text to Speech',
          submitted: new Date().toLocaleString(),
          time: data.processing_time ? `${data.processing_time.toFixed(2)}s` : '-',
          status: 'Completed',
        };
        setHistoryData(prev => [entry, ...prev]);
      }
    } catch (err) {
      const msg = err.message || 'TTS synthesis failed.';
      setTtsError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = audioUrl.split('/').pop() || `conversa_tts.${audioFormat}`;
    a.target = '_blank';
    a.click();
    showToast('Audio download started!', 'success');
  };

  const handleClearTTS = () => {
    setText('');
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setTtsError('');
    if (audioRef.current) audioRef.current.pause();
  };

  // ── STT: Microphone Recording ────────────────────────────────────────────
  const startRecording = async () => {
    setSttError('');
    setTranscriptResult(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Microphone recording is not supported in this browser. A secure HTTPS connection is required in production.';
      setSttError(msg);
      showToast(msg, 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        {
          audio: {
            autoGainControl: false,  // Prevents amplifying silence into loud static
            noiseSuppression: true,  // Actively filters out background noise/hums
            echoCancellation: true
        }
      });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        blob.name = `recording_${Date.now()}.webm`;
        setReviewBlob(blob);
        setSttState('reviewing');
      };

      mr.start();
      setSttState('recording');
      showToast('🎙️ Live recording active...', 'info');
    } catch (err) {
      console.error('Microphone error:', err);
      let msg = 'Microphone access denied or unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone access was blocked. Please allow microphone permissions in your browser/site settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'Microphone is busy. Close other apps/tabs using the mic and try again.';
      }
      setSttError(msg);
      showToast(msg, 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && sttState === 'recording') {
      mediaRecorderRef.current.stop();
      showToast('Recording stopped.', 'success');
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    setSttState('idle');
    showToast('Recording cancelled.', 'info');
  };

  // ── STT: Review panel actions (shared by record + upload) ──────────────────
  const closeReviewPanel = () => {
    setReviewBlob(null);
    setTranscriptResult(null);
    setSttError('');
    setSttState('idle');
  };

  const reviewPanelReRecord = () => {
    setReviewBlob(null);
    setTranscriptResult(null);
    setSttError('');
    setSttMode('record');
    startRecording();
  };

  const reviewPanelReUpload = () => {
    setReviewBlob(null);
    setTranscriptResult(null);
    setSttError('');
    setSttMode('upload');
    fileInputRef.current?.click();
  };

  const submitReviewedAudio = async () => {
    if (!reviewBlob) return;
    await transcribeFile(reviewBlob, sttMode === 'record');
  };

  // ── STT: Drag & Drop Upload ────────────────────────────────────────────────
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    const validExts = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm'];
    const isValid = file.type.startsWith('audio/') || validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValid) {
      showToast('Unsupported format. Please select an audio file (e.g. .mp3, .wav, .m4a, .ogg).', 'error');
      return;
    }
    setReviewBlob(file);
    setTranscriptResult(null);
    setSttError('');
    setSttState('reviewing');
    showToast(`Loaded: ${file.name}`, 'info');
  };

  // ── STT: Core API Transcription Call ──────────────────────────────────────
  const transcribeFile = async (file, fromMic = false) => {
    setSttState('transcribing');
    setSttError('');

    try {
      let result;
      if (user?.api_key) {
        result = await speechToText(user.api_key, file, sttLanguage || null);
      } else {
        result = await demoSTT(file, sttLanguage || null);
      }

      if (result?.status === 'queued' && result?.job_id) {
        showToast('STT job queued, transcribing...', 'info');
        let job = result;
        // Cap polling so a stuck job can't spin this UI forever.
        const deadline = Date.now() + 180000;
        while (job.status === 'queued' || job.status === 'processing') {
          if (Date.now() > deadline) {
            throw new Error('STT job timed out after 3 minutes. Please try again.');
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          job = await getJobStatus(user.api_key, result.job_id);
          if (job.status === 'failed') {
            throw new Error(job.error || 'Async STT transcription failed on worker.');
          }
        }
        result = job;
      }

      const transcript = result?.detail ?? result?.transcript ?? result?.text ?? JSON.stringify(result);
      const processingTime = result?.processing_time ? `${result.processing_time.toFixed(2)}s` : '-';
      const filename = file.name || `recording.wav`;

      setTranscriptResult({
        filename,
        duration: processingTime,
        language: result?.language || sttLanguage || 'en',
        confidence: null,
        text: transcript,
        segments: result?.segments || null,
        request_id: result?.request_id,
        raw: result,
      });

      // Default back to text tab on new transcription
      setResultTab('text');
      setSttState('completed');
      showToast('✅ Transcription completed!', 'success');

      if (setHistoryData) {
        const entry = {
          id: Date.now(),
          name: filename,
          type: 'Speech to Text',
          submitted: new Date().toLocaleString(),
          time: processingTime,
          status: 'Completed',
        };
        setHistoryData(prev => [entry, ...prev]);
      }
    } catch (err) {
      const msg = err.message || 'Transcription failed.';
      setSttError(msg);
      setSttState(reviewBlob ? 'reviewing' : 'idle');
      showToast(msg, 'error');
    }
  };

  const copyTranscriptToClipboard = () => {
    if (!transcriptResult) return;
    navigator.clipboard.writeText(transcriptResult.text);
    showToast('Transcript copied to clipboard!', 'success');
  };

  const handleDownloadTranscriptJSON = () => {
    if (!transcriptResult) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transcriptResult, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `${transcriptResult.filename.split('.')[0]}_transcript.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Transcript downloaded as JSON.', 'success');
  };

  const formatSegmentTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${ms}`;
  };

  // Group voices by gender, dynamically filtered by language category
  const isIndicLanguage = (langCode) => {
    const indicGroup = TTS_LANGUAGES.find(g => g.category === 'Indic Languages');
    return indicGroup?.langs.some(l => l.code === langCode) || false;
  };

  const isIndic = isIndicLanguage(ttsLanguage);
  const filteredVoices = voices.filter(v => {
    const isBarkVoice = v.model === 'bark' || v.id.startsWith('en_speaker');
    return isIndic ? !isBarkVoice : isBarkVoice;
  });

  const femaleVoices = filteredVoices.filter(v => v.gender?.toLowerCase() === 'female');
  const maleVoices = filteredVoices.filter(v => v.gender?.toLowerCase() === 'male');

  // Character Limit Calculations
  const charPercentage = Math.min((text.length / CHAR_LIMIT) * 100, 100);
  let progressBarColor = 'var(--success)';
  if (text.length > 850) {
    progressBarColor = 'var(--error)';
  } else if (text.length > 600) {
    progressBarColor = 'var(--warning)';
  }

  // Voice card renderer
  const renderVoiceCard = (v) => {
    const isActive = selectedVoice === v.id;
    return (
      <button
        key={v.id}
        onClick={() => setSelectedVoice(v.id)}
        className={`conversa-voice-card ${isActive ? 'active' : ''}`}
        type="button"
      >
        <div className="conversa-voice-card-header">
          <span className="conversa-voice-name">{v.name}</span>
          <span className="badge" style={{
            background: v.gender === 'female' ? 'rgba(14,165,233, 0.1)' : 'rgba(37,99,235, 0.1)',
            color: v.gender === 'female' ? 'var(--secondary)' : 'var(--primary-light)',
            border: v.gender === 'female' ? '1px solid rgba(14,165,233, 0.2)' : '1px solid rgba(37,99,235, 0.2)'
          }}>
            {v.gender?.toUpperCase()}
          </span>
        </div>
        <span className="conversa-voice-style">{v.style || 'Standard Neural Voice'}</span>
      </button>
    );
  };

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', paddingBottom: '80px' }} className="animate-fade-in">

      {/* ═══════════════════ HUB VIEW ═══════════════════ */}
      {subView === 'hub' ? (
        <div style={styles.container}>
          <div style={styles.hubHeader}>
            <span className="badge badge-purple">AI Voice Suite</span>
            <h1 style={styles.hubTitle}>Conversa Voice Tools</h1>
            <p style={styles.hubSub}>High-fidelity neural Speech-to-Text and Text-to-Speech models integrated dynamically.</p>
          </div>

          <div className="voice-hub-grid">
            {/* STT Card */}
            <div onClick={() => setSubView('stt')} className="glass-card glass-card-hover" style={styles.hubCard}>
              <div style={styles.iconBoxPurple}><Mic size={24} color="var(--primary)" /></div>
              <h3 style={styles.cardTitle}>Speech to Text</h3>
              <p style={styles.cardDesc}>
                Upload pre-recorded audio files or stream live microphone recordings to get precision timestamps and transcripts.
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'auto', alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.85rem' }}>
                Launch STT
              </button>
            </div>

            {/* TTS Card */}
            <div onClick={() => setSubView('tts')} className="glass-card glass-card-hover" style={styles.hubCard}>
              <div style={styles.iconBoxPink}><Volume2 size={24} color="var(--secondary)" /></div>
              <h3 style={styles.cardTitle}>Text to Speech</h3>
              <p style={styles.cardDesc}>
                Synthesize plain text inputs into natural-sounding multi-accented speech using our leading multilingual neural voices.
              </p>
              <button className="btn btn-outline" style={{ marginTop: 'auto', alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.85rem' }}>
                Launch TTS
              </button>
            </div>
          </div>

          {/* Active API Details */}
          <div style={styles.apiKeyBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Conversa Gateway Endpoint Active:&nbsp;
                <code style={{ color: 'var(--primary-light)', fontSize: '0.82rem' }}>
                  {user?.api_key ? `${user.api_key.slice(0, 12)}...` : 'Demo Gateway'}
                </code>
              </span>
            </div>
          </div>

          {/* Core Feature Showcases */}
          <div style={styles.whySection}>
            <h3 style={styles.secTitle}>Key Operational Strengths</h3>
            <div style={styles.whyGrid}>
              <div>
                <h4 style={styles.whyItemTitle}>Neural Clarity</h4>
                <p style={styles.whyItemText}>Engineered using custom speaker embeddings to maintain expressive pacing and consistent tone.</p>
              </div>
              <div>
                <h4 style={styles.whyItemTitle}>Dynamic Multilingual Support</h4>
                <p style={styles.whyItemText}>Handles both Indian regional dialects (Parler pipeline) and global languages (Bark pipeline).</p>
              </div>
              <div>
                <h4 style={styles.whyItemTitle}>Automatic Segment Parsing</h4>
                <p style={styles.whyItemText}>Extracts and displays timestamps down to milliseconds, perfect for captioning and audio timelines.</p>
              </div>
            </div>
          </div>
        </div>

      /* ═══════════════════ TTS VIEW ═══════════════════ */
      ) : subView === 'tts' ? (
        <div style={styles.container}>
          <div style={styles.subHeader}>
            <button onClick={() => setSubView('hub')} style={styles.backBtn} className="voice-back-btn">
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <h1 style={{ ...styles.hubTitle, marginTop: '20px' }}>Text to Speech</h1>
            <p style={styles.hubSub}>Synthesize premium neural audio files from plain text.</p>
          </div>

          <div className="glass-card" style={styles.ttsCard}>
            {/* Target Language dropdown */}
            <div className="form-group">
              <label className="form-label">Target Synthesis Language</label>
              <select
                value={ttsLanguage}
                onChange={(e) => setTtsLanguage(e.target.value)}
                className="form-input"
                style={{ cursor: 'pointer' }}
              >
                {TTS_LANGUAGES.map((group) => (
                  <optgroup key={group.category} label={group.category} style={{ background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                    {group.langs.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Premium Voice Selector */}
            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Available Speaker Voices</label>
              
              {femaleVoices.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Female Voices</h5>
                  <div className="conversa-voice-grid">
                    {femaleVoices.map((v) => renderVoiceCard(v))}
                  </div>
                </div>
              )}

              {maleVoices.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h5 style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Male Voices</h5>
                  <div className="conversa-voice-grid">
                    {maleVoices.map((v) => renderVoiceCard(v))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Format */}
            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Output Audio Format</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['wav', 'mp3'].map((format) => (
                  <button
                    key={format}
                    onClick={() => setAudioFormat(format)}
                    className="btn"
                    style={{
                      flex: 1,
                      border: audioFormat === format ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: audioFormat === format ? 'rgba(37,99,235, 0.08)' : 'transparent',
                      color: audioFormat === format ? 'var(--text-primary)' : 'var(--text-secondary)',
                      padding: '10px',
                    }}
                    type="button"
                  >
                    {format.toUpperCase()} Audio
                  </button>
                ))}
              </div>
            </div>

            {/* Synthesis Text Input */}
            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Plain Text Input</label>
              <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste the sentences you want to convert to high-fidelity speech..."
                className="form-input"
                style={{ resize: 'vertical', background: 'var(--bg-main)' }}
              />
              
              {/* Character Limit Indicator */}
              <div className="char-limit-container">
                <div className="char-limit-bar-bg">
                  <div 
                    className="char-limit-bar-fill" 
                    style={{ 
                      width: `${charPercentage}%`, 
                      backgroundColor: progressBarColor 
                    }} 
                  />
                </div>
                <div className="char-limit-info">
                  <span>{text.length} / {CHAR_LIMIT} characters</span>
                  {text.length > CHAR_LIMIT && (
                    <span style={{ color: 'var(--error)', fontWeight: '600' }}>Exceeds maximum character limit!</span>
                  )}
                </div>
              </div>

              <div style={styles.textareaFooter}>
                <div></div>
                <button onClick={handleClearTTS} style={styles.clearBtn} className="voice-clear-btn" type="button">
                  <Trash2 size={14} /> Reset Form
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {ttsError && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <AlertCircle size={16} color="#ef4444" />
                <span>{ttsError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actionRow}>
              <button
                onClick={handleConvertToSpeech}
                disabled={isSynthesizing || !text.trim() || text.length > CHAR_LIMIT}
                className="btn btn-primary"
                style={styles.convertBtn}
                type="button"
              >
                {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                {isSynthesizing ? 'Synthesizing...' : 'Synthesize Audio'}
              </button>

              {audioUrl && (
                <button onClick={handleDownloadAudio} className="btn btn-outline" style={{ padding: '12px 20px' }} type="button">
                  <Download size={16} /> Save Audio File
                </button>
              )}

              {/* Loader soundwave animation */}
              {isSynthesizing && (
                <div style={styles.soundwave}>
                  {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
                    <div key={i} style={{ ...styles.waveBar, animationDelay: `${delay}s` }}></div>
                  ))}
                </div>
              )}
            </div>

            {/* Premium Audio Player */}
            {audioUrl && (
              <div style={styles.audioPlayerBox} className="animate-fade-in">
                <div style={styles.audioPlayerHeader}>
                  <Volume2 size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    Synthesized: {selectedVoice.toUpperCase()} · Language: {ttsLanguage.toUpperCase()} · Format: {audioFormat.toUpperCase()}
                  </span>
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  style={{ width: '100%', marginTop: '12px', borderRadius: '8px' }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}
          </div>
        </div>

      /* ═══════════════════ STT VIEW ═══════════════════ */
      ) : (
        <div style={styles.container}>
          <div style={styles.subHeader}>
            <button onClick={() => setSubView('hub')} style={styles.backBtn} className="voice-back-btn">
              <ArrowLeft size={16} /> Back to Hub
            </button>
            <h1 style={{ ...styles.hubTitle, marginTop: '20px' }}>Speech to Text</h1>
            <p style={styles.hubSub}>Transcribe dynamic vocal streams or upload existing audio files.</p>
          </div>

          <div style={styles.sttLayout}>
            {/* Mode Tab Switcher */}
            <div style={styles.sttTabBar}>
              <button
                onClick={() => { setSttMode('record'); setSttState('idle'); setReviewBlob(null); setTranscriptResult(null); setSttError(''); }}
                style={{ ...styles.sttTab, ...(sttMode === 'record' ? styles.sttTabActive : {}) }}
                type="button"
              >
                <Mic size={15} /> Live Record
              </button>
              <button
                onClick={() => { setSttMode('upload'); setSttState('idle'); setReviewBlob(null); setTranscriptResult(null); setSttError(''); }}
                style={{ ...styles.sttTab, ...(sttMode === 'upload' ? styles.sttTabActive : {}) }}
                type="button"
              >
                <Upload size={15} /> Choose Audio File
              </button>
            </div>

            {/* Target Language Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                Acoustic Language:
              </label>
              <select
                value={sttLanguage}
                onChange={(e) => setSttLanguage(e.target.value)}
                className="form-input"
                style={{ maxWidth: '240px', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                {STT_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* STT Operational Panel */}
            <div className="glass-card" style={styles.sttCard}>

              {/* Hidden file input — always mounted so the review panel's "switch to upload" shortcut works regardless of current mode */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="audio/*"
              />

              {sttState === 'reviewing' ? (
                /* 🔎 SHARED REVIEW/TRIM PANEL (record + upload both land here) */
                <div>
                  <h3 style={{ ...styles.cardSubHeader, marginBottom: '16px' }}>Review Audio</h3>
                  <AudioReviewPanel
                    blob={reviewBlob}
                    fileName={reviewBlob?.name || 'recording.wav'}
                    onBlobChange={setReviewBlob}
                    onClose={closeReviewPanel}
                    onReRecord={reviewPanelReRecord}
                    onReUpload={reviewPanelReUpload}
                    showToast={showToast}
                  />
                  <button onClick={submitReviewedAudio} className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px' }} type="button">
                    <Sparkles size={16} /> Run Transcription Models
                  </button>
                </div>

              ) : sttState === 'transcribing' ? (
                /* ⏳ TRANSCRIBING (shared by record + upload) */
                <div style={styles.transcribingWrapper}>
                  <Loader2 size={24} className="animate-spin" color="var(--primary)" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                    {sttMode === 'record' ? 'Processing acoustic features...' : 'Uploading and parsing file chunks...'}
                  </span>
                </div>

              ) : sttMode === 'record' ? (
                /* 🎙️ LIVE RECORDING LAYOUT */
                <div className="mic-record-wrapper">
                  <h3 style={{ ...styles.cardSubHeader, marginBottom: '8px' }}>Microphone Streaming</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', textAlign: 'center' }}>
                    Speak clearly. Audio streams inside your sandbox, and resolves to text via neural Whisper.
                  </p>

                  <div className="mic-halo-container">
                    {sttState === 'recording' && <div className="mic-halo-ring active"></div>}
                    {sttState === 'recording' && <div className="mic-halo-ring active" style={{ animationDelay: '0.6s' }}></div>}
                    {sttState === 'recording' && <div className="mic-halo-ring active" style={{ animationDelay: '1.2s' }}></div>}
                    <button
                      onClick={sttState === 'recording' ? stopRecording : startRecording}
                      className={`conversa-mic-btn ${sttState === 'recording' ? 'recording' : ''}`}
                      type="button"
                      title={sttState === 'recording' ? "Stop recording" : "Start recording"}
                    >
                      {sttState === 'recording' ? <Square size={24} color="#ffffff" fill="#ffffff" /> : <Mic size={28} color="#ffffff" />}
                    </button>
                  </div>

                  {sttState === 'recording' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <div className="badge badge-danger" style={{ animation: 'pulse 1s infinite alternate', marginBottom: '10px' }}>
                        🔴 RECORDING ACTIVE
                      </div>

                      {/* Timer */}
                      <div style={styles.recordingTimer}>
                        {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                      </div>

                      {/* Visualizer soundwave */}
                      <div className="conversa-waveform active">
                        {[...Array(12)].map((_, i) => (
                          <div
                            key={i}
                            className="conversa-wave-bar"
                            style={{ animationDelay: `${i * 0.08}s` }}
                          />
                        ))}
                      </div>

                      <div style={styles.btnGroup}>
                        <button onClick={cancelRecording} className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.85rem' }} type="button">
                          Discard
                        </button>
                        <button onClick={stopRecording} className="btn btn-primary" style={{ padding: '8px 18px', background: '#ef4444', borderColor: '#ef4444', fontSize: '0.85rem' }} type="button">
                          Finish & Process
                        </button>
                      </div>
                    </div>
                  )}

                  {sttState === 'idle' && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '10px' }}>
                      Click the microphone to request stream access
                    </p>
                  )}
                </div>

              /* 📁 FILE UPLOAD LAYOUT */
              ) : (
                <div>
                  <h3 style={{ ...styles.cardSubHeader, marginBottom: '16px' }}>Local File Input</h3>

                  <div
                    className={`conversa-dropzone ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="conversa-dropzone-icon">
                      <Upload size={24} color="var(--primary-light)" />
                    </div>
                    <p className="conversa-dropzone-text">
                      Drag and drop audio file here
                    </p>
                    <p className="conversa-dropzone-subtext">
                      or click to browse local files (WAV, MP3, M4A, OGG up to 25MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {sttError && (
              <div style={styles.errorBanner} className="animate-fade-in">
                <AlertCircle size={16} color="#ef4444" />
                <span>{sttError}</span>
              </div>
            )}

            {/* Results card */}
            {transcriptResult && (
              <div className="glass-card animate-fade-in" style={styles.sttCard}>
                <div style={styles.resultsHeader}>
                  <h3 style={styles.cardSubHeader}>Transcription Complete</h3>
                  <div style={styles.resultsActions}>
                    <button onClick={copyTranscriptToClipboard} className="voice-action-icon-btn" style={styles.actionIconBtn} title="Copy Full Text" type="button">
                      <Copy size={16} />
                    </button>
                    <button onClick={handleDownloadTranscriptJSON} className="voice-action-icon-btn" style={styles.actionIconBtn} title="Download JSON Response" type="button">
                      <File size={16} />
                    </button>
                  </div>
                </div>

                {/* Meta details badges */}
                <div style={styles.resultsMeta}>
                  <div style={styles.metaBadge}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Source:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.8rem' }}>{transcriptResult.filename}</span>
                  </div>
                  {transcriptResult.duration && (
                    <div style={styles.metaBadge}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Processing Time:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.8rem' }}>{transcriptResult.duration}</span>
                    </div>
                  )}
                  <div style={styles.metaBadge}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Language:</span>
                    <span style={{ color: 'var(--primary-light)', fontWeight: '600', fontSize: '0.8rem' }}>
                      {transcriptResult.language?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Sub-view tab switcher for Result Card (if segments exist) */}
                {transcriptResult.segments && transcriptResult.segments.length > 0 && (
                  <div style={{ ...styles.sttTabBar, marginBottom: '20px', maxWidth: '300px' }}>
                    <button
                      onClick={() => setResultTab('text')}
                      style={{ ...styles.sttTab, padding: '6px 12px', fontSize: '0.82rem', ...(resultTab === 'text' ? styles.sttTabActive : {}) }}
                      type="button"
                    >
                      Full Paragraph
                    </button>
                    <button
                      onClick={() => setResultTab('timeline')}
                      style={{ ...styles.sttTab, padding: '6px 12px', fontSize: '0.82rem', ...(resultTab === 'timeline' ? styles.sttTabActive : {}) }}
                      type="button"
                    >
                      Segments Timeline
                    </button>
                  </div>
                )}

                {/* Content Box */}
                {resultTab === 'text' ? (
                  <div style={styles.transcriptBox}>
                    <h4 style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Text Transcript
                    </h4>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                      {transcriptResult.text}
                    </p>
                  </div>
                ) : (
                  <div className="conversa-timeline">
                    {transcriptResult.segments.map((seg, idx) => (
                      <div key={idx} className="conversa-timeline-item">
                        <div className="conversa-timeline-dot"></div>
                        <div className="conversa-timeline-time">
                          {formatSegmentTime(seg.start)} &rarr; {formatSegmentTime(seg.end)}
                        </div>
                        <div className="conversa-timeline-text">{seg.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 'var(--max-width)', margin: '0 auto', padding: '40px 24px' },
  hubHeader: {
    textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px auto',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  hubTitle: { fontSize: '2.2rem', color: 'var(--text-primary)' },
  hubSub: { fontSize: '1rem', color: 'var(--text-secondary)' },
  hubCard: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', cursor: 'pointer', minHeight: '220px' },
  iconBoxPurple: { width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBoxPink:   { width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(14,165,233,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '1.2rem', color: 'var(--text-primary)' },
  cardDesc: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' },
  apiKeyBanner: {
    marginTop: '24px', maxWidth: '700px', margin: '24px auto 0',
    background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
    borderRadius: '10px', padding: '12px 20px',
  },
  whySection: { marginTop: '80px', borderTop: '1px solid var(--border-color)', paddingTop: '64px' },
  secTitle: { fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '32px', textAlign: 'center' },
  whyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '32px', textAlign: 'left' },
  whyItemTitle: { fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '8px' },
  whyItemText: { fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' },
  subHeader: { textAlign: 'left', maxWidth: '800px', margin: '0 auto 32px auto' },
  backBtn: {
    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '0.9rem', transition: 'var(--transition)',
  },
  ttsCard: { maxWidth: '800px', margin: '0 auto', padding: '32px' },
  cardSubHeader: { fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '16px' },
  textareaFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' },
  clearBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'var(--transition)' },
  actionRow: { marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  convertBtn: { padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' },
  soundwave: { display: 'flex', alignItems: 'center', gap: '4px', height: '32px' },
  waveBar: { width: '4px', height: '10px', background: 'var(--primary-light)', borderRadius: '2px', animation: 'wave 1s infinite alternate ease-in-out' },
  audioPlayerBox: {
    marginTop: '24px', background: 'rgba(37,99,235,0.03)', border: '1px solid var(--border-color)',
    borderRadius: '12px', padding: '16px',
  },
  audioPlayerHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  errorBanner: {
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center',
    gap: '10px', fontSize: '0.85rem', color: '#dc2626', margin: '16px 0',
  },
  sttLayout: { maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  sttTabBar: {
    display: 'flex', gap: '4px', background: 'rgba(15,23,42,0.02)',
    border: '1px solid var(--border-color)', borderRadius: '12px', padding: '4px',
  },
  sttTab: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'transparent',
    color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
    transition: 'var(--transition)',
  },
  sttTabActive: {
    background: 'rgba(37,99,235, 0.15)', color: 'var(--text-primary)',
    boxShadow: '0 0 0 1px rgba(37,99,235, 0.3)',
  },
  sttCard: { padding: '32px' },
  recordingTimer: { fontSize: '2.2rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: '8px' },
  btnGroup: { display: 'flex', gap: '10px', marginTop: '16px' },
  transcribingWrapper: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
    padding: '20px', background: 'rgba(37,99,235,0.03)', borderRadius: '8px',
    border: '1px solid var(--border-color)', width: '100%',
  },
  resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  resultsActions: { display: 'flex', gap: '8px' },
  actionIconBtn: {
    background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)',
    padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)',
  },
  resultsMeta: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  metaBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(15,23,42,0.02)', padding: '6px 12px',
    borderRadius: '20px', border: '1px solid var(--border-color)',
  },
  transcriptBox: {
    background: '#eaf1fc', border: '1px solid var(--border-color)',
    borderRadius: '8px', padding: '20px',
  },
};
