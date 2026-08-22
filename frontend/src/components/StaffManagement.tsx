import { useEffect, useState } from 'react';
import { createStaff, deactivateStaff, listStaff, type StaffMember } from '../api/staff';

export function StaffManagement({ canManage }: { canManage: boolean }) {
  const [staff,setStaff]=useState<StaffMember[]>([]); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({staffNumber:'',firstName:'',lastName:'',nationalId:'',phoneNumber:'',email:'',employmentType:'Permanent'});
  async function load(){setLoading(true);try{setStaff(await listStaff())}catch(e){setError(e instanceof Error?e.message:'Unable to load staff.')}finally{setLoading(false)}}
  useEffect(()=>{void load()},[]);
  async function submit(e:React.FormEvent){e.preventDefault();setError('');try{await createStaff(form);setForm({staffNumber:'',firstName:'',lastName:'',nationalId:'',phoneNumber:'',email:'',employmentType:'Permanent'});await load()}catch(e){setError(e instanceof Error?e.message:'Unable to create staff.')}}
  async function deactivate(id:string){try{await deactivateStaff(id);await load()}catch(e){setError(e instanceof Error?e.message:'Unable to deactivate staff.')}}
  return <section className="panel"><div className="panel-heading"><div><span className="eyebrow">HR</span><h2>Staff Management</h2></div><span className="status">{staff.length} active</span></div>
    {canManage&&<form className="grid-form" onSubmit={submit}><input placeholder="Staff number" value={form.staffNumber} onChange={e=>setForm({...form,staffNumber:e.target.value})} required/><input placeholder="First name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} required/><input placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} required/><input placeholder="Employment type" value={form.employmentType} onChange={e=>setForm({...form,employmentType:e.target.value})} required/><input placeholder="Phone" value={form.phoneNumber} onChange={e=>setForm({...form,phoneNumber:e.target.value})}/><input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><button type="submit">Add staff member</button></form>}
    {error&&<div className="error" role="alert">{error}</div>}{loading?<p className="empty">Loading staff…</p>:<div className="table-wrap"><table><thead><tr><th>Staff No.</th><th>Name</th><th>Employment</th><th>Contact</th>{canManage&&<th>Action</th>}</tr></thead><tbody>{staff.map(s=><tr key={s.id}><td>{s.staffNumber}</td><td>{s.firstName} {s.lastName}</td><td>{s.employmentType}</td><td>{s.email||s.phoneNumber||'—'}</td>{canManage&&<td><button className="secondary-button" onClick={()=>void deactivate(s.id)}>Deactivate</button></td>}</tr>)}</tbody></table></div>}</section>
}
