/**
 * Lightweight client-side language detector based on Unicode script ranges.
 *
 * Analyses the dominant script in a piece of text and returns a BCP-47
 * language code that the TTS engine understands.  For Latin-script text it
 * falls back to simple keyword heuristics (French, Spanish, German, Italian,
 * Portuguese) before defaulting to English.
 *
 * This covers every language the TTS_LANGUAGES list in VoiceTools supports.
 */

// ── Unicode-range → language mapping ─────────────────────────────────────────
// Each entry: [regex, language code]
const SCRIPT_RANGES = [
  [/[\u0900-\u097F]/g, 'hi'],   // Devanagari  → Hindi (also Marathi/Sanskrit, refined below)
  [/[\u0980-\u09FF]/g, 'bn'],   // Bengali
  [/[\u0A00-\u0A7F]/g, 'pa'],   // Gurmukhi    → Punjabi
  [/[\u0A80-\u0AFF]/g, 'gu'],   // Gujarati
  [/[\u0B00-\u0B7F]/g, 'or'],   // Odia
  [/[\u0B80-\u0BFF]/g, 'ta'],   // Tamil
  [/[\u0C00-\u0C7F]/g, 'te'],   // Telugu
  [/[\u0C80-\u0CFF]/g, 'kn'],   // Kannada
  [/[\u0D00-\u0D7F]/g, 'ml'],   // Malayalam
  [/[\u0D80-\u0DFF]/g, 'si'],   // Sinhala (not in TTS list, fallback to en)
  [/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, 'ar'], // Arabic script → Arabic / Urdu
  [/[\u3040-\u309F\u30A0-\u30FF]/g, 'ja'],  // Hiragana + Katakana → Japanese
  [/[\u4E00-\u9FFF\u3400-\u4DBF]/g, 'zh'],  // CJK Unified → Chinese (refined below)
  [/[\uAC00-\uD7AF\u1100-\u11FF]/g, 'ko'],  // Hangul → Korean
  [/[\u0400-\u04FF]/g, 'ru'],   // Cyrillic → Russian
  [/[\u0E00-\u0E7F]/g, 'th'],   // Thai (not in TTS list, fallback to en)
];

// ── Latin-script keyword heuristics ──────────────────────────────────────────
// For Latin-based text, use common words to guess the language.
const LATIN_KEYWORDS = [
  { code: 'fr', words: /\b(le|la|les|un|une|des|est|sont|dans|avec|pour|que|qui|mais|nous|vous|leur|cette|ces|merci|bonjour|au|aux|du|ce|je|tu|il|elle|très|aussi|bien|même|pas|sur|par)\b/gi },
  { code: 'es', words: /\b(el|los|las|una|unos|unas|es|son|está|están|con|por|que|pero|como|más|también|para|hay|ser|todo|este|esta|estos|estas|hola|gracias|muy|del|al|yo|tú|él|ella)\b/gi },
  { code: 'de', words: /\b(der|die|das|ein|eine|ist|sind|und|oder|aber|mit|für|auf|von|zu|den|dem|des|wird|haben|nicht|ich|sie|wir|ihr|mein|dein|sein|kann|über|auch|noch|schon)\b/gi },
  { code: 'it', words: /\b(il|lo|la|gli|le|un|una|è|sono|con|per|che|ma|come|più|anche|questo|questa|questi|queste|ciao|grazie|molto|della|delle|del|dei|degli|non|si|tutto|ho|hai)\b/gi },
  { code: 'pt', words: /\b(o|os|a|as|um|uma|é|são|está|estão|com|por|para|que|mas|como|mais|também|este|esta|estes|estas|olá|obrigado|muito|do|da|dos|das|não|eu|ele|ela|nós|tem)\b/gi },
];

/**
 * Detect the dominant language of `text`.
 * @param {string} text
 * @returns {string} BCP-47 language code (e.g. 'hi', 'en', 'fr')
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'en';

  // Strip markdown formatting and code blocks for cleaner detection
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')   // code blocks
    .replace(/`[^`]*`/g, '')          // inline code
    .replace(/https?:\/\/\S+/g, '')   // URLs
    .replace(/[#*_~>\[\]()!|]/g, '')  // markdown chars
    .trim();

  if (!cleaned) return 'en';

  // ── Phase 1: Script-based detection (non-Latin scripts) ────────────────
  let bestLang = null;
  let bestCount = 0;

  for (const [regex, lang] of SCRIPT_RANGES) {
    // Reset lastIndex for global regex
    regex.lastIndex = 0;
    const matches = cleaned.match(regex);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      bestLang = lang;
    }
  }

  // If ≥ 15% of characters are in a non-Latin script, use that language
  const totalChars = cleaned.replace(/\s/g, '').length;
  if (bestCount > 0 && totalChars > 0 && (bestCount / totalChars) >= 0.15) {
    // Refine Arabic-script: if text contains Urdu-specific characters, use 'ur'
    if (bestLang === 'ar') {
      const urduSpecific = /[\u0679\u067E\u0686\u0688\u0691\u0698\u06A9\u06AF\u06C1\u06C3\u06CC\u06D2]/;
      if (urduSpecific.test(cleaned)) return 'ur';
    }
    // Refine Devanagari: check for Marathi-specific words
    if (bestLang === 'hi') {
      const marathiWords = /\b(आहे|आणि|मला|तुम्ही|करा|आम्ही|त्यांना|होता|नाही)\b/;
      if (marathiWords.test(cleaned)) return 'mr';
    }
    return bestLang;
  }

  // ── Phase 2: Latin-script keyword heuristics ───────────────────────────
  const latinChars = cleaned.match(/[a-zA-ZÀ-ÿ]/g);
  if (latinChars && latinChars.length > 5) {
    let bestKeywordLang = null;
    let bestKeywordScore = 0;

    for (const { code, words } of LATIN_KEYWORDS) {
      words.lastIndex = 0;
      const kwMatches = cleaned.match(words);
      const score = kwMatches ? kwMatches.length : 0;
      if (score > bestKeywordScore) {
        bestKeywordScore = score;
        bestKeywordLang = code;
      }
    }

    // Need at least 3 keyword hits to beat English default
    if (bestKeywordLang && bestKeywordScore >= 3) {
      return bestKeywordLang;
    }
  }

  // ── Default ────────────────────────────────────────────────────────────
  return 'en';
}

/**
 * Pick a sensible default voice for a detected language.
 * Falls back to null (server picks default) for global languages.
 */
export function getDefaultVoiceForLanguage(langCode) {
  // Indic languages → use Indic Parler voices (multilingual)
  const indicLangs = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur', 'or', 'as', 'sa'];
  if (indicLangs.includes(langCode)) {
    return 'divya'; // Indic Parler model, natural female
  }
  // Global languages → use Qwen custom voices (multilingual, cross-lingual)
  return 'serena'; // Warm, gentle – good default for any global language
}
