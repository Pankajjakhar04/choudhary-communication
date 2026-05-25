import React, { useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { useAutoTranslate } from '../hooks/useAutoTranslate'
import { formatPrice, whatsappLink } from '../utils/helpers'

export default function ItemCard({ item, whatsappNumber }) {
  const { lang, t } = useLang()
  const [expanded, setExpanded] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const name = useAutoTranslate(item.name, item.nameHindi)
  const desc = useAutoTranslate(item.description, item.descriptionHindi)
  const inStock = item.stock > 0
  const waNumber = whatsappNumber || import.meta.env.VITE_SHOP_WHATSAPP || import.meta.env.VITE_SHOP_PHONE || ''
  const message = `Hello! I'm interested in ${name} priced at ${formatPrice(item.price)}. Is it available?`
  const waHref = whatsappLink(waNumber, message)
  const priceLabel = formatPrice(item.price)

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
      {/* Product image — responsive aspect ratio */}
      <div className="relative">
        <img
          loading="lazy"
          src={item.imageUrl}
          alt={name}
          className="w-full aspect-[4/3] object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsImageModalOpen(true)}
        />
        {/* Stock badge overlay */}
        <span
          className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
            inStock
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {inStock ? t('inStock') : t('outOfStock')}
        </span>
      </div>

      {/* Info section */}
      <div className="p-3 flex flex-col flex-1">
        <div className="font-medium text-sm leading-snug line-clamp-2">{name}</div>
        <div className="text-primary font-semibold mt-1">{priceLabel}</div>

        {/* Description — show if exists */}
        {desc ? (
          <div className="mt-1.5">
            <p
              className={`text-xs text-muted leading-relaxed ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {desc}
            </p>
            {desc.length > 60 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary font-medium mt-0.5"
              >
                {expanded ? '▲ Less' : '▼ More'}
              </button>
            )}
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <a
            className="block text-center text-sm bg-primary text-white rounded-lg px-3 py-2.5 font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
            href={waHref || '#'}
          >
            💬 {t('whatsappUs')}
          </a>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl w-full max-h-screen flex flex-col items-center justify-center animate-fade-in">
            <button 
              className="absolute -top-12 right-0 md:-right-8 text-white hover:text-gray-300 text-4xl font-light p-2"
              onClick={() => setIsImageModalOpen(false)}
            >
              &times;
            </button>
            <img 
              src={item.imageUrl} 
              alt={name} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
