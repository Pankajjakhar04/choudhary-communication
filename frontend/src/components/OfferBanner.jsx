import React, { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAutoTranslate } from '../hooks/useAutoTranslate'
import { formatDate } from '../utils/helpers'

export default function OfferBanner({ offer }) {
  const { lang } = useLang()
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const title = useAutoTranslate(offer.title, offer.titleHindi)
  const description = useAutoTranslate(offer.description, offer.descriptionHindi)
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const start = formatDate(offer.startDate, locale)
  const end = formatDate(offer.endDate, locale)
  const range = start && end ? `${start} - ${end}` : (start || end || '')

  // If offer has an image, show a richer card
  if (offer.imageUrl) {
    return (
      <div className="min-w-[260px] max-w-[320px] rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-white border">
        <img
          src={offer.imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsImageModalOpen(true)}
        />
        <div className="p-3" style={{ borderTop: `3px solid ${offer.bgColor || '#7C3AED'}` }}>
          <div className="font-semibold text-sm">{title}</div>
          {range ? <div className="text-xs text-muted mt-0.5">{range}</div> : null}
          {description ? <div className="text-xs text-muted mt-1 line-clamp-2">{description}</div> : null}
        </div>


        {/* Image Modal */}
        {isImageModalOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <div className="relative max-w-4xl w-full max-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ position: 'fixed' }}>
              <button 
                className="absolute -top-12 right-0 md:-right-8 text-white hover:text-gray-300 text-4xl font-light p-2"
                onClick={() => setIsImageModalOpen(false)}
              >
                &times;
              </button>
              <img 
                src={offer.imageUrl} 
                alt={title} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback: color banner (original style)
  return (
    <div className="min-w-[220px] rounded-xl p-4 text-white shadow-sm flex-shrink-0" style={{ background: offer.bgColor || '#7C3AED' }}>
      <div className="font-semibold">{title}</div>
      {range ? <div className="text-xs opacity-90 mt-1">{range}</div> : null}
      {description ? <div className="text-sm mt-2">{description}</div> : null}
    </div>
  )
}
