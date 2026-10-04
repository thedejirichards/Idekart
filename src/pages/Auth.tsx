import { useState } from 'react'
import { CITIES } from '../data/locations'
import { navigate, query } from '../lib/router'
import { useStore } from '../lib/store'

export default function Auth({ mode, path }: { mode: 'login' | 'signup'; path: string }) {
  const { logIn, signUp } = useStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', homeCity: 'lagos' })
  const [error, setError] = useState<string | null>(null)
  const next = query(path).get('next')
  const isLogin = mode === 'login'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isLogin) {
      if (!form.name.trim()) return setError('Tell us what to call you.')
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.')
      if (form.password.length < 8) return setError('Use at least 8 characters for your password.')
    }
    const err = isLogin ? logIn(form.email, form.password) : signUp(form)
    if (err) return setError(err)
    navigate(next && next !== '/login' ? next : '/new')
  }

  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <a className="brand" href="#/" style={{ color: '#fff' }}><img src="/IdekartLogo.svg" alt="Idekart" /></a>
        <div>
          <p className="display" style={{ fontSize: 40, lineHeight: 1.1, maxWidth: 420 }}>
            “I want to do this someday” is a plan waiting to happen.
          </p>
          <p className="mt-16" style={{ color: '#bdb8cf', maxWidth: 400 }}>
            Save an idea, find a place on the map, and take the next step when you’re ready. Book only when it makes sense.
          </p>
        </div>
        <div className="cover auth-orbit" style={{ '--h': 28, position: 'absolute', right: -80, top: 80, width: 260, height: 260, borderRadius: '50%', opacity: 0.5 } as React.CSSProperties}>
          <div className="sun" />
        </div>
        <p className="tiny" style={{ color: '#8f8aa6' }}>MVP prototype · data is stored in this browser only</p>
      </div>

      <div className="auth-form">
        <form className={`stack auth-card ${isLogin ? 'login-card' : ''}`} onSubmit={submit} noValidate>
          <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="muted">
            {isLogin ? 'Log in to pick up your plans.' : 'It takes 30 seconds. Your first idea is next.'}
          </p>
          {!isLogin && (
            <label className="field mt-8">
              <span>First name</span>
              <input className="input" autoComplete="given-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          {!isLogin && (
            <label className="field">
              <span>Home city <span className="hint">— used for directions and travel costs</span></span>
              <select className="select" value={form.homeCity} onChange={(e) => setForm({ ...form, homeCity: e.target.value })}>
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.country}</option>)}
              </select>
            </label>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-lg btn-block mt-8">{isLogin ? 'Log in' : 'Create account'}</button>
          {isLogin ? (
            <>
              <p className="small muted" style={{ textAlign: 'center' }}>
                New here? <a href="#/signup">Create an account</a>
              </p>
              <div className="card-flat small" style={{ background: 'var(--sand)', border: 0 }}>
                <b>Demo accounts</b>
                <div className="row between mt-8">
                  <span className="muted">demo@idekart.app · demo1234</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, email: 'demo@idekart.app', password: 'demo1234' })}>Use</button>
                </div>
                <div className="row between mt-8">
                  <span className="muted">admin@idekart.app · admin1234</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm({ ...form, email: 'admin@idekart.app', password: 'admin1234' })}>Use</button>
                </div>
              </div>
            </>
          ) : (
            <p className="small muted" style={{ textAlign: 'center' }}>
              Already have an account? <a href="#/login">Log in</a>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
