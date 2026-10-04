import { useEffect } from 'react'
import { Shell } from './components/Shell'
import { Toaster } from './components/ui'
import { match, navigate, useRoute } from './lib/router'
import { useStore } from './lib/store'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Explore from './pages/Explore'
import History from './pages/History'
import ItemDetail from './pages/ItemDetail'
import Landing from './pages/Landing'
import LocationPage from './pages/LocationPage'
import NewIdea from './pages/NewIdea'
import Profile from './pages/Profile'

const PUBLIC = ['/', '/login', '/signup']

export default function App() {
  const path = useRoute()
  const { user } = useStore()
  const bare = path.split('?')[0]
  const isPublic = PUBLIC.includes(bare)

  // Business rule: bucket-list features require an authenticated user.
  useEffect(() => {
    if (!user && !isPublic) navigate('/login?next=' + encodeURIComponent(path))
    if (user && (bare === '/login' || bare === '/signup')) navigate('/new')
  }, [user, isPublic, path, bare])

  let page: React.ReactNode
  let p: Record<string, string> | null
  if (bare === '/') page = <Landing />
  else if (bare === '/login' || bare === '/signup') page = <Auth mode={bare === '/login' ? 'login' : 'signup'} path={path} />
  else if (!user) page = null
  else if (bare === '/app') page = <NewIdea path={path} />
  else if (bare === '/new') page = <NewIdea path={path} />
  else if (bare === '/explore') page = <Explore />
  else if ((p = match('/location/:id', bare))) page = <LocationPage id={p.id} />
  else if ((p = match('/item/:id', bare))) page = <ItemDetail id={p.id} />
  else if (bare === '/history') page = <History />
  else if (bare === '/profile') page = <Profile />
  else if (bare === '/admin') page = user.role === 'admin' ? <Admin /> : <NotFound />
  else page = <NotFound />

  return (
    <>
      {isPublic || !user ? page : <Shell path={bare === '/app' ? '/new' : bare}>{page}</Shell>}
      <Toaster />
    </>
  )
}

function NotFound() {
  return (
    <div className="empty">
      <h3>That page wandered off</h3>
      <p className="muted">It may have been deleted or never existed.</p>
      <a className="btn btn-dark mt-16" href="#/new">Go to New Idea</a>
    </div>
  )
}
