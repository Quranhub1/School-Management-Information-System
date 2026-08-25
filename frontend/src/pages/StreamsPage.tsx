import React, { useEffect, useState } from 'react'
import { getStreams, createStream, updateStream, type Stream } from '../api/academicStructure'

export default function StreamsPage() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [classFormId, setClassFormId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setStreams(await getStreams())
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
      await createStream({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        classFormId: classFormId || undefined,
      })
      setName('')
      setCode('')
      setClassFormId('')
      setMessage('Stream created.')
      await load()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create stream.') }
    finally { setSaving(false) }
  }

  async function toggleActive(stream: Stream) {
    try {
      await updateStream(stream.id, {
        name: stream.name,
        code: stream.code,
        classFormId: stream.classFormId ?? null,
        isActive: !stream.isActive,
      })
      setStreams((items) => items.map((item) => item.id === stream.id ? { ...item, isActive: !item.isActive } : item))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update stream.') }
  }

  return <section>
    <h2>Streams</h2>
    <form onSubmit={createStreamEvent}>
      <label>Name <input value={name} onChange={e => setName(e.target.value)} placeholder="Stream A" required /></label>
      <label>Code <input value={code} onChange={e => setCode(e.target.value)} placeholder="A" required /></label>
      <label>Class Form ID <input value={classFormId} onChange={e => setClassFormId(e.target.value)} placeholder="Optional" /></label>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Stream'}</button>
    </form>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading streams…</p> : <table><thead><tr><th>Name</th><th>Code</th><th>Class Form</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {streams.length === 0 && <tr><td colSpan={5}>No streams found.</td></tr>}
      {streams.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.code}</td><td>{s.classFormId ?? '—'}</td><td>{s.isActive ? 'Active' : 'Inactive'}</td><td><button type="button" onClick={() => void toggleActive(s)}>{s.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}
    </tbody></table>}
  </section>
}
