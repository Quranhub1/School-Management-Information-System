import { useEffect, useMemo, useState } from 'react'

type InventoryColumn = { id: string; label: string }
type InventoryRow = { id: string; values: Record<string, string> }
type InventoryRegister = { columns: InventoryColumn[]; rows: InventoryRow[] }

const INVENTORY_SECTIONS = [
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
] as const

const DEFAULT_COLUMNS: InventoryColumn[] = [
  { id: 'name', label: 'Name of item' },
  { id: 'description', label: 'Description' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'condition', label: 'Condition' },
  { id: 'location', label: 'Location' },
]
const storageKey = (section: string) => `smis.inventory.register.${section}`
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
const readRegister = (section: string): InventoryRegister => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(section)) || 'null')
    if (saved && Array.isArray(saved.columns) && Array.isArray(saved.rows)) {
      return { columns: saved.columns, rows: saved.rows }
    }
  } catch { /* Start with a clean register if saved data is invalid. */ }
  return { columns: DEFAULT_COLUMNS.map(column => ({ ...column })), rows: [] }
}

export function InventoryManagement({ canManage }: { canManage?: boolean; initialTab?: string }) {
  const [sectionId, setSectionId] = useState<string>(INVENTORY_SECTIONS[0].id)
  const [registers, setRegisters] = useState<Record<string, InventoryRegister>>(() =>
    Object.fromEntries(INVENTORY_SECTIONS.map(section => [section.id, readRegister(section.id)]))
  )
  const [newColumnName, setNewColumnName] = useState('')
  const [renamingColumn, setRenamingColumn] = useState<string | null>(null)
  const [renamedLabel, setRenamedLabel] = useState('')
  const section = INVENTORY_SECTIONS.find(item => item.id === sectionId) ?? INVENTORY_SECTIONS[0]
  const register = registers[sectionId] ?? { columns: DEFAULT_COLUMNS, rows: [] }

  useEffect(() => {
    for (const item of INVENTORY_SECTIONS) {
      const value = registers[item.id]
      if (value) localStorage.setItem(storageKey(item.id), JSON.stringify(value))
    }
  }, [registers])

  const updateRegister = (update: (current: InventoryRegister) => InventoryRegister) => {
    setRegisters(current => ({ ...current, [sectionId]: update(current[sectionId] ?? { columns: DEFAULT_COLUMNS, rows: [] }) }))
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
    if (!label) return
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
  const filledRows = useMemo(() => register.rows.filter(row => register.columns.some(column => (row.values[column.id] ?? '').trim())).length, [register])

  return <section className="panel inventory-register-panel" aria-label="School inventory register">
    <div className="panel-heading">
      <div>
        <span className="eyebrow">SCHOOL INVENTORIES</span>
        <h3>Inventory Register</h3>
        <p className="empty">One consistent, spreadsheet-style register for laboratory equipment, furniture, departments and school infrastructure. Select a register, edit cells directly, and add rows or custom columns as needed.</p>
      </div>
    </div>

    <div className="inventory-card inventory-register-selector">
      <label>Choose inventory register
        <select value={sectionId} onChange={event => { setSectionId(event.target.value); setRenamingColumn(null) }}>
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
      </div>
    </div>

    {canManage && <div className="inventory-card inventory-column-tools">
      <form className="inventory-form-grid" onSubmit={event => { event.preventDefault(); addColumn() }}>
        <label>Add custom column<input value={newColumnName} onChange={event => setNewColumnName(event.target.value)} placeholder="e.g. Asset tag, supplier, purchase date" /></label>
        <button className="secondary-button" type="submit" disabled={!newColumnName.trim()}>Add column</button>
        <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>
      </form>
      <p className="empty">Edit the column headings with the Rename action. S/N is automatic and remains continuous when rows are added or deleted.</p>
    </div>}

    <div className="inventory-card inventory-spreadsheet-card">
      <div className="welfare-toolbar">
        <div><span className="eyebrow">EDITABLE REGISTER</span><h4>{section.name}</h4></div>
        {canManage && <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>}
      </div>
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
                : <div className="inventory-column-heading"><span>{column.label}</span>{canManage && <div className="inventory-column-actions">
                    <button type="button" title={`Rename ${column.label}`} onClick={() => { setRenamingColumn(column.id); setRenamedLabel(column.label) }}>Rename</button>
                    {!['name', 'description', 'quantity', 'condition', 'location'].includes(column.id) && <button type="button" title={`Delete ${column.label}`} onClick={() => deleteColumn(column.id)}>Remove</button>}
                  </div>}</div>}
            </th>)}
            {canManage && <th>Actions</th>}
          </tr></thead>
          <tbody>
            {register.rows.map((row, index) => <tr key={row.id}>
              <td className="inventory-serial-cell">{index + 1}</td>
              {register.columns.map(column => <td key={column.id}>
                {canManage
                  ? <input className="inventory-cell-input" aria-label={`Row ${index + 1}, ${column.label}`} value={row.values[column.id] ?? ''} onChange={event => updateCell(row.id, column.id, event.target.value)} placeholder="—" type={column.id === 'quantity' ? 'number' : 'text'} min={column.id === 'quantity' ? 0 : undefined} />
                  : <span>{row.values[column.id] || '—'}</span>}
              </td>)}
              {canManage && <td><button className="secondary-button" type="button" onClick={() => deleteRow(row.id)}>Delete row</button></td>}
            </tr>)}
            {register.rows.length === 0 && <tr><td colSpan={register.columns.length + (canManage ? 2 : 1)} className="inventory-empty-cell">No rows yet for {section.name}. {canManage ? 'Select “Add row” to start entering items.' : ''}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="inventory-spreadsheet-footer">
        <span>{register.rows.length} total rows · {register.columns.length + 1} columns</span>
        {canManage && <button className="secondary-button" type="button" onClick={addRow}>+ Add row</button>}
      </div>
    </div>
  </section>
}
