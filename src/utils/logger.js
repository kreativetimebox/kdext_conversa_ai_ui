// Simple frontend audit/event logger.
// Stores events in localStorage so they survive refreshes, and lets you
// export everything as a downloadable file for debugging after testing.

const STORAGE_KEY = 'conversa_audit_log';
const MAX_ENTRIES = 500; // keep the log from growing forever

function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to persist audit log:', err);
  }
}

/**
 * Record an event.
 * @param {string} type - e.g. 'info', 'error', 'action'
 * @param {string} message - short description, e.g. 'Login success'
 * @param {object} [details] - any extra context (page, error message, etc.)
 */
export function logEvent(type, message, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
    page: window.location.pathname,
  };

  const entries = readLog();
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift(); // drop oldest
  writeLog(entries);

  // Also print to browser console for real-time viewing during dev
  const consoleFn = type === 'error' ? console.error : console.log;
  consoleFn(`[AUDIT] ${entry.timestamp} — ${message}`, details);
}

export function getLogs() {
  return readLog();
}

export function clearLogs() {
  writeLog([]);
}

/**
 * Triggers a browser download of all logged events as a .json file.
 */
export function downloadLogs() {
  const entries = readLog();
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversa_audit_log_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}