import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getGroups, addGroup, updateGroup, deleteGroup, getItems, getOffers, getServices, getSettings } from '../api/api'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/helpers'

export default function AdminCustomers({ onChanged, createSignal }) {
  const [groups, setGroups] = useState([])
  const [items, setItems] = useState([])
  const [offers, setOffers] = useState([])
  const [services, setServices] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  // Group Form state
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [form, setForm] = useState({ name: '', inviteLink: '', description: '' })
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const createRef = useRef(createSignal)

  // Message Composer state
  const [msgType, setMsgType] = useState('custom') // 'custom', 'offer', 'item'
  const [msgLang, setMsgLang] = useState('en') // 'en', 'hi'
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedOffer, setSelectedOffer] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [customMsg, setCustomMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gRes, iRes, oRes, sRes, setRes] = await Promise.all([
        getGroups().catch(() => ({ data: [] })),
        getItems().catch(() => ({ data: [] })),
        getOffers().catch(() => ({ data: [] })),
        getServices().catch(() => ({ data: [] })),
        getSettings().catch(() => ({ data: {} }))
      ])
      
      const gData = Array.isArray(gRes.data) ? gRes.data : []
      setGroups(gData)
      setItems(Array.isArray(iRes.data) ? iRes.data.filter(i => i.isAvailable) : [])
      setOffers(Array.isArray(oRes.data) ? oRes.data.filter(o => o.isActive) : [])
      setServices(Array.isArray(sRes.data) ? sRes.data : [])
      setSettings(setRes.data || {})
      
      if (onChanged) onChanged(gData.length)
    } catch (e) {
      toast.error('Failed to load data')
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
    setForm({ name: '', inviteLink: '', description: '' })
    setOpen(true)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({ name: g.name, inviteLink: g.inviteLink || '', description: g.description || '' })
    setOpen(true)
  }

  const submitGroup = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const res = await updateGroup(editing._id, form)
        setGroups(prev => prev.map(g => g._id === editing._id ? res.data : g))
        toast.success('Group updated')
      } else {
        const res = await addGroup(form)
        setGroups(prev => {
          const next = [res.data, ...prev]
          if (onChanged) onChanged(next.length)
          return next
        })
        toast.success('Group created')
      }
      setOpen(false)
    } catch (e) {
      toast.error('Failed to save group')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteGroup(id)
      setGroups(prev => {
        const next = prev.filter(g => g._id !== id)
        if (onChanged) onChanged(next.length)
        return next
      })
      setConfirm({ open: false, id: null })
      toast.success('Group deleted')
    } catch (e) {
      toast.error('Failed to delete group')
      setConfirm({ open: false, id: null })
    } finally {
      setDeleting(null)
    }
  }

  // Generate Message
  const generatedMessage = React.useMemo(() => {
    let baseMsg = ''

    if (msgType === 'custom') {
      baseMsg = customMsg
    } else if (msgType === 'overall') {
      if (msgLang === 'hi') {
        baseMsg = `नमस्कार! 🙏 चौधरी कम्युनिकेशंस में आपका स्वागत है।\n\n`;
        if (settings.showAnnouncement && settings.announcementTextHindi) {
          baseMsg += `📢 *घोषणा:* ${settings.announcementTextHindi}\n\n`;
        }
        if (offers.length > 0) {
          baseMsg += `🎉 *आज के खास ऑफर्स:*\n`;
          offers.forEach(o => baseMsg += `• ${o.titleHindi || o.title}\n`);
          baseMsg += `\n`;
        }
        baseMsg += `यहाँ हम आपको बेहतरीन सेवाएं और प्रोडक्ट्स प्रदान करते हैं:\n\n`;
        if (items.length > 0) {
          baseMsg += `*📱 हमारे प्रमुख प्रोडक्ट्स:*\n`;
          items.slice(0, 5).forEach(i => baseMsg += `• ${i.nameHindi || i.name} - मात्र ${formatPrice(i.price)}\n`);
          baseMsg += `\n`;
        }
        if (services.length > 0) {
          baseMsg += `*🔧 हमारी सेवाएं:*\n`;
          services.slice(0, 5).forEach(s => baseMsg += `• ${s.nameHindi || s.name}\n`);
          baseMsg += `\n`;
        }
      } else {
        baseMsg = `Hello! 🙏 Welcome to Choudhary Communications.\n\n`;
        if (settings.showAnnouncement && settings.announcementText) {
          baseMsg += `📢 *Announcement:* ${settings.announcementText}\n\n`;
        }
        if (offers.length > 0) {
          baseMsg += `🎉 *Today's Special Offers:*\n`;
          offers.forEach(o => baseMsg += `• ${o.title}\n`);
          baseMsg += `\n`;
        }
        baseMsg += `We offer the best services and products for you:\n\n`;
        if (items.length > 0) {
          baseMsg += `*📱 Top Products:*\n`;
          items.slice(0, 5).forEach(i => baseMsg += `• ${i.name} - Just ${formatPrice(i.price)}\n`);
          baseMsg += `\n`;
        }
        if (services.length > 0) {
          baseMsg += `*🔧 Our Services:*\n`;
          services.slice(0, 5).forEach(s => baseMsg += `• ${s.name}\n`);
          baseMsg += `\n`;
        }
      }
    } else if (msgType === 'item' && selectedItem) {
      const it = items.find(i => i._id === selectedItem)
      if (it) {
        if (msgLang === 'hi') {
          baseMsg = `नमस्ते ग्राहकों! 👋\n\n🚀 नया प्रोडक्ट उपलब्ध है: *${it.nameHindi || it.name}*\n💰 कीमत: मात्र ${formatPrice(it.price)}\n\n${it.descriptionHindi || it.description || ''}`
        } else {
          baseMsg = `Hello everyone! 👋\n\n🚀 New Arrival: *${it.name}*\n💰 Price: Just ${formatPrice(it.price)}\n\n${it.description || ''}`
        }
      }
    } else if (msgType === 'offer' && selectedOffer) {
      const off = offers.find(o => o._id === selectedOffer)
      if (off) {
        if (msgLang === 'hi') {
          baseMsg = `🎉 शानदार ऑफर! 🎉\n\n*${off.titleHindi || off.title}*\n${off.descriptionHindi || off.description || ''}\n\nयह ऑफर सीमित समय के लिए है। जल्दी आएं!`
        } else {
          baseMsg = `🎉 Special Offer! 🎉\n\n*${off.title}*\n${off.description || ''}\n\nHurry, this offer is valid for a limited time only!`
        }
      }
    } else if (msgType === 'service' && selectedService) {
      const s = services.find(x => x._id === selectedService)
      if (s) {
        if (msgLang === 'hi') {
          baseMsg = `नमस्ते ग्राहकों! 👋\n\n🔧 हमारी बेहतरीन सर्विस: *${s.nameHindi || s.name}*\n${s.descriptionHindi || s.description || ''}`
        } else {
          baseMsg = `Hello everyone! 👋\n\n🔧 Professional Service: *${s.name}*\n${s.description || ''}`
        }
      }
    }

    if (!baseMsg.trim()) return ''

    // Dynamically append address and phone footer
    const phone = settings.phone || settings.whatsapp || import.meta.env.VITE_SHOP_PHONE || ''
    const address = msgLang === 'hi' 
      ? (settings.addressHindi || settings.address || '') 
      : (settings.address || '')
    const website = settings.websiteUrl || 'https://choudhary-communication.vercel.app'
    
    let footer = '\n\n'
    if (msgLang === 'hi') {
      if (website) footer += `🌐 *अधिक जानकारी के लिए:* ${website}\n`
      if (address) footer += `📍 *हमारा पता:* ${address}\n`
      if (phone) footer += `📞 *संपर्क करें:* ${phone}\n`
      footer += `- चौधरी कम्युनिकेशंस`
    } else {
      if (website) footer += `🌐 *For more info, visit:* ${website}\n`
      if (address) footer += `📍 *Our Address:* ${address}\n`
      if (phone) footer += `📞 *Contact Us:* ${phone}\n`
      footer += `- Choudhary Communications`
    }

    return baseMsg + footer
  }, [msgType, msgLang, selectedItem, selectedOffer, selectedService, customMsg, items, offers, services, settings])

  const handleSendWhatsApp = () => {
    if (!generatedMessage.trim()) {
      toast.error('Please generate a message first')
      return
    }
    
    // Copy to clipboard fallback
    navigator.clipboard.writeText(generatedMessage).catch(() => {})
    
    // Open WhatsApp URL scheme
    const text = encodeURIComponent(generatedMessage)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
    toast.success('Message copied & opening WhatsApp!')
  }

  return (
    <div className="space-y-6 mt-4">
      {/* SECTION 1: Message Composer */}
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <span>💬</span> Message Composer
        </h2>
        <p className="text-sm text-muted mb-6">Create professional promotional messages to share in your WhatsApp groups.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border ${msgLang === 'en' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-700'}`}
                onClick={() => setMsgLang('en')}
              >English</button>
              <button 
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border ${msgLang === 'hi' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-700'}`}
                onClick={() => setMsgLang('hi')}
              >Hindi (हिन्दी)</button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">What do you want to promote?</label>
              <select 
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={msgType}
                onChange={(e) => setMsgType(e.target.value)}
              >
                <option value="custom">✍️ Custom Message</option>
                <option value="overall">🏪 Overall Shop Info</option>
                <option value="offer">🎉 Active Offer</option>
                <option value="item">📦 Specific Product</option>
                <option value="service">🔧 Our Service</option>
              </select>
            </div>

            {msgType === 'item' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  <option value="">-- Choose a product --</option>
                  {items.map(it => <option key={it._id} value={it._id}>{it.name} - {formatPrice(it.price)}</option>)}
                </select>
              </div>
            )}

            {msgType === 'offer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Offer</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={selectedOffer}
                  onChange={(e) => setSelectedOffer(e.target.value)}
                >
                  <option value="">-- Choose an offer --</option>
                  {offers.map(off => <option key={off._id} value={off._id}>{off.title}</option>)}
                </select>
              </div>
            )}

            {msgType === 'service' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Service</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="">-- Choose a service --</option>
                  {services.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {msgType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Message</label>
                <textarea 
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  rows={4}
                  placeholder="Type your message here..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Preview & Action */}
          <div className="bg-gray-50 border rounded-xl p-4 flex flex-col">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Message Preview</h3>
            <div className="bg-[#E1F6CB] rounded-lg p-3 text-sm text-gray-800 whitespace-pre-wrap shadow-sm border border-[#D1E6BB] flex-1">
              {generatedMessage || <span className="text-gray-400 italic">Configure your message to see the preview...</span>}
            </div>
            
            <button
              onClick={handleSendWhatsApp}
              disabled={!generatedMessage.trim()}
              className="mt-4 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Copy & Open WhatsApp
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2 leading-tight">
              Standard web browsers cannot automatically send messages to specific groups. Clicking this will open WhatsApp, allowing you to manually select the group to paste the message.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Manage Groups List */}
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Saved Groups</h2>
          <button className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium" onClick={openCreate}>
            + Add Group
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-muted py-4">⏳ Loading...</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-muted py-8 text-center bg-gray-50 rounded-lg border border-dashed">No WhatsApp groups saved yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g._id} className="border rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-dark">{g.name}</h3>
                    {g.description && <p className="text-xs text-muted mt-1">{g.description}</p>}
                  </div>
                  <span className="text-2xl opacity-80">👥</span>
                </div>
                
                {g.inviteLink && (
                  <a href={g.inviteLink} target="_blank" rel="noreferrer" className="text-xs text-primary mt-3 hover:underline inline-flex items-center gap-1">
                    🔗 Group Invite Link
                  </a>
                )}

                <div className="mt-4 pt-3 border-t flex gap-3">
                  <button className="text-sm text-primary font-medium hover:underline flex-1 text-left" onClick={() => openEdit(g)}>Edit</button>
                  <button 
                    className="text-sm text-danger font-medium hover:underline disabled:opacity-40"
                    disabled={deleting === g._id}
                    onClick={() => setConfirm({ open: true, id: g._id })}
                  >
                    {deleting === g._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Group' : 'Add WhatsApp Group'}</h3>
              <button onClick={() => setOpen(false)} className="text-2xl text-muted leading-none">&times;</button>
            </div>
            <form onSubmit={submitGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Group Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" placeholder="e.g. VIP Customers" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invite Link (Optional)</label>
                <input value={form.inviteLink} onChange={e => setForm({ ...form, inviteLink: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" placeholder="https://chat.whatsapp.com/..." />
                <p className="text-xs text-muted mt-1">Save the invite link so you can easily share it to add new customers to the group.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="border rounded-lg w-full px-3 py-2.5 text-base" rows={2} placeholder="For top regular buyers..." />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" className="rounded-lg px-4 py-2.5 text-sm border" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 bg-primary text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete Group"
        message="Are you sure you want to remove this group from the list?"
        onConfirm={() => onDelete(confirm.id)}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </div>
  )
}
