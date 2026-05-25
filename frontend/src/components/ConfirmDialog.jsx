import React from 'react'
import { useLang } from '../context/LanguageContext'

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText, cancelText }){
  const { t } = useLang()
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-lg">{title || t('confirmDelete')}</h3>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg px-4 py-2.5 text-sm" onClick={onCancel}>{cancelText || t('no')}</button>
          <button className="rounded-lg px-4 py-2.5 bg-danger text-white text-sm" onClick={onConfirm}>{confirmText || t('yes')}</button>
        </div>
      </div>
    </div>
  )
}
