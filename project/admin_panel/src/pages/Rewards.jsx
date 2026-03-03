import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const s = {
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', padding: 4, borderRadius: 10, width: 'fit-content' },
  tab: (active) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: active ? '#fff' : 'transparent', color: active ? '#7c3aed' : '#6b7280',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
  }),
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f9fafb' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', borderRadius: 16, padding: 32, width: 480, maxHeight: '90vh', overflow: 'auto' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' },
  g: { marginBottom: 16 },
  btn: (v = 'primary') => ({
    padding: '9px 18px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: v === 'primary' ? '#7c3aed' : v === 'danger' ? '#ef4444' : '#e5e7eb',
    color: v === 'ghost' ? '#374151' : '#fff',
  }),
  warning: { background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, fontSize: 13, color: '#92400e', marginBottom: 16 },
  colorDot: (color) => ({ width: 20, height: 20, borderRadius: '50%', background: color, display: 'inline-block', border: '1px solid #e5e7eb' }),
  toggle: (on) => ({
    width: 36, height: 20, borderRadius: 10, background: on ? '#7c3aed' : '#d1d5db',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: 'none',
  }),
}

const empty = { label: '', icon: '🎁', probabilityWeight: 10, color: '#7c3aed', enabled: true, value: 0 }

export default function Rewards() {
  const [gameType, setGameType] = useState('scratch_card')
  const [rewards, setRewards] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = () => api.get(`/rewards?gameType=${gameType}`).then(r => setRewards(r.data))
  useEffect(() => { load() }, [gameType])

  const totalWeight = rewards.filter(r => r.enabled).reduce((s, r) => s + r.probabilityWeight, 0)

  const openCreate = () => { setEditing(null); setForm({ ...empty, gameType }); setModal(true) }
  const openEdit = (r) => { setEditing(r._id); setForm({ ...r }); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/rewards/${editing}`, form)
        toast.success('Reward updated')
      } else {
        await api.post('/rewards', { ...form, gameType })
        toast.success('Reward created')
      }
      setModal(false); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    }
  }

  const handleToggle = async (r) => {
    try {
      await api.put(`/rewards/${r._id}`, { ...r, enabled: !r.enabled })
      load()
    } catch { toast.error('Toggle failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete reward?')) return
    try { await api.delete(`/rewards/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Reward Configuration</h1>
        <button style={s.btn()} onClick={openCreate}>+ Add Reward</button>
      </div>

      <div style={s.tabs}>
        <button style={s.tab(gameType === 'scratch_card')} onClick={() => setGameType('scratch_card')}>🃏 Scratch Card</button>
        <button style={s.tab(gameType === 'spin_wheel')} onClick={() => setGameType('spin_wheel')}>🎡 Spin Wheel</button>
      </div>

      {Math.abs(totalWeight - 100) > 0.01 && rewards.length > 0 && (
        <div style={s.warning}>
          ⚠️ Total enabled probability weight is <b>{totalWeight}%</b> (should be exactly 100%). Please adjust the weights.
        </div>
      )}

      <table style={s.table}>
        <thead>
          <tr>
            {['Reward', 'Weight', 'Value (₹)', 'Color', 'Enabled', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rewards.length === 0 && <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: '#9ca3af' }}>No rewards configured</td></tr>}
          {rewards.map(r => (
            <tr key={r._id}>
              <td style={s.td}><span style={{ marginRight: 8 }}>{r.icon}</span>{r.label}</td>
              <td style={s.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, height: 8, width: 80 }}>
                    <div style={{ background: '#7c3aed', height: '100%', borderRadius: 4, width: `${r.probabilityWeight}%` }} />
                  </div>
                  <span>{r.probabilityWeight}%</span>
                </div>
              </td>
              <td style={s.td}>₹{r.value}</td>
              <td style={s.td}><span style={s.colorDot(r.color)} title={r.color} /></td>
              <td style={s.td}>
                <button style={s.toggle(r.enabled)} onClick={() => handleToggle(r)}>
                  <span style={{ position: 'absolute', top: 2, left: r.enabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </button>
              </td>
              <td style={s.td}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn('ghost')} onClick={() => openEdit(r)}>Edit</button>
                  <button style={s.btn('danger')} onClick={() => handleDelete(r._id)}>Del</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={s.modal}>
          <div style={s.box}>
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>{editing ? 'Edit Reward' : 'New Reward'}</h2>
            <form onSubmit={handleSave}>
              <div style={s.g}><label style={s.label}>Label *</label><input style={s.input} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: 12, ...s.g }}>
                <div style={{ flex: 1 }}><label style={s.label}>Icon (emoji)</label><input style={s.input} value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
                <div style={{ flex: 1 }}><label style={s.label}>Value (₹)</label><input style={s.input} type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) })} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, ...s.g }}>
                <div style={{ flex: 1 }}><label style={s.label}>Probability Weight (0–100)</label><input style={s.input} type="number" min={0} max={100} value={form.probabilityWeight} onChange={e => setForm({ ...form, probabilityWeight: parseInt(e.target.value) })} /></div>
                <div style={{ flex: 1 }}><label style={s.label}>Segment Color</label><input style={s.input} type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
              </div>
              <div style={s.g}>
                <label style={s.label}><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} style={{ marginRight: 8 }} />Enabled</label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" style={s.btn('ghost')} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" style={s.btn()}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
