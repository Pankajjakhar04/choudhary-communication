import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getServices, addService, updateService, deleteService } from '../api/api'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'

export default function AdminServices({ onChanged, createSignal }) {
  const { t } = useLang()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  const toggleActive = async (service) => {
    setToggling(service._id)
    try {
      const res = await updateService(service._id, { isActive: !service.isActive })
      setServices(prev => prev.map(s => s._id === service._id ? res.data : s))
    } catch {
      toast.error(t('error'))
    } finally {
      setToggling(null)
    }
  }
  const [form, setForm] = useState({ name: '', nameHindi: '', icon: '🔧', isActive: true })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const createRef = useRef(createSignal)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getServices()
      const data = Array.isArray(res.data) ? res.data : []
      setServices(data)
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
    setForm({ name: '', nameHindi: '', icon: '🔧', isActive: true })
    setOpen(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, nameHindi: s.nameHindi || '', icon: s.icon || '🔧', isActive: s.isActive })
    setOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const res = await updateService(editing._id, form)
        // Update in local state immediately
        setServices(prev => prev.map(s => s._id === editing._id ? res.data : s))
        toast.success(t('updated'))
      } else {
        const res = await addService(form)
        // Add to local state immediately
        setServices(prev => {
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
      await deleteService(id)
      // ✅ Immediately remove from local state — no re-fetch needed
      setServices(prev => {
        const next = prev.filter(s => s._id !== id)
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
        <h2 className="font-semibold">{t('manageServices')}</h2>
        <button
          className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium"
          onClick={openCreate}
        >
          + {t('addService')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted">
          <span className="animate-spin">⏳</span> {t('loading')}
        </div>
      ) : services.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">No services yet. Add your first service!</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-muted border-b">
                  <th className="pb-2 pr-4">{t('serviceIcon')}</th>
                  <th className="pb-2 pr-4">{t('serviceName')}</th>
                  <th className="pb-2 pr-4">{t('activeStatus')}</th>
                  <th className="pb-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s._id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-2xl">{s.icon}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium">{s.name}</div>
                      {s.nameHindi ? <div className="text-xs text-muted">{s.nameHindi}</div> : null}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(s)}
                        disabled={toggling === s._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          s.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          s.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}>
                          {toggling === s._id && (
                            <span className="block h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                          )}
                        </span>
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        className="mr-3 text-sm text-primary font-medium hover:underline"
                        onClick={() => openEdit(s)}
                      >
                        {t('edit')}
                      </button>
                      <button
                        className="text-sm text-danger font-medium hover:underline disabled:opacity-40"
                        disabled={deleting === s._id}
                        onClick={() => setConfirm({ open: true, id: s._id })}
                      >
                        {deleting === s._id ? '...' : t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {services.map(s => (
              <div key={s._id} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl flex-shrink-0 w-10 text-center">{s.icon}</div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      {s.nameHindi ? <div className="text-xs text-muted truncate">{s.nameHindi}</div> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(s)}
                    disabled={toggling === s._id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ml-2 ${
                      s.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      s.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}>
                      {toggling === s._id && (
                        <span className="block h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                      )}
                    </span>
                  </button>
                </div>
                <div className="mt-3 flex gap-0 border-t pt-2">
                  <button
                    className="flex-1 text-sm text-center py-2 text-primary font-medium active:bg-blue-50 rounded-l-lg"
                    onClick={() => openEdit(s)}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    className="flex-1 text-sm text-center py-2 text-danger font-medium active:bg-red-50 rounded-r-lg disabled:opacity-40"
                    disabled={deleting === s._id}
                    onClick={() => setConfirm({ open: true, id: s._id })}
                  >
                    {deleting === s._id ? '...' : `🗑️ ${t('delete')}`}
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
              <h3 className="font-semibold text-lg">{editing ? t('edit') : t('addService')}</h3>
              <button onClick={() => setOpen(false)} className="text-2xl text-muted leading-none">&times;</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('serviceName')} *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                  placeholder="e.g. Mobile Repair"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('serviceNameHi')}</label>
                <input
                  value={form.nameHindi}
                  onChange={e => setForm({ ...form, nameHindi: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                  placeholder="e.g. मोबाइल मरम्मत"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('serviceIcon')}</label>
                <input
                  list="service-icons"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                  placeholder="Paste an emoji"
                />
                <datalist id="service-icons">
                  {['🔧','💳','📡','🔌','📱','🛠️','🎧','💡','🔋','📞','💰','🖨️','📷','🔑','⚡'].map(e => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
                <p className="text-xs text-muted mt-1">Click the field and pick an emoji, or type/paste any emoji</p>
              </div>
              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="svc-active"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="svc-active" className="text-sm font-medium">{t('activeStatus')}</label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2.5 text-sm border"
                  onClick={() => setOpen(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg px-5 py-2.5 bg-primary text-white text-sm font-medium disabled:opacity-50"
                >
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
        message="This service will be permanently removed."
        onConfirm={() => onDelete(confirm.id)}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  )
}
