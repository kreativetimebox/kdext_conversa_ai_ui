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

// Configured production endpoint (VITE_API_BASE_URL), falling back to the
// known deployment so old builds keep working.
const CONFIGURED_BASE = (import.meta.env?.VITE_API_BASE_URL || 'https://aiservices.dexaitech.com').replace(/\/+$/, '');

// Fallback used when the UI is opened by raw server IP instead of the domain
// (e.g. the reverse proxy / TLS in front of aiservices.dexaitech.com is down).
// In that case CONFIGURED_BASE would still point at the broken domain, so we
// talk to the gateway directly instead.
const DIRECT_GATEWAY_URL = (import.meta.env?.VITE_DIRECT_GATEWAY_URL || 'http://185.14.252.20:8001').replace(/\/+$/, '');

function isRawIpHost(hostname) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

// The real backend server, for building absolute audio URLs. Mirrors the
// BASE_URL fallback below so audio actually resolves against whichever host
// served the request.
export const SERVER_BASE = (typeof window !== 'undefined' && isRawIpHost(window.location.hostname))
  ? DIRECT_GATEWAY_URL
  : CONFIGURED_BASE;

// API calls go through the Vite dev proxy, hit the gateway directly (raw IP
// access — domain may be unreachable), or use the secure reverse proxy.
const BASE_URL = (() => {
  if (typeof window === 'undefined') return CONFIGURED_BASE;
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
  if (isRawIpHost(hostname)) return DIRECT_GATEWAY_URL;
  return CONFIGURED_BASE;
})();

// WebSocket base for live translation — same host as the API, ws(s) scheme.
// On localhost it goes through the Vite dev proxy just like HTTP calls.
export function getWsBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, protocol, host } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const proto = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${host}`;
    }
    if (isRawIpHost(hostname)) {
      return DIRECT_GATEWAY_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    }
  }
  return CONFIGURED_BASE.replace('https://', 'wss://').replace('http://', 'ws://');
}

// WebSocket URL for the live voice-translation endpoint.
// The browser cannot set custom headers on WebSocket connections, so the
// API key is passed as a query parameter — same pattern as /ws/translate.
export function getVoiceTranslateWsUrl(apiKey) {
  return `${getWsBaseUrl()}/ws/voice-translate?api_key=${encodeURIComponent(apiKey)}`;
}

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
 * POST /verify-otp
 * Body: { email, otp_code }
 * Response: { message, verified }
 */
export async function verifyOtp(email, otp_code) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp_code }),
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

/**
 * GET /jobs/{job_id}  (requires api_key)
 * Pass jobType ('tts' | 'stt') when known — it lets the gateway skip querying
 * the other job table, which halves the DB work on every poll.
 */
export async function getJobStatus(apiKey, jobId, jobType = null) {
  const qs = jobType ? `?type=${jobType}` : '';
  const res = await fetch(`${BASE_URL}/jobs/${jobId}${qs}`, {
    headers: { 'x-api-key': apiKey },
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

// ─── Chat & Conversations ─────────────────────────────────────────────────────

/**
 * POST /conversations
 * Header: x-api-key: <apiKey>
 * Body: { title, mode, messages }
 */
export async function createConversation(apiKey, title = 'New Chat', mode = 'chat', messages = []) {
  const res = await fetch(`${BASE_URL}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ title, mode, messages }),
  });
  return handleResponse(res);
}

/**
 * GET /conversations
 * Header: x-api-key: <apiKey>
 */
export async function getConversations(apiKey) {
  const res = await fetch(`${BASE_URL}/conversations`, {
    headers: { 'x-api-key': apiKey },
  });
  return handleResponse(res);
}

/**
 * GET /conversations/{id}
 * Header: x-api-key: <apiKey>
 */
export async function getConversationDetails(apiKey, id) {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, {
    headers: { 'x-api-key': apiKey },
  });
  return handleResponse(res);
}

/**
 * PATCH /conversations/{id}
 * Header: x-api-key: <apiKey>
 * Body: { title, mode }
 */
export async function renameConversation(apiKey, id, title, mode = 'chat') {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ title, mode }),
  });
  return handleResponse(res);
}

/**
 * DELETE /conversations/{id}
 * Header: x-api-key: <apiKey>
 */
export async function deleteConversation(apiKey, id) {
  const res = await fetch(`${BASE_URL}/conversations/${id}`, {
    method: 'DELETE',
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data?.detail || data?.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return true;
}

/**
 * POST /conversations/{id}/messages
 * Header: x-api-key: <apiKey> (or token)
 * Body: { role, content }
 */
export async function addMessage(apiKey, id, role, content) {
  const res = await fetch(`${BASE_URL}/conversations/${id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ role, content }),
  });
  return handleResponse(res);
}

/**
 * POST /chat/completions (SSE streaming)
 * Header: x-api-key: <apiKey>
 * Body: { messages, model, stream: true }
 */
export async function chatCompletion(apiKey, messages, model = null, stream = true, maxTokens = 2048, signal = null) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      // This UI persists chats itself via /conversations — tell the gateway
      // not to double-save the exchange server-side.
      'x-client-persist': '1'
    },
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream
    }),
    // Wire the caller's AbortController through so Stop actually stops.
    signal,
  });
  
  if (!res.ok) {
    let errMsg = `chat ${res.status}`;
    try {
      const errData = await res.json();
      const raw = errData?.error || errData?.detail || errData?.message || errMsg;
      // detail/error can be an object or a FastAPI validation array — never
      // let it stringify to "[object Object]" or leak raw JSON to the bubble.
      if (Array.isArray(raw)) {
        errMsg = raw.map(d => d?.msg || d).join(', ');
      } else if (raw && typeof raw === 'object') {
        errMsg = raw.message || raw.detail || raw.error || JSON.stringify(raw);
      } else {
        errMsg = raw;
      }
    } catch (_) {}
    const err = new Error(errMsg);
    err.status = res.status;
    throw err;
  }
  return res;
}

// ─── Translation ──────────────────────────────────────────────────────────────

/**
 * POST /translate
 * Header: x-api-key: <apiKey>
 * Body: { text, source, target, engine }
 */
export async function translateText(apiKey, text, source, target, engine = 'api') {
  // source was previously accepted but never sent — an explicitly selected
  // source language was silently discarded and the server always auto-detected
  // (wrong for ambiguous short strings). Send it when it isn't auto-detect;
  // servers without the field simply ignore it.
  const body = { text, target_lang: target, engine };
  if (source && source !== 'auto') body.source_lang = source;
  const res = await fetch(`${BASE_URL}/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

// ─── Voice (Real-time via Gateway /api/voice/*) ───────────────────────────────

/**
 * POST /api/voice/stt  (requires x-api-key)
 * Gateway proxies this to the STT engine at :8002/v1/stt
 * Body: multipart/form-data { file, language? }
 * Response: { text, language, words: [{word, start, end, confidence}] }
 */
export async function voiceSTT(apiKey, file, language = null) {
  const formData = new FormData();
  const filename = file.name || `voice_${Date.now()}.wav`;
  formData.append('file', file, filename);
  if (language && language !== 'auto') {
    formData.append('language', language);
  }
  const res = await fetch(`${BASE_URL}/api/voice/stt`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
  });
  return handleResponse(res);
}

/**
 * POST /api/voice/tts  (requires x-api-key)
 * Gateway proxies this to the TTS engine at :8000/v1/tts
 * Body: multipart/form-data { text, language, voice? }  (gateway uses form-data)
 * Response: audio/wav binary bytes
 * Returns a Blob URL that can be played by <audio>
 */
export async function voiceTTS(apiKey, text, language = 'en', voice = null) {
  const formData = new FormData();
  formData.append('text', text);
  formData.append('language', language);
  if (voice) formData.append('voice', voice);

  const res = await fetch(`${BASE_URL}/api/voice/tts`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
  });

  if (!res.ok) {
    let errMsg = `TTS HTTP ${res.status}`;
    try {
      const data = await res.json();
      errMsg = data?.detail || data?.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  // Response is raw audio/wav bytes — convert to a playable blob URL
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

