/**
 * Voice Gateway API Service
 * Base URL: http://185.14.252.20:8001
 *
 * TTS response: { request_id, audio_url, detail, processing_time, current_time }
 *   → audio_url is a relative path e.g. "/audio/tts/23.wav"
 *   → Full URL: BASE_SERVER_URL + audio_url
 *
 * STT response: { request_id, detail, audio_url, processing_time, current_time }
 *   → detail contains the transcript text
 */

// ─── Base URLs ────────────────────────────────────────────────────────────────

// The real backend server (always direct, for building absolute audio URLs)
export const SERVER_BASE = 'http://185.14.252.20:8001';

// API calls go through the Vite dev proxy (/api → SERVER_BASE) to avoid CORS.
// In production, set VITE_API_BASE_URL to SERVER_BASE or use a reverse proxy.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse(res) {
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      // FastAPI validation errors
      if (Array.isArray(data?.detail)) {
        errMsg = data.detail.map(d => d.msg).join(', ');
      } else {
        errMsg = data?.detail || data?.message || errMsg;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }
  return res.json();
}

// Build the full audio URL from a relative path returned by the API
export function buildAudioUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  return `${SERVER_BASE}${relativePath}`;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /signup
 * Body: { email, password }
 * Response: 201 Created
 */
export async function signup(email, password) {
  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

/**
 * POST /login
 * Body: { email, password }
 * Response: { access_token, token_type, api_key, expires_in }
 */
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

/**
 * POST /verify-otp
 * Body: { email, otp_code }
 * Response: { message, verified }
 */
export async function verifyOtp(email, otpCode) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp_code: otpCode }),
  });
  return handleResponse(res);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /profile
 * Header: Authorization: Bearer <token>
 * Response: { user_id, email, api_key, login_time, signout_time, total_processing, total_failed }
 */
export async function getProfile(token) {
  const res = await fetch(`${BASE_URL}/profile`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

/**
 * GET /voices  (requires api_key)
 * Response: { voices: [ { id, name, gender, style, language } ] }
 */
export async function getVoices(apiKey) {
  const res = await fetch(`${BASE_URL}/voices`, {
    headers: { 'x-api-key': apiKey },
  });
  return handleResponse(res);
}

/**
 * GET /demo/voices  (no auth)
 */
export async function getDemoVoices() {
  const res = await fetch(`${BASE_URL}/demo/voices`);
  return handleResponse(res);
}

/**
 * POST /text-to-speech  (requires api_key)
 * Body: { text, voice, format }
 * Response: { request_id, audio_url, detail, processing_time, current_time }
 *   → audio_url is RELATIVE — use buildAudioUrl(audio_url) for the full URL
 *   → e.g.  audio_url = "/audio/tts/23.wav"
 */
export async function textToSpeech(apiKey, text, voice = 'divya', format = 'wav') {
  const payload = { text, voice, format };

  const res = await fetch(`${BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res); // returns JSON { request_id, audio_url, ... }
}

// ─── STT ──────────────────────────────────────────────────────────────────────

/**
 * POST /speech-to-text  (requires api_key)
 * Body: multipart/form-data { file, language? }
 * Response: { request_id, detail, audio_url, processing_time, current_time }
 *   → detail is the TRANSCRIPT TEXT
 */
export async function speechToText(apiKey, file, language = null) {
  const formData = new FormData();
  const filename = file.name || `audio_${Date.now()}.wav`;
  formData.append('file', file, filename);
  if (language && language !== 'auto' && language !== 'null') {
    formData.append('language', language);
  }

  const res = await fetch(`${BASE_URL}/speech-to-text`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
  });
  return handleResponse(res);
}

/**
 * POST /demo/stt  (no auth)
 * Body: multipart/form-data { file, language? }
 * Response: { request_id, detail, ... }
 */
export async function demoSTT(file, language = null) {
  const formData = new FormData();
  const filename = file.name || `audio_${Date.now()}.wav`;
  formData.append('file', file, filename);
  if (language && language !== 'auto' && language !== 'null') {
    formData.append('language', language);
  }

  const res = await fetch(`${BASE_URL}/demo/stt`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function checkDemoHealth() {
  const res = await fetch(`${BASE_URL}/demo/health`);
  return handleResponse(res);
}
