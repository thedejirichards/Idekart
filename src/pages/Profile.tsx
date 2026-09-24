import { useState } from 'react'
import { Icon } from '../components/Icon'
import { toast } from '../components/ui'
import { CITIES } from '../data/locations'
import { navigate } from '../lib/router'
import { useStore } from '../lib/store'
import type { Currency } from '../lib/types'
import { formatDate } from '../lib/util'

export default function Profile() {
  const { user, updateProfile, logOut, items } = useStore()
  const [name, setName] = useState(user?.name ?? '')
  if (!user) return null
  const completed = items.filter((i) => i.status === 'completed').length

  return (
    <div className="stack-lg" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div className="row">
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>{user.name[0]?.toUpperCase()}</span>
          <div>
            <h1>{user.name}</h1>
            <p className="muted small">Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })} · {completed} completed</p>
          </div>
        </div>
      </div>

      <section className="card stack">
        <h3>Profile</h3>
        <label className="field">
          <span>Name</span>
          <div className="row">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-dark" disabled={!name.trim() || name === user.name} onClick={() => { updateProfile({ name: name.trim() }); toast('Name updated') }}>Save</button>
          </div>
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" value={user.email} disabled />
        </label>
      </section>

      <section className="card stack">
        <h3>Preferences</h3>
        <label className="field">
          <span>Home city <span className="hint">— starting point for directions and travel costs</span></span>
          <select className="select" value={user.homeCity} onChange={(e) => { updateProfile({ homeCity: e.target.value }); toast('Home city updated') }}>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
          </select>
        </label>
        <div className="field">
          <span>Show prices in</span>
          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            {(['NGN', 'USD'] as Currency[]).map((c) => (
              <button key={c} className={user.currency === c ? 'on' : ''} onClick={() => updateProfile({ currency: c })}>
                {c === 'NGN' ? '₦ Naira' : '$ US Dollar'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <button className="btn btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => { logOut(); navigate('/') }}>
        <Icon name="logout" /> Log out
      </button>
    </div>
  )
}
