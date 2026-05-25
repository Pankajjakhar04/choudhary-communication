import React, { useCallback, useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api/api'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'

// ─── Time options ───
const TIMES = []
for (let h = 0; h < 24; h++) {
  for (const m of ['00', '30']) {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const ampm = h < 12 ? 'AM' : 'PM'
    TIMES.push({
      value: `${String(h).padStart(2, '0')}:${m}`,
      label: `${hour12}:${m} ${ampm}`,
    })
  }
}

// ─── Day definitions (English + Hindi) ───
const DAYS = [
  { key: 'Mon', en: 'Mon', hi: 'सोम' },
  { key: 'Tue', en: 'Tue', hi: 'मंगल' },
  { key: 'Wed', en: 'Wed', hi: 'बुध' },
  { key: 'Thu', en: 'Thu', hi: 'गुरु' },
  { key: 'Fri', en: 'Fri', hi: 'शुक्र' },
  { key: 'Sat', en: 'Sat', hi: 'शनि' },
  { key: 'Sun', en: 'Sun', hi: 'रवि' },
]

// ─── Hindi time formatter ───
function toHindiTime(value24) {
  if (!value24) return ''
  const [hStr, mStr] = value24.split(':')
  const h = parseInt(hStr, 10)
  const m = mStr
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  let period = ''
  if (h >= 5 && h < 12)       period = 'सुबह'
  else if (h >= 12 && h < 17) period = 'दोपहर'
  else if (h >= 17 && h < 21) period = 'शाम'
  else                         period = 'रात'
  return `${period} ${hour12}:${m} बजे`
}

// ─── Build readable strings from selections ───
function buildTimingStrings(openTime, closeTime, selectedDays) {
  if (!openTime || !closeTime) return { en: '', hi: '' }

  const openLabel  = TIMES.find(t => t.value === openTime)?.label || openTime
  const closeLabel = TIMES.find(t => t.value === closeTime)?.label || closeTime

  // Build day range string (e.g. "Mon-Sat" or "Mon, Wed, Fri")
  const dayObjs = DAYS.filter(d => selectedDays.includes(d.key))
  let enDays = '', hiDays = ''

  if (dayObjs.length === 7) {
    enDays = 'Every Day'
    hiDays = 'हर दिन'
  } else if (dayObjs.length === 0) {
    enDays = ''
    hiDays = ''
  } else {
    // Check if consecutive
    const indices = dayObjs.map(d => DAYS.indexOf(d))
    const isConsecutive = indices.every((val, i) => i === 0 || val === indices[i - 1] + 1)

    if (isConsecutive && dayObjs.length > 1) {
      enDays = `${dayObjs[0].en}-${dayObjs[dayObjs.length - 1].en}`
      hiDays = `${dayObjs[0].hi}-${dayObjs[dayObjs.length - 1].hi}`
    } else {
      enDays = dayObjs.map(d => d.en).join(', ')
      hiDays = dayObjs.map(d => d.hi).join(', ')
    }
  }

  const en = `${openLabel} - ${closeLabel}${enDays ? ', ' + enDays : ''}`
  const hi = `${toHindiTime(openTime)} - ${toHindiTime(closeTime)}${hiDays ? ', ' + hiDays : ''}`

  return { en, hi }
}

// ─── Parse existing timing string back into components ───
function parseTimingString(timingStr) {
  const result = { openTime: '', closeTime: '', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
  if (!timingStr) return result

  // Try to match pattern like "8:00 AM - 9:00 PM, Mon-Sat"
  const timeMatch = timingStr.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i)
  if (timeMatch) {
    result.openTime = to24h(timeMatch[1].trim())
    result.closeTime = to24h(timeMatch[2].trim())
  }

  // Parse days
  const dayPart = timingStr.replace(/.*[AP]M/i, '').replace(/^[\s,]+/, '').trim()
  if (dayPart) {
    if (/every\s*day/i.test(dayPart)) {
      result.days = DAYS.map(d => d.key)
    } else {
      const rangeMatch = dayPart.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*-\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/i)
      if (rangeMatch) {
        const startIdx = DAYS.findIndex(d => d.en.toLowerCase() === rangeMatch[1].toLowerCase())
        const endIdx = DAYS.findIndex(d => d.en.toLowerCase() === rangeMatch[2].toLowerCase())
        if (startIdx >= 0 && endIdx >= 0) {
          result.days = DAYS.slice(startIdx, endIdx + 1).map(d => d.key)
        }
      } else {
        const mentioned = DAYS.filter(d =>
          dayPart.toLowerCase().includes(d.en.toLowerCase())
        ).map(d => d.key)
        if (mentioned.length > 0) result.days = mentioned
      }
    }
  }

  return result
}

function to24h(time12) {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return ''
  let h = parseInt(match[1], 10)
  const m = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m}`
}

// ─── Non-timing field sections ───
const TEXT_SECTIONS = [
  { section: 'Shop Info', icon: '🏪', fields: [
    { key: 'shopName',      label: 'Shop Name (English)',  placeholder: 'Choudhary Communications' },
    { key: 'shopNameHindi',  label: 'Shop Name (Hindi)',    placeholder: 'चौधरी कम्युनिकेशंस' },
  ]},
  { section: 'Contact', icon: '📞', fields: [
    { key: 'whatsapp',      label: 'WhatsApp Number',      placeholder: '917891753753', hint: 'Country code + number, no spaces' },
    { key: 'phone',          label: 'Phone Number',         placeholder: '7891753753' },
  ]},
  { section: 'Location', icon: '📍', fields: [
    { key: 'address',       label: 'Address (English)',     placeholder: 'Near City Center, Main Road, Jaipur' },
    { key: 'addressHindi',   label: 'Address (Hindi)',       placeholder: 'सिटी सेंटर के पास, मेन रोड, जयपुर' },
    { key: 'googleMapsLink', label: 'Google Maps Link',     placeholder: 'https://www.google.com/maps/...' },
  ]},
]

// ─── Main component ───
export default function AdminSettings() {
  const { t } = useLang()
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Timing-specific state
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('21:00')
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSettings()
      const data = res.data || {}
      setForm(data)

      // Parse existing timing string into structured state
      if (data.shopTimings) {
        const parsed = parseTimingString(data.shopTimings)
        if (parsed.openTime) setOpenTime(parsed.openTime)
        if (parsed.closeTime) setCloseTime(parsed.closeTime)
        if (parsed.days.length > 0) setSelectedDays(parsed.days)
      }
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, []) // eslint-disable-line

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  // Update timing strings whenever time/day selection changes
  const updateTimings = (open, close, days) => {
    const { en, hi } = buildTimingStrings(open, close, days)
    setForm(prev => ({ ...prev, shopTimings: en, shopTimingsHindi: hi }))
    setDirty(true)
  }

  const handleOpenTime = (v) => { setOpenTime(v); updateTimings(v, closeTime, selectedDays) }
  const handleCloseTime = (v) => { setCloseTime(v); updateTimings(openTime, v, selectedDays) }
  const toggleDay = (dayKey) => {
    setSelectedDays(prev => {
      const next = prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
      // Sort by original order
      const sorted = DAYS.filter(d => next.includes(d.key)).map(d => d.key)
      updateTimings(openTime, closeTime, sorted)
      return sorted
    })
  }

  const onSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateSettings(form)
      setForm(res.data)
      setDirty(false)
      toast.success('Settings saved successfully!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mt-4">
        <div className="flex items-center gap-2 text-sm text-muted py-8 justify-center">
          <span className="animate-spin">⏳</span> Loading settings...
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSave} className="mt-4 space-y-4">
      {/* Text-based sections */}
      {TEXT_SECTIONS.map(section => (
        <div key={section.section} className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
            <span className="text-lg">{section.icon}</span>
            <h3 className="font-semibold text-sm text-dark">{section.section}</h3>
          </div>
          <div className="p-4 space-y-4">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  value={form[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="border rounded-lg w-full px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow outline-none"
                />
                {field.hint && (
                  <p className="text-xs text-muted mt-1">{field.hint}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Timings section — structured selects */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <h3 className="font-semibold text-sm text-dark">Timings</h3>
        </div>
        <div className="p-4 space-y-5">
          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
              <select
                value={openTime}
                onChange={e => handleOpenTime(e.target.value)}
                className="border rounded-lg w-full px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {TIMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
              <select
                value={closeTime}
                onChange={e => handleCloseTime(e.target.value)}
                className="border rounded-lg w-full px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                {TIMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Day selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => {
                const active = selectedDays.includes(day.key)
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      active
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {day.en}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-blue-700">Preview:</p>
            <p className="text-sm text-blue-900">{form.shopTimings || 'Select time and days above'}</p>
            <p className="text-sm text-blue-800">{form.shopTimingsHindi || ''}</p>
          </div>
        </div>
      </div>

      {/* Announcement section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
          <span className="text-lg">📢</span>
          <h3 className="font-semibold text-sm text-dark">Store Announcement</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <input 
              type="checkbox" 
              id="show-announcement"
              checked={form.showAnnouncement || false}
              onChange={e => onChange('showAnnouncement', e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="show-announcement" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
              Enable Announcement Banner on Homepage
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Text (English)
            </label>
            <textarea
              value={form.announcementText || ''}
              onChange={e => onChange('announcementText', e.target.value)}
              placeholder="e.g., 🎉 Diwali Mega Sale! Get 20% off on all accessories."
              className="border rounded-lg w-full px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow outline-none"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Text (Hindi)
            </label>
            <textarea
              value={form.announcementTextHindi || ''}
              onChange={e => onChange('announcementTextHindi', e.target.value)}
              placeholder="e.g., 🎉 दिवाली महा सेल! सभी एक्सेसरीज पर 20% की छूट पाएं।"
              className="border rounded-lg w-full px-3 py-2.5 text-base bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow outline-none"
              rows={2}
            />
            <p className="text-xs text-muted mt-1">If left blank, the English text will be auto-translated for Hindi users.</p>
          </div>

          {/* Live Preview */}
          {form.showAnnouncement && (form.announcementText || form.announcementTextHindi) && (
            <div className="mt-4 border rounded-xl overflow-hidden">
              <div className="bg-gray-100 text-xs text-center py-1 font-medium text-gray-500 uppercase tracking-wider">Live Preview</div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 text-center text-sm font-medium shadow-inner flex items-center justify-center gap-2">
                <span className="text-xl">📢</span>
                <span>{form.announcementText || form.announcementTextHindi}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border p-4">
        <div className="text-sm text-muted">
          {dirty ? (
            <span className="text-amber-600 font-medium">⚠️ Unsaved changes</span>
          ) : (
            <span className="text-green-600">✅ All changes saved</span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || !dirty}
          className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          {saving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </form>
  )
}
