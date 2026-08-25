import React, { useEffect, useState } from 'react'

type Stream = { id: string; name: string; code: string; classFormId?: string; isActive: boolean }

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/academic-structure/streams', { headers: { Accept: 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) } })
      if (!response.ok) throw new Error(`Unable to load streams (${response.status}).`)
      setStreams(await response.json() as Stream[])
      setMessage('')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load streams.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function createStreamEvent(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/academic-structure/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), isActive: true }),
      })
      if (!response.ok) throw new Error(await response.text() || `Unable to create stream (${response.status}).`)
      setName('')
      setCode('')
      setMessage('Stream created.')
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create stream.') }
    finally { setSaving(false) }
  }

  async function toggleActive(stream: Stream) {
    try {
      const response = await fetch(`/api/academic-structure/streams/${stream.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}) },
        body: JSON.stringify({ name: stream.name, code: stream.code, isActive: !stream.isActive }),
      })
      if (!response.ok) throw new Error(await response.text() || `Unable to update stream (${response.status}).`)
      setStreams((items) => items.map((item) => item.id === stream.id ? { ...item, isActive: !item.isActive } : item))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update stream.') }
  }

  return <section>
    <h2>Streams</h2>
    <form onSubmit={createStreamEvent}>
      <label>Name <input value={name} onChange={e => setName(e.target.value)} placeholder="Stream A" required /></label>
      <label>Code <input value={code} onChange={e => setCode(e.target.value)} placeholder="A" required /></label>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Stream'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading streams…</p> : <table><thead><tr><th>Name</th><th>Code</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {streams.length === 0 && <tr><td colSpan={4}>No streams found.</td></tr>}
      {streams.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.code}</td><td>{s.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => void toggleActive(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
    </tbody></table>}
  </section>
}
