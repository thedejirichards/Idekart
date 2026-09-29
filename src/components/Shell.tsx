import type { ReactNode } from 'react'
import { useStore } from '../lib/store'
import { Icon } from './Icon'

const NAV = [
  { href: '/app', label: 'Dashboard', short: 'Home', icon: 'home' },
  { href: '/new', label: 'New idea', short: 'New', icon: 'plus' },
  { href: '/explore', label: 'Explore', short: 'Explore', icon: 'compass' },
  { href: '/history', label: 'History', short: 'History', icon: 'trophy' },
  { href: '/profile', label: 'Profile', short: 'Me', icon: 'user' },
]

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useStore()
  const active = (href: string) =>
    path === href || path.startsWith(href + '/') || (href === '/app' && path.startsWith('/item'))
  const nav = user?.role === 'admin' ? [...NAV, { href: '/admin', label: 'Admin', short: 'Admin', icon: 'shield' }] : NAV

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#/app"><img src="/IdekartLogo.svg" alt="Idekart" /></a>
        {nav.map((n) => (
          <a key={n.href} href={'#' + n.href} className={`nav-link ${active(n.href) ? 'active' : ''}`}>
            <Icon name={n.icon} /> {n.label}
          </a>
        ))}
        <div className="spacer" />
        {user && (
          <a className="me" href="#/profile" style={{ textDecoration: 'none' }}>
            <span className="avatar">{user.name[0]?.toUpperCase()}</span>
            <span className="grow">
              <span className="small strong" style={{ color: '#fff', display: 'block' }}>{user.name}</span>
              <span className="tiny" style={{ color: '#a8a4bb' }}>{user.email}</span>
            </span>
          </a>
        )}
      </aside>

      <div>
        <header className="topbar">
          <a className="brand" href="#/app" style={{ color: '#fff', fontSize: 20 }}><img src="/IdekartLogo.svg" alt="Idekart" /></a>
          {user && <a href="#/profile" className="avatar" style={{ textDecoration: 'none' }}>{user.name[0]?.toUpperCase()}</a>}
        </header>
        <main className="main">{children}</main>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {nav.map((n) => (
          <a key={n.href} href={'#' + n.href} className={active(n.href) ? 'active' : ''}>
            <Icon name={n.icon} /> {n.short}
          </a>
        ))}
      </nav>
    </div>
  )
}
