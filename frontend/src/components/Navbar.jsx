import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

export default function Navbar({ shopName }){
  const { t, toggleLang, lang } = useLang()
  const [logoError, setLogoError] = useState(false)
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoError ? (
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">CC</div>
          ) : (
            <img src="/logo.png" alt="logo" className="w-10 h-10 rounded-full" onError={() => setLogoError(true)} />
          )}
          <div className="font-semibold text-base leading-tight">
            <span className="hidden sm:inline">{shopName || t('shopName')}</span>
            <span className="sm:hidden">{shopName ? shopName.split(' ')[0] : 'Choudhary'} Comm.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 border rounded text-sm font-medium"
          >
            {lang === 'en' ? 'हि' : 'EN'}
          </button>
          <Link
            to="/admin/login"
            className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded text-sm font-medium"
          >
            <span>🔐</span>
            <span className="hidden sm:inline">{t('adminPanel')}</span>
            <span className="sm:hidden">Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
