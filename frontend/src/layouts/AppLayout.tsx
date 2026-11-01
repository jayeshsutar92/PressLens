import { type FC } from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/navigation/AppHeader.tsx'
import { AppSidebar } from '../components/navigation/AppSidebar.tsx'

export const AppLayout: FC = () => {
  return (
    <div className="pl-app-shell">
      <AppSidebar />
      <div className="pl-main-wrapper">
        <AppHeader />
        <main className="pl-content">
          <Outlet />
        </main>
        <footer className="pl-footer">
          <div>
            <span>PressLens Football Intelligence Engine</span> &bull;{' '}
            <span style={{ color: 'var(--text-dim)' }}>Powered by FastAPI, PostgreSQL, and Groq</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)' }}>PressLens UI v0.2.0</div>
        </footer>
      </div>
    </div>
  )
}
