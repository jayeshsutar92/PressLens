import { type FC } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Compass,
  History,
  LayoutDashboard,
  PlusCircle,
  ShieldAlert,
  Zap,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scenarios', label: 'Match Scenarios', icon: Compass },
  { to: '/scenarios/builder', label: 'Scenario Builder', icon: PlusCircle },
  { to: '/analysis', label: 'Tactical Analysis', icon: Zap, badge: 'AI' },
  { to: '/history', label: 'Analysis History', icon: History },
]

export const AppSidebar: FC = () => {
  return (
    <aside className="pl-sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-pitch), var(--color-pitch-dark))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--color-pitch-glow)',
            color: 'var(--text-inverse)',
          }}
        >
          <ShieldAlert size={20} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            Press<span style={{ color: 'var(--color-pitch-light)' }}>Lens</span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Tactical AI Intelligence
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            fontSize: '0.6875rem',
            textTransform: 'uppercase',
            color: 'var(--text-dim)',
            padding: '8px 12px 4px',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          Tactical Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-pitch)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color="currentColor" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--color-pitch-light)',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Info Box */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-pitch)',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              PressLens Core
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Grounding pressing theory with geometric spatial tracking.
          </p>
        </div>
      </div>
    </aside>
  )
}
