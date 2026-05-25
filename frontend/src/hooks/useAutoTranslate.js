import { useState, useEffect } from 'react'
import { translateText } from '../utils/translate'
import { useLang } from '../context/LanguageContext'

/**
 * Hook that auto-translates English text to Hindi when:
 * 1. Language is set to Hindi AND
 * 2. No pre-filled Hindi text is provided by the admin
 *
 * @param {string} englishText    - The original English text
 * @param {string} prefilledHindi - Admin-provided Hindi text (if any)
 * @returns {string} The text to display
 */
export function useAutoTranslate(englishText, prefilledHindi) {
  const { lang } = useLang()
  const [text, setText] = useState(() => {
    if (lang === 'hi' && prefilledHindi) return prefilledHindi
    return englishText || ''
  })

  useEffect(() => {
    // English mode — just show English
    if (lang !== 'hi') {
      setText(englishText || '')
      return
    }

    // Hindi mode + admin provided Hindi — use it
    if (prefilledHindi) {
      setText(prefilledHindi)
      return
    }

    // Hindi mode + no admin Hindi — auto-translate
    if (!englishText || englishText.trim().length === 0) {
      setText('')
      return
    }

    let cancelled = false
    translateText(englishText, 'en', 'hi').then(result => {
      if (!cancelled) setText(result)
    })

    return () => { cancelled = true }
  }, [englishText, prefilledHindi, lang])

  return text
}
