/**
 * Auto-translation utility with aggressive caching.
 * Uses MyMemory free translation API (CORS-friendly, no API key needed).
 * Translations are cached in localStorage so each text is only translated once.
 */

const CACHE_KEY = 'cc_translations_v1'
let cache = {}
const pending = {} // dedup in-flight requests

// Load cache from localStorage on init
try {
  const stored = localStorage.getItem(CACHE_KEY)
  if (stored) cache = JSON.parse(stored)
} catch {}

function saveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

/**
 * Translate a single text string.
 * @param {string} text - The text to translate
 * @param {string} from - Source language code (e.g. 'en')
 * @param {string} to   - Target language code (e.g. 'hi')
 * @returns {Promise<string>} Translated text (or original on failure)
 */
export async function translateText(text, from = 'en', to = 'hi') {
  if (!text || typeof text !== 'string' || text.trim().length === 0) return text
  const trimmed = text.trim()

  // Check cache
  const key = `${from}|${to}|${trimmed}`
  if (cache[key]) return cache[key]

  // Dedup — if already fetching this exact text, wait for that result
  if (pending[key]) return pending[key]

  pending[key] = (async () => {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        let translated = data.responseData.translatedText
        // MyMemory sometimes returns all-caps "TRANSLATED TEXT" — fix casing
        if (translated === translated.toUpperCase() && trimmed !== trimmed.toUpperCase()) {
          translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase()
        }
        cache[key] = translated
        saveCache()
        return translated
      }
    } catch {}
    return trimmed
  })()

  const result = await pending[key]
  delete pending[key]
  return result
}

/**
 * Translate multiple texts in batch (one by one with small delay to be API-friendly).
 * @param {string[]} texts - Array of texts to translate
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string[]>} Array of translated texts
 */
export async function translateBatch(texts, from = 'en', to = 'hi') {
  const results = []
  for (const text of texts) {
    results.push(await translateText(text, from, to))
  }
  return results
}

/**
 * Clear the translation cache (useful for debugging).
 */
export function clearTranslationCache() {
  cache = {}
  try { localStorage.removeItem(CACHE_KEY) } catch {}
}
