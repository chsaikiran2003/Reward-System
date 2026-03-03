import { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js'
import api from '../services/api'
import { useSocket } from '../contexts/SocketContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  card: { background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  stat: { fontSize: 28, fontWeight: 700, color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280' },
  chartCard: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 },
  select: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 },
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  liveBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#16a34a' },
}

export default function AdAnalytics() {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState('')
  const [stats, setStats] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const { socket } = useSocket()

  useEffect(() => {
    api.get('/campaigns').then(r => {
      setCampaigns(r.data)
      if (r.data.length > 0) setSelected(r.data[0]._id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    api.get(`/analytics/ads/${selected}`).then(r => setStats(r.data)).catch(() => {})
  }, [selected])

  useEffect(() => {
    if (!socket || !selected) return
    const handler = (data) => {
      if (data.adId === selected || !data.adId) {
        setStats(prev => {
          if (!prev) return prev
          const updated = { ...prev }
          if (data.type === 'ad_view') {
            updated.totalViews = (prev.totalViews || 0) + 1
            updated.uniqueViewers = prev.uniqueViewers // approximate
          } else if (data.type === 'ad_click') {
            updated.totalClicks = (prev.totalClicks || 0) + 1
          }
          updated.ctr = updated.totalViews > 0
            ? parseFloat(((updated.totalClicks / updated.totalViews) * 100).toFixed(2))
            : 0
          return updated
        })
        setRecentEvents(prev => [{ ...data, ts: Date.now() }, ...prev].slice(0, 20))
      }
    }
    socket.on('analytics_update', handler)
    return () => socket.off('analytics_update', handler)
  }, [socket, selected])

  const freqData = {
    labels: (stats?.frequencyDistribution || []).map(d => `${d.impressions}×`),
    datasets: [{
      label: 'Users',
      data: (stats?.frequencyDistribution || []).map(d => d.users),
      backgroundColor: '#a78bfa',
      borderRadius: 6,
    }],
  }

  const pieData = {
    labels: ['Views', 'Clicks', 'No Action'],
    datasets: [{
      data: [
        stats?.totalViews || 0,
        stats?.totalClicks || 0,
        Math.max(0, (stats?.totalViews || 0) - (stats?.totalClicks || 0)),
      ],
      backgroundColor: ['#7c3aed', '#10b981', '#e5e7eb'],
      borderWidth: 0,
    }],
  }

  return (
    <div>
      <div style={s.toolbar}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ad Analytics</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={s.liveBadge}><span style={s.dot} /> Live</span>
          <select style={s.select} value={selected} onChange={e => setSelected(e.target.value)}>
            {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {!stats && selected && <div style={{ color: '#9ca3af' }}>Loading analytics…</div>}
      {stats && <>
        <div style={s.grid}>
          {[
            { label: 'Total Views', value: stats.totalViews?.toLocaleString() },
            { label: 'Unique Viewers', value: stats.uniqueViewers?.toLocaleString() },
            { label: 'Total Clicks', value: stats.totalClicks?.toLocaleString() },
            { label: 'CTR', value: `${stats.ctr}%` },
          ].map(m => (
            <div key={m.label} style={s.card}>
              <div style={s.stat}>{m.value ?? 0}</div>
              <div style={s.statLabel}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={s.chartCard}>
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Frequency Distribution (impressions per user)</h3>
            <Bar data={freqData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
          </div>
          <div style={s.chartCard}>
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>View vs Click</h3>
            <Doughnut data={pieData} options={{ responsive: true, cutout: '70%' }} />
          </div>
        </div>

        <div style={s.chartCard}>
          <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Recent Events (Live)</h3>
          {recentEvents.length === 0 && <div style={{ color: '#9ca3af', fontSize: 13 }}>No events yet…</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentEvents.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ background: ev.type === 'ad_view' ? '#dbeafe' : '#dcfce7', color: ev.type === 'ad_view' ? '#1d4ed8' : '#16a34a', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>{ev.type}</span>
                <span>User: {ev.userId || '—'}</span>
                <span style={{ color: '#9ca3af' }}>📍 {ev.location?.city || '—'}</span>
                <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>{new Date(ev.ts).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </>}
    </div>
  )
}
