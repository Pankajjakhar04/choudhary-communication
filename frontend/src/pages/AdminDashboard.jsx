import React, { useState, useContext, useCallback } from 'react'
import { useLang } from '../context/LanguageContext'
import AuthContext from '../context/AuthContext'
import AdminItems from './AdminItems'
import AdminOffers from './AdminOffers'
import AdminServices from './AdminServices'
import AdminSettings from './AdminSettings'

const TABS = ['items', 'offers', 'services', 'settings']

export default function AdminDashboard() {
  const { t, toggleLang, lang } = useLang()
  const { logout } = useContext(AuthContext)
  const [tab, setTab] = useState('items')
  const [stats, setStats] = useState({ items: 0, offers: 0, services: 0 })
  const [createSignals, setCreateSignals] = useState({ items: 0, offers: 0, services: 0 })

  const handleChanged = useCallback((section, count) => {
    setStats(prev => ({ ...prev, [section]: typeof count === 'number' ? count : prev[section] }))
  }, [])

  const triggerCreate = (section) => {
    setTab(section)
    setTimeout(() => {
      setCreateSignals(prev => ({ ...prev, [section]: (prev[section] || 0) + 1 }))
    }, 50)
  }

  const tabLabel = (key) => {
    switch (key) {
      case 'items':    return t('manageItems')
      case 'offers':   return t('manageOffers')
      case 'services': return t('manageServices')
      case 'settings': return '⚙️ Settings'
      default: return key
    }
  }

  const tabIcon = (key) => {
    switch (key) {
      case 'items':    return '📦'
      case 'offers':   return '🏷️'
      case 'services': return '🔧'
      case 'settings': return '⚙️'
      default: return '📋'
    }
  }

  const statLabel = (key) => {
    switch (key) {
      case 'items':    return t('totalItems')
      case 'offers':   return t('activeOffers')
      case 'services': return t('totalServices')
      default: return key
    }
  }

  const STAT_TABS = ['items', 'offers', 'services']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-semibold text-lg truncate">{t('adminPanel')}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 border rounded text-sm font-medium"
            >
              {lang === 'en' ? 'हि' : 'EN'}
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-danger text-white rounded text-sm font-medium"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        {/* Stats cards — click to switch tab */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {STAT_TABS.map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl p-3 text-center transition-all ${
                tab === key
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white border shadow-sm hover:shadow-md'
              }`}
            >
              <div className="text-xl">{tabIcon(key)}</div>
              <div className="text-2xl font-bold mt-1">{stats[key]}</div>
              <div className={`text-xs mt-0.5 ${tab === key ? 'text-blue-100' : 'text-muted'}`}>
                {statLabel(key)}
              </div>
            </button>
          ))}
        </div>

        {/* Quick add buttons */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted mb-2">{t('quickActions')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerCreate('items')}
              className="flex items-center gap-1.5 bg-white border rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <span>📦</span> {t('addItem')}
            </button>
            <button
              onClick={() => triggerCreate('offers')}
              className="flex items-center gap-1.5 bg-white border rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <span>🏷️</span> {t('addOffer')}
            </button>
            <button
              onClick={() => triggerCreate('services')}
              className="flex items-center gap-1.5 bg-white border rounded-lg px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              <span>🔧</span> {t('addService')}
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b mb-0 overflow-x-auto">
          {TABS.map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 min-w-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-dark'
              }`}
            >
              {tabLabel(key)}
            </button>
          ))}
        </div>

        {/* Tab panels — kept in DOM to preserve state */}
        <div style={{ display: tab === 'items' ? 'block' : 'none' }}>
          <AdminItems
            onChanged={(count) => handleChanged('items', count)}
            createSignal={createSignals.items}
          />
        </div>
        <div style={{ display: tab === 'offers' ? 'block' : 'none' }}>
          <AdminOffers
            onChanged={(count) => handleChanged('offers', count)}
            createSignal={createSignals.offers}
          />
        </div>
        <div style={{ display: tab === 'services' ? 'block' : 'none' }}>
          <AdminServices
            onChanged={(count) => handleChanged('services', count)}
            createSignal={createSignals.services}
          />
        </div>
        <div style={{ display: tab === 'settings' ? 'block' : 'none' }}>
          <AdminSettings />
        </div>
      </div>
    </div>
  )
}
