import { useEffect, useState } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  card: { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' },
  g: { marginBottom: 18 },
  btn: { padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  toggle: (on) => ({
    width: 44, height: 24, borderRadius: 12, background: on ? '#7c3aed' : '#d1d5db',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: 'none',
  }),
  knob: (on) => ({ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }),
}

const DEFAULT = { maxPlaysPerDay: 3, cooldownMinutes: 60, enabled: true }

export default function GameSettingsPage() {
  const [settings, setSettings] = useState({ scratch_card: { ...DEFAULT }, spin_wheel: { ...DEFAULT } })

  useEffect(() => {
    api.get('/game/settings').then(r => {
      const map = {}
      r.data.forEach(s => { map[s.gameType] = s })
      setSettings(prev => ({
        scratch_card: map.scratch_card || prev.scratch_card,
        spin_wheel: map.spin_wheel || prev.spin_wheel,
      }))
    }).catch(() => {})
  }, [])

  const handleSave = async (gameType) => {
    try {
      await api.put(`/game/settings/${gameType}`, settings[gameType])
      toast.success(`${gameType === 'scratch_card' ? 'Scratch Card' : 'Spin Wheel'} settings saved`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const update = (gameType, field, value) => {
    setSettings(prev => ({ ...prev, [gameType]: { ...prev[gameType], [field]: value } }))
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Game Settings</h1>
      <div style={s.grid}>
        {['scratch_card', 'spin_wheel'].map(gt => {
          const cfg = settings[gt]
          const title = gt === 'scratch_card' ? '🃏 Scratch Card' : '🎡 Spin Wheel'
          return (
            <div key={gt} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h2>
                <button style={s.toggle(cfg.enabled)} onClick={() => update(gt, 'enabled', !cfg.enabled)}>
                  <span style={s.knob(cfg.enabled)} />
                </button>
              </div>
              <div style={s.g}>
                <label style={s.label}>Max Plays Per Day</label>
                <input style={s.input} type="number" min={1} value={cfg.maxPlaysPerDay}
                  onChange={e => update(gt, 'maxPlaysPerDay', parseInt(e.target.value))} />
              </div>
              <div style={s.g}>
                <label style={s.label}>Cooldown Period (minutes)</label>
                <input style={s.input} type="number" min={0} value={cfg.cooldownMinutes}
                  onChange={e => update(gt, 'cooldownMinutes', parseInt(e.target.value))} />
              </div>
              <button style={s.btn} onClick={() => handleSave(gt)}>Save Settings</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
