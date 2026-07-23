# Chat — Bug Fixes & Error Handling

Summary of fixes applied to [src/views/Chat.jsx](src/views/Chat.jsx) and
[src/services/api.js](src/services/api.js).

## 1. Usage / rate limit now disables the chat

**Before:** Hitting a usage limit just painted another error bubble; the composer
stayed active, so the user could keep firing requests that all failed.

**After:**
- `isLimitError()` classifies limit failures (HTTP `429` or messages containing
  `limit`, `quota`, `exceeded`, `too many requests`, `insufficient`, `rate limit`).
- `chatCompletion()` now attaches `err.status` so `429` is detectable.
- On a limit error the UI sets `limitReached`, which:
  - shows a red banner above the composer,
  - disables the textarea, send button, and mic button,
  - blocks `handleSubmit`,
  - changes the placeholder to "Usage limit reached".

## 2. Errors shown in plain language (no raw JSON)

**Before:** The error bubble printed `Error: <raw backend message>`, which was
often a raw JSON string or `[object Object]`.

**After:**
- `friendlyError()` maps any thrown error to a short human message:
  - limit → "You've reached your usage limit…"
  - network/fetch failure → "Couldn't reach the AI service…"
  - anything else → "Something went wrong while generating a response…"
- Two leak sources hardened:
  - SSE `obj.error` is normalized to a string (object → `message`/`detail`/JSON).
  - `chatCompletion()` unwraps object/array error payloads (incl. FastAPI
    `detail` arrays) instead of stringifying them.

## 3. Empty AI bubble left behind on Stop

**Before:** Pressing **Stop** before any token arrived returned early and left
the empty `{ role:'assistant', content:'' }` placeholder on screen as a blank
AI bubble.

**After:** On abort with no streamed content, the empty placeholder is removed.

## 4. Empty AI bubble on an empty model response

**Before:** If the stream finished (`[DONE]`) with no content, the blank
placeholder stayed forever.

**After:** The empty placeholder is removed and a "No response was generated"
warning toast is shown.

## 5. Error bubble written into the wrong conversation

**Before:** The catch block wrote the error bubble at `assistantMsgIndex`
without checking whether the user had switched conversations mid-stream — so an
error could be painted into a different conversation's message list.

**After:** The error write is skipped when `gen !== chatGenRef.current`
(the stream's generation no longer matches the active conversation).

## Files changed
- [src/views/Chat.jsx](src/views/Chat.jsx) — `isLimitError`, `friendlyError`,
  `limitReached` state + banner, composer disabling, placeholder cleanup,
  generation guard, normalized SSE error throw.
- [src/services/api.js](src/services/api.js) — `chatCompletion` attaches
  `err.status` and unwraps object/array error payloads.
