import { useEffect, useState } from 'react'

type PrintDocType = 'certificate' | 'report-card' | 'receipt' | 'transcript' | 'custom'

interface PrinterConfig {
  id: string
  name: string
  type: string
  location: string
  isDefault: boolean
  status: 'online' | 'offline' | 'error'
}

interface PrintJob {
  id: string
  docType: PrintDocType
  docLabel: string
  copies: number
  paperSize: 'A4' | 'A3' | 'Letter'
  orientation: 'portrait' | 'landscape'
  color: boolean
  status: 'queued' | 'printing' | 'completed' | 'failed'
  createdAt: string
}

const DEFAULT_PRINTERS: PrinterConfig[] = [
  { id: 'printer-1', name: 'HP LaserJet Pro', type: 'Laser', location: 'Admin Office', isDefault: true, status: 'online' },
  { id: 'printer-2', name: 'Epson EcoTank', type: 'Inkjet', location: 'Registrar Office', isDefault: false, status: 'online' },
  { id: 'printer-3', name: 'Brother DCP', type: 'Multifunction', location: 'Exams Office', isDefault: false, status: 'offline' },
]

const DOC_LABELS: Record<PrintDocType, string> = {
  certificate: 'Certificate',
  'report-card': 'Report Card',
  receipt: 'Receipt',
  transcript: 'Transcript',
  custom: 'Custom Document',
}

export function PrinterManagement() {
  const [printers, setPrinters] = useState<PrinterConfig[]>(() => {
    const stored = localStorage.getItem('smis_printers')
    return stored ? JSON.parse(stored) : DEFAULT_PRINTERS
  })
  const [jobs, setJobs] = useState<PrintJob[]>(() => {
    const stored = localStorage.getItem('smis_print_jobs')
    return stored ? JSON.parse(stored) : []
  })
  const [selectedPrinter, setSelectedPrinter] = useState<string>(() => printers.find(p => p.isDefault)?.id ?? printers[0]?.id ?? '')
  const [docType, setDocType] = useState<PrintDocType>('certificate')
  const [copies, setCopies] = useState(1)
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Letter'>('A4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [color, setColor] = useState(false)
  const [customLabel, setCustomLabel] = useState('')

  useEffect(() => {
    localStorage.setItem('smis_printers', JSON.stringify(printers))
  }, [printers])

  useEffect(() => {
    localStorage.setItem('smis_print_jobs', JSON.stringify(jobs))
  }, [jobs])

  function addJob() {
    const job: PrintJob = {
      id: `job-${Date.now()}`,
      docType,
      docLabel: docType === 'custom' ? customLabel || 'Custom' : DOC_LABELS[docType],
      copies,
      paperSize,
      orientation,
      color,
      status: 'queued',
      createdAt: new Date().toISOString(),
    }
    setJobs(prev => [job, ...prev])
  }

  function updateJobStatus(id: string, status: PrintJob['status']) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  function processQueue() {
    const queued = jobs.filter(j => j.status === 'queued')
    if (queued.length === 0) return
    const next = queued[0]
    updateJobStatus(next.id, 'printing')
    setTimeout(() => {
      updateJobStatus(next.id, 'completed')
    }, 2000)
  }

  function setAsDefault(id: string) {
    setPrinters(prev => prev.map(p => ({ ...p, isDefault: p.id === id })))
  }

  function togglePrinterStatus(id: string) {
    setPrinters(prev => prev.map(p => {
      if (p.id !== id) return p
      const nextStatus = p.status === 'online' ? 'offline' : 'online'
      return { ...p, status: nextStatus }
    }))
  }

  const defaultPrinter = printers.find(p => p.isDefault)

  return (
    <section className="panel" aria-label="Printer management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRINTERS</span>
          <h3>Printer Management</h3>
        </div>
      </div>

      <div className="library-workspace-tabs" role="tablist" aria-label="Printer sections">
        <span className="module-chip" style={{ cursor: 'default' }}>Configured Printers: {printers.length}</span>
        <span className="module-chip" style={{ cursor: 'default' }}>Queue: {jobs.filter(j => j.status === 'queued').length}</span>
      </div>

      <div className="summary-grid">
        <div className="student-form">
          <h4>Printers</h4>
          <div className="printer-list">
            {printers.map(printer => (
              <div key={printer.id} className={`printer-card ${printer.status}`}>
                <div>
                  <strong>{printer.name}</strong>
                  <span className="badge">{printer.type}</span>
                  <span className="badge">{printer.location}</span>
                  {printer.isDefault && <span className="badge badge-primary">Default</span>}
                  <span className={`status-dot ${printer.status}`}>{printer.status}</span>
                </div>
                <div className="printer-actions">
                  {!printer.isDefault && <button className="secondary-button" onClick={() => setAsDefault(printer.id)}>Set Default</button>}
                  <button className="secondary-button" onClick={() => togglePrinterStatus(printer.id)}>
                    {printer.status === 'online' ? 'Go Offline' : 'Go Online'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="student-form">
          <h4>Quick Print</h4>
          <div className="form-row">
            <label>Document Type
              <select value={docType} onChange={e => setDocType(e.target.value as PrintDocType)}>
                <option value="certificate">Certificate</option>
                <option value="report-card">Report Card</option>
                <option value="receipt">Receipt</option>
                <option value="transcript">Transcript</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            {docType === 'custom' && (
              <label>Label<input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Document label" /></label>
            )}
          </div>
          <div className="form-row">
            <label>Printer
              <select value={selectedPrinter} onChange={e => setSelectedPrinter(e.target.value)}>
                {printers.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                ))}
              </select>
            </label>
            <label>Copies<input type="number" min="1" max="100" value={copies} onChange={e => setCopies(Number(e.target.value))} /></label>
          </div>
          <div className="form-row">
            <label>Paper Size
              <select value={paperSize} onChange={e => setPaperSize(e.target.value as 'A4' | 'A3' | 'Letter')}>
                <option value="A4">A4</option>
                <option value="A3">A3</option>
                <option value="Letter">Letter</option>
              </select>
            </label>
            <label>Orientation
              <select value={orientation} onChange={e => setOrientation(e.target.value as 'portrait' | 'landscape')}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={color} onChange={e => setColor(e.target.checked)} /> Color
            </label>
          </div>
          <button type="button" onClick={addJob}>Add to Print Queue</button>
        </div>
      </div>

      <div className="print-queue-section">
        <div className="panel-heading">
          <div>
            <h4>Print Queue</h4>
          </div>
          <button className="secondary-button" onClick={processQueue} disabled={!jobs.some(j => j.status === 'queued')}>Process Queue</button>
        </div>
        {jobs.length === 0 ? (
          <p className="empty">No print jobs in queue.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Document</th>
                  <th>Copies</th>
                  <th>Paper</th>
                  <th>Orientation</th>
                  <th>Color</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id}>
                    <td><code>{job.id}</code></td>
                    <td>{job.docLabel}</td>
                    <td>{job.copies}</td>
                    <td>{job.paperSize}</td>
                    <td>{job.orientation}</td>
                    <td>{job.color ? 'Yes' : 'No'}</td>
                    <td>
                      <span className={`status-badge ${job.status}`}>{job.status}</span>
                    </td>
                    <td>{new Date(job.createdAt).toLocaleString()}</td>
                    <td>
                      {job.status === 'queued' && (
                        <button className="secondary-button" onClick={() => updateJobStatus(job.id, 'printing')}>Print Now</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
