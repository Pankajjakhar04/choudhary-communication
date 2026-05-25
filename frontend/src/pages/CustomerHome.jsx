import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { getItems, getOffers, getServices, getSettings } from '../api/api'
import ItemCard from '../components/ItemCard'
import SkeletonCard from '../components/SkeletonCard'
import OfferBanner from '../components/OfferBanner'
import ServiceCard from '../components/ServiceCard'
import { useLang } from '../context/LanguageContext'
import { useAutoTranslate } from '../hooks/useAutoTranslate'
import { whatsappLink } from '../utils/helpers'

/* ─── Splash / Welcome Screen ─── */
function SplashScreen({ shopName, fading }) {
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-700 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 40%, #7c3aed 100%)' }}
    >
      <div className="flex flex-col items-center px-6 text-center">
        {/* Animated logo circle */}
        <div className="relative mb-6">
          {/* Rotating ring */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-white/20 border-t-white animate-spin"
            style={{ width: 96, height: 96 }}
          />
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <span className="text-white text-3xl font-bold tracking-tight">CC</span>
          </div>
        </div>

        {/* Shop name with fade-in */}
        <h1
          className="text-white text-2xl sm:text-3xl font-bold tracking-tight animate-fade-in"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          {shopName}
        </h1>

        {/* Tagline */}
        <p
          className="text-blue-100 text-sm mt-2 animate-fade-in"
          style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
        >
          Your one-stop shop for mobiles &amp; accessories
        </p>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/80 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CustomerHome() {
  const { t, lang } = useLang()
  const [items, setItems] = useState(null)
  const [offers, setOffers] = useState(null)
  const [services, setServices] = useState(null)
  const [settings, setSettings] = useState(null)

  // Splash state
  const [splashVisible, setSplashVisible] = useState(true)
  const [splashFading, setSplashFading] = useState(false)

  useEffect(() => {
    const p1 = getItems().then(r => setItems(r.data)).catch(() => setItems([]))
    const p2 = getOffers().then(r => setOffers(r.data)).catch(() => setOffers([]))
    const p3 = getServices().then(r => setServices(r.data)).catch(() => setServices([]))
    const p4 = getSettings().then(r => setSettings(r.data)).catch(() => setSettings({}))

    // Wait for ALL data, then fade out splash
    Promise.all([p1, p2, p3, p4]).then(() => {
      // Minimum 1.2s splash to avoid flicker on fast connections
      setTimeout(() => {
        setSplashFading(true)
        // Remove splash from DOM after fade animation
        setTimeout(() => setSplashVisible(false), 700)
      }, 1200)
    })
  }, [])

  // Derive contact info from settings (with env var fallbacks)
  const shopName = (lang === 'hi' && settings?.shopNameHindi) || settings?.shopName || import.meta.env.VITE_SHOP_NAME || 'Choudhary Communications'
  const whatsappNumber = settings?.whatsapp || import.meta.env.VITE_SHOP_WHATSAPP || import.meta.env.VITE_SHOP_PHONE || ''
  const phoneNumber = settings?.phone || import.meta.env.VITE_SHOP_PHONE || ''
  const address = (lang === 'hi' && settings?.addressHindi) || settings?.address || import.meta.env.VITE_SHOP_ADDRESS || ''
  const mapsLink = settings?.googleMapsLink || ''
  const timings = (lang === 'hi' && settings?.shopTimingsHindi) || settings?.shopTimings || ''

  const rawAnnouncement = settings?.announcementText || ''
  const rawAnnouncementHi = settings?.announcementTextHindi || ''
  const announcementText = useAutoTranslate(rawAnnouncement, rawAnnouncementHi)
  const showAnnouncement = settings?.showAnnouncement && announcementText

  const whatsappHref = whatsappLink(whatsappNumber)
  const callHref = phoneNumber ? `tel:${phoneNumber}` : ''
  const displayNumber = (value) => value || ''

  const allLoaded = items !== null && offers !== null && services !== null && settings !== null

  return (
    <div className="min-h-screen">
      {/* Splash screen */}
      {splashVisible && (
        <SplashScreen shopName={shopName} fading={splashFading} />
      )}

      <Navbar shopName={shopName} />
      
      {showAnnouncement && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 text-center text-sm sm:text-base font-medium shadow-md">
          <span className="text-lg mr-2 inline-block animate-bounce">📢</span>
          {announcementText}
        </div>
      )}

      <main className="max-w-5xl mx-auto p-4">
        <section className="bg-gradient-to-r from-primary/90 to-blue-400 text-white rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-semibold">{t('welcome')}</h1>
          <p className="mt-2">{t('welcomeSubtitle') || ''}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <a className="bg-success text-white px-4 py-2 rounded-lg min-h-[56px] flex items-center justify-center" href={whatsappHref || '#'}>{t('whatsappUs')}</a>
            <a className="bg-white text-dark px-4 py-2 rounded-lg min-h-[56px] flex items-center justify-center" href={callHref || '#'}>{t('callUs')}</a>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">{t('specialOffers')}</h2>
          <div className="flex gap-3 overflow-x-auto md:flex-wrap md:overflow-visible pb-2">
            {offers === null || offers.length === 0 ? (
              allLoaded ? <div className="text-muted">{t('noOffers')}</div> : null
            ) : (
              offers.map(off => <OfferBanner key={off._id} offer={off} />)
            )}
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">{t('featuredItems')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items === null ? [1, 2, 3].map(i => <SkeletonCard key={i} />) : items.map(it => <ItemCard key={it._id} item={it} whatsappNumber={whatsappNumber} />)}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-semibold mb-3">{t('ourServices')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {(services || []).map(s => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        </section>

        {/* Contact & Info section */}
        <section className="mt-8">
          <h2 className="font-semibold mb-3">{t('contactUs')}</h2>
          <div className="grid gap-3">
            <a className="bg-success text-white rounded-lg min-h-[56px] px-4 py-3 flex items-center justify-between" href={whatsappHref || '#'}>
              <span>🟢 {t('whatsappUs')}</span>
              <span className="text-sm">{displayNumber(whatsappNumber)}</span>
            </a>
            <a className="bg-white border rounded-lg min-h-[56px] px-4 py-3 flex items-center justify-between" href={callHref || '#'}>
              <span>📞 {t('callUs')}</span>
              <span className="text-sm text-muted">{displayNumber(phoneNumber)}</span>
            </a>
            {timings && (
              <div className="bg-white border rounded-lg min-h-[56px] px-4 py-3 flex items-center justify-between">
                <span>🕐 {lang === 'hi' ? 'समय' : 'Timings'}</span>
                <span className="text-sm text-muted">{timings}</span>
              </div>
            )}
            {address && (
              <div className="bg-white border rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <span>📍 {lang === 'hi' ? 'पता' : 'Address'}</span>
                  {mapsLink && (
                    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary font-medium">
                      View Map →
                    </a>
                  )}
                </div>
                <div className="text-sm text-muted mt-1">{address}</div>
              </div>
            )}
          </div>
        </section>
      </main>
      <footer className="mt-10 border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-muted flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>© {new Date().getFullYear()} {shopName}</div>
          <div className="flex flex-wrap items-center gap-2">
            {address ? <span>{address}</span> : null}
            {address && (whatsappHref || callHref) ? <span>|</span> : null}
            {whatsappHref ? <a className="text-primary" href={whatsappHref}>{t('whatsappUs')}</a> : null}
            {whatsappHref && callHref ? <span>|</span> : null}
            {callHref ? <a className="text-primary" href={callHref}>{t('callUs')}</a> : null}
          </div>
        </div>
      </footer>
    </div>
  )
}
