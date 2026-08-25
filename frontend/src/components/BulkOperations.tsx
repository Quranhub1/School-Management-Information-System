import { useRef, useState } from 'react'
import { importData, exportData } from '../api/importExport'

type EntityType = 'student' | 'staff'
type Tab = 'import' | 'export'

const SAMPLE_CSV: Record<EntityType, string> = {
  student: 'StudentNumber,FirstName,LastName,OtherNames,DateOfBirth,Gender,PhoneNumber,Email,Status\nSTU001,John,Doe,,2000-01-01,Male,0700000000,john@example.com,Active',
  staff: 'StaffNumber,FirstName,LastName,EmploymentType,NationalId,PhoneNumber,Email\nSTF001,Jane,Smith,Permanent,ID123,0712345678,jane@example.com',
}

export function BulkOperations() {
  const [tab, setTab] = useState<Tab>('import')
  const [entityType, setEntityType] = useState<EntityType>('student')
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[]; warnings: string[] } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await importData({ entityType, csvData: csv })
      setResult({ success: res.successCount, errors: res.errors, warnings: res.warnings })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsv(reader.result as string)
    reader.readAsText(file)
  }

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      await exportData(entityType)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="academic-workspace" aria-label="Bulk operations workspace">
      <div className="panel-heading"><div><p className="eyebrow">Bulk Operations</p><h2>Import / Export data</h2></div></div>
      <div className="library-workspace-tabs" role="tablist" aria-label="Bulk operations">
        <button role="tab" aria-selected={tab === 'import'} className={tab === 'import' ? 'active' : ''} onClick={() => { setTab('import'); setResult(null); setError('') }}>Import</button>
        <button role="tab" aria-selected={tab === 'export'} className={tab === 'export' ? 'active' : ''} onClick={() => { setTab('export'); setResult(null); setError('') }}>Export</button>
      </div>

      {tab === 'import' && (
        <div className="panel">
          <div className="form-grid">
            <label>Entity type
              <select value={entityType} onChange={e => setEntityType(e.target.value as EntityType)}>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
              </select>
            </label>
          </div>
          <p className="hint">Upload a CSV file or paste CSV data below.</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} />
          <label>CSV data
            <textarea value={csv} onChange={e => setCsv(e.target.value)} rows={8} placeholder={SAMPLE_CSV[entityType]} />
          </label>
          <div>
            <button type="button" className="secondary-button" onClick={() => setCsv(SAMPLE_CSV[entityType])}>Load sample CSV</button>
            <button type="button" disabled={loading || !csv.trim()} onClick={handleImport}>{loading ? 'Importing…' : 'Import'}</button>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
          {result && (
            <div className="result-box">
              <p>Imported: <strong>{result.success}</strong></p>
              {result.errors.length > 0 && <div className="error"><p>Errors ({result.errors.length}):</p><ul>{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
              {result.warnings.length > 0 && <div className="warning"><p>Warnings ({result.warnings.length}):</p><ul>{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
            </div>
          )}
        </div>
      )}

      {tab === 'export' && (
        <div className="panel">
          <div className="form-grid">
            <label>Entity type
              <select value={entityType} onChange={e => setEntityType(e.target.value as EntityType)}>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
              </select>
            </label>
          </div>
          <button type="button" disabled={loading} onClick={handleExport}>{loading ? 'Preparing…' : 'Download CSV'}</button>
          {error && <div className="error" role="alert">{error}</div>}
        </div>
      )}
    </section>
  )
}
