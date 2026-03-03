// GameAnalytics.jsx
import { useEffect, useState } from 'react'
import { Bar, Pie } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import api from '../services/api'
import { useSocket } from '../contexts/SocketContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  stat: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  chartCard: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#f3f4f6', padding: 4, borderRadius: 10, width: 'fit-content' },
  tab: (active) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: active ? '#fff' : 'transparent', color: active ? '#7c3aed' : '#6b7280',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
  }),
}

export function GameAnalytics() {
  const [gameType, setGameType] = useState('scratch_card')
  const [stats, setStats] = useState(null)
  const { socket } = useSocket()

  const load = () => api.get(`/analytics/games/${gameType}`).then(r => setStats(r.data)).catch(() => {})
  useEffect(() => { load() }, [gameType])

  useEffect(() => {
    if (!socket) return
    const h = (data) => {
      if (data.gameType === gameType) {
        setStats(prev => prev ? { ...prev, totalPlays: prev.totalPlays + 1 } : prev)
      }
    }
    socket.on('game_analytics_update', h)
    return () => socket.off('game_analytics_update', h)
  }, [socket, gameType])

  const barData = {
    labels: (stats?.rewardDistribution || []).map(r => r.label),
    datasets: [{ label: 'Times Won', data: (stats?.rewardDistribution || []).map(r => r.count), backgroundColor: '#a78bfa', borderRadius: 6 }],
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Game Analytics</h1>
      </div>
      <div style={s.tabs}>
        <button style={s.tab(gameType === 'scratch_card')} onClick={() => setGameType('scratch_card')}>🃏 Scratch Card</button>
        <button style={s.tab(gameType === 'spin_wheel')} onClick={() => setGameType('spin_wheel')}>🎡 Spin Wheel</button>
      </div>
      {stats && <>
        <div style={s.grid}>
          {[
            { label: 'Total Plays', value: stats.totalPlays },
            { label: 'Unique Players', value: stats.uniquePlayers },
            { label: 'Revenue Exposure', value: `₹${stats.revenueExposure?.toLocaleString()}` },
          ].map(m => (
            <div key={m.label} style={s.card}>
              <div style={s.stat}>{m.value ?? 0}</div>
              <div style={s.statLabel}>{m.label}</div>
            </div>
          ))}
        </div>
        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Reward Distribution</h3>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
        </div>
      </>}
    </div>
  )
}

export default GameAnalytics
