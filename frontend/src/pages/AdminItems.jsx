import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getItems, addItem, updateItem, deleteItem } from '../api/api'
import ConfirmDialog from '../components/ConfirmDialog'
import ImageUpload from '../components/ImageUpload'
import toast from 'react-hot-toast'
import { useLang } from '../context/LanguageContext'
import { formatPrice } from '../utils/helpers'

export default function AdminItems({ onChanged, createSignal }) {
  const { t, lang } = useLang()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  const toggleActive = async (item) => {
    const newVal = !item.isAvailable
    setToggling(item._id)
    try {
      const res = await updateItem(item._id, { isAvailable: newVal })
      setItems(prev => prev.map(it => it._id === item._id ? res.data : it))
    } catch {
      toast.error(t('error'))
    } finally {
      setToggling(null)
    }
  }
  const [form, setForm] = useState({
    name: '',
    nameHindi: '',
    price: '',
    stock: '',
    category: 'Mobile',
    description: '',
    descriptionHindi: '',
    isAvailable: true,
  })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const createRef = useRef(createSignal)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getItems()
      const data = Array.isArray(res.data) ? res.data : []
      setItems(data)
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
    setForm({
      name: '',
      nameHindi: '',
      price: '',
      stock: '',
      category: 'Mobile',
      description: '',
      descriptionHindi: '',
      isAvailable: true,
    })
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFile(null)
    setForm({
      name: item.name,
      nameHindi: item.nameHindi || '',
      price: String(item.price),
      stock: String(item.stock),
      category: item.category || 'Mobile',
      description: item.description || '',
      descriptionHindi: item.descriptionHindi || '',
      isAvailable: item.isAvailable !== false,
    })
    setOpen(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        let res
        if (file) {
          // Image changed — send as FormData so backend can upload to Cloudinary
          const fd = new FormData()
          fd.append('name', form.name)
          fd.append('nameHindi', form.nameHindi)
          fd.append('price', form.price)
          fd.append('stock', form.stock)
          fd.append('category', form.category)
          fd.append('description', form.description)
          fd.append('descriptionHindi', form.descriptionHindi)
          fd.append('isAvailable', String(form.isAvailable))
          fd.append('image', file)
          res = await updateItem(editing._id, fd)
        } else {
          // No image change — send JSON
          res = await updateItem(editing._id, {
            name: form.name,
            nameHindi: form.nameHindi,
            price: Number(form.price),
            stock: Number(form.stock),
            category: form.category,
            description: form.description,
            descriptionHindi: form.descriptionHindi,
            isAvailable: form.isAvailable,
          })
        }
        // Update in local state immediately
        setItems(prev => prev.map(it => it._id === editing._id ? res.data : it))
        toast.success(t('updated'))
      } else {
        if (!file) {
          toast.error(t('uploadImage'))
          setSaving(false)
          return
        }
        const fd = new FormData()
        fd.append('name', form.name)
        fd.append('nameHindi', form.nameHindi)
        fd.append('price', form.price)
        fd.append('stock', form.stock)
        fd.append('category', form.category)
        fd.append('description', form.description)
        fd.append('descriptionHindi', form.descriptionHindi)
        fd.append('image', file)
        const res = await addItem(fd)
        // Add to local state immediately
        setItems(prev => {
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
      await deleteItem(id)
      // ✅ Immediately remove from local state
      setItems(prev => {
        const next = prev.filter(it => it._id !== id)
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

  const categories = ['Mobile', 'Accessory', 'Charger', 'Earphone', 'Cover', 'Cable', 'Other']

  return (
    <div className="bg-white rounded shadow-sm p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{t('manageItems')}</h2>
        <button
          className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium"
          onClick={openCreate}
        >
          + {t('addItem')}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-muted">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted py-8 text-center">No items yet. Add your first product!</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2">Image</th>
                  <th className="pb-2">{t('productName')}</th>
                  <th className="pb-2">{t('price')}</th>
                  <th className="pb-2">{t('stock')}</th>
                  <th className="pb-2">{t('category')}</th>
                  <th className="pb-2">{t('activeStatus')}</th>
                  <th className="pb-2">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id} className="border-t">
                    <td className="py-3">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    </td>
                    <td>
                      <div className="font-medium">{item.name}</div>
                      {item.nameHindi ? <div className="text-xs text-muted">{item.nameHindi}</div> : null}
                    </td>
                    <td>{formatPrice(item.price)}</td>
                    <td>{item.stock}</td>
                    <td>
                      <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">{item.category}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        disabled={toggling === item._id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          item.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        >
                          {toggling === item._id && (
                            <span className="block h-3 w-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                          )}
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="mr-3 text-sm text-primary font-medium hover:underline" onClick={() => openEdit(item)}>{t('edit')}</button>
                      <button
                        className="text-sm text-danger font-medium hover:underline disabled:opacity-40"
                        disabled={deleting === item._id}
                        onClick={() => setConfirm({ open: true, id: item._id })}
                      >
                        {deleting === item._id ? '...' : t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map(item => (
              <div key={item._id} className="border rounded-lg p-3">
                <div className="flex gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    {item.nameHindi ? <div className="text-xs text-muted truncate">{item.nameHindi}</div> : null}
                    <div className="text-sm text-primary font-medium mt-0.5">{formatPrice(item.price)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">{item.category}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${item.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {item.stock > 0 ? `${t('inStock')} (${item.stock})` : t('outOfStock')}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleActive(item)}
                        disabled={toggling === item._id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ml-auto flex-shrink-0 ${
                          item.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            item.isAvailable ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        >
                          {toggling === item._id && (
                            <span className="block h-2.5 w-2.5 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-0 border-t pt-2">
                  <button
                    className="flex-1 text-sm text-center py-2 text-primary font-medium active:bg-blue-50 rounded-l-lg"
                    onClick={() => openEdit(item)}
                  >
                    ✏️ {t('edit')}
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    className="flex-1 text-sm text-center py-2 text-danger font-medium active:bg-red-50 rounded-r-lg disabled:opacity-40"
                    disabled={deleting === item._id}
                    onClick={() => setConfirm({ open: true, id: item._id })}
                  >
                    {deleting === item._id ? '...' : `🗑️ ${t('delete')}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create/Edit modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold mb-3">{editing ? t('edit') : t('addItem')}</h3>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm">{t('productName')}</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                />
              </div>
              <div>
                <label className="block text-sm">{t('productNameHi')}</label>
                <input
                  value={form.nameHindi}
                  onChange={e => setForm({ ...form, nameHindi: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm">{t('price')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="border rounded-lg w-full px-3 py-2.5 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm">{t('stock')}</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="border rounded-lg w-full px-3 py-2.5 text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm">{t('category')}</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base bg-white"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">{t('description')}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm">{t('descriptionHi')}</label>
                <textarea
                  value={form.descriptionHindi}
                  onChange={e => setForm({ ...form, descriptionHindi: e.target.value })}
                  className="border rounded-lg w-full px-3 py-2.5 text-base"
                  rows={2}
                />
              </div>

              {/* Image section — show in BOTH create and edit modes */}
              <div>
                {editing && !file && editing.imageUrl && (
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Current Image</label>
                    <img
                      src={editing.imageUrl}
                      alt={editing.name}
                      className="w-24 h-24 rounded-lg object-cover border"
                    />
                    <p className="text-xs text-muted mt-1">Choose a new image below to replace it</p>
                  </div>
                )}
                <ImageUpload
                  file={file}
                  setFile={setFile}
                  label={editing ? 'Update Product Image (Optional)' : t('uploadImage')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={e => setForm({ ...form, isAvailable: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>{t('activeStatus')}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2.5 text-sm"
                  onClick={() => setOpen(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg px-4 py-2.5 bg-primary text-white text-sm disabled:opacity-50"
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
        message={t('confirmDelete')}
        onConfirm={() => onDelete(confirm.id)}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  )
}
