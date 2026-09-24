import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createWelfareCommodity, getWelfareCommodities, getWelfareDaily, recordWelfareTransaction, type WelfareCommodity, type WelfareRow } from '../api/welfareInventory'

const today = new Date().toISOString().slice(0, 10)
const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30)

export function WelfareInventory({ canManage }: { canManage?: boolean }) {
  const [commodities, setCommodities] = useState<WelfareCommodity[]>([])
  const [rows, setRows] = useState<WelfareRow[]>([])
  const [from, setFrom] = useState(monthStart.toISOString().slice(0,10))
  const [to, setTo] = useState(today)
  const [commodityId, setCommodityId] = useState('')
  const [entry, setEntry] = useState({ commodityId:'', date:today, type:'Consumption', quantity:'', supplier:'', reference:'', batchNumber:'', expiryDate:'', notes:'' })
  const [newCommodity, setNewCommodity] = useState({ name:'', category:'Food', unit:'kg', reorderLevel:'' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setError('')
    try { const [c,r] = await Promise.all([getWelfareCommodities(), getWelfareDaily(from,to,commodityId || undefined)]); setCommodities(c); setRows(r); if (!entry.commodityId && c[0]) setEntry(e=>({...e,commodityId:c[0].id})) }
    catch(e){ setError(e instanceof Error ? e.message : 'Unable to load welfare records.') }
  }
  useEffect(()=>{ void load() }, [from,to,commodityId])

  const totals = useMemo(() => rows.reduce((a,r)=>({received:a.received+r.received,used:a.used+r.used,wastage:a.wastage+r.wastage}),{received:0,used:0,wastage:0}),[rows])

  async function saveTransaction(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await recordWelfareTransaction({...entry, quantity:Number(entry.quantity), expiryDate:entry.expiryDate || undefined}); setMessage('Welfare stock record saved. Balance recalculated automatically.'); setEntry(x=>({...x,quantity:'',supplier:'',reference:'',batchNumber:'',expiryDate:'',notes:''})); await load() }
    catch(e){ setError(e instanceof Error ? e.message : 'Unable to save transaction.') } finally { setBusy(false) }
  }
  async function saveCommodity(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try { await createWelfareCommodity({name:newCommodity.name,category:newCommodity.category,unit:newCommodity.unit,reorderLevel:Number(newCommodity.reorderLevel||0)}); setNewCommodity({name:'',category:'Food',unit:'kg',reorderLevel:''}); setMessage('Commodity added to the welfare register.'); await load() }
    catch(e){ setError(e instanceof Error ? e.message : 'Unable to create commodity.') } finally { setBusy(false) }
  }

  return <div className="welfare-workspace">
    <div className="welfare-heading">
      <div><span className="eyebrow">WELFARE • KITCHEN & COMMODITIES</span><h4>Daily Welfare Stock Ledger</h4><p>Receipts, consumption, wastage and adjustments are recorded as transactions. Closing balances are calculated, not typed.</p></div>
      <div className="welfare-total"><span>Recorded usage</span><strong>{totals.used.toLocaleString()} units</strong></div>
    </div>
    {message && <div className="success">{message}</div>}{error && <div className="error">{error}</div>}
    <div className="welfare-grid">
      <form className="welfare-card" onSubmit={saveTransaction}>
        <div className="panel-heading"><div><span className="eyebrow">DAILY ENTRY</span><h4>Record stock movement</h4></div></div>
        <div className="welfare-form-grid">
          <label>Date<input type="date" value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})}/></label>
          <label>Commodity<select value={entry.commodityId} onChange={e=>setEntry({...entry,commodityId:e.target.value})}>{commodities.map(c=><option key={c.id} value={c.id}>{c.name} ({c.unit})</option>)}</select></label>
          <label>Movement<select value={entry.type} onChange={e=>setEntry({...entry,type:e.target.value})}><option value="Consumption">Used</option><option value="Receipt">Received</option><option value="Wastage">Wastage</option><option value="Adjustment">Adjustment</option></select></label>
          <label>Quantity<input type="number" min="0.001" step="0.001" value={entry.quantity} onChange={e=>setEntry({...entry,quantity:e.target.value})} required/></label>
          {entry.type==='Receipt' && <><label>Supplier<input value={entry.supplier} onChange={e=>setEntry({...entry,supplier:e.target.value})}/></label><label>Reference<input value={entry.reference} onChange={e=>setEntry({...entry,reference:e.target.value})}/></label><label>Batch/Lot<input value={entry.batchNumber} onChange={e=>setEntry({...entry,batchNumber:e.target.value})}/></label><label>Expiry<input type="date" value={entry.expiryDate} onChange={e=>setEntry({...entry,expiryDate:e.target.value})}/></label></>}
          <label className="welfare-full">Notes<textarea rows={2} value={entry.notes} onChange={e=>setEntry({...entry,notes:e.target.value})}/></label>
        </div>
        {canManage && <button className="primary-button" disabled={busy || !entry.commodityId}>{busy?'Saving…':'Record movement'}</button>}
      </form>
      <form className="welfare-card" onSubmit={saveCommodity}>
        <div className="panel-heading"><div><span className="eyebrow">REGISTER</span><h4>Add welfare commodity</h4></div></div>
        <div className="welfare-form-grid">
          <label>Name<input value={newCommodity.name} onChange={e=>setNewCommodity({...newCommodity,name:e.target.value})} required placeholder="e.g. Maize flour"/></label>
          <label>Category<input value={newCommodity.category} onChange={e=>setNewCommodity({...newCommodity,category:e.target.value})} required/></label>
          <label>Unit<input value={newCommodity.unit} onChange={e=>setNewCommodity({...newCommodity,unit:e.target.value})} required placeholder="kg, L, bags"/></label>
          <label>Reorder level<input type="number" min="0" step="0.001" value={newCommodity.reorderLevel} onChange={e=>setNewCommodity({...newCommodity,reorderLevel:e.target.value})}/></label>
        </div>
        {canManage && <button className="secondary-button" disabled={busy}>Add commodity</button>}
      </form>
    </div>
    <div className="welfare-card">
      <div className="welfare-toolbar"><div><span className="eyebrow">LEDGER</span><h4>Daily records</h4></div><div className="welfare-filters"><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label>Commodity<select value={commodityId} onChange={e=>setCommodityId(e.target.value)}><option value="">All commodities</option>{commodities.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Commodity</th><th>Unit</th><th>Opening</th><th>Received</th><th>Used</th><th>Wastage</th><th>Adjustment</th><th>Balance</th><th>Status</th></tr></thead><tbody>{rows.map(r=><tr key={r.date+'-'+r.commodityId}><td>{r.date}</td><td><strong>{r.commodity}</strong></td><td>{r.unit}</td><td>{r.opening}</td><td>{r.received}</td><td>{r.used}</td><td>{r.wastage}</td><td>{r.adjustment}</td><td><strong>{r.balance}</strong></td><td><span className={r.balance<=r.reorderLevel?'stock-badge empty-stock':'stock-badge'}>{r.balance<=r.reorderLevel?'Low stock':'Healthy'}</span></td></tr>)}{rows.length===0&&<tr><td colSpan={10}><div className="empty">No welfare movements recorded for the selected period.</div></td></tr>}</tbody></table></div>
    </div>
  </div>
}