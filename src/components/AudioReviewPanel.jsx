import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  RotateCcw,
  Scissors,
  Undo2,
  Download,
  Share2,
  X,
  Mic,
  Upload,
  Music,
} from 'lucide-react';
import { trimBlobToWav, formatTime } from '../utils/audioTrim';

const SPEEDS = [0.5, 1, 2, 3];
const MIN_TRIM_SECONDS = 0.5;
const SKIP_SECONDS = 5;

export default function AudioReviewPanel({
  blob,
  fileName = 'recording.wav',
  title = 'Review Audio',
  onBlobChange,
  onClose,
  onReRecord,
  onReUpload,
  showToast,
}) {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionsRef = useRef(null);
  const activeRegionRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1x
  const [trimMode, setTrimMode] = useState(false);
  const [trimHistory, setTrimHistory] = useState([]);

  // (Re)build the waveform whenever the underlying blob changes (fresh recording,
  // fresh upload, or a trim/undo swapping the active clip).
  useEffect(() => {
    if (!blob || !containerRef.current) return undefined;

    setIsReady(false);
    setTrimMode(false);
    activeRegionRef.current = null;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(blob);
    objectUrlRef.current = url;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(15, 23, 42, 0.18)',
      progressColor: 'var(--primary)',
      cursorColor: 'var(--primary-hover)',
      height: 64,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      url,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsRef.current = regions;
    wavesurferRef.current = ws;

    ws.on('ready', (d) => {
      setDuration(d);
      setIsReady(true);
      ws.setPlaybackRate(SPEEDS[speedIndex], true);
    });
    ws.on('timeupdate', (t) => setCurrentTime(t));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      regionsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  // Clean up the last object URL on unmount.
  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const restart = useCallback(() => {
    wavesurferRef.current?.setTime(0);
  }, []);

  const skip = useCallback((secs) => {
    wavesurferRef.current?.skip(secs);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((prev) => {
      const next = (prev + 1) % SPEEDS.length;
      wavesurferRef.current?.setPlaybackRate(SPEEDS[next], true);
      return next;
    });
  }, []);

  const enterTrimMode = useCallback(() => {
    const ws = wavesurferRef.current;
    const regions = regionsRef.current;
    if (!ws || !regions || !isReady) return;

    regions.clearRegions();
    const total = ws.getDuration();
    // Default selection: middle 60% of the clip, respecting the min trim length.
    const span = Math.max(MIN_TRIM_SECONDS, total * 0.6);
    const start = Math.max(0, (total - span) / 2);
    const end = Math.min(total, start + span);

    const region = regions.addRegion({
      start,
      end,
      color: 'rgba(217, 119, 6, 0.25)',
      drag: true,
      resize: true,
      minLength: MIN_TRIM_SECONDS,
      maxLength: total,
    });
    activeRegionRef.current = region;
    setTrimMode(true);
  }, [isReady]);

  const cancelTrim = useCallback(() => {
    regionsRef.current?.clearRegions();
    activeRegionRef.current = null;
    setTrimMode(false);
  }, []);

  const confirmTrim = useCallback(() => {
    const ws = wavesurferRef.current;
    const region = activeRegionRef.current;
    if (!ws || !region) return;

    const decoded = ws.getDecodedData();
    if (!decoded) {
      showToast?.('Audio is still decoding, try again in a moment.', 'error');
      return;
    }

    const start = Math.max(0, region.start);
    const end = Math.min(decoded.duration, region.end);
    if (end - start < MIN_TRIM_SECONDS - 0.01) {
      showToast?.(`Trim must be at least ${MIN_TRIM_SECONDS}s long.`, 'error');
      return;
    }

    try {
      const wavBlob = trimBlobToWav(decoded, start, end);
      wavBlob.name = `trimmed_${Date.now()}.wav`;
      setTrimHistory((prev) => [...prev, blob]);
      regionsRef.current?.clearRegions();
      activeRegionRef.current = null;
      setTrimMode(false);
      onBlobChange?.(wavBlob);
      showToast?.('Audio trimmed.', 'success');
    } catch (err) {
      console.error('Trim failed:', err);
      showToast?.('Could not trim audio.', 'error');
    }
  }, [blob, onBlobChange, showToast]);

  const undoTrim = useCallback(() => {
    if (trimHistory.length === 0) return;
    const previous = trimHistory[trimHistory.length - 1];
    setTrimHistory((prev) => prev.slice(0, -1));
    onBlobChange?.(previous);
    showToast?.('Trim undone.', 'info');
  }, [trimHistory, onBlobChange, showToast]);

  const handleDownload = useCallback(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = blob.name || fileName || 'audio.wav';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [blob, fileName]);

  const handleShare = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], blob.name || fileName || 'audio.wav', { type: blob.type || 'audio/wav' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Audio recording' });
      } catch {
        // user cancelled share sheet — nothing to do
      }
    } else {
      showToast?.('Sharing is not supported in this browser. Use Download instead.', 'info');
    }
  }, [blob, fileName, showToast]);

  return (
    <div className="audio-review-panel">
      <div className="audio-review-header">
        <div className="audio-review-title">
          <Music size={16} />
          <span>{title}</span>
        </div>
        <div className="audio-review-header-actions">
          <button type="button" title="Download" onClick={handleDownload} className="audio-review-icon-btn">
            <Download size={16} />
          </button>
          <button type="button" title="Share" onClick={handleShare} className="audio-review-icon-btn">
            <Share2 size={16} />
          </button>
          <button type="button" title="Close" onClick={onClose} className="audio-review-icon-btn audio-review-close-btn">
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="audio-review-waveform" />

      <div className="audio-review-time-row">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {!trimMode ? (
        <div className="audio-review-controls-row">
          <button type="button" title={`Playback speed: ${SPEEDS[speedIndex]}x`} onClick={cycleSpeed} className="audio-review-speed-btn">
            {SPEEDS[speedIndex]}x
          </button>

          <div className="audio-review-transport">
            <button type="button" title="Back 5s" onClick={() => skip(-SKIP_SECONDS)} className="audio-review-icon-btn" disabled={!isReady}>
              <Rewind size={18} />
            </button>
            <button type="button" title={isPlaying ? 'Pause' : 'Play'} onClick={togglePlay} className="audio-review-play-btn" disabled={!isReady}>
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button type="button" title="Forward 5s" onClick={() => skip(SKIP_SECONDS)} className="audio-review-icon-btn" disabled={!isReady}>
              <FastForward size={18} />
            </button>
          </div>

          <div className="audio-review-edit-actions">
            <button type="button" title="Restart from beginning" onClick={restart} className="audio-review-icon-btn" disabled={!isReady}>
              <RotateCcw size={17} />
            </button>
            <button type="button" title="Trim audio" onClick={enterTrimMode} className="audio-review-icon-btn" disabled={!isReady}>
              <Scissors size={17} />
            </button>
            {trimHistory.length > 0 && (
              <button type="button" title="Undo trim" onClick={undoTrim} className="audio-review-icon-btn">
                <Undo2 size={17} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="audio-review-controls-row">
          <span className="audio-review-trim-hint">Drag the handles to select a section ({MIN_TRIM_SECONDS}s min)</span>
          <div className="audio-review-edit-actions">
            <button type="button" onClick={cancelTrim} className="btn btn-outline audio-review-trim-btn">
              Cancel
            </button>
            <button type="button" onClick={confirmTrim} className="btn btn-primary audio-review-trim-btn">
              Trim
            </button>
          </div>
        </div>
      )}

      <div className="audio-review-source-row">
        <button type="button" title="Upload a different file" onClick={onReUpload} className="audio-review-icon-btn">
          <Upload size={18} />
        </button>
        <button type="button" title="Record again" onClick={onReRecord} className="audio-review-icon-btn">
          <Mic size={18} />
        </button>
      </div>
    </div>
  );
}
