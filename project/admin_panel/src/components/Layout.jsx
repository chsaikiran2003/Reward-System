import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'

const s = {
  app: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column', padding: '0', flexShrink: 0 },
  logo: { padding: '24px 20px 16px', fontSize: 18, fontWeight: 700, borderBottom: '1px solid #2d2d50', color: '#a78bfa' },
  nav: { flex: 1, padding: '12px 0' },
  link: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', color: '#ccc', textDecoration: 'none', fontSize: 14, transition: 'background 0.2s' },
  activeLink: { background: '#2d2d50', color: '#a78bfa', borderRight: '3px solid #a78bfa' },
  section: { padding: '8px 20px', fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
  footer: { padding: '16px 20px', borderTop: '1px solid #2d2d50' },
  badge: { background: '#10b981', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#fff' },
  badgeOff: { background: '#ef4444', borderRadius: 4, padding: '2px 6px', fontSize: 10, color: '#fff' },
  main: { flex: 1, overflow: 'auto', background: '#f0f2f5' },
  header: { background: '#fff', padding: '16px 32px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  content: { padding: 32 },
  userBadge: { background: '#ede9fe', color: '#7c3aed', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 },
  logoutBtn: { background: 'none', border: '1px solid #d1d5db', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151' },
}

const linkStyle = ({ isActive }) => ({ ...s.link, ...(isActive ? s.activeLink : {}) })

export default function Layout() {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.logo}>🎮 Reward Admin</div>
        <nav style={s.nav}>
          <div style={s.section}>Overview</div>
          <NavLink to="/" end style={linkStyle}>📊 Dashboard</NavLink>

          {isAdmin && <><div style={s.section}>Ads</div>
          <NavLink to="/campaigns" style={linkStyle}>📢 Campaigns</NavLink></>}
          <NavLink to="/ad-analytics" style={linkStyle}>📈 Ad Analytics</NavLink>

          {isAdmin && <><div style={s.section}>Games</div>
          <NavLink to="/rewards" style={linkStyle}>🎁 Rewards Config</NavLink>
          <NavLink to="/game-settings" style={linkStyle}>⚙️ Game Settings</NavLink></>}
          <NavLink to="/game-analytics" style={linkStyle}>🎰 Game Analytics</NavLink>

          {isAdmin && <><div style={s.section}>System</div>
          <NavLink to="/users" style={linkStyle}>👥 Users</NavLink></>}
        </nav>
        <div style={s.footer}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            Socket: <span style={connected ? s.badge : s.badgeOff}>{connected ? 'Live' : 'Off'}</span>
          </div>
        </div>
      </aside>

      <div style={s.main}>
        <div style={s.header}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
            Reward System Admin
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={s.userBadge}>{user?.email} · {user?.role}</span>
            <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
