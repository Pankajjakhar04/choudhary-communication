import React from 'react'
import { useLang } from '../context/LanguageContext'
import { useAutoTranslate } from '../hooks/useAutoTranslate'

export default function ServiceCard({ service }){
  const { lang } = useLang()
  const name = useAutoTranslate(service.name, service.nameHindi)
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
      <div className="text-2xl">{service.icon}</div>
      <div className="mt-2 text-sm font-medium">{name}</div>
    </div>
  )
}
