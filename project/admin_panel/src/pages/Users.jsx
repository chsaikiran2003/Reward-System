import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const s = {
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f9fafb' },
  badge: (role) => ({
    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: role === 'admin' ? '#fef3c7' : '#dbeafe',
    color: role === 'admin' ? '#92400e' : '#1d4ed8',
  }),
  btn: (v = 'primary') => ({
    padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    background: v === 'primary' ? '#7c3aed' : '#e5e7eb', color: v === 'ghost' ? '#374151' : '#fff',
  }),
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  box: { background: '#fff', borderRadius: 16, padding: 32, width: 420 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [modal, setModal] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'observer' })

  const load = () => api.get('/users').then(r => setUsers(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/auth/register', newUser)
      toast.success('User created')
      setModal(false)
      setNewUser({ email: '', password: '', role: 'observer' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error')
    }
  }

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'observer' : 'admin'
    try {
      await api.put(`/users/${user._id}/role`, { role: newRole })
      toast.success(`Role updated to ${newRole}`)
      load()
    } catch { toast.error('Update failed') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Users</h1>
        <button style={s.btn()} onClick={() => setModal(true)}>+ Add User</button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>{['Email', 'Role', 'Created', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td style={s.td}>{u.email}</td>
              <td style={s.td}><span style={s.badge(u.role)}>{u.role}</span></td>
              <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td style={s.td}><button style={s.btn('ghost')} onClick={() => toggleRole(u)}>Toggle Role</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <div style={s.modal}>
          <div style={s.box}>
            <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Add Admin User</h2>
            <form onSubmit={handleCreate}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
              <label style={s.label}>Role</label>
              <select style={s.input} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="admin">Admin (full access)</option>
                <option value="observer">Observer (analytics only)</option>
              </select>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" style={s.btn('ghost')} onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" style={s.btn()}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
