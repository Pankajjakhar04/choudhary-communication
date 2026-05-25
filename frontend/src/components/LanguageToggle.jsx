import React from 'react'
import { useLang } from '../context/LanguageContext'

export default function LanguageToggle(){
  const { lang, toggleLang } = useLang()
  return (
    <button onClick={toggleLang} className="px-2 py-1 border rounded">{lang === 'en' ? 'EN' : 'हि'}</button>
  )
}
