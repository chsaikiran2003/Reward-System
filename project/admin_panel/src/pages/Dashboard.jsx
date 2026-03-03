import { useEffect, useState } from 'react'
import api from '../services/api'
import { useSocket } from '../contexts/SocketContext'

const s = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  value: { fontSize: 32, fontWeight: 700, color: '#111827' },
  change: { fontSize: 12, color: '#10b981', marginTop: 4 },
  live: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' },
  feed: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  feedTitle: { fontWeight: 600, marginBottom: 16, fontSize: 15 },
  event: { display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'center' },
  badge: (type) => ({
    padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
    background: type === 'ad_view' ? '#dbeafe' : type === 'ad_click' ? '#dcfce7' : '#fef3c7',
    color: type === 'ad_view' ? '#1d4ed8' : type === 'ad_click' ? '#16a34a' : '#d97706',
  }),
  meta: { fontSize: 12, color: '#9ca3af' },
}

export default function Dashboard() {
  const [overview, setOverview] = useState({ totalAdViews: 0, totalAdClicks: 0, totalGames: 0 })
  const [feed, setFeed] = useState([])
  const { socket } = useSocket()

  useEffect(() => {
    api.get('/analytics/overview').then(r => setOverview(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    const onAd = (data) => {
      setFeed(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 50))
      setOverview(prev => ({
        ...prev,
        totalAdViews: data.type === 'ad_view' ? prev.totalAdViews + 1 : prev.totalAdViews,
        totalAdClicks: data.type === 'ad_click' ? prev.totalAdClicks + 1 : prev.totalAdClicks,
      }))
    }
    const onGame = (data) => {
      setFeed(prev => [{ ...data, type: 'game_played', id: Date.now() }, ...prev].slice(0, 50))
      setOverview(prev => ({ ...prev, totalGames: prev.totalGames + 1 }))
    }
    socket.on('analytics_update', onAd)
    socket.on('game_analytics_update', onGame)
    return () => { socket.off('analytics_update', onAd); socket.off('game_analytics_update', onGame) }
  }, [socket])

  const ctr = overview.totalAdViews > 0
    ? ((overview.totalAdClicks / overview.totalAdViews) * 100).toFixed(1)
    : '0.0'

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={s.grid}>
        {[
          { label: 'Total Ad Views', value: overview.totalAdViews.toLocaleString(), icon: '👁' },
          { label: 'Total Ad Clicks', value: overview.totalAdClicks.toLocaleString(), icon: '🖱' },
          { label: 'Overall CTR', value: `${ctr}%`, icon: '📊' },
          { label: 'Games Played', value: overview.totalGames.toLocaleString(), icon: '🎮' },
        ].map(c => (
          <div key={c.label} style={s.card}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>
            <div style={s.label}>{c.label}</div>
            <div style={s.value}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={s.feed}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={s.feedTitle}>Live Event Feed</span>
          <div style={s.live}><div style={s.dot} />Live</div>
        </div>
        {feed.length === 0 && <div style={{ color: '#9ca3af', fontSize: 14 }}>Waiting for events from Flutter app…</div>}
        {feed.map(ev => (
          <div key={ev.id} style={s.event}>
            <span style={s.badge(ev.type)}>{ev.type}</span>
            <div>
              <div style={{ fontSize: 13 }}>User: {ev.userId || ev.user || '—'}</div>
              <div style={s.meta}>{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'just now'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
