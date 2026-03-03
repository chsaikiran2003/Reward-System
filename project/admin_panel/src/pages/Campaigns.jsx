import { useEffect, useState, useRef } from 'react'
import api, { UPLOAD_BASE } from '../services/api'
import toast from 'react-hot-toast'

const s = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  btn: (variant = 'primary') => ({
    padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: variant === 'primary' ? '#7c3aed' : variant === 'danger' ? '#ef4444' : variant === 'success' ? '#10b981' : '#e5e7eb',
    color: variant === 'ghost' ? '#374151' : '#fff',
  }),
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  td: { padding: '12px 16px', fontSize: 13, color: '#374151', borderBottom: '1px solid #f9fafb' },
  badge: (status) => ({
    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: status === 'active' ? '#dcfce7' : status === 'scheduled' ? '#dbeafe' : '#f3f4f6',
    color: status === 'active' ? '#16a34a' : status === 'scheduled' ? '#1d4ed8' : '#6b7280',
  }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox: { background: '#fff', borderRadius: 16, padding: 32, width: 600, maxHeight: '90vh', overflow: 'auto' },
  formGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' },
  row: { display: 'flex', gap: 12 },
  imgThumb: { width: 60, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' },
  actions: { display: 'flex', gap: 8 },
}

const emptyForm = {
  name: '', description: '', status: 'scheduled',
  schedule: { startDate: '', endDate: '' },
  frequencyCap: 5,
  locationTargets: [],
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [uploadFor, setUploadFor] = useState(null) // campaign id for image upload
  const fileRef = useRef()

  const load = () => api.get('/campaigns').then(r => setCampaigns(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true) }
  const openEdit = (c) => {
    setEditing(c._id)
    setForm({
      name: c.name, description: c.description || '', status: c.status,
      schedule: {
        startDate: c.schedule?.startDate?.slice(0, 16) || '',
        endDate: c.schedule?.endDate?.slice(0, 16) || '',
      },
      frequencyCap: c.frequencyCap || 5,
      locationTargets: c.locationTargets || [],
    })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/campaigns/${editing}`, form)
        toast.success('Campaign updated')
      } else {
        await api.post('/campaigns', form)
        toast.success('Campaign created')
      }
      setModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving campaign')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await api.delete(`/campaigns/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const handleImageUpload = async (campaignId, files) => {
    const fd = new FormData()
    for (const f of files) fd.append('images', f)
    setUploading(true)
    try {
      await api.post(`/campaigns/${campaignId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Images uploaded')
      load()
    } catch { toast.error('Upload failed') }
    finally { setUploading(false) }
  }

  return (
    <div>
      <div style={s.toolbar}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ad Campaigns</h1>
        <button style={s.btn()} onClick={openCreate}>+ New Campaign</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            {['Name', 'Status', 'Schedule', 'Freq Cap', 'Images', 'Actions'].map(h => (
              <th key={h} style={s.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {campaigns.length === 0 && (
            <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#9ca3af' }}>No campaigns yet. Create one!</td></tr>
          )}
          {campaigns.map(c => (
            <tr key={c._id}>
              <td style={s.td}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.description}</div>
              </td>
              <td style={s.td}><span style={s.badge(c.status)}>{c.status}</span></td>
              <td style={s.td}>
                <div style={{ fontSize: 11 }}>{c.schedule?.startDate ? new Date(c.schedule.startDate).toLocaleDateString() : '—'}</div>
                <div style={{ fontSize: 11 }}>→ {c.schedule?.endDate ? new Date(c.schedule.endDate).toLocaleDateString() : '—'}</div>
              </td>
              <td style={s.td}>{c.frequencyCap}×</td>
              <td style={s.td}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                  {(c.images || []).slice(0, 3).map(img => (
                    <img key={img._id} src={img.url} alt="" style={s.imgThumb} />
                  ))}
                  {c.images?.length > 3 && <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>+{c.images.length - 3}</span>}
                </div>
                <label style={{ ...s.btn('ghost'), fontSize: 11, padding: '4px 8px', cursor: 'pointer', display: 'inline-block' }}>
                  {uploading ? '…' : '📤 Upload'}
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={e => handleImageUpload(c._id, e.target.files)} />
                </label>
              </td>
              <td style={s.td}>
                <div style={s.actions}>
                  <button style={s.btn('ghost')} onClick={() => openEdit(c)}>Edit</button>
                  <button style={s.btn('danger')} onClick={() => handleDelete(c._id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              {editing ? 'Edit Campaign' : 'New Campaign'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={s.formGroup}>
                <label style={s.label}>Campaign Name *</label>
                <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Description</label>
                <input style={s.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ ...s.row, ...s.formGroup }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Start Date *</label>
                  <input style={s.input} type="datetime-local" value={form.schedule.startDate}
                    onChange={e => setForm({ ...form, schedule: { ...form.schedule, startDate: e.target.value } })} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>End Date *</label>
                  <input style={s.input} type="datetime-local" value={form.schedule.endDate}
                    onChange={e => setForm({ ...form, schedule: { ...form.schedule, endDate: e.target.value } })} required />
                </div>
              </div>
              <div style={{ ...s.row, ...s.formGroup }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Frequency Cap (per user)</label>
                  <input style={s.input} type="number" min={1} value={form.frequencyCap}
                    onChange={e => setForm({ ...form, frequencyCap: parseInt(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Status</label>
                  <select style={s.input} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" style={s.btn('ghost')} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" style={s.btn()}>Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
