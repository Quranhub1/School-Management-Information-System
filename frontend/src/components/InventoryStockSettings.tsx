import { useEffect, useMemo, useState } from 'react'
import { getInventoryRegister, saveInventoryRegister, type InventoryRegister } from '../api/inventoryRegisters'

const sections = [
  { id: 'ict-skills-lab', name: 'ICT Skills Lab' },
  { id: 'dcm-lab', name: 'DCM Lab' },
  { id: 'pharmacy-lab', name: 'Pharmacy Lab' },
  { id: 'clt-lab', name: 'CLT Lab' },
  { id: 'food-science-lab', name: 'Food Science Lab' },
  { id: 'biomedical-engineering-lab', name: 'Biomedical Engineering Lab' },
  { id: 'admin-block', name: 'Admin Block' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'sports-department', name: 'Sports Department' },
  { id: 'guild-department', name: 'Guild Department' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'sickbay', name: 'Sickbay' },
  { id: 'infrastructure-details', name: 'Infrastructure Details' },
]

type StockSetting = { key: string; sectionId: string; sectionName: string; rowId: string; itemName: string; quantity: string; threshold: string }

export function InventoryStockSettings() {
  const [registers, setRegisters] = useState<Record<string, InventoryRegister>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const loaded = await Promise.all(sections.map(async section => [section.id, await getInventoryRegister(section.id)] as const))
      setRegisters(Object.fromEntries(loaded))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load inventory thresholds.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const settings = useMemo<StockSetting[]>(() => sections.flatMap(section => {
    const register = registers[section.id]
    if (!register) return []
    const nameColumn = register.columns.find(column => column.id === 'name') ?? register.columns.find(column => /item|name/i.test(column.label))
    const quantityColumn = register.columns.find(column => column.id === 'quantity') ?? register.columns.find(column => /quantity|current stock|^stock$/i.test(column.label))
    if (!nameColumn || !quantityColumn) return []
    return register.rows.flatMap(row => {
      const itemName = (row.values[nameColumn.id] ?? '').trim()
      if (!itemName) return []
      return [{ key: `${section.id}:${row.id}`, sectionId: section.id, sectionName: section.name, rowId: row.id, itemName, quantity: row.values[quantityColumn.id] ?? '', threshold: row.values._reorderLevel ?? '' }]
    })
  }), [registers])

  async function saveThreshold(setting: StockSetting, value: string) {
    const current = registers[setting.sectionId]
    if (!current) return
    if (value.trim() !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      setError('Threshold must be a non-negative number, or blank to alert only when stock reaches zero.')
      return
    }
    setSavingKey(setting.key); setError(''); setSavedMessage('')
    try {
      const rows = current.rows.map(row => row.id === setting.rowId
        ? { ...row, values: { ...row.values, _reorderLevel: value.trim() } }
        : row)
      const updated = await saveInventoryRegister(setting.sectionId, { columns: current.columns, rows })
      setRegisters(previous => ({ ...previous, [setting.sectionId]: updated }))
      setSavedMessage(`Threshold saved for ${setting.itemName}.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save the threshold.')
    } finally { setSavingKey('') }
  }

  return <section className="panel" aria-label="Inventory threshold settings">
    <div className="panel-heading"><div><span className="eyebrow">SYSTEM SETTINGS</span><h3>Inventory low-stock thresholds</h3><p className="empty">Only the System Administrator configures these thresholds. Records Officers and School Wardens see in-app warnings when stock is at or below the configured level; items at zero are always flagged.</p></div><button type="button" className="secondary-button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    {error && <div className="error" role="alert">{error}</div>}
    {savedMessage && <p role="status" className="empty">{savedMessage}</p>}
    {loading ? <p className="empty">Loading inventory registers…</p> : settings.length === 0 ? <p className="empty">No named inventory items with a quantity column were found. Add items and quantities in the Inventory & Property register first.</p> :
      <div className="table-wrap"><table>
        <thead><tr><th>Inventory</th><th>Item</th><th>Current quantity</th><th>Low-stock threshold</th><th>Action</th></tr></thead>
        <tbody>{settings.map(setting => <tr key={setting.key}>
          <td>{setting.sectionName}</td><td>{setting.itemName}</td><td>{setting.quantity || 'Not entered'}</td>
          <td><input aria-label={`Low-stock threshold for ${setting.itemName}`} type="number" min="0" step="any" value={registers[setting.sectionId]?.rows.find(row => row.id === setting.rowId)?.values._reorderLevel ?? ''} placeholder="0 = alert only at zero" onChange={event => {
            const value = event.target.value
            setRegisters(previous => {
              const current = previous[setting.sectionId]
              if (!current) return previous
              return { ...previous, [setting.sectionId]: { ...current, rows: current.rows.map(row => row.id === setting.rowId ? { ...row, values: { ...row.values, _reorderLevel: value } } : row) } }
            })
          }} /></td>
          <td><button type="button" className="secondary-button" disabled={savingKey === setting.key} onClick={() => {
            const value = registers[setting.sectionId]?.rows.find(row => row.id === setting.rowId)?.values._reorderLevel ?? ''
            void saveThreshold(setting, value)
          }}>{savingKey === setting.key ? 'Saving…' : 'Save threshold'}</button></td>
        </tr>)}</tbody>
      </table></div>}
  </section>
}
