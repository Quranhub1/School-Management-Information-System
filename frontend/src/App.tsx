import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Archive, BarChart3, BookOpen, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, ClipboardCheck, ClipboardList, Database, FileText, GraduationCap, HeartPulse, LayoutDashboard, Library, LogOut, Megaphone, MessageSquare, Package, Settings, Shield, ShieldCheck, SlidersHorizontal, Stethoscope, UserPlus, UserRound, UsersRound, WalletCards } from 'lucide-react'
import type { FormEvent } from 'react'
import { getSession, logout, saveAuthSession } from './api/auth'
import { getMyEffectivePermissions } from './api/permissions'
import { canManageAcademics, canManageAdministration, canManageAdmissions, canManageFinance, canAccessFinance, canManageStudents, canManageStaff, canReadStaff, canReadLibrary, canManageLibrary, canManageCommunication, canManageReporting, canManageInventory, canManageHostel, canViewAnalytics, canManageAttendance, canReadAttendance, canReadOnlyFinance, canManageTimetable, canReadTimetable, canReadPayroll, canProcessPayroll } from './auth/roleGuards'
import { CommandPalette } from './components/CommandPalette'
import { GlobalNotificationViewport } from './components/GlobalNotifications'
import type { InstitutionSettings } from './api/institutionSettings'
import { useInstitutionSettings } from './components/InstitutionSettingsContext'
import './components/PrintStyles.css'
import './workspace-loading.css'

const AcademicManagement = lazy(() => import('./components/AcademicManagement').then(module => ({ default: module.AcademicManagement })))
const AcademicStructures = lazy(() => import('./components/AcademicStructures').then(module => ({ default: module.AcademicStructures })))
const HostelManagement = lazy(() => import('./components/HostelManagement').then(module => ({ default: module.HostelManagement })))
const AdministrationManagement = lazy(() => import('./components/AdministrationManagement').then(module => ({ default: module.AdministrationManagement })))
const AdmissionsStudentManagement = lazy(() => import('./components/AdmissionsStudentManagement').then(module => ({ default: module.AdmissionsStudentManagement })))
const StudentRegistry = lazy(() => import('./components/StudentRegistry').then(module => ({ default: module.StudentRegistry })))
const FinanceManagement = lazy(() => import('./components/FinanceManagement').then(module => ({ default: module.FinanceManagement })))
const StaffManagement = lazy(() => import('./components/StaffManagement').then(module => ({ default: module.StaffManagement })))
const LibraryManagementWorkspace = lazy(() => import('./components/LibraryManagementWorkspace').then(module => ({ default: module.LibraryManagementWorkspace })))
const Announcements = lazy(() => import('./components/Announcements').then(module => ({ default: module.Announcements })))
const NoticeDashboardTicker = lazy(() => import('./components/NoticeDashboardTicker').then(module => ({ default: module.NoticeDashboardTicker })))
const ReportCards = lazy(() => import('./components/ReportCards').then(module => ({ default: module.ReportCards })))
const Receipts = lazy(() => import('./components/Receipts').then(module => ({ default: module.Receipts })))
const CertificateManagement = lazy(() => import('./components/CertificateManagement').then(module => ({ default: module.CertificateManagement })))
const InventoryManagement = lazy(() => import('./components/InventoryManagement').then(module => ({ default: module.InventoryManagement })))
const InventoryStockAlerts = lazy(() => import('./components/InventoryStockAlerts').then(module => ({ default: module.InventoryStockAlerts })))
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })))
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })))
const HealthRecordsManagement = lazy(() => import('./components/HealthRecordsManagement').then(module => ({ default: module.HealthRecordsManagement })))
const GuildManagement = lazy(() => import('./components/GuildManagement').then(module => ({ default: module.GuildManagement })))
const AttendanceManagement = lazy(() => import('./components/AttendanceWorkspace').then(module => ({ default: module.AttendanceWorkspace })))
const RoleSpecificDashboard = lazy(() => import('./components/RoleSpecificDashboard').then(module => ({ default: module.RoleSpecificDashboard })))
const ResidentDirectorHRDashboard = lazy(() => import('./components/ResidentDirectorHRDashboard').then(module => ({ default: module.ResidentDirectorHRDashboard })))
const DirectorExecutiveDashboard = lazy(() => import('./components/DirectorExecutiveDashboard').then(module => ({ default: module.DirectorExecutiveDashboard })))
const PrincipalDashboard = lazy(() => import('./components/PrincipalDashboard').then(module => ({ default: module.PrincipalDashboard })))
const TimetableManagement = lazy(() => import('./components/TimetableManagement').then(module => ({ default: module.TimetableManagement })))
const CurriculumManagement = lazy(() => import('./components/CurriculumManagement').then(module => ({ default: module.CurriculumManagement })))
const SchoolWardenManagement = lazy(() => import('./components/SchoolWardenManagement').then(module => ({ default: module.SchoolWardenManagement })))
const SystemAdministrationManagement = lazy(() => import('./components/SystemAdministrationManagement').then(module => ({ default: module.SystemAdministrationManagement })))
const CampusManagement = lazy(() => import('./components/CampusManagement').then(module => ({ default: module.CampusManagement })))
type ModuleKey = 'dashboard' | 'administration' | 'students' | 'academics' | 'curriculum' | 'finance' | 'staff' | 'attendance' | 'library' | 'health' | 'laboratories' | 'inventory' | 'communication' | 'guild' | 'reports' | 'timetable' | 'system-administration' | 'campuses'
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
  const loginSrc = API_BASE_URL
    ? `/institution-login.html?api=${encodeURIComponent(API_BASE_URL)}`
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
function GlobalTableLayoutEditor({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    // Row resize handles are created only for the row under the pointer.
    // Large registers no longer pay the DOM/layout cost of an extra element per row.
    let activeResizeRow: HTMLTableRowElement | null = null;
    const decorateActiveRow = (row: HTMLTableRowElement) => {
      if (activeResizeRow === row && row.querySelector(':scope > .smis-row-resize-handle')) return;
      if (activeResizeRow?.isConnected) {
        activeResizeRow.querySelector(':scope > .smis-row-resize-handle')?.remove();
        activeResizeRow.classList.remove('smis-resizable-row');
      }
      activeResizeRow = row;
      if (row.querySelector(':scope > .smis-row-resize-handle')) return;
      row.classList.add('smis-resizable-row');
      const handle = document.createElement('span');
      handle.className = 'smis-row-resize-handle';
      handle.title = 'Drag to resize this row';
      handle.setAttribute('aria-label', 'Resize row');
      handle.setAttribute('role', 'separator');
      handle.setAttribute('tabindex', '0');
      handle.addEventListener('keydown', event => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
        event.preventDefault();
        const delta = event.key === 'ArrowDown' ? 8 : -8;
        row.style.height = Math.max(24, row.getBoundingClientRect().height + delta) + 'px';
      });
      row.appendChild(handle);
    };

    const decorateTables = (tables: Iterable<HTMLTableElement>) => {
      for (const table of tables) {
        if (table.dataset.fixedLayout === 'true') continue;
        table.querySelectorAll<HTMLTableCellElement>('thead th').forEach((cell, index) => {
          if (cell.querySelector(':scope > .smis-column-resize-handle')) return;
          cell.classList.add('smis-resizable-column');
          const handle = document.createElement('span');
          handle.className = 'smis-column-resize-handle';
          handle.title = 'Drag to resize this column';
          handle.setAttribute('aria-label', 'Resize column');
          handle.setAttribute('role', 'separator');
          handle.setAttribute('tabindex', '0');
          handle.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 12 : -12;
            const width = Math.max(56, cell.getBoundingClientRect().width + delta);
            table.querySelectorAll('tr').forEach(row => {
              const target = row.children.item(index) as HTMLElement | null;
              if (target) { target.style.width = width + 'px'; target.style.minWidth = width + 'px'; }
            });
          });
          cell.appendChild(handle);
        });
      }
    };

    const tablesForNode = (node: Element): Set<HTMLTableElement> => {
      const tables = new Set<HTMLTableElement>();
      const containingTable = node.closest<HTMLTableElement>('table:not([data-fixed-layout="true"])');
      if (containingTable) tables.add(containingTable);
      if (node.matches('table:not([data-fixed-layout="true"])')) tables.add(node as HTMLTableElement);
      node.querySelectorAll<HTMLTableElement>('table:not([data-fixed-layout="true"])').forEach(table => tables.add(table));
      return tables;
    };

    decorateTables(document.querySelectorAll<HTMLTableElement>('table:not([data-fixed-layout="true"])'));

    // React updates elsewhere in the page should not trigger a full-document table scan.
    // Ignore our own resize-handle insertions to prevent unnecessary observer callbacks.
    const observer = new MutationObserver(records => {
      const affectedTables = new Set<HTMLTableElement>();
      records.forEach(record => record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches('.smis-column-resize-handle, .smis-row-resize-handle')) return;
        tablesForNode(node).forEach(table => affectedTables.add(table));
      }));
      if (affectedTables.size) decorateTables(affectedTables);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const onPointerOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const row = target.closest<HTMLTableRowElement>('table:not([data-fixed-layout="true"]) tr');
      if (!row || (event.relatedTarget instanceof Node && row.contains(event.relatedTarget))) return;
      decorateActiveRow(row);
    };
    document.addEventListener('pointerover', onPointerOver, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerover', onPointerOver);
      activeResizeRow?.querySelector(':scope > .smis-row-resize-handle')?.remove();
      document.querySelectorAll<HTMLElement>('.smis-column-resize-handle, .smis-row-resize-handle').forEach(handle => handle.remove());
      document.querySelectorAll('.smis-resizable-column, .smis-resizable-row').forEach(cell => cell.classList.remove('smis-resizable-column', 'smis-resizable-row'));
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let drag: { kind: 'column'; start: number; size: number; table: HTMLTableElement; index: number; cells: HTMLTableCellElement[] } | { kind: 'row'; start: number; size: number; table: HTMLTableElement; index: number; row: HTMLTableRowElement } | null = null;
    const down = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const columnHandle = target.closest<HTMLElement>('.smis-column-resize-handle');
      const rowHandle = target.closest<HTMLElement>('.smis-row-resize-handle');
      if (!columnHandle && !rowHandle) return;
      const table = target.closest('table') as HTMLTableElement | null;
      if (!table) return;
      event.preventDefault();
      if (columnHandle) {
        const cell = columnHandle.parentElement as HTMLTableCellElement;
        const index = Array.from(cell.parentElement?.children ?? []).indexOf(cell);
        const cells = Array.from(table.rows)
          .map(row => row.cells.item(index))
          .filter((candidate): candidate is HTMLTableCellElement => candidate !== null);
        drag = { kind: 'column', start: event.clientX, size: cell.getBoundingClientRect().width, table, index, cells };
      } else if (rowHandle) {
        const row = rowHandle.parentElement as HTMLTableRowElement;
        drag = { kind: 'row', start: event.clientY, size: row.getBoundingClientRect().height, table, index: -1, row };
      }
      if (drag) document.body.classList.add('smis-table-resizing');
    };
    const applyMove = (event: PointerEvent) => {
      if (!drag) return;
      if (drag.kind === 'column') {
        const width = Math.max(56, Math.min(900, drag.size + event.clientX - drag.start));
        drag.cells.forEach(cell => {
          cell.style.width = width + 'px';
          cell.style.minWidth = width + 'px';
        });
      } else {
        drag.row.style.height = Math.max(24, Math.min(400, drag.size + event.clientY - drag.start)) + 'px';
      }
    };
    // Pointer devices can emit more move events than the browser can paint. Apply only
    // the latest position per animation frame to avoid redundant layout/style work.
    let pendingMove: PointerEvent | null = null;
    let frameId: number | null = null;
    const move = (event: PointerEvent) => {
      if (!drag) return;
      pendingMove = event;
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const latest = pendingMove;
        pendingMove = null;
        if (latest) applyMove(latest);
      });
    };
    const up = (event?: PointerEvent) => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
      if (event && drag) applyMove(event);
      else if (pendingMove) applyMove(pendingMove);
      pendingMove = null;
      drag = null;
      document.body.classList.remove('smis-table-resizing');
    };
    document.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      document.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      pendingMove = null;
      document.body.classList.remove('smis-table-resizing');
    };
  }, [enabled]);
  return null;
}
function AuthenticatedWorkspace({ onLogout, institution, onInstitutionSaved }: { onLogout: () => void; institution: InstitutionSettings; onInstitutionSaved: (settings: InstitutionSettings) => void }) {
  const prefersReducedMotion = useReducedMotion()
  const s=getSession(); const r=s?.roles??[]; const isSystemAdministrator=r.includes('SystemAdministrator'); const [effectivePermissions,setEffectivePermissions]=useState<string[]|null>(null); useEffect(()=>{let active=true; void getMyEffectivePermissions().then(permissions=>{if(active)setEffectivePermissions(permissions)}).catch(()=>{if(active)setEffectivePermissions(null)}); return()=>{active=false}},[s?.username]); const hasPermission=(...codes:string[])=>effectivePermissions===null?undefined:codes.some(code=>effectivePermissions.includes(code)); const [tableLayoutEditing,setTableLayoutEditing]=useState(false); function updateTableLayoutEditing(enabled:boolean){if(!isSystemAdministrator)return;setTableLayoutEditing(enabled)} const a=effectivePermissions===null?canManageAdministration(r):Boolean(hasPermission('administration.manage-users','administration.manage-roles')),ad=effectivePermissions===null?canManageAdmissions(r):Boolean(hasPermission('admissions.create','admissions.review','admissions.decide','admissions.enrol')),ac=effectivePermissions===null?canManageAcademics(r):Boolean(hasPermission('academics.manage-programmes','academics.manage-courses','academics.manage-registration')),st=effectivePermissions===null?canManageStudents(r):Boolean(hasPermission('students.create','students.update','students.archive','students.documents')),fi=effectivePermissions===null?canAccessFinance(r):Boolean(hasPermission('finance.read','finance.manage-fees','finance.record-payments','finance.manage-ledger')),sr=effectivePermissions===null?canReadStaff(r):Boolean(hasPermission('hr.read-staff','hr.manage-staff')),sm=effectivePermissions===null?canManageStaff(r):Boolean(hasPermission('hr.manage-staff')),lr=effectivePermissions===null?canReadLibrary(r):Boolean(hasPermission('library.read','library.manage-books','library.manage-circulation')),lm=effectivePermissions===null?canManageLibrary(r):Boolean(hasPermission('library.manage-books','library.manage-circulation')),cm=effectivePermissions===null?canManageCommunication(r):Boolean(hasPermission('communications.send')),rp=effectivePermissions===null?canManageReporting(r):Boolean(hasPermission('reports.read','reports.export')),inv=effectivePermissions===null?canManageInventory(r):Boolean(hasPermission('inventory.create','inventory.update','inventory.issue','inventory.approve')),hostel=effectivePermissions===null?canManageHostel(r):Boolean(hasPermission('hostel.manage')),attManage=effectivePermissions===null?(canManageAttendance(r)||isSystemAdministrator):Boolean(hasPermission('attendance.record','attendance.manage-sessions')),att=effectivePermissions===null?(canReadAttendance(r)||isSystemAdministrator):Boolean(hasPermission('attendance.read','attendance.record')); const adminRead=effectivePermissions===null?canManageAdministration(r):Boolean(hasPermission('administration.read-users','administration.manage-users')); const academicRead=effectivePermissions===null?canManageAcademics(r):Boolean(hasPermission('academics.read','academics.manage-programmes','academics.manage-courses')); const inventoryRead=effectivePermissions===null?canManageInventory(r):Boolean(hasPermission('inventory.read','inventory.create','inventory.update','inventory.issue','inventory.approve')); const hostelRead=effectivePermissions===null?canManageHostel(r):Boolean(hasPermission('hostel.read','hostel.manage')); const communicationRead=effectivePermissions===null?canManageCommunication(r):Boolean(hasPermission('communications.read','communications.send')); const s360=r.includes('SystemAdministrator')||r.includes('AcademicRegistrar')||r.includes('AdmissionsOfficer')||r.includes('Student'); const isAdminSecretary=r.includes('Admin Secretary')||r.includes('AdminSecretary'); const studentRead=effectivePermissions===null?(r.includes('SystemAdministrator')||r.includes('AcademicRegistrar')||r.includes('Principal')||r.includes('AssistantPrincipal')||r.includes('Director')||r.includes('ResidentDirector')||r.includes('Secretary')||r.includes('HeadOfDepartment')||r.includes('Receptionist')||r.includes('HR Manager')||r.includes('Records Officer')||isAdminSecretary):Boolean(hasPermission('students.read')); const admissionRead=effectivePermissions===null?(ad||r.includes('SystemAdministrator')||r.includes('AcademicRegistrar')||r.includes('AdmissionsOfficer')||r.includes('Principal')||r.includes('Director')||r.includes('AssistantPrincipal')||r.includes('ResidentDirector')||r.includes('Secretary')||r.includes('HeadOfDepartment')||r.includes('Receptionist')||r.includes('HR Manager')||r.includes('Records Officer')||isAdminSecretary):Boolean(hasPermission('admissions.read')); const analytics=canViewAnalytics(r); const lecturer=r.includes('Lecturer'); const sessionUsername=s?.username?.trim()||'anonymous'; const stateKey=`smis.workspace.${sessionUsername}`; const moduleAllowed=(module:ModuleKey):boolean=>{if(effectivePermissions===null&&r.includes('SystemAdministrator'))return true;switch(module){
  case 'dashboard': return true;
  case 'administration': return adminRead && !isAdminSecretary;
  case 'students': return st || ad || s360 || studentRead || admissionRead || r.includes('HR Manager') || r.includes('Records Officer');
  case 'academics': return ac || academicRead || isAdminSecretary || lecturer || r.includes('HeadOfDepartment') || r.includes('Principal') || r.includes('AssistantPrincipal');
  case 'curriculum': return ac;
  case 'finance': return fi && !isAdminSecretary;
  case 'staff': return sr;
  case 'attendance': return att;
  case 'library': return lr;
  case 'health': return effectivePermissions===null?(attManage || r.includes('Nurse') || r.includes('ClinicalInstructor') || isSystemAdministrator):Boolean(hasPermission('medical.read','medical.manage'));
  case 'laboratories': return hostel || hostelRead;
  case 'inventory': return inv || inventoryRead;
  case 'communication': return cm || communicationRead || ['ExaminationsOfficer','Lecturer','Records Officer','Admin Secretary','AssistantRegistrar','SchoolWarden','Principal','Director','Secretary','ResidentDirector','HeadOfDepartment','AssistantPrincipal','Receptionist','Accountant','AssistantAccountant','AdmissionsOfficer','Librarian'].some(role => r.includes(role));
  case 'guild': return r.includes('Student') || r.includes('Guild') || r.includes('SystemAdministrator') || r.includes('HR Manager');
  case 'reports': return rp || analytics;
  case 'timetable': return effectivePermissions===null?canReadTimetable(r):Boolean(hasPermission('timetable.read'));
  case 'system-administration': return effectivePermissions===null?isSystemAdministrator:Boolean(hasPermission('settings.manage','administration.manage-users'));
  case 'campuses': return effectivePermissions===null?isSystemAdministrator:Boolean(hasPermission('settings.manage'));
  default: return false;
}};
const storedModule=localStorage.getItem(stateKey);
const [activeModule,setActiveModule]=useState<ModuleKey>(()=>storedModule&&(['dashboard','administration','students','academics','curriculum','finance','staff','attendance','library','health','laboratories','inventory','communication','guild','reports','timetable','system-administration','campuses'] as string[]).includes(storedModule)&&moduleAllowed(storedModule as ModuleKey)?storedModule as ModuleKey:'dashboard'); useEffect(()=>{localStorage.setItem(stateKey,activeModule)},[stateKey,activeModule]);useEffect(()=>{const handler=(event:Event)=>{const detail=(event as CustomEvent<ModuleKey>).detail;if(detail&&moduleAllowed(detail)){setActiveModule(detail);setActiveSubsection(null)}else{setActiveModule('dashboard');setActiveSubsection(null)}};window.addEventListener('smis:navigate-module',handler);return()=>window.removeEventListener('smis:navigate-module',handler)},[]); function signOut(){localStorage.setItem(stateKey,activeModule);logout();onLogout()} const iconByModule:Record<ModuleKey,LucideIcon>={
  dashboard:LayoutDashboard,
  administration:BriefcaseBusiness,
  students:UsersRound,
  academics:GraduationCap,
  curriculum:GraduationCap,
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
  timetable:CalendarDays,
  'system-administration':Settings,
  campuses:Building2
};
const moduleLabels:Record<ModuleKey,string>={
  dashboard:'Dashboard',
  administration:'Administration',
  students:'Students',
  academics:'Academic Management',
  curriculum:'Curriculum & Courses',
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
  timetable:'Timetables',
  'system-administration':'System Administration',
  campuses:'Campus Management'
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
  if (!moduleAllowed(module)) {
    setActiveSubsection(null);
    setActiveModule('dashboard');
    return;
  }
  setActiveModule(module);
  setActiveSubsection(subsection??null);
  // Dispatch after React commits the destination workspace so newly mounted screens receive the request.
  if (subsection) window.setTimeout(() => window.dispatchEvent(new CustomEvent('smis:navigate-subsection', { detail: { module, subsection } })), 0);
}
type SidebarItem={label:string;module:ModuleKey;subsection?:string;child?:boolean};
type SidebarGroup={label:string;items:SidebarItem[];alwaysOpen?:boolean};
const iconBySidebarLabel: Record<string, LucideIcon> = {
  'Access Control': ShieldCheck,
  Users: UsersRound,
  Roles: Shield,
  Staff: UserRound,
  Payroll: WalletCards,
  Leave: CalendarDays,
  Recruitment: UserPlus,
  Logs: ClipboardList,
  Backups: Database,
  Settings: SlidersHorizontal,
  Registration: ClipboardCheck,
  Records: FileText,
  Classes: GraduationCap,
  Courses: BookOpen,
  'Medical Records': HeartPulse,
  Archives: Archive,
  Clinic: Stethoscope,
};
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
    {label:'Campuses',module:'campuses'},
    {label:'Logs',module:'system-administration',subsection:'logs',child:true},
    {label:'Backups',module:'system-administration',subsection:'backups',child:true},
    {label:'Settings',module:'system-administration',subsection:'settings',child:true}
  ]},
  {label:'Academic',items:[
    {label:'Students',module:'students'},
    {label:'Registration',module:'students',subsection:'registration',child:true},
    {label:'Registry',module:'students',subsection:'records',child:true},
    {label:'Archives',module:'students',subsection:'archives',child:true},
    {label:'Academic Management',module:'academics'},
    {label:'Curriculum & Courses',module:'curriculum'},
    {label:'Timetables',module:'timetable'},
    {label:'Classes',module:'academics',subsection:'classes',child:true},
    {label:'Courses',module:'curriculum',subsection:'courses',child:true},
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
  if (!moduleAllowed(item.module)) return false;
  // Class setup is a management screen; do not expose a destination that renders blank for read-only roles.
  if (item.module === 'academics' && item.subsection === 'classes' && !ac) return false;
  if (item.module === 'staff' && item.subsection === 'payroll') return effectivePermissions===null?canReadPayroll(r)&&!isAdminSecretary:Boolean(hasPermission('hr.read-payroll','hr.manage-payroll'));
  if (item.module === 'staff' && (item.subsection === 'leave' || item.subsection === 'recruitment')) return sm;
  if (item.module === 'system-administration') return moduleAllowed('system-administration');
  return true;
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
  <GlobalTableLayoutEditor enabled={tableLayoutEditing} />
  <div className="institution-watermark" aria-hidden="true">
    <img src={institutionLogoUrl(institution)} alt="" />
    <span>{institution.institutionName}</span>
  </div>
  <aside className="flex flex-col w-72 h-screen bg-white/65 backdrop-blur-2xl border-r border-white/60 shadow-[4px_0_30px_rgba(30,41,59,0.06)] font-sans text-slate-700 select-none">
    <div className="flex items-center gap-3.5 px-6 py-6 border-b border-white/60 group cursor-pointer">
      {institution && (
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-indigo-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          <img src={institutionLogoUrl(institution)} alt={institution.institutionName + " Logo"} className="relative w-11 h-11 rounded-xl object-cover shadow-sm ring-1 ring-slate-900/10 " onError={(e) => { e.currentTarget.style.display = "none"; }} />
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
                <ChevronDown size={14} className="text-slate-400" aria-hidden="true" />
              </button>
            )}

            <motion.div id={groupId} initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0, marginTop: open ? 8 : 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }} style={{ overflow: "hidden", pointerEvents: open ? "auto" : "none" }} aria-hidden={!open} inert={!open}>
              <div className="flex flex-col overflow-hidden space-y-1">
                {group.items?.map(item => {
                  const Icon = iconBySidebarLabel[item.label] || iconByModule[item.module] || LayoutDashboard;
                  const isModuleActive = activeModule === item.module;
                  const isItemActive = item.subsection ? isModuleActive && activeSubsection === item.subsection : isModuleActive && !activeSubsection;
                  return (
                    <button key={group.label + "-" + item.label + "-" + (item.subsection || "root")} type="button" onClick={() => navigate(item.module, item.subsection)} aria-current={isItemActive ? "page" : undefined}
                      className={[
                        "group relative flex items-center w-full text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] text-left",
                        item.child ? "py-2 pr-3 pl-9 rounded-lg border-0" : "py-2.5 px-3 gap-3 rounded-xl",
                        isItemActive
                          ? "border-0 bg-[#292821] text-[#f5efdf] font-semibold shadow-none"
                          : "border-0 text-[#d7cfbb] hover:bg-[#1e1e1a] hover:text-[#f5efdf]"
                      ].join(" ")}
                    >
                      {!item.child && !isItemActive && <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-400 rounded-r-full opacity-0 scale-y-0 group-hover:opacity-100 group-hover:scale-y-100 transition-all duration-300 origin-center"></span>}
                      <Icon size={item.child ? 16 : 18} strokeWidth={isItemActive ? 2.5 : 2} className={"flex-shrink-0 " + (isItemActive ? "text-[#f5efdf]" : "text-[#c9c0aa]")} aria-hidden="true" />
                      <span className="relative z-10 truncate">{(item.module === 'laboratories' && (r.includes('SchoolWarden') || r.includes('School Warden'))) ? 'School Warden' : item.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
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
        <button type="button" className="p-2 ml-1 text-slate-400 rounded-lg hover:text-white hover:bg-red-500 focus:outline-none" onClick={signOut} title="Sign out" aria-label="Sign out">
          <LogOut size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  </aside>
  <div className="main-content"><header className="topbar"><div className="topbar-context"><div className="topbar-context-label"><strong>{(activeModule === 'laboratories' && (r.includes('SchoolWarden') || r.includes('School Warden')) ? 'School Warden' : (moduleLabels[activeModule]||'Dashboard')).toUpperCase()}</strong></div></div><div className="topbar-actions">{isSystemAdministrator && <button type="button" className="secondary-button table-layout-toggle" aria-pressed={tableLayoutEditing} onClick={() => updateTableLayoutEditing(!tableLayoutEditing)} title="Allow resizing table columns and rows">{tableLayoutEditing ? 'Disable table resizing' : 'Enable table resizing'}</button>}<CommandPalette scope={activeModule} onNavigate={module => navigate(module as ModuleKey)}/></div></header><Suspense fallback={<div className="workspace-loading" role="status" aria-live="polite"><span className="workspace-loading-spinner" aria-hidden="true" /><span className="workspace-loading-copy">Loading workspace…</span><span className="workspace-loading-skeleton" aria-hidden="true"><i /><i /><i /></span></div>}><AnimatePresence mode="wait" initial={false}><motion.div key={activeModule} className="content" initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: prefersReducedMotion ? 0 : 0.16, ease: "easeOut" }}>{activeModule==='dashboard'&&<>{r.includes('Director')?<DirectorExecutiveDashboard onNavigate={m=>navigate(m)}/>:r.includes('ResidentDirector')?<ResidentDirectorHRDashboard onNavigate={m=>navigate(m)}/>:(r.includes('Admin Secretary')||r.includes('AdminSecretary'))?<RoleSpecificDashboard role="AdminSecretary" onNavigate={m=>navigate(m)}/>:r.includes('Secretary')?<RoleSpecificDashboard role="Secretary" onNavigate={m=>navigate(m)}/>:r.includes('Receptionist')?<RoleSpecificDashboard role="Receptionist" onNavigate={m=>navigate(m)}/>:r.includes('HeadOfDepartment')?<RoleSpecificDashboard role="HeadOfDepartment" onNavigate={m=>navigate(m)}/>:r.includes('Principal')||r.includes('AssistantPrincipal')?<PrincipalDashboard/>:r.includes('HR Manager')?<ResidentDirectorHRDashboard onNavigate={m=>navigate(m)}/>:(r.includes('SchoolWarden')||r.includes('School Warden'))?<SchoolWardenManagement/>:r.includes('SystemAdministrator')?<AdminDashboard/>:<AnalyticsDashboard/>}<NoticeDashboardTicker onOpen={()=>navigate('communication')}/></>}
{activeModule==='dashboard'&&(r.includes('Records Officer')||r.includes('RecordsOfficer')||r.includes('School Warden')||r.includes('SchoolWarden')||r.includes('SchoolWarden'))&&<InventoryStockAlerts/>}
{activeModule==='administration'&&adminRead&&<AdministrationManagement institution={institution} onInstitutionSaved={onInstitutionSaved} activeSubsection={activeSubsection}/>} 
{activeModule==='students'&&(st||ad||s360||studentRead||admissionRead)&&(activeSubsection==='records'?<StudentRegistry/>:<AdmissionsStudentManagement canManage={st||ad} readOnly={!st&&!ad} activeSubsection={activeSubsection} accessProfile={r.includes('Receptionist')?'receptionist':r.includes('Records Officer')?'records':r.includes('HeadOfDepartment')?'department':'general'} />)} 
{activeModule==='academics'&&activeSubsection==='classes'&&ac&&<AcademicStructures canManage={ac}/>} {activeModule==='academics'&&activeSubsection!=='classes'&&(ac||academicRead||isAdminSecretary||lecturer||r.includes('HeadOfDepartment')||r.includes('Principal')||r.includes('AssistantPrincipal'))&&<AcademicManagement canManage={ac} readOnly={!ac}/>} {activeModule==='curriculum'&&ac&&<CurriculumManagement canManage={ac}/>} 
{activeModule==='timetable'&&moduleAllowed('timetable')&&<TimetableManagement readOnly={effectivePermissions===null?!canManageTimetable(r):!Boolean(hasPermission('timetable.edit'))} />}
{activeModule==='finance'&&fi&&<FinanceManagement readOnly={effectivePermissions===null?canReadOnlyFinance(r):!Boolean(hasPermission('finance.manage-fees','finance.record-payments','finance.manage-ledger'))} />}
{activeModule==='staff'&&sr&&<StaffManagement canManage={sm} canReadPayroll={effectivePermissions===null?canReadPayroll(r):Boolean(hasPermission('hr.read-payroll','hr.manage-payroll'))} canManagePayroll={effectivePermissions===null?canManageFinance(r):Boolean(hasPermission('hr.manage-payroll','finance.manage-ledger'))} canProcessPayroll={effectivePermissions===null?canProcessPayroll(r):Boolean(hasPermission('hr.manage-payroll','finance.record-payments'))} activeSubsection={activeSubsection}/>}
{activeModule==='attendance'&&att&&<AttendanceManagement readOnly={!attManage} canViewStaffAttendance={canReadStaff(r)} />}
{activeModule==='library'&&lr&&<LibraryManagementWorkspace canManage={lm}/>}
{activeModule==='health'&&moduleAllowed('health')&&<HealthRecordsManagement activeSubsection={activeSubsection}/>}
{activeModule==='laboratories'&&(hostel||hostelRead)&&((r.includes('SchoolWarden')||r.includes('School Warden'))?<SchoolWardenManagement/>:<HostelManagement canManage={hostel}/>)}
{activeModule==='inventory'&&(inv||inventoryRead)&&<InventoryManagement canManage={inv}/>}
{activeModule==='communication'&&moduleAllowed('communication')&&<Announcements canManage={cm}/>}
{activeModule==='guild'&&(st||r.includes('Guild')||r.includes('SystemAdministrator'))&&<GuildManagement canOpenCalendar={ac} canOpenNotices={moduleAllowed('communication')} canOpenFinance={fi && !isAdminSecretary}/>}
{activeModule==='reports'&&(rp||analytics)&&<div><div className="library-workspace-tabs" style={{marginBottom:18}}><button className={rptTab==='cards'?'active':''} onClick={()=>setRptTab('cards')}>Report Cards</button><button className={rptTab==='receipts'?'active':''} onClick={()=>setRptTab('receipts')}>Receipts</button><button className={rptTab==='certificates'?'active':''} onClick={()=>setRptTab('certificates')}>Certificates</button><button className={rptTab==='analytics'?'active':''} onClick={()=>setRptTab('analytics')}>Analytics</button></div>{rptTab==='cards'&&rp&&<ReportCards canManage/>}{rptTab==='receipts'&&rp&&<Receipts canManage/>}{rptTab==='certificates'&&rp&&<CertificateManagement canManage/>}{rptTab==='analytics'&&analytics&&<AnalyticsDashboard/>}</div>}
{activeModule==='system-administration'&&moduleAllowed('system-administration')&&<SystemAdministrationManagement activeSubsection={activeSubsection} onNavigate={navigate}/> }
 {activeModule==='campuses'&&moduleAllowed('campuses')&&<CampusManagement/>}
 </motion.div></AnimatePresence></Suspense></div></main> }
function App(){
  return <AppContent />
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

  return <><GlobalNotificationViewport />{authed
    ? <AuthenticatedWorkspace onLogout={()=>setAuthed(false)} institution={institution} onInstitutionSaved={setInstitution}/>
    : <LoginScreen institution={institution}/>}</>
}
export default App