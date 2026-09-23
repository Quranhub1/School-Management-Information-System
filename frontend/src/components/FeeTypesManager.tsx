import { useEffect, useState } from 'react'
import { applyFeeStructure, createFeeStructure, getFeeStructures, getFinanceAccounts, type FeeStructure, type FinanceAccountOption } from '../api/finance'
import { formatCurrency, SYSTEM_CURRENCY } from '../lib/currency'

type AcademicYear = { id: string; name: string; isCurrent: boolean; isActive: boolean }
type ItemDraft = { code: string; name: string; amount: string; incomeAccountId: string }

export function FeeTypesManager() {
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])\n  const [accounts, setAccounts] = useState<FinanceAccountOption[]>([])
  const [name, setName] = useState('')
  const [feeType, setFeeType] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([{ code: 'FEE', name: '', amount: '', incomeAccountId: '' }])
  const [applyAll, setApplyAll] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try { setStructures(await getFeeStructures(academicYearId || undefined)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load fee types.') }
  }
  useEffect(() => { void load() }, [academicYearId])
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    fetch('/api/academic-structure/years', { headers: { Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) } })
      .then(r => r.ok ? r.json() as Promise<AcademicYear[]> : Promise.reject(new Error('Unable to load academic years.')))
      .then(setYears).catch(() => setYears([]))
  }, [])

  function updateItem(index:number,key:keyof ItemDraft,value:string) { setItems(current=>current.map((item,i)=>i===index?{...item,[key]:value}:item)) }
  function addItem() { setItems(current=>[...current,{code:'FEE-' + (current.length+1),name:'',amount:'',incomeAccountId:''}]) }

  async function createAndMaybeApply() {
    setSaving(true); setError(''); setMessage('')
    try {
      const structure=await createFeeStructure({
        name:name.trim(), feeType:feeType.trim() || name.trim(), currency:SYSTEM_CURRENCY,
        academicYearId:academicYearId || undefined,
        items:items.map((x,i)=>({code:x.code.trim(),name:x.name.trim(),amount:Number(x.amount),incomeAccountId:x.incomeAccountId || undefined,sortOrder:i,isOptional:false}))
      })
      let result=''
      if(applyAll){ const applied=await applyFeeStructure(structure.id,{allActiveStudents:true}); result=' Applied to ' + applied.applied + ' active students; ' + applied.skipped + ' already had this fee.' }
      setMessage('Fee type “' + structure.name + '” created.' + result)
      setName(''); setFeeType(''); setItems([{code:'FEE',name:'',amount:'',incomeAccountId:''}]); await load()
    } catch(e){setError(e instanceof Error?e.message:'Unable to create fee type.')} finally {setSaving(false)}
  }

  async function apply(id:string,label:string) {
    setError(''); setMessage('')
    try { const result=await applyFeeStructure(id,{allActiveStudents:true}); setMessage('Applied ' + label + ' to ' + result.applied + ' active students; ' + result.skipped + ' already had it.'); await load() }
    catch(e){setError(e instanceof Error?e.message:'Unable to apply fee.')}
  }

  return <section className="fee-types-manager">
    <div className="panel-heading"><div><p className="eyebrow">FEE CONFIGURATION</p><h3>Add other fees to student accounts</h3><p className="finance-muted">Create a reusable fee type such as Bus Fee, Medical Insurance, Examination Fee or Development Fund, then post it to every active student account.</p></div></div>
    {error&&<div className="error" role="alert">{error}</div>}{message&&<div className="success-banner" role="status">{message}</div>}
    <div className="fee-builder">
      <div className="fee-builder-grid">
        <label>Fee name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Bus Fee" /></label>
        <label>Fee type<input value={feeType} onChange={e=>setFeeType(e.target.value)} placeholder="Transport" /></label>
        <label>Academic year<select value={academicYearId} onChange={e=>setAcademicYearId(e.target.value)}><option value="">All / not restricted</option>{years.map(y=><option key={y.id} value={y.id}>{y.name}{y.isCurrent?' · Current':''}</option>)}</select></label>
      </div>
      <div className="fee-items-list"><div className="fee-items-heading"><strong>Fee items</strong><span>Map each item to the correct revenue account when available. Total is calculated from the items, because apparently arithmetic deserves governance.</span></div>{items.map((item,i)=><div className="fee-item-row" key={i}><input value={item.code} onChange={e=>updateItem(i,'code',e.target.value)} placeholder="BUS" /><input value={item.name} onChange={e=>updateItem(i,'name',e.target.value)} placeholder="School Bus / Transport" /><input type="number" min="0.01" step="0.01" value={item.amount} onChange={e=>updateItem(i,'amount',e.target.value)} placeholder="150000" /><select value={item.incomeAccountId} onChange={e=>updateItem(i,'incomeAccountId',e.target.value)} aria-label="Revenue account"><option value="">Default student-fee revenue</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select>{items.length>1&&<button type="button" className="secondary-button" onClick={()=>setItems(items.filter((_,x)=>x!==i))}>Remove</button>}</div>)}<button type="button" className="secondary-button" onClick={addItem}>+ Add fee item</button></div>
      <label className="fee-apply-toggle"><input type="checkbox" checked={applyAll} onChange={e=>setApplyAll(e.target.checked)} /><span><strong>Post to all active students immediately</strong><small>This creates real student invoices and double-entry receivable/revenue postings. Existing applications of the same fee are skipped.</small></span></label>
      <button disabled={saving||!name.trim()||items.some(x=>!x.name.trim()||Number(x.amount)<=0)} onClick={()=>void createAndMaybeApply()}>{saving?'Saving…':'Create Fee & Post to Student Accounts'}</button>
    </div>
    <div className="panel" style={{marginTop:22}}><div className="panel-heading"><div><p className="eyebrow">ACTIVE STRUCTURES</p><h3>Configured fee types</h3></div><button className="secondary-button" onClick={()=>void load()}>Refresh</button></div><div className="table-wrap"><table><thead><tr><th>Fee</th><th>Type</th><th>Items</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{structures.map(s=><tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.feeType}</td><td>{s.items.map(i=>i.name).join(', ')}</td><td>{formatCurrency(s.totalAmount)}</td><td>{s.isActive?'Active':'Inactive'}</td><td><button className="secondary-button" onClick={()=>void apply(s.id,s.name)}>Apply to Active Students</button></td></tr>)}{structures.length===0&&<tr><td colSpan={6}>No fee structures configured yet.</td></tr>}</tbody></table></div></div>
  </section>
}
