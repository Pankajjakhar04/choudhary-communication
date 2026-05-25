import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getOffers, addOffer, updateOffer, deleteOffer } from '../api/api'
import ConfirmDialog from '../components/ConfirmDialog'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'
import { formatDate } from '../utils/helpers'

export default function AdminOffers({ onChanged, createSignal }) {
  const { t, lang } = useLang()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [viewImage, setViewImage] = useState(null)

  const toggleActive = async (offer) => {
    setToggling(offer._id)
    try {
      const res = await updateOffer(offer._id, { isActive: !offer.isActive })
      setOffers(prev => prev.map(o => o._id === offer._id ? res.data : o))
    } catch {
      toast.error(t('error'))
    } finally {
      setToggling(null)
    }
  }
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    title: '', titleHindi: '', description: '', descriptionHindi: '',
    startDate: '', endDate: '', bgColor: '#7C3AED', isActive: true,
  })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const createRef = useRef(createSignal)

  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN'
  const formatDisplayDate = (value) => formatDate(value, locale) || '-'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getOffers()
      const data = Array.isArray(res.data) ? res.data : []
      setOffers(data)
      if (onChanged) onChanged(data.length)
    } catch (e) {
      toast.error(t('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { load() }, []) // eslint-disable-line

  useEffect(() => {
    if (createSignal === undefined) return
    if (createRef.current === createSignal) return
    createRef.current = createSignal
    openCreate()
  }, [createSignal])

  const openCreate = () => {
    setEditing(null)
    setFile(null)
    setForm({ title: '', titleHindi: '', description: '', descriptionHindi: '', startDate: '', endDate: '', bgColor: '#7C3AED', isActive: true })
    setOpen(true)
  }

  const openEdit = (o) => {
    setEditing(o)
    setFile(null)
    setForm({
      title: o.title, titleHindi: o.titleHindi || '',
      description: o.description || '', descriptionHindi: o.descriptionHindi || '',
      startDate: o.startDate ? o.startDate.substring(0, 10) : '',
      endDate: o.endDate ? o.endDate.substring(0, 10) : '',
      bgColor: o.bgColor || '#7C3AED', isActive: o.isActive,
    })
    setOpen(true)
  }

  // Build FormData from form state + optional image file
  const buildFormData = () => {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('titleHindi', form.titleHindi)
    fd.append('description', form.description)
    fd.append('descriptionHindi', form.descriptionHindi)
    fd.append('startDate', form.startDate)
    fd.append('endDate', form.endDate)
    fd.append('bgColor', form.bgColor)
    fd.append('isActive', String(form.isActive))
    if (file) fd.append('image', file)
    return fd
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        let res
        if (file) {
          res = await updateOffer(editing._id, buildFormData())
        } else {
          res = await updateOffer(editing._id, form)
        }
        setOffers(prev => prev.map(o => o._id === editing._id ? res.data : o))
        toast.success(t('updated'))
      } else {
        let res
        if (file) {
          res = await addOffer(buildFormData())
        } else {
          res = await addOffer(form)
        }
        setOffers(prev => {
          const next = [res.data, ...prev]
          if (onChanged) onChanged(next.length)
          return next
        })
        toast.success(t('created'))
      }
      setOpen(false)
    } catch (e) {
      toast.error(t('error'))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteOffer(id)
      setOffers(prev => {
        const next = prev.filter(o => o._id !== id)
        if (onChanged) onChanged(next.length)
        return next
      })
      setConfirm({ open: false, id: null })
      toast.success(t('deleted'))
    } catch (e) {
      toast.error(t('deleteFailed'))
      setConfirm({ open: false, id: null })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded shadow-sm p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{t('manageOffers')}</h2>
        <button className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium" onClick={openCreate}>
          + {t('addOffer')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <span className="animate-spin">⏳</span> {t('loading')}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">{t('noOffers')}</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-muted border-b">
                  <th className="pb-2 pr-4">Image</th>
                  <th className="pb-2 pr-4">{t('offerTitle')}</th>
                  <th className="pb-2 pr-4">{t('startDate')}</th>
                  <th className="pb-2 pr-4">{t('endDate')}</th>
                  <th className="pb-2 pr-4">{t('activeStatus')}</th>
                  <th className="pb-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(o => (
                  <tr key={o._id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      {o.imageUrl ? (
                        <img 
                          src={o.imageUrl} 
                          alt={o.title} 
                          className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => setViewImage(o.imageUrl)}
                        />
                      ) : (
                        <span className="inline-block w-3 h-3 rounded-full" style={{ background: o.bgColor || '#7C3AED' }} />
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{o.title}</div>
                      {o.titleHindi ? <div className="text-xs text-muted">{o.titleHindi}</div> : null}
                    </td>
                    <td className="py-3 pr-4">{formatDisplayDate(o.startDate)}</td>
                    <td className="py-3 pr-4">{formatDisplayDate(o.endDate)}</td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(o)}
                        disabled={toggling === o._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          o.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          o.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}>
                          {toggling === o._id && (
                            <span className="block h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="py-3">
                      <button className="mr-3 text-sm text-primary font-medium hover:underline" onClick={() => openEdit(o)}>{t('edit')}</button>
                      <button
                        className="text-sm text-danger font-medium hover:underline disabled:opacity-40"
                        disabled={deleting === o._id}
                        onClick={() => setConfirm({ open: true, id: o._id })}
                      >
                        {deleting === o._id ? '...' : t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {offers.map(o => (
              <div key={o._id} className="border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {o.imageUrl ? (
                      <img 
                        src={o.imageUrl} 
                        alt={o.title} 
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => setViewImage(o.imageUrl)}
                      />
                    ) : (
                      <span className="inline-block w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ background: o.bgColor || '#7C3AED' }} />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{o.title}</div>
                      {o.titleHindi ? <div className="text-xs text-muted truncate">{o.titleHindi}</div> : null}
                      <div className="text-xs text-muted mt-1">
                        {formatDisplayDate(o.startDate)} – {formatDisplayDate(o.endDate)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(o)}
                    disabled={toggling === o._id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                      o.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      o.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}>
                      {toggling === o._id && (
                        <span className="block h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                      )}
                    </span>
                  </button>
                </div>
                <div className="mt-3 flex gap-0 border-t pt-2">
                  <button className="flex-1 text-sm text-center py-2 text-primary font-medium active:bg-blue-50 rounded-l-lg" onClick={() => openEdit(o)}>
                    ✏️ {t('edit')}
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    className="flex-1 text-sm text-center py-2 text-danger font-medium active:bg-red-50 rounded-r-lg disabled:opacity-40"
                    disabled={deleting === o._id}
                    onClick={() => setConfirm({ open: true, id: o._id })}
                  >
                    {deleting === o._id ? '...' : `🗑️ ${t('delete')}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? t('edit') : t('addOffer')}</h3>
              <button onClick={() => setOpen(false)} className="text-2xl text-muted leading-none">&times;</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('offerTitle')} *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('offerTitleHi')}</label>
                <input value={form.titleHindi} onChange={e => setForm({ ...form, titleHindi: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('description')}</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('descriptionHi')}</label>
                <textarea value={form.descriptionHindi} onChange={e => setForm({ ...form, descriptionHindi: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" rows={2} />
              </div>

              {/* Image upload section */}
              <div>
                {editing && !file && editing.imageUrl && (
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Current Image</label>
                    <img src={editing.imageUrl} alt={editing.title} className="w-24 h-24 rounded-lg object-cover border" />
                    <p className="text-xs text-muted mt-1">Choose a new image below to replace it</p>
                  </div>
                )}
                <ImageUpload
                  file={file}
                  setFile={setFile}
                  label={editing ? 'Update Offer Image (Optional)' : 'Offer Image (Optional)'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('startDate')}</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('endDate')}</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('bannerColor')}</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="h-10 w-14 cursor-pointer rounded" />
                  <span className="text-sm text-muted">{form.bgColor}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input type="checkbox" id="offer-active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 rounded" />
                <label htmlFor="offer-active" className="text-sm font-medium">{t('activeStatus')}</label>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" className="rounded-lg px-4 py-2.5 text-sm border" onClick={() => setOpen(false)}>{t('cancel')}</button>
                <button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 bg-primary text-white text-sm font-medium disabled:opacity-50">
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title={t('confirmDelete')}
        message="This offer will be permanently removed."
        onConfirm={() => onDelete(confirm.id)}
        onCancel={() => setConfirm({ open: false, id: null })}
      />

      {/* Image Modal */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ position: 'fixed' }}>
            <button 
              className="absolute -top-12 right-0 md:-right-8 text-white hover:text-gray-300 text-4xl font-light p-2"
              onClick={() => setViewImage(null)}
            >
              &times;
            </button>
            <img 
              src={viewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
