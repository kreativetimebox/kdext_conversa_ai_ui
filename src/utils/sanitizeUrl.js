/**
 * Credential-safety helpers for anything derived from a server audio URL.
 *
 * In S3 mode the gateway returns PRESIGNED URLs whose query string carries the
 * AWS access key id (`X-Amz-Credential`) and a request signature
 * (`X-Amz-Signature`). Those must never be persisted (localStorage), rendered
 * in the UI, or logged — otherwise the credentials leak client-side. Local
 * mode is the same shape (`?token=&exp=`), an HMAC bearer we equally shouldn't
 * store. These helpers strip the query so only the safe path/name survives.
 */

/** True if the string looks like it carries presign/token query params. */
export function looksLikeSignedUrl(value) {
  return (
    typeof value === 'string' &&
    /[?&](X-Amz-|token=|exp=|Signature=)/i.test(value)
  );
}

/** Drop the query string, keeping the path (or plain value) intact. */
export function stripQuery(value) {
  if (typeof value !== 'string') return value;
  const q = value.indexOf('?');
  return q === -1 ? value : value.slice(0, q);
}

/**
 * Derive a display filename from a URL WITHOUT its credential-bearing query.
 * e.g. ".../tts/23.mp3?X-Amz-Credential=AKIA...&X-Amz-Signature=..." -> "23.mp3"
 */
export function fileNameFromUrl(value, fallback = 'file') {
  const clean = stripQuery(value);
  if (typeof clean !== 'string') return fallback;
  const base = clean.split('/').pop();
  return base || fallback;
}

/**
 * Defensive pass over a persisted voice-history array: strip any query string
 * from `name` and drop known URL-bearing fields, so pre-existing entries saved
 * before this safeguard (or any future field) can't leak credentials on load.
 */
export function sanitizeHistoryEntries(entries) {
  if (!Array.isArray(entries)) return entries;
  return entries.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const cleaned = { ...entry };
    if (typeof cleaned.name === 'string') {
      cleaned.name = stripQuery(cleaned.name);
    }
    // Never keep a signed URL around, whatever field it landed in.
    for (const key of ['audioUrl', 'downloadUrl', 'audio_url', 'download_url', 'url']) {
      if (looksLikeSignedUrl(cleaned[key])) delete cleaned[key];
    }
    return cleaned;
  });
}
