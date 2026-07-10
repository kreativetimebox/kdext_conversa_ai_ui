import React, { useState, useRef, useEffect } from 'react';
import logo from '../assets/logo.svg';
import { Send, Mic, Copy, CheckCircle2, User, Bot, StopCircle, Volume2, Loader2, Headphones, X, MicVocal } from 'lucide-react';
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

// currentAudioRef is SHARED by all SpeakButtons in the chat: it holds a
// { stop } handle for whichever button is loading/playing right now, so
// starting speech on one message both silences the previous message AND
// resets its button back to "Speak".
const SpeakButton = ({ text, apiKey, showToast, currentAudioRef }) => {
  // idle → loading (TTS request in flight) → playing.
  // The loading state is the fix for "audio appears with no stop": TTS takes
  // seconds to generate, and the old two-state button let the UI and the
  // audio get out of sync during that window.
  const [status, setStatus] = useState('idle');
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  // Bumped on every stop/start so a TTS response that arrives AFTER the user
  // pressed Stop is discarded instead of playing anyway with the button
  // already back on "Speak".
  const genRef = useRef(0);

  const stop = () => {
    genRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setStatus('idle');
  };

  // Stop playback if this button's component unmounts (e.g. user navigates
  // away to another page while audio is still playing/generating)
  useEffect(() => {
    return () => {
      genRef.current += 1;
      if (audioRef.current) audioRef.current.pause();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handleSpeak = async () => {
    // Clicking while loading or playing = stop/cancel
    if (status !== 'idle') {
      stop();
      if (currentAudioRef.current?.owner === genRef) currentAudioRef.current = null;
      return;
    }

    if (!text?.trim()) return;

    // Take over from whichever message is currently speaking
    if (currentAudioRef.current) {
      currentAudioRef.current.stop();
    }
    currentAudioRef.current = { stop, owner: genRef };

    const gen = ++genRef.current;
    setStatus('loading');

    try {
      const blobUrl = await voiceTTS(apiKey, text, 'en', 'divya');

      // User pressed Stop (or started another message) while generating —
      // throw the late audio away instead of playing it.
      if (gen !== genRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }

      blobUrlRef.current = blobUrl;
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      const finish = (errored) => {
        if (gen !== genRef.current) return;
        stop();
        if (currentAudioRef.current?.owner === genRef) currentAudioRef.current = null;
        if (errored) showToast('Failed to play audio.', 'error');
      };
      audio.onended = () => finish(false);
      audio.onerror = () => finish(true);
      await audio.play();
      if (gen === genRef.current) setStatus('playing');
    } catch (err) {
      if (gen !== genRef.current) return; // user cancelled while generating
      stop();
      showToast(err.message || 'Speech synthesis failed.', 'error');
      logEvent('error', 'TTS speak failed', { error: err.message });
    }
  };

  const active = status !== 'idle';
  return (
    <button
      onClick={handleSpeak}
      style={{
        ...styles.msgActionBtn,
        color: active ? '#3b82f6' : undefined,
        background: active ? 'rgba(37,99,235,0.15)' : undefined,
        borderColor: active ? 'rgba(37,99,235,0.3)' : undefined,
      }}
      title={status === 'idle' ? 'Speak response' : status === 'loading' ? 'Cancel' : 'Stop speaking'}
    >
      {status === 'loading'
        ? <Loader2 size={13} color="#3b82f6" style={{ animation: 'spin 0.8s linear infinite' }} />
        : status === 'playing'
        ? <StopCircle size={13} color="#3b82f6" />
        : <Volume2 size={13} />}
      <span>{status === 'idle' ? 'Speak' : status === 'loading' ? 'Loading' : 'Stop'}</span>
    </button>
  );
};

export default function Chat({ user, showToast, currentPath, navigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  // Hands-free voice conversation ("voice chat" like ChatGPT's voice mode):
  // listen → transcribe → send → AI replies → reply is spoken → listen again.
  const [voiceChat, setVoiceChat] = useState(false);
  const [voiceStage, setVoiceStage] = useState('idle'); // listening | thinking | speaking
  const [voiceLiveText, setVoiceLiveText] = useState(''); // live transcript while listening

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
  // Voice-chat loop state. voiceChatRef mirrors voiceChat for async callbacks;
  // latest.current always points at THIS render's functions so the loop
  // (which lives in old recorder/timer closures) never acts on stale state.
  const voiceChatRef = useRef(false);
  const voiceChatAudioRef = useRef(null);
  const voiceEmptyCountRef = useRef(0);
  // Set when a recording should be thrown away unprocessed (e.g. the user
  // ended voice chat while the dictation mic was still listening).
  const discardRecordingRef = useRef(false);
  const latest = useRef({});
  // ── Segmented live-transcription engine (same pattern as live translation):
  // the mic records short complete segments, each is transcribed while the
  // next records, and ordered results append to a live transcript on screen.
  const vcStreamRef = useRef(null);
  const vcRecorderRef = useRef(null);
  const vcCycleTimerRef = useRef(null);
  const vcListeningRef = useRef(false);   // true only during the listen phase
  const vcChunkSeqRef = useRef(0);        // next seq to assign to a segment
  const vcFlushSeqRef = useRef(0);        // next seq allowed to append
  const vcPendingRef = useRef({});        // seq -> transcript ('' = silent/failed)
  const vcInflightRef = useRef(0);        // STT uploads in flight (backpressure)
  const vcTranscriptRef = useRef('');     // accumulated text for this turn
  // Adaptive silence detection (same as the Translate live mic)
  const vcAudioCtxRef = useRef(null);
  const vcRafRef = useRef(null);

  // Set right before navigating to a conversation WE just created: the
  // messages are already in state, so the load effect must not refetch them.
  // The refetch flipped isTyping on, which unmounted the last message's
  // Copy/Speak buttons mid-action — cutting off TTS audio that had just
  // started playing after the first reply of every new chat.
  const skipNextLoadRef = useRef(false);

  const pathParts = currentPath ? currentPath.split('/') : [];
  const activeConversationId = pathParts.length > 2 ? pathParts[2] : null;

  useEffect(() => {
    const loadConversation = async () => {
      if (activeConversationId) {
        if (skipNextLoadRef.current) {
          skipNextLoadRef.current = false;
          return;
        }
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
        // Release the mic hardware first — in voice chat the next listen
        // opens a fresh stream, and holding this one keeps the tab's
        // recording indicator on while the AI is thinking/speaking.
        stream.getTracks().forEach(track => track.stop());

        // Recording cancelled (e.g. voice chat ended mid-listen) — drop it.
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }

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
          logEvent('error', 'STT transcription failed', { error: err.message });
          showToast(err.message || 'Failed to transcribe voice.', 'error');
        } finally {
          if (gen === voiceGenRef.current) setIsTyping(false);
        }
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

  // ══ Voice chat (hands-free conversation) ══════════════════════════════════
  // listen (live transcription) → pause → send → AI streams reply → reply is
  // spoken aloud → listen again. Uses the same segmented live-STT pattern as
  // live translation: short complete recordings transcribed while the next
  // segment records, so your words appear on screen AS you speak.

  const VC_SEGMENT_MS = 1500;        // length of each mic segment
  const VC_CALIBRATION_MS = 500;     // learn ambient noise before judging
  const VC_MIN_SPEECH_RMS = 0.006;   // absolute floor for very quiet rooms
  const VC_NOISE_MULT = 2.5;         // speech = louder than noise × this
  const VC_PAUSE_MS = 2000;          // pause after speech = turn is done, send it
  const VC_NO_SPEECH_MS = 15000;     // said nothing at all → empty-turn handling

  // Feature-detect a supported recorder mime (hardcoding webm breaks Safari).
  const pickVcMime = () => {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      for (const t of candidates) {
        if (MediaRecorder.isTypeSupported(t)) return t;
      }
    }
    return '';
  };

  // Append every consecutive completed segment (in seq order) to this turn's
  // transcript and mirror it on screen. Ordering matters: STT calls run in
  // parallel and a slow early chunk must not let a later chunk's words land first.
  const flushVcChunks = () => {
    const pending = vcPendingRef.current;
    const parts = [];
    while (Object.prototype.hasOwnProperty.call(pending, vcFlushSeqRef.current)) {
      const t = pending[vcFlushSeqRef.current];
      delete pending[vcFlushSeqRef.current];
      vcFlushSeqRef.current += 1;
      if (t) parts.push(t);
    }
    if (parts.length) {
      vcTranscriptRef.current = vcTranscriptRef.current
        ? `${vcTranscriptRef.current} ${parts.join(' ')}`
        : parts.join(' ');
      setVoiceLiveText(vcTranscriptRef.current);
    }
  };

  // Record one complete segment; on stop, immediately start the next while
  // this one uploads to STT in parallel (capped at 2 in flight — beyond that
  // the segment is dropped so the transcript stays near real time).
  const startVcSegmentCycle = (stream) => {
    if (!vcListeningRef.current || !stream.active) return;

    const chunks = [];
    const mime = pickVcMime();
    let mr;
    try {
      mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (err) {
      console.error('Voice chat MediaRecorder init failed:', err);
      stopVoiceChat('Voice recording is not supported in this browser.');
      return;
    }
    vcRecorderRef.current = mr;
    const actualType = mr.mimeType || mime || 'audio/webm';
    const uploadType = actualType.split(';')[0].trim() || 'audio/webm';
    const ext = uploadType.includes('mp4') ? 'mp4' : uploadType.includes('ogg') ? 'ogg' : 'webm';

    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mr.onstop = async () => {
      if (!voiceChatRef.current) return;
      // Keep the cycle going first — never wait on the network to keep listening.
      if (vcListeningRef.current) startVcSegmentCycle(stream);

      const blob = new Blob(chunks, { type: uploadType });
      const seq = vcChunkSeqRef.current++;
      if (blob.size > 500 && vcInflightRef.current < 2) {
        vcInflightRef.current += 1;
        try {
          const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
          const file = new File([blob], `vc_${seq}.${ext}`, { type: uploadType });
          const res = await voiceSTT(apiKey, file, null);
          const t = res?.text || res?.detail || '';
          vcPendingRef.current[seq] = (t || '').trim();
        } catch (err) {
          console.warn('Voice chat STT segment failed:', err);
          vcPendingRef.current[seq] = ''; // keep the order moving
        } finally {
          vcInflightRef.current -= 1;
        }
      } else {
        vcPendingRef.current[seq] = ''; // silent/dropped segment
      }
      flushVcChunks();
    };

    mr.start();
    vcCycleTimerRef.current = setTimeout(() => {
      if (mr.state === 'recording') mr.stop();
    }, VC_SEGMENT_MS);
  };

  // Adaptive end-of-turn detection (same detector as the Translate live mic):
  // calibrate to ambient noise, then a 2s pause AFTER real speech ends the turn.
  const startVcSilenceWatch = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      vcAudioCtxRef.current = audioCtx;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let startTime = 0;
      let noiseFloor = 0;
      let calibSamples = 0;
      let calibrated = false;
      let hasSpoken = false;
      let loudStreak = 0;
      let silenceStart = null;

      const tick = () => {
        if (!vcListeningRef.current) return;
        if (!startTime) startTime = Date.now();

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const n = (dataArray[i] - 128) / 128;
          sumSquares += n * n;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        if (!calibrated) {
          noiseFloor = (noiseFloor * calibSamples + rms) / (calibSamples + 1);
          calibSamples += 1;
          if (Date.now() - startTime >= VC_CALIBRATION_MS) calibrated = true;
          vcRafRef.current = requestAnimationFrame(tick);
          return;
        }

        const speechThreshold = Math.max(VC_MIN_SPEECH_RMS, noiseFloor * VC_NOISE_MULT);
        if (rms >= speechThreshold) {
          loudStreak += 1;
          if (loudStreak >= 3) { // ~50ms sustained — a click can't fake speech
            hasSpoken = true;
            silenceStart = null;
          }
        } else {
          loudStreak = 0;
          noiseFloor = noiseFloor * 0.95 + rms * 0.05; // track the room
          if (hasSpoken) {
            if (silenceStart === null) {
              silenceStart = Date.now();
            } else if (Date.now() - silenceStart > VC_PAUSE_MS) {
              latest.current.endVoiceTurn();
              return;
            }
          } else if (Date.now() - startTime > VC_NO_SPEECH_MS) {
            latest.current.endVoiceTurn(); // empty turn → retry/exit below
            return;
          }
        }
        vcRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn('Voice chat silence watch setup failed:', err);
    }
  };

  // Tear down just the LISTEN-phase machinery (recorder cycle, mic, analyser).
  const stopVcListening = () => {
    vcListeningRef.current = false;
    clearTimeout(vcCycleTimerRef.current);
    if (vcRafRef.current) {
      cancelAnimationFrame(vcRafRef.current);
      vcRafRef.current = null;
    }
    if (vcAudioCtxRef.current) {
      try { vcAudioCtxRef.current.close(); } catch { /* already closed */ }
      vcAudioCtxRef.current = null;
    }
    if (vcRecorderRef.current && vcRecorderRef.current.state !== 'inactive') {
      try { vcRecorderRef.current.stop(); } catch { /* already stopped */ }
    }
    vcRecorderRef.current = null;
    if (vcStreamRef.current) {
      vcStreamRef.current.getTracks().forEach(t => t.stop());
      vcStreamRef.current = null;
    }
  };

  // Open the mic and start a fresh listening turn.
  const startVoiceListening = async () => {
    if (!voiceChatRef.current) return;
    vcChunkSeqRef.current = 0;
    vcFlushSeqRef.current = 0;
    vcPendingRef.current = {};
    vcInflightRef.current = 0;
    vcTranscriptRef.current = '';
    setVoiceLiveText('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true },
      });
      if (!voiceChatRef.current) { // ended while permission prompt was open
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      vcStreamRef.current = stream;
      vcListeningRef.current = true;
      setVoiceStage('listening');
      startVcSegmentCycle(stream);
      startVcSilenceWatch(stream);
    } catch (err) {
      logEvent('error', 'Voice chat mic error', { errorName: err.name, error: err.message });
      stopVoiceChat(
        err.name === 'NotAllowedError'
          ? 'Microphone access blocked — voice chat ended.'
          : 'Microphone unavailable — voice chat ended.'
      );
    }
  };

  // The user paused — close out the listen phase, wait briefly for the last
  // in-flight STT segments, then hand the full transcript to the turn handler.
  const endVoiceTurn = async () => {
    if (!voiceChatRef.current || !vcListeningRef.current) return;
    stopVcListening();
    setVoiceStage('thinking');

    const deadline = Date.now() + 2500;
    while (
      (vcInflightRef.current > 0 || Object.keys(vcPendingRef.current).length > 0) &&
      Date.now() < deadline
    ) {
      flushVcChunks();
      await new Promise(r => setTimeout(r, 120));
    }
    flushVcChunks();

    latest.current.handleVoiceTurn(vcTranscriptRef.current.trim());
  };

  // Markdown reads terribly out loud — strip it before synthesis.
  const stripForSpeech = (text) => text
    .replace(/```[\s\S]*?```/g, '. Code block omitted. ')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[#*_`>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // One full conversational turn: send the transcript, then speak the reply.
  const handleVoiceTurn = async (text) => {
    if (!voiceChatRef.current) return;
    setVoiceLiveText('');

    if (!text) {
      voiceEmptyCountRef.current += 1;
      if (voiceEmptyCountRef.current >= 2) {
        stopVoiceChat('Voice chat ended — no speech detected.');
        return;
      }
      showToast("Didn't catch that — listening again…", 'info');
      latest.current.startVoiceListening();
      return;
    }
    voiceEmptyCountRef.current = 0;

    const reply = await latest.current.sendMessage(text);
    if (!voiceChatRef.current) return;
    if (!reply) {
      stopVoiceChat('Voice chat ended due to an error.');
      return;
    }

    setVoiceStage('speaking');
    try {
      const apiKey = user?.api_key || sessionStorage.getItem('api_key') || 'demo';
      const blobUrl = await voiceTTS(apiKey, stripForSpeech(reply), 'en', 'divya');
      if (!voiceChatRef.current) {
        URL.revokeObjectURL(blobUrl);
        return;
      }
      const audio = new Audio(blobUrl);
      voiceChatAudioRef.current = audio;
      // Wait until the spoken reply finishes (or fails) before listening again,
      // so the mic can't hear the AI talking to itself.
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
      URL.revokeObjectURL(blobUrl);
      voiceChatAudioRef.current = null;
    } catch (err) {
      console.warn('Voice chat TTS failed:', err);
    }

    if (voiceChatRef.current) latest.current.startVoiceListening();
  };

  const startVoiceChat = () => {
    if (voiceChatRef.current) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Microphone recording is not supported in this browser.', 'error');
      return;
    }
    // A dictation recording in progress would race the voice-chat mic — drop it.
    if (isRecordingRef.current) {
      discardRecordingRef.current = true;
      stopRecording();
    }
    voiceChatRef.current = true;
    voiceEmptyCountRef.current = 0;
    setVoiceChat(true);
    showToast('🎧 Voice chat on — just start talking', 'info');
    latest.current.startVoiceListening();
  };

  const stopVoiceChat = (msg) => {
    voiceChatRef.current = false;
    stopVcListening();
    vcPendingRef.current = {};
    vcTranscriptRef.current = '';
    if (voiceChatAudioRef.current) {
      try { voiceChatAudioRef.current.pause(); } catch { /* already stopped */ }
      voiceChatAudioRef.current = null;
    }
    setVoiceChat(false);
    setVoiceStage('idle');
    setVoiceLiveText('');
    if (msg) showToast(msg, 'info');
  };

  // Kill the whole voice-chat loop if the user navigates away.
  useEffect(() => {
    return () => {
      voiceChatRef.current = false;
      stopVcListening();
      if (voiceChatAudioRef.current) {
        try { voiceChatAudioRef.current.pause(); } catch { /* already stopped */ }
        voiceChatAudioRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Core send path, shared by the text box (handleSubmit) and voice chat.
  // Streams the reply into the chat and RETURNS the final reply text so the
  // voice loop can speak it (null on error).
  const sendMessage = async (userMsgContent) => {
    const userMsg = { role: 'user', content: userMsgContent };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
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
              // The messages on screen ARE this conversation — skip the
              // refetch the URL change would trigger (it remounts the last
              // message's buttons and kills any TTS playing on it).
              skipNextLoadRef.current = true;
              navigate(`/chat/${conv.conversation_id || conv.id}`);
            }
          } catch (err) {
            console.error("Failed to create conversation:", err);
          }
        }
      }

      return assistantReply || null;
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
      return null;
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim() || isTyping || isRecording || voiceChat) return;

    const userMsgContent = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(userMsgContent);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Re-bound on every render so the voice-chat loop — which runs from old
  // recorder/timer closures — always calls the CURRENT functions, with the
  // current messages and conversation id (critical after the first exchange
  // navigates to the newly created conversation).
  latest.current = { sendMessage, handleVoiceTurn, startVoiceListening, endVoiceTurn };

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
          {voiceChat ? (
            /* Voice chat bar: replaces the input while a hands-free
               conversation is running. Shows the live transcript as you
               speak, then the AI's stage (thinking/speaking). */
            <div className="chat-input-wrapper" style={{ alignItems: 'center', gap: '12px' }}>
              <span
                className="pulse"
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: voiceStage === 'listening' ? '#2563eb' : voiceStage === 'thinking' ? '#f59e0b' : '#16a34a',
                  boxShadow: `0 0 10px ${voiceStage === 'listening' ? 'rgba(37,99,235,0.6)' : voiceStage === 'thinking' ? 'rgba(245,158,11,0.6)' : 'rgba(22,163,74,0.6)'}`,
                }}
              />
              <span style={{
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: voiceLiveText ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '0.92rem',
              }}>
                {voiceStage === 'listening'
                  ? (voiceLiveText || 'Listening — start talking, pause when you\'re done…')
                  : voiceStage === 'thinking'
                  ? 'Thinking…'
                  : 'Speaking…'}
              </span>
              {voiceStage === 'thinking' && (
                <Loader2 size={16} color="#f59e0b" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              )}
              {voiceStage === 'speaking' && (
                <Volume2 size={16} color="#16a34a" className="pulse" style={{ flexShrink: 0 }} />
              )}
              <button
                onClick={() => stopVoiceChat('Voice chat ended.')}
                title="End voice chat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  flexShrink: 0,
                  fontFamily: 'inherit',
                }}
              >
                <X size={14} /> End
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="chat-input-wrapper" style={{ flex: 1, margin: 0 }}>
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
              <button
                onClick={startVoiceChat}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-main)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  flexShrink: 0,
                  marginRight: '12px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Voice chat — speak and the AI speaks back"
              >
                <MicVocal size={20} />
              </button>
            </div>
          )}
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
        @keyframes spin { to { transform: rotate(360deg); } }

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
