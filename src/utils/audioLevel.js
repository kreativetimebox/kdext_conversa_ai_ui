// Lightweight mic-volume meter built on the Web Audio API. Used to drive
// audio-reactive UI (e.g. a Siri-style pulsing orb) and to detect sustained
// silence so a recording can auto-stop instead of running forever.
//
// This is a heuristic RMS-over-time-domain-data level, not a speech/VAD
// model — good enough for UI feedback and a "no one is talking" timeout.
export function attachAudioLevelMeter(stream, {
  onLevel,
  onSilence,
  silenceThresholdRms = 0.02,
  silenceTimeoutMs = 3500,
} = {}) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return { stop: () => {} };
  }

  const audioCtx = new AudioContextClass();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const buffer = new Uint8Array(analyser.fftSize);
  let lastLoudAt = Date.now();
  let silenceFired = false;
  let rafId = null;

  const tick = () => {
    analyser.getByteTimeDomainData(buffer);

    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = (buffer[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);

    if (onLevel) onLevel(Math.min(1, rms * 4)); // scaled up for a livelier UI response

    if (rms > silenceThresholdRms) {
      lastLoudAt = Date.now();
    } else if (!silenceFired && onSilence && Date.now() - lastLoudAt > silenceTimeoutMs) {
      silenceFired = true;
      onSilence();
      return; // stop the loop — caller is expected to tear the recording down
    }

    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    source.disconnect();
    analyser.disconnect();
    audioCtx.close().catch(() => {});
  };

  return { stop };
}
