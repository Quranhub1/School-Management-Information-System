import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, BriefcaseBusiness, ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, Library, LogOut, MessageSquare, Package, Settings, Stethoscope, UsersRound, WalletCards } from 'lucide-react'
import type { FormEvent } from 'react'
import { getSession, login, logout } from './api/auth'
import { canManageAcademics, canManageAdministration, canManageAdmissions, canManageFinance, canManageStudents, canManageStaff, canReadStaff, canReadLibrary, canManageLibrary, canManageCommunication, canManageReporting, canManageInventory, canViewAnalytics, canManageAttendance } from './auth/roleGuards'
import { AcademicManagement } from './components/AcademicManagement'; import { AdministrationManagement } from './components/AdministrationManagement'; import { AdmissionsStudentManagement } from './components/AdmissionsStudentManagement'; import { FinanceManagement } from './components/FinanceManagement'; import { StaffManagement } from './components/StaffManagement'; import { LibraryManagementWorkspace } from './components/LibraryManagementWorkspace'; import { Announcements } from './components/Announcements'; import { ReportCards } from './components/ReportCards'; import { Receipts } from './components/Receipts'; import { CertificateManagement } from './components/CertificateManagement'; import { InventoryManagement } from './components/InventoryManagement'; import { GlobalSearch } from './components/GlobalSearch'; import { AnalyticsDashboard } from './components/AnalyticsDashboard'; import { AdminDashboard } from './components/AdminDashboard'; import { HealthRecordsManagement } from './components/HealthRecordsManagement'; import { GuildManagement } from './components/GuildManagement'; import { AttendanceManagement } from './components/AttendanceManagement'; import { getPublicInstitutionSettings, type InstitutionSettings } from './api/institutionSettings'; import './components/PrintStyles.css'
type ModuleKey = 'dashboard' | 'administration' | 'students' | 'academics' | 'finance' | 'staff' | 'attendance' | 'library' | 'health' | 'laboratories' | 'inventory' | 'communication' | 'guild' | 'reports' | 'system-administration'
const DEFAULT_INSTITUTION: InstitutionSettings = { id: '', institutionName: 'Your Institution Name', abbreviation: '', motto: '', address: '', phone: '', email: '', website: '', postalAddress: '', country: '', institutionType: '', logoPath: null, primaryColor: null, accentColor: null, isActive: false, updatedAt: '' }
function LoginScreen({ onLogin, institution }: { onLogin: () => void; institution: InstitutionSettings }) { const [username,setUsername]=useState(''); const [password,setPassword]=useState(''); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const brandName=institution.institutionName?.trim()||'Your Institution Name'; async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError('');try{await login(username.trim(),password);onLogin()}catch(e){setError(e instanceof Error?e.message:'Unable to sign in.')}finally{setLoading(false)}} return <main className="auth-shell"><section className="auth-card">{institution.logoPath&&<div style={{textAlign:'center',marginBottom:16}}><img src={institution.logoPath} alt={brandName} style={{maxHeight:80,maxWidth:160,objectFit:'contain'}} /></div>}<p className="eyebrow">{institution.abbreviation?.trim()||'Secure access'}</p><h1>Sign in to {brandName}</h1><p className="auth-copy">{brandName} Management Information System</p><form onSubmit={submit} className="auth-form"><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" /><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" />{error&&<div className="error" role="alert">{error}</div>}<button type="submit" disabled={loading}>{loading?'Signing in…':'Sign in'}</button></form><p style={{textAlign:'center',marginTop:16,fontSize:13}}><a href="/privacy-policy.html">Privacy Policy</a></p></section></main> }
function AuthenticatedWorkspace({ onLogout, institution }: { onLogout: () => void; institution: InstitutionSettings }) { const s=getSession(); const r=s?.roles??[]; const a=canManageAdministration(r),ad=canManageAdmissions(r),ac=canManageAcademics(r),st=canManageStudents(r),fi=canManageFinance(r),sr=canReadStaff(r),sm=canManageStaff(r),lr=canReadLibrary(r),lm=canManageLibrary(r),cm=canManageCommunication(r),rp=canManageReporting(r),inv=canManageInventory(r),att=canManageAttendance(r)||r.includes('SystemAdministrator'); const s360=r.includes('SystemAdministrator')||r.includes('Registrar')||r.includes('AcademicRegistrar')||r.includes('Student'); const analytics=canViewAnalytics(r); const lecturer=r.includes('Lecturer'); const sessionUsername=s?.username?.trim()||'anonymous'; const stateKey=`smis.workspace.${sessionUsername}`; const storedModule=localStorage.getItem(stateKey); const [activeModule,setActiveModule]=useState<ModuleKey>(()=>{const allowed=new Set<ModuleKey>(['dashboard','administration','students','academics','finance','staff','attendance','library','health','laboratories','inventory','communication','guild','reports','system-administration']); return storedModule&&allowed.has(storedModule as ModuleKey)?storedModule as ModuleKey:'dashboard'}); useEffect(()=>{localStorage.setItem(stateKey,activeModule)},[stateKey,activeModule]);useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent<ModuleKey>).detail;if(detail)setActiveModule(detail)};window.addEventListener('smis:navigate-module',handler);return()=>window.removeEventListener('smis:navigate-module',handler)},[]); function signOut(){localStorage.setItem(stateKey,activeModule);logout();onLogout()} const iconByModule:Record<ModuleKey,LucideIcon>={
  dashboard:LayoutDashboard,
  administration:BriefcaseBusiness,
  students:UsersRound,
  academics:GraduationCap,
  finance:WalletCards,
  staff:BriefcaseBusiness,
  attendance:ClipboardCheck,
  library:Library,
  health:Stethoscope,
  laboratories:Package,
  inventory:Package,
  communication:MessageSquare,
  guild:UsersRound,
  reports:BarChart3,
  'system-administration':Settings
};
const moduleLabels:Record<ModuleKey,string>={
  dashboard:'Dashboard',
  administration:'Administration',
  students:'Students',
  academics:'Academic Management',
  finance:'Finance & Accounting',
  staff:'Staff & HR',
  attendance:'Attendance',
  library:'Library',
  health:'Health & Clinical',
  laboratories:'Hostel & Welfare',
  inventory:'Inventory & Property',
  communication:'Communication',
  guild:'Guild',
  reports:'Reports & Analytics',
  'system-administration':'System Administration'
};
const [activeSubsection,setActiveSubsection]=useState<string|null>(null);
const [openSidebarGroups,setOpenSidebarGroups]=useState<Record<string,boolean>>({
  Administration:true,
  Academic:true,
  Operations:true,
  'Reports & Settings':true
});
function navigate(module:ModuleKey, subsection?:string){
  setActiveModule(module);
  setActiveSubsection(subsection??null);
  if(subsection) window.dispatchEvent(new CustomEvent('smis:navigate-subsection',{detail:{module,subsection}}));
}
type SidebarItem={label:string;module:ModuleKey;subsection?:string;child?:boolean};
type SidebarGroup={label:string;items:SidebarItem[];alwaysOpen?:boolean};
const sidebarGroups:SidebarGroup[]=[
  {label:'Main',alwaysOpen:true,items:[
    {label:'Dashboard',module:'dashboard'}
  ]},
  {label:'Administration',items:[
    {label:'Access Control',module:'administration'},
    {label:'Users',module:'administration',subsection:'users',child:true},
    {label:'Roles',module:'administration',subsection:'roles',child:true},
    {label:'Settings',module:'administration',subsection:'settings',child:true},
    {label:'Staff & HR',module:'staff'}
  ]},
  {label:'Academic',items:[
    {label:'Students',module:'students'},
    {label:'Registration',module:'students',subsection:'registration',child:true},
    {label:'Records',module:'students',subsection:'records',child:true},
    {label:'Academic Management',module:'academics'},
    {label:'Classes',module:'academics',subsection:'classes',child:true},
    {label:'Courses',module:'academics',subsection:'courses',child:true},
    {label:'Health & Clinical',module:'health'},
    {label:'Medical Records',module:'health',subsection:'medical-records',child:true},
    {label:'Clinic',module:'health',subsection:'clinic',child:true},
    {label:'Library',module:'library'}
  ]},
  {label:'Operations',items:[
    {label:'Finance & Accounting',module:'finance'},
    {label:'Attendance',module:'attendance'},
    {label:'Hostel & Welfare',module:'laboratories'},
    {label:'Inventory & Property',module:'inventory'},
    {label:'Guild',module:'guild'},
    {label:'Communication',module:'communication'}
  ]},
  {label:'Reports & Settings',items:[
    {label:'Reports & Analytics',module:'reports'},
    {label:'System Administration',module:'system-administration'},
    {label:'Logs',module:'system-administration',subsection:'logs',child:true},
    {label:'Backups',module:'system-administration',subsection:'backups',child:true},
    {label:'Settings',module:'system-administration',subsection:'settings',child:true}
  ]}
];
function canSeeSidebarItem(item:SidebarItem){
  if(item.module==='dashboard') return true;
  if(item.module==='administration') return a;
  if(item.module==='students') return st || ad || s360;
  if(item.module==='academics') return ac || lecturer;
  if(item.module==='finance') return fi;
  if(item.module==='staff') return sr;
  if(item.module==='attendance') return att;
  if(item.module==='library') return lr;
  if(item.module==='health') return att || r.includes('Nurse') || r.includes('ClinicalInstructor') || r.includes('SystemAdministrator');
  if(item.module==='laboratories') return inv;
  if(item.module==='inventory') return inv;
  if(item.module==='communication') return cm;
  if(item.module==='guild') return st || r.includes('Guild') || r.includes('SystemAdministrator');
  if(item.module==='reports') return rp || analytics;
  if(item.module==='system-administration') return a;
  return false;
}
const visibleSidebarGroups=sidebarGroups.map(group=>({
  ...group,
  items:group.items.filter(canSeeSidebarItem)
})).filter(group=>group.items.length>0);

return <main className="app-shell">
  <aside className="sidebar">
    <div className="sidebar-brand">
      {institution.logoPath&&<img src={institution.logoPath} alt="" className="sidebar-logo" />}
      <div>
        <span className="sidebar-kicker">SMIS</span>
        <h1>{institution.institutionName}</h1>
        {institution.motto&&<p>{institution.motto}</p>}
      </div>
    </div>
    <nav className="sidebar-nav" aria-label="Primary navigation">
      {visibleSidebarGroups.map(group=>{
        const open=group.alwaysOpen||openSidebarGroups[group.label];
        const toggle=()=>{if(!group.alwaysOpen)setOpenSidebarGroups(current=>({...current,[group.label]:!open}))};
        return <section key={group.label} className="sidebar-nav-group">
          <button type="button" className={`sidebar-group-heading ${group.alwaysOpen?'static':''}`} onClick={toggle} aria-expanded={group.alwaysOpen?true:open}>
            <span>{group.label}</span>
            {!group.alwaysOpen&&<ChevronDown size={14} className={open?'open':''} aria-hidden="true" />}
          </button>
          {open&&<div className="sidebar-group-items">
            {group.items.map(item=>{
              const Icon=iconByModule[item.module];
              const isModuleActive=activeModule===item.module;
              const isItemActive=item.subsection ? isModuleActive&&activeSubsection===item.subsection : isModuleActive&&activeSubsection===null;
              return <button
                key={`${group.label}-${item.label}`}
                type="button"
                className={`sidebar-item ${item.child?'sidebar-child-item':'sidebar-parent-item'} ${isItemActive?'active':''}`}
                onClick={()=>navigate(item.module,item.subsection)}
                aria-current={isItemActive?'page':undefined}
              >
                {item.child
                  ? <span className="sidebar-child-marker" aria-hidden="true">└</span>
                  : <Icon size={18} strokeWidth={isItemActive?2.2:1.8} aria-hidden="true"/>}
                <span>{item.label}</span>
              </button>
            })}
          </div>}
        </section>
      })}
    </nav>
    <div className="sidebar-footer"><div className="sidebar-account"><div className="sidebar-account-avatar">{(sessionUsername[0]||'U').toUpperCase()}</div><div className="sidebar-account-copy"><strong>{sessionUsername}</strong><span>{r[0]||'User'}</span></div><button type="button" className="sidebar-logout" onClick={signOut} aria-label="Sign out"><LogOut size={16}/></button></div><a href="/privacy-policy.html">Privacy Policy</a></div>
  </aside>
  <div className="main-content"><header className="topbar"><div className="topbar-context"><div className="topbar-context-label"><strong>{(moduleLabels[activeModule]||'Dashboard').toUpperCase()}</strong></div></div><GlobalSearch/></header><AnimatePresence mode="wait" initial={false}><motion.div key={activeModule} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="content">{activeModule==='dashboard'&&<>{a?<AdminDashboard/>:<AnalyticsDashboard/>}</>}
{activeModule==='administration'&&a&&<AdministrationManagement/>}
{activeModule==='students'&&(st||ad||s360)&&<AdmissionsStudentManagement canManage={st||ad}/>}
{activeModule==='academics'&&(ac||lecturer)&&<AcademicManagement canManage={ac}/>}
{activeModule==='finance'&&fi&&<FinanceManagement/>}
{activeModule==='staff'&&sr&&<StaffManagement canManage={sm}/>}
{activeModule==='attendance'&&att&&<AttendanceManagement/>}
{activeModule==='library'&&lr&&<LibraryManagementWorkspace canManage={lm}/>}
{activeModule==='health'&&(att||r.includes('Nurse')||r.includes('ClinicalInstructor')||r.includes('SystemAdministrator'))&&<HealthRecordsManagement/>}
{activeModule==='laboratories'&&inv&&<InventoryManagement canManage={inv} initialTab="laboratories"/>}
{activeModule==='inventory'&&inv&&<InventoryManagement canManage={inv}/>}
{activeModule==='communication'&&cm&&<Announcements canManage={cm}/>}
{activeModule==='guild'&&(st||r.includes('Guild')||r.includes('SystemAdministrator'))&&<GuildManagement/>}
{activeModule==='reports'&&(rp||analytics)&&<div><div className="library-workspace-tabs" style={{marginBottom:18}}><button className={rptTab==='cards'?'active':''} onClick={()=>setRptTab('cards')}>Report Cards</button><button className={rptTab==='receipts'?'active':''} onClick={()=>setRptTab('receipts')}>Receipts</button><button className={rptTab==='certificates'?'active':''} onClick={()=>setRptTab('certificates')}>Certificates</button><button className={rptTab==='analytics'?'active':''} onClick={()=>setRptTab('analytics')}>Analytics</button></div>{rptTab==='cards'&&rp&&<ReportCards canManage/>}{rptTab==='receipts'&&rp&&<Receipts canManage/>}{rptTab==='certificates'&&rp&&<CertificateManagement canManage/>}{rptTab==='analytics'&&analytics&&<AnalyticsDashboard/>}</div>}
{activeModule==='system-administration'&&a&&<AdministrationManagement/>}</motion.div></AnimatePresence></div></main> }
function App(){const[authed,setAuthed]=useState(()=>Boolean(getSession()));const[institution,setInstitution]=useState<InstitutionSettings>(DEFAULT_INSTITUTION);const[loading,setLoading]=useState(true);useEffect(()=>{const root=document.documentElement;const primary=institution.primaryColor||'#1e40af';const accent=institution.accentColor||'#f97316';root.style.setProperty('--brand-primary',primary);root.style.setProperty('--brand-accent',accent);root.style.setProperty('--brand-primary-soft',primary+'18');root.style.setProperty('--brand-accent-soft',accent+'18');document.title=institution.institutionName?.trim()||'School Management Information System'},[institution]);useEffect(()=>{void getPublicInstitutionSettings().then(setInstitution).catch(()=>setInstitution(DEFAULT_INSTITUTION)).finally(()=>setLoading(false))},[]);if(loading)return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">Management Information System</p><h1>Loading…</h1></section></main>;return authed?<AuthenticatedWorkspace onLogout={()=>setAuthed(false)} institution={institution}/>:<LoginScreen onLogin={()=>setAuthed(true)} institution={institution}/>} export default App
