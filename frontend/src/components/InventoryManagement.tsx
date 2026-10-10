import { useEffect, useMemo, useRef, useState } from 'react'
import { getInventoryRegister, saveInventoryRegister, type InventoryColumn, type InventoryRow } from '../api/inventoryRegisters'

type InventorySection = { id: string; name: string; group: string }
const INVENTORY_SECTIONS: InventorySection[] = [
  { id: 'ict-skills-lab', name: 'ICT Skills Lab', group: 'Laboratories' },
  { id: 'dcm-lab', name: 'DCM Lab', group: 'Laboratories' },
  { id: 'pharmacy-lab', name: 'Pharmacy Lab', group: 'Laboratories' },
  { id: 'clt-lab', name: 'CLT Lab', group: 'Laboratories' },
  { id: 'food-science-lab', name: 'Food Science Lab', group: 'Laboratories' },
  { id: 'biomedical-engineering-lab', name: 'Biomedical Engineering Lab', group: 'Laboratories' },
  { id: 'admin-block', name: 'Admin Block', group: 'Other Inventories' },
  { id: 'furniture', name: 'Furniture', group: 'Other Inventories' },
  { id: 'sports-department', name: 'Sports Department', group: 'Other Inventories' },
  { id: 'guild-department', name: 'Guild Department', group: 'Other Inventories' },
  { id: 'kitchen', name: 'Kitchen', group: 'Other Inventories' },
  { id: 'sickbay', name: 'Sickbay', group: 'Other Inventories' },
  { id: 'infrastructure-details', name: 'Infrastructure Details', group: 'Other Inventories' },
]
const DEFAULT_COLUMNS: InventoryColumn[] = [
  { id: 'name', label: 'Name of Item' },
  { id: 'description', label: 'Description' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'condition', label: 'Condition' },
  { id: 'location', label: 'Location' },
]
const emptyRegister = () => ({ columns: DEFAULT_COLUMNS.map(column => ({ ...column })), rows: [] as InventoryRow[] })
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'The inventory register could not be saved.'

export function InventoryManagement({ canManage }: { canManage?: boolean; initialTab?: string }) {
  const [sectionId, setSectionId] = useState(INVENTORY_SECTIONS[0].id)
  const [register, setRegister] = useState(emptyRegister)
  const [loading, setLoading] = useState(true)
  const [loadedSection, setLoadedSection] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [retryCounter, setRetryCounter] = useState(0)
  const [newColumnName, setNewColumnName] = useState('')
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null)
  const [renamedLabel, setRenamedLabel] = useState('')
  const revision = useRef(0)
  const section = INVENTORY_SECTIONS.find(item => item.id === sectionId) ?? INVENTORY_SECTIONS[0]
  const canEdit = Boolean(canManage && loadedSection === sectionId && !loading)
  const filledRows = useMemo(() => register.rows.filter(row => register.columns.some(column => (row.values[column.id] ?? '').trim())).length, [register])

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadedSection(null)
    setDirty(false)
    setLoadError('')
    setSaveError('')
    setRenamingColumn(null)
    getInventoryRegister(sectionId).then(saved => {
      if (!active) return
      setRegister({ columns: saved.columns, rows: saved.rows })
      setLoadedSection(sectionId)
      setLoading(false)
    }).catch(error => {
      if (!active) return
      setLoadError(errorMessage(error))
      setLoading(false)
    })
    return () => { active = false }
  }, [sectionId])

  useEffect(() => {
    if (!canManage || loadedSection !== sectionId || !dirty) return
    const savingRevision = revision.current
    const snapshot = { columns: register.columns, rows: register.rows }
    const timer = window.setTimeout(async () => {
      setSaving(true)
      setSaveError('')
      try {
        await saveInventoryRegister(sectionId, snapshot)
        if (revision.current === savingRevision) setDirty(false)
      } catch (error) {
        if (revision.current === savingRevision) {
          setDirty(false)
          setSaveError(errorMessage(error))
        }
      } finally {
        setSaving(false)
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [canManage, dirty, loadedSection, register, retryCounter, sectionId])

  const updateRegister = (update: (current: { columns: InventoryColumn[]; rows: InventoryRow[] }) => { columns: InventoryColumn[]; rows: InventoryRow[] }) => {
    if (!canEdit) return
    revision.current += 1
    setSaveError('')
    setDirty(true)
    setRegister(current => update(current))
  }
  const addRow = () => updateRegister(current => ({
    ...current,
    rows: [...current.rows, { id: makeId(), values: Object.fromEntries(current.columns.map(column => [column.id, ''])) }],
  }))
  const updateCell = (rowId: string, columnId: string, value: string) => updateRegister(current => ({
    ...current,
    rows: current.rows.map(row => row.id === rowId ? { ...row, values: { ...row.values, [columnId]: value } } : row),
  }))
  const deleteRow = (rowId: string) => updateRegister(current => ({ ...current, rows: current.rows.filter(row => row.id !== rowId) }))
  const addColumn = () => {
    const label = newColumnName.trim()
    if (!label || !canEdit) return
    const column = { id: makeId(), label }
    updateRegister(current => ({
      columns: [...current.columns, column],
      rows: current.rows.map(row => ({ ...row, values: { ...row.values, [column.id]: '' } })),
    }))
    setNewColumnName('')
  }
  const renameColumn = (columnId: string) => {
    const label = renamedLabel.trim()
    if (!label) { setRenamingColumn(null); return }
    updateRegister(current => ({ ...current, columns: current.columns.map(column => column.id === columnId ? { ...column, label } : column) }))
    setRenamingColumn(null)
    setRenamedLabel('')
  }
  const deleteColumn = (columnId: string) => {
    if (['name', 'description', 'quantity', 'condition', 'location'].includes(columnId)) return
    updateRegister(current => ({
      columns: current.columns.filter(column => column.id !== columnId),
      rows: current.rows.map(row => { const values = { ...row.values }; delete values[columnId]; return { ...row, values } }),
    }))
  }

  return <section className="panel inventory-register-panel" aria-label="School inventory register">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">SCHOOL INVENTORIES</span>
        <h3>Inventory Register</h3>
        <p className="empty">This is the school inventory workspace. Registers are loaded from and saved to the application database, not browser storage. Choose a laboratory, department or facility and manage its spreadsheet-style register.</p>
      </div>
    </div>

    <div className="inventory-card inventory-register-selector">
      <label>Choose inventory register
        <select value={sectionId} onChange={event => setSectionId(event.target.value)}>
          <optgroup label="Laboratories">
            {INVENTORY_SECTIONS.filter(item => item.group === 'Laboratories').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </optgroup>
          <optgroup label="Other Inventories">
            {INVENTORY_SECTIONS.filter(item => item.group === 'Other Inventories').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </optgroup>
        </select>
      </label>
      <div className="inventory-register-summary">
        <div><span>Selected register</span><strong>{section.name}</strong></div>
        <div><span>Rows with data</span><strong>{filledRows}</strong></div>
        <div><span>Columns</span><strong>{register.columns.length + 1}</strong></div>
        <div><span>Database status</span><strong role="status">{loading ? 'Loading…' : saving ? 'Saving…' : saveError ? 'Save failed' : dirty ? 'Unsaved changes' : loadedSection === sectionId ? 'Saved' : 'Unavailable'}</strong></div>
      </div>
    </div>

    {loadError && <div className="inventory-error" role="alert"><strong>Could not load this inventory register.</strong><p>{loadError}</p><button className="secondary-button" type="button" onClick={() => { setLoadedSection(null); setLoadError(''); setLoading(true); setSectionId(current => current) }}>Retry loading</button></div>}
    {saveError && <div className="inventory-error" role="alert"><strong>Changes were not saved to the database.</strong><p>{saveError}</p><button className="secondary-button" type="button" onClick={() => { setSaveError(''); setDirty(true); setRetryCounter(value => value + 1) }}>Retry save</button></div>}

    {canEdit && <div className="inventory-card inventory-column-tools">
      <form className="inventory-form-grid" onSubmit={event => { event.preventDefault(); addColumn() }}>
        <label>Add custom column<input value={newColumnName} onChange={event => setNewColumnName(event.target.value)} placeholder="e.g. Asset tag, supplier, purchase date" /></label>
        <button className="secondary-button" type="submit" disabled={!newColumnName.trim()}>Add column</button>
        <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>
      </form>
      <p className="empty">Rename any heading, add custom columns, or remove custom columns. S/N is automatic and continuous, like a spreadsheet, and is not manually editable.</p>
    </div>}

    <div className="inventory-card inventory-spreadsheet-card">
      <div className="welfare-toolbar">
        <div><span className="eyebrow">DATABASE REGISTER</span><h4>{section.name}</h4></div>
        {canEdit && <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>}
      </div>
      {loading && <p className="empty" role="status">Loading register from database…</p>}
      <div className="table-wrap inventory-table-wrap inventory-spreadsheet-wrap">
        <table className="compact-table inventory-spreadsheet">
          <thead><tr>
            <th className="inventory-serial-column">S/N</th>
            {register.columns.map(column => <th key={column.id}>
              {renamingColumn === column.id
                ? <form className="inventory-rename-column" onSubmit={event => { event.preventDefault(); renameColumn(column.id) }}>
                    <input autoFocus aria-label="New column name" value={renamedLabel} onChange={event => setRenamedLabel(event.target.value)} />
                    <button className="secondary-button" type="submit">Save</button>
                    <button className="secondary-button" type="button" onClick={() => setRenamingColumn(null)}>Cancel</button>
                  </form>
                : <div className="inventory-column-heading"><span>{column.label}</span>{canEdit && <div className="inventory-column-actions">
                    <button type="button" title={`Rename ${column.label}`} onClick={() => { setRenamingColumn(column.id); setRenamedLabel(column.label) }}>Rename</button>
                    {!['name', 'description', 'quantity', 'condition', 'location'].includes(column.id) && <button type="button" title={`Delete ${column.label}`} onClick={() => deleteColumn(column.id)}>Remove</button>}
                  </div>}</div>}
            </th>)}
            {canEdit && <th>Actions</th>}
          </tr></thead>
          <tbody>
            {!loadError && register.rows.map((row, index) => <tr key={row.id}>
              <td className="inventory-serial-cell">{index + 1}</td>
              {register.columns.map(column => <td key={column.id}>
                {canEdit
                  ? <input className="inventory-cell-input" aria-label={`Row ${index + 1}, ${column.label}`} value={row.values[column.id] ?? ''} onChange={event => updateCell(row.id, column.id, event.target.value)} placeholder="—" type={column.id === 'quantity' ? 'number' : 'text'} min={column.id === 'quantity' ? 0 : undefined} />
                  : <span>{row.values[column.id] || '—'}</span>}
              </td>)}
              {canEdit && <td><button className="secondary-button" type="button" onClick={() => deleteRow(row.id)}>Delete row</button></td>}
            </tr>)}
            {!loading && !loadError && register.rows.length === 0 && <tr><td colSpan={register.columns.length + (canEdit ? 2 : 1)} className="inventory-empty-cell">No rows yet for {section.name}. {canEdit ? 'Select “Add row” to start entering items.' : ''}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="inventory-spreadsheet-footer">
        <span>{register.rows.length} total rows · {register.columns.length + 1} columns · Auto-numbered S/N</span>
        {canEdit && <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>}
      </div>
    </div>
  </section>
}
