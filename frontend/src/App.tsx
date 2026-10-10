import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, BriefcaseBusiness, ChevronDown, ClipboardCheck, GraduationCap, LayoutDashboard, Library, LogOut, Megaphone, MessageSquare, Package, Settings, ShieldCheck, Stethoscope, UsersRound, WalletCards } from 'lucide-react'
import type { FormEvent } from 'react'
import { getSession, logout, saveAuthSession } from './api/auth'
import { canManageAcademics, canManageAdministration, canManageAdmissions, canManageFinance, canAccessFinance, canManageStudents, canManageStaff, canReadStaff, canReadLibrary, canManageLibrary, canManageCommunication, canManageReporting, canManageInventory, canViewAnalytics, canManageAttendance, canReadAttendance, canReadOnlyFinance } from './auth/roleGuards'
import { AcademicManagement } from './components/AcademicManagement'; import { HostelManagement } from './components/HostelManagement'; import { AdministrationManagement } from './components/AdministrationManagement'; import { AdmissionsStudentManagement } from './components/AdmissionsStudentManagement'; import { FinanceManagement } from './components/FinanceManagement'; import { StaffManagement } from './components/StaffManagement'; import { LibraryManagementWorkspace } from './components/LibraryManagementWorkspace'; import { Announcements } from './components/Announcements'; import { ReportCards } from './components/ReportCards'; import { Receipts } from './components/Receipts'; import { CertificateManagement } from './components/CertificateManagement'; import { InventoryManagement } from './components/InventoryManagement'; import { GlobalSearch } from './components/GlobalSearch'; import { AnalyticsDashboard } from './components/AnalyticsDashboard'; import { AdminDashboard } from './components/AdminDashboard'; import { HealthRecordsManagement } from './components/HealthRecordsManagement'; import { GuildManagement } from './components/GuildManagement'; import { AttendanceManagement } from './components/AttendanceManagement'; import { RoleSpecificDashboard } from './components/RoleSpecificDashboard'; import { ResidentDirectorHRDashboard } from './components/ResidentDirectorHRDashboard'; import { DirectorExecutiveDashboard } from './components/DirectorExecutiveDashboard'; import { PrincipalDashboard } from './components/PrincipalDashboard'; import type { InstitutionSettings } from './api/institutionSettings'
import { InstitutionSettingsProvider, useInstitutionSettings } from './components/InstitutionSettingsContext'; import './components/PrintStyles.css'
type ModuleKey = 'dashboard' | 'administration' | 'students' | 'academics' | 'finance' | 'staff' | 'attendance' | 'library' | 'health' | 'laboratories' | 'inventory' | 'communication' | 'guild' | 'reports' | 'system-administration'
const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '')
function institutionLogoUrl(settings: InstitutionSettings): string {
  const path = settings.logoPath?.trim()

  if (path) {
    return path.startsWith('http')
      ? path
      : `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`
  }

  return `${API_BASE_URL}/api/public/institution-settings/logo`
}
function institutionShortName(settings: InstitutionSettings): string {
  return settings.abbreviation?.trim() ?? ''
}
function LoginScreen({ institution }: { institution: InstitutionSettings }) {
  const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '')
  const loginSrc = apiBaseUrl
    ? `/institution-login.html?api=${encodeURIComponent(apiBaseUrl)}`
    : '/institution-login.html'

  return (
    <main className="institution-login-host">
      <iframe
        className="institution-login-frame"
        src={loginSrc}
        title="Institutional Sign In"
        allow="clipboard-read; clipboard-write"
        onLoad={(event) => {
          event.currentTarget.contentWindow?.postMessage(
            { type: 'smis-institution-branding', settings: institution },
            window.location.origin,
          )
        }}
      />
    </main>
  )
}
function AuthenticatedWorkspace({ onLogout, institution, onInstitutionSaved }: { onLogout: () => void; institution: InstitutionSettings; onInstitutionSaved: (settings: InstitutionSettings) => void }) { const s=getSession(); const r=s?.roles??[]; const a=canManageAdministration(r),ad=canManageAdmissions(r),ac=canManageAcademics(r),st=canManageStudents(r),fi=canAccessFinance(r),sr=canReadStaff(r),sm=canManageStaff(r),lr=canReadLibrary(r),lm=canManageLibrary(r),cm=canManageCommunication(r),rp=canManageReporting(r),inv=canManageInventory(r),attManage=canManageAttendance(r)||r.includes('SystemAdministrator'),att=canReadAttendance(r)||r.includes('SystemAdministrator'); const s360=r.includes('SystemAdministrator')||r.includes('Registrar')||r.includes('AcademicRegistrar')||r.includes('AdmissionsOfficer')||r.includes('Student'); const studentRead=r.includes('Director')||r.includes('ResidentDirector')||r.includes('Secretary')||r.includes('HeadOfDepartment'); const admissionRead=ad||r.includes('ResidentDirector')||r.includes('Secretary')||r.includes('HeadOfDepartment')||r.includes('Receptionist')||r.includes('HR Manager')||r.includes('Records Officer'); const analytics=canViewAnalytics(r); const lecturer=r.includes('Lecturer'); const sessionUsername=s?.username?.trim()||'anonymous'; const stateKey=`smis.workspace.${sessionUsername}`; const storedModule=localStorage.getItem(stateKey); const [activeModule,setActiveModule]=useState<ModuleKey>(()=>{const allowed=new Set<ModuleKey>(['dashboard','administration','students','academics','finance','staff','attendance','library','health','laboratories','inventory','communication','guild','reports','system-administration']); return storedModule&&allowed.has(storedModule as ModuleKey)?storedModule as ModuleKey:'dashboard'}); useEffect(()=>{localStorage.setItem(stateKey,activeModule)},[stateKey,activeModule]);useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent<ModuleKey>).detail;if(detail)setActiveModule(detail)};window.addEventListener('smis:navigate-module',handler);return()=>window.removeEventListener('smis:navigate-module',handler)},[]); function signOut(){localStorage.setItem(stateKey,activeModule);logout();onLogout()} const iconByModule:Record<ModuleKey,LucideIcon>={
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
  communication:Megaphone,
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
  communication:'Announcements',
  guild:'Guild',
  reports:'Reports & Analytics',
  'system-administration':'System Administration'
};
const [activeSubsection,setActiveSubsection]=useState<string|null>(null);
const [rptTab,setRptTab]=useState<'cards'|'receipts'|'certificates'|'analytics'>('cards');
const [openSidebarGroups,setOpenSidebarGroups]=useState<Record<string,boolean>>({
  Administration:true,
  Academic:true,
  Operations:true,
  Reports:true
});
const userInitials = useMemo(() => {
  if (!sessionUsername || typeof sessionUsername !== "string") return "U";
  const words = sessionUsername.trim().replace(/[_-]/g, " ").split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}, [sessionUsername]);

function navigate(module:ModuleKey, subsection?:string){
  // System Administration remains warning-only for non-administrators.
  if (module === 'system-administration' && !r.includes('SystemAdministrator')) {
    setActiveSubsection(null);
    setActiveModule(module);
    return;
  }
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
    {label:'Staff & HR',module:'staff'},
    {label:'Staff',module:'staff',subsection:'staff',child:true},
    {label:'Payroll',module:'staff',subsection:'payroll',child:true},
    {label:'Leave',module:'staff',subsection:'leave',child:true},
    {label:'Recruitment',module:'staff',subsection:'recruitment',child:true},
    {label:'System Administration',module:'system-administration'},
    {label:'Logs',module:'system-administration',subsection:'logs',child:true},
    {label:'Backups',module:'system-administration',subsection:'backups',child:true},
    {label:'Settings',module:'system-administration',subsection:'settings',child:true}
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
    {label:'Inventory & Property',module:'inventory'}
  ]},
  {label:'Student Affairs',items:[
    {label:'Guild',module:'guild'},
    {label:'Announcements',module:'communication'},
    {label:'Hostel & Welfare',module:'laboratories'}
  ]},
  {label:'Reports',items:[
    {label:'Reports & Analytics',module:'reports'}
  ]}
];
function canSeeSidebarItem(item:SidebarItem){
  if(item.module==='dashboard') return true;
  if(item.module==='administration') return a;
  if(item.module==='students') return st || ad || s360 || studentRead || admissionRead || r.includes('HR Manager') || r.includes('Records Officer');
  if(item.module==='academics') return ac || lecturer || r.includes('HeadOfDepartment') || r.includes('HR Manager') || r.includes('AssistantPrincipal') || r.includes('Principal');
  if(item.module==='finance') return fi;
  if(item.module==='staff') return sr || r.includes('HeadOfDepartment') || r.includes('HR Manager') || r.includes('Records Officer');
  if(item.module==='attendance') return att;
  if(item.module==='library') return lr;
  if(item.module==='health') return att || r.includes('Nurse') || r.includes('ClinicalInstructor') || r.includes('SystemAdministrator') || r.includes('HR Manager');
  if(item.module==='laboratories') return inv || r.includes('HostelWarden') || r.includes('SystemAdministrator') || r.includes('HR Manager');
  if(item.module==='inventory') return inv;
  if(item.module==='communication') return cm || r.includes('HR Manager');
  if(item.module==='guild') return st || r.includes('Guild') || r.includes('SystemAdministrator') || r.includes('HR Manager');
  if(item.module==='reports') return rp || analytics;
  if(item.module==='system-administration') return r.includes('SystemAdministrator');
  return false;
}
const visibleSidebarGroups=sidebarGroups.map(group=>({
  ...group,
  items:group.items.filter(canSeeSidebarItem)
})).filter(group=>group.items.length>0);

useEffect(() => {
  if (!activeModule) return;
  visibleSidebarGroups.forEach(group => {
    const containsActiveItem = group.items?.some(item => {
      if (item.module !== activeModule) return false;
      if (activeSubsection) return item.subsection === activeSubsection;
      return true;
    });
    if (containsActiveItem && !group.alwaysOpen && !openSidebarGroups[group.label]) {
      setOpenSidebarGroups(current => ({ ...current, [group.label]: true }));
    }
  });
}, [activeModule, activeSubsection, visibleSidebarGroups]);

return <main className="app-shell">
  <div className="institution-watermark" aria-hidden="true">
    <img src={institutionLogoUrl(institution)} alt="" />
    <span>{institution.institutionName}</span>
  </div>
  <aside className="flex flex-col w-72 h-screen bg-white/65 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_30px_rgba(30,41,59,0.06)] font-sans text-slate-700 select-none">
    <div className="flex items-center gap-3.5 px-6 py-6 border-b border-white/60 group cursor-pointer">
      {institution && (
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <img src={institutionLogoUrl(institution)} alt={institution.institutionName + " Logo"} className="relative w-11 h-11 rounded-xl object-cover shadow-sm ring-1 ring-slate-900/10 group-hover:scale-105 group-hover:-rotate-3 transition-all duration-300" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        </div>
      )}
      <div className="flex flex-col min-w-0 overflow-hidden">
        <span className="text-[10px] font-extrabold tracking-widest text-blue-600 uppercase mb-0.5 group-hover:text-blue-500 transition-colors truncate">{institutionShortName(institution)}</span>
        <h1 className="text-sm font-bold text-slate-900 truncate leading-tight group-hover:text-blue-950 transition-colors">{institution.institutionName}</h1>
        {institution.motto && <p className="text-xs font-medium text-slate-500 truncate mt-0.5">{institution.motto}</p>}
      </div>
    </div>

    <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-6" aria-label="Primary navigation">
      {visibleSidebarGroups.map((group, groupIdx) => {
        const open = group.alwaysOpen || !!openSidebarGroups[group.label];
        const groupId = "sidebar-group-" + groupIdx;
        const toggle = () => {
          if (!group.alwaysOpen) setOpenSidebarGroups(current => ({ ...current, [group.label]: !open }));
        };

        return (
          <section key={group.label} className="flex flex-col">
            {group.alwaysOpen ? (
              <div className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-bold tracking-wider uppercase text-slate-400 cursor-default">
                <span>{group.label}</span>
              </div>
            ) : (
              <button type="button" className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 rounded-md group text-slate-500 hover:text-indigo-600 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" onClick={toggle} aria-expanded={open} aria-controls={groupId}>
                <span className="transition-transform duration-300 origin-left group-hover:scale-105">{group.label}</span>
                <ChevronDown size={14} className={"transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] text-slate-400 group-hover:text-indigo-500 " + (open ? "rotate-180" : "rotate-0")} aria-hidden="true" />
              </button>
            )}

            <div id={groupId} className={"grid transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] " + (open ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none")}>
              <div className="flex flex-col overflow-hidden space-y-1">
                {group.items?.map(item => {
                  const Icon = iconByModule?.[item.module] || LayoutDashboard;
                  const isModuleActive = activeModule === item.module;
                  const isItemActive = item.subsection ? isModuleActive && activeSubsection === item.subsection : isModuleActive && !activeSubsection;
                  return (
                    <button key={group.label + "-" + item.label + "-" + (item.subsection || "root")} type="button" onClick={() => navigate(item.module, item.subsection)} aria-current={isItemActive ? "page" : undefined}
                      className={[
                        "group relative flex items-center w-full text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] text-left",
                        item.child ? "py-2 pr-3 pl-9 rounded-r-xl border-l-2" : "py-2.5 px-3 gap-3 rounded-xl",
                        isItemActive
                          ? (item.child ? "border-blue-500 bg-blue-50/70 text-blue-700 font-semibold" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/25")
                          : (item.child ? "border-slate-200/70 text-slate-500 hover:border-blue-300 hover:bg-white/70 hover:text-blue-700 hover:translate-x-1" : "text-slate-600 hover:bg-white/70 hover:text-slate-900 hover:translate-x-1")
                      ].join(" ")}
                    >
                      {!item.child && !isItemActive && <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-400 rounded-r-full opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-300 origin-center"></span>}
                      {!item.child && <Icon size={18} strokeWidth={isItemActive ? 2.5 : 2} className={"transition-all duration-300 flex-shrink-0 " + (isItemActive ? "text-white" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110 group-hover:-rotate-3")} aria-hidden="true" />}
                      <span className="relative z-10 truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </nav>

    <div className="p-4 mt-auto border-t border-white/60 bg-white/40 backdrop-blur-xl">
      <div className="group flex items-center p-2 transition-all duration-300 rounded-xl hover:bg-white/80 hover:shadow-[0_4px_20px_rgba(30,41,59,0.06)] ring-1 ring-transparent hover:ring-white/80 cursor-pointer">
        <div className="relative flex items-center justify-center flex-shrink-0 w-9 h-9 font-bold text-xs text-blue-700 bg-blue-100 rounded-full shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
          {userInitials}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full transition-transform duration-300 group-hover:scale-110"></div>
        </div>
        <div className="flex flex-col min-w-0 ml-3 mr-auto transition-transform duration-300 group-hover:translate-x-1 text-left">
          <span className="text-sm font-bold text-slate-900 truncate">{sessionUsername || "Guest User"}</span>
          <span className="text-xs font-medium text-slate-500 truncate capitalize group-hover:text-indigo-500 transition-colors duration-300">{r?.[0] || "User"}</span>
        </div>
        <button type="button" className="p-2 ml-1 text-slate-400 transition-all duration-300 rounded-lg hover:text-white hover:bg-red-500 hover:shadow-md hover:shadow-red-200 hover:-rotate-12 hover:scale-110 active:scale-95 focus:outline-none" onClick={signOut} title="Sign out" aria-label="Sign out">
          <LogOut size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </aside>
  <div className="main-content"><header className="topbar"><div className="topbar-context"><div className="topbar-context-label"><strong>{(moduleLabels[activeModule]||'Dashboard').toUpperCase()}</strong></div></div><GlobalSearch/></header><AnimatePresence mode="wait" initial={false}><motion.div key={activeModule} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="content">{activeModule==='dashboard'&&<>{r.includes('Director')?<DirectorExecutiveDashboard onNavigate={m=>navigate(m)}/>:r.includes('ResidentDirector')?<ResidentDirectorHRDashboard onNavigate={m=>navigate(m)}/>:r.includes('Secretary')?<RoleSpecificDashboard role="Secretary" onNavigate={m=>navigate(m)}/>:r.includes('Receptionist')?<RoleSpecificDashboard role="Receptionist" onNavigate={m=>navigate(m)}/>:r.includes('HeadOfDepartment')?<RoleSpecificDashboard role="HeadOfDepartment" onNavigate={m=>navigate(m)}/>:r.includes('Principal')||r.includes('AssistantPrincipal')?<PrincipalDashboard/>:r.includes('HR Manager')?<ResidentDirectorHRDashboard onNavigate={m=>navigate(m)}/>:a?<AdminDashboard/>:<AnalyticsDashboard/>}</>}
{activeModule==='administration'&&a&&<AdministrationManagement onInstitutionSaved={onInstitutionSaved}/>} 
{activeModule==='students'&&(st||ad||s360||studentRead||admissionRead)&&<AdmissionsStudentManagement canManage={st||ad} readOnly={!st&&!ad} accessProfile={r.includes('Receptionist')?'receptionist':r.includes('Records Officer')?'records':r.includes('HeadOfDepartment')?'department':'general'} />} 
{activeModule==='academics'&&(ac||lecturer||r.includes('HeadOfDepartment')||r.includes('Principal')||r.includes('AssistantPrincipal'))&&<AcademicManagement canManage={ac} readOnly={!ac}/>}
{activeModule==='finance'&&fi&&<FinanceManagement readOnly={canReadOnlyFinance(r)} />}
{activeModule==='staff'&&sr&&<StaffManagement canManage={sm}/>}
{activeModule==='attendance'&&att&&<AttendanceManagement readOnly={!attManage} />}
{activeModule==='library'&&lr&&<LibraryManagementWorkspace canManage={lm}/>}
{activeModule==='health'&&(attManage||r.includes('Nurse')||r.includes('ClinicalInstructor')||r.includes('SystemAdministrator'))&&<HealthRecordsManagement/>}
{activeModule==='laboratories'&&(inv||r.includes('HostelWarden')||r.includes('ResidentDirector')||r.includes('SystemAdministrator'))&&<HostelManagement canManage={inv||r.includes('HostelWarden')||r.includes('ResidentDirector')||r.includes('SystemAdministrator')}/>}
{activeModule==='inventory'&&inv&&<InventoryManagement canManage={inv}/>}
{activeModule==='communication'&&cm&&<Announcements canManage={cm}/>}
{activeModule==='guild'&&(st||r.includes('Guild')||r.includes('SystemAdministrator'))&&<GuildManagement/>}
{activeModule==='reports'&&(rp||analytics)&&<div><div className="library-workspace-tabs" style={{marginBottom:18}}><button className={rptTab==='cards'?'active':''} onClick={()=>setRptTab('cards')}>Report Cards</button><button className={rptTab==='receipts'?'active':''} onClick={()=>setRptTab('receipts')}>Receipts</button><button className={rptTab==='certificates'?'active':''} onClick={()=>setRptTab('certificates')}>Certificates</button><button className={rptTab==='analytics'?'active':''} onClick={()=>setRptTab('analytics')}>Analytics</button></div>{rptTab==='cards'&&rp&&<ReportCards canManage/>}{rptTab==='receipts'&&rp&&<Receipts canManage/>}{rptTab==='certificates'&&rp&&<CertificateManagement canManage/>}{rptTab==='analytics'&&analytics&&<AnalyticsDashboard/>}</div>}
{activeModule==='system-administration'&&r.includes('SystemAdministrator')&&<AdministrationManagement onInstitutionSaved={onInstitutionSaved}/>}
{activeModule==='system-administration'&&!r.includes('SystemAdministrator')&&<section className="panel" role="alert" aria-labelledby="system-admin-warning-title" style={{border:'1px solid #f59e0b',background:'linear-gradient(135deg,rgba(255,251,235,.98),rgba(255,247,237,.96))',color:'#78350f',padding:24}}><div style={{display:'flex',alignItems:'flex-start',gap:14}}><span aria-hidden="true" style={{fontSize:28,lineHeight:1}}>⚠</span><div><span className="eyebrow" style={{color:'#b45309'}}>RESTRICTED SECTION</span><h2 id="system-admin-warning-title" style={{marginTop:6,color:'#78350f'}}>System Administration — Access Restricted</h2><p style={{marginTop:10,fontWeight:700}}>Warning: Changes in this section can affect the entire school management system.</p><p style={{marginTop:8}}>System administration includes institution-wide settings, user access, security and critical configuration. Unauthorized changes may disrupt school operations or compromise data integrity.</p><p style={{marginTop:8}}>Your current role cannot modify these settings. Contact the System Administrator for authorized changes.</p></div></div></section>} </motion.div></AnimatePresence></div></main> }
function App(){
  return <InstitutionSettingsProvider><AppContent/></InstitutionSettingsProvider>
}

function AppContent(){
  const[authed,setAuthed]=useState(()=>Boolean(getSession()))
  const { institution, setInstitution, loaded: institutionLoaded } = useInstitutionSettings()

  useEffect(()=>{
    const handleLoginMessage=(event:MessageEvent)=>{
      if(event.origin!==window.location.origin) return
      if(event.data?.type==='smis-institution-branding-ready') {
        const iframe = document.querySelector<HTMLIFrameElement>('.institution-login-frame')
        iframe?.contentWindow?.postMessage({ type: 'smis-institution-branding', settings: institution }, window.location.origin)
        return
      }
      if(event.data?.type!=='smis-login' || !event.data.session) return
      const session=event.data.session as Parameters<typeof saveAuthSession>[0]
      if(typeof session.accessToken!=='string' || typeof session.username!=='string' || !Array.isArray(session.roles)) return
      saveAuthSession(session)
      setAuthed(true)
    }
    window.addEventListener('message',handleLoginMessage)
    return()=>window.removeEventListener('message',handleLoginMessage)
  },[institution])

  useEffect(()=>{
    const iframe = document.querySelector<HTMLIFrameElement>('.institution-login-frame')
    iframe?.contentWindow?.postMessage(
      { type: 'smis-institution-branding', settings: institution },
      window.location.origin,
    )
    const root=document.documentElement
    const primary=institution.primaryColor||''
    const accent=institution.accentColor||''
    if(primary) root.style.setProperty('--brand-primary',primary)
    if(accent) root.style.setProperty('--brand-accent',accent)
    if(primary) root.style.setProperty('--brand-primary-soft',primary+'18')
    if(accent) root.style.setProperty('--brand-accent-soft',accent+'18')
    root.style.setProperty('--brand-institution-name', JSON.stringify(institution.institutionName || ''))
    root.style.setProperty('--brand-institution-short', JSON.stringify(institutionShortName(institution)))
    document.title=institution.institutionName.trim()
  },[institution])

  if (!institutionLoaded) return <div className="institution-login-host" aria-label="Loading institution settings" />

  return authed
    ? <AuthenticatedWorkspace onLogout={()=>setAuthed(false)} institution={institution} onInstitutionSaved={setInstitution}/>
    : <LoginScreen institution={institution}/>
}
export default App