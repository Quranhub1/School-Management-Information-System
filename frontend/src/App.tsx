import { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/dashboard';
import { AdministrationManagement } from './components/administration-management';
import { SystemAdministration } from './components/system-administration';
import { SystemLogs } from './components/system-administration';
import { SystemBackups } from './components/system-administration';
import { AcademicManagement } from './components/academic-management';
import { AdmissionsStudentManagement } from './components/admissions-student-management';
import { HealthRecordsManagement } from './components/health-records-management';
import { StaffManagement } from './components/staff-management';
import { FinanceManagement } from './components/finance-management';
import { InventoryManagement } from './components/inventory-management';
import { LibraryManagement } from './components/library-management';
import { CommunicationManagement } from './components/communication-management';
import { TimetableManagement } from './components/timetable-management';
import { GuildManagement } from './components/guild-management';
import { Reports } from './components/reports';
import './App.css';

type SidebarItem={label:string;module:ModuleKey;subsection?:string;child?:boolean};
type SidebarGroup={label:string;items:SidebarItem[];alwaysOpen?:boolean};
type ModuleKey = 
  | 'dashboard'
  | 'administration'
  | 'students'
  | 'academics'
  | 'finance'
  | 'staff'
  | 'attendance'
  | 'library'
  | 'health'
  | 'laboratories'
  | 'inventory'
  | 'communication'
  | 'guild'
  | 'reports'
  | 'timetable'
  | 'system-administration';

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
    {label:'Settings',module:'administration',subsection:'settings',child:true}
  ]},
  {label:'System Administration',items:[
    {label:'System Administration',module:'system-administration'},
    {label:'Logs',module:'system-administration',subsection:'logs',child:true},
    {label:'Backups',module:'system-administration',subsection:'backups',child:true}
  ]},
  {label:'Academic',items:[
    {label:'Students',module:'students'},
    {label:'Registration',module:'students',subsection:'registration',child:true},
    {label:'Records',module:'students',subsection:'records',child:true},
    {label:'Academic Management',module:'academics'},
    {label:'Timetables',module:'timetable'},
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
  {label:'Student Affairs',items=[
    {label:'Guild',module:'guild'},
    {label:'Announcements',module:'communication'},
    {label:'Hostel & Welfare',module:'laboratories'}
  ]},
  {label:'Reports',items=[
    {label:'Reports & Analytics',module:'reports'}
  ]}
];

type UserSummary = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
};

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey | null>('dashboard');
  const [activeSubsection, setActiveSubsection] = useState<string | null>(null);
  const [sessionUsername, setSessionUsername] = useState<string | null>(null);
  const [isAdminSecretary, setIsAdminSecretary] = useState<boolean>(false);
  const [openSidebarGroups, setOpenSidebarGroups] = useState<Record<string, boolean>>({});
  const [rptTab, setRptTab] = useState<'cards' | 'receipts' | 'certificates' | 'analytics'>('cards');

  useEffect(() => {
    // Initialize from localStorage or defaults
    const storedUsername = localStorage.getItem('smis_username');
    if (storedUsername) {
      setSessionUsername(storedUsername);
    }
    
    const storedIsAdminSecretary = localStorage.getItem('smis_isAdminSecretary') === 'true';
    setIsAdminSecretary(storedIsAdminSecretary);
    
    // Initialize open sidebar groups
    const initialOpenGroups: Record<string, boolean> = {};
    sidebarGroups.forEach(group => {
      if (group.alwaysOpen) {
        initialOpenGroups[group.label] = true;
      }
    });
    setOpenSidebarGroups(initialOpenGroups);
  }, []);

  function navigate(module: ModuleKey, subsection?: string) {
    // System Administration remains warning-only for non-administrators.
    if (module === 'system-administration' && !r.includes('SystemAdministrator')) {
      setActiveSubsection(null);
      setActiveModule(module);
      return;
    }
    setActiveModule(module);
    setActiveSubsection(subsection ?? null);
    if (subsection) {
      window.dispatchEvent(new CustomEvent('smis:navigate-subsection', { detail: { module, subsection } }));
    }
  }

  // Listen for navigation events from other components
  useEffect(() => {
    const handleNavigateModule = (event: Event) => {
      const detail = (event as CustomEvent<{ module: ModuleKey }>).detail;
      setActiveModule(detail.module);
      setActiveSubsection(null);
    };

    const handleNavigateSubsection = (event: Event) => {
      const detail = (event as CustomEvent<{ module: ModuleKey; subsection: string }>).detail;
      setActiveModule(detail.module);
      setActiveSubsection(detail.subsection);
    };

    window.addEventListener('smis:navigate-module', handleNavigateModule);
    window.addEventListener('smis:navigate-subsection', handleNavigateSubsection);

    return () => {
      window.removeEventListener('smis:navigate-module', handleNavigateModule);
      window.removeEventListener('smis:navigate-subsection', handleNavigateSubsection);
    };
  }, []);

  // Get user roles from localStorage or session
  const r: string[] = JSON.parse(localStorage.getItem('smis_roles') || '[]');
  const st = r.includes('Student');
  const ac = r.includes('Academic') || r.includes('Lecturer');
  const fi = r.includes('Finance');
  const sr = r.includes('Staff');
  const att = r.includes('Attendance');
  const lr = r.includes('Library');
  const inv = r.includes('Inventory');
  const cm = r.includes('Communication');

  const lecturer = r.includes('Lecturer');
  const s360 = r.includes('360View');
  const studentRead = r.includes('StudentRead');
  const admissionRead = r.includes('AdmissionRead');
  const analytics = r.includes('Analytics');
  const rp = r.includes('Reports');
  const canReadTimetable = (roles: string[]) => 
    roles.includes('TimetableManager') || 
    roles.includes('Academic') || 
    roles.includes('Principal') ||
    roles.includes('AssistantPrincipal');

  const iconByModule: Record<ModuleKey, any> = {
    dashboard: () => import('lucide-react').then(mod => mod.LayoutDashboard),
    administration: () => import('lucide-react').then(mod => mod.BriefcaseBusiness),
    students: () => import('lucide-react').then(mod => mod.UsersRound),
    academics: () => import('lucide-react').then(mod => mod.GraduationCap),
    finance: () => import('lucide-react').then(mod => mod.WalletCards),
    staff: () => import('lucide-react').then(mod => mod.BriefcaseBusiness),
    attendance: () => import('lucide-react').then(mod => mod.ClipboardCheck),
    library: () => import('lucide-react').then(mod => mod.Library),
    health: () => import('lucide-react').then(mod => mod.Stethoscope),
    laboratories: () => import('lucide-react').then(mod => mod.Package),
    inventory: () => import('lucide-react').then(mod => mod.Package),
    communication: () => import('lucide-react').then(mod => mod.Megaphone),
    guild: () => import('lucide-react').then(mod => mod.UsersRound),
    reports: () => import('lucide-react').then(mod => mod.BarChart3),
    timetable: () => import('lucide-react').then(mod => mod.CalendarDays),
    'system-administration': () => import('lucide-react').then(mod => mod.Settings)
  };

  const moduleLabels: Record<ModuleKey, string> = {
    dashboard: 'Dashboard',
    administration: 'Administration',
    students: 'Students',
    academics: 'Academic Management',
    finance: 'Finance & Accounting',
    staff: 'Staff & HR',
    attendance: 'Attendance',
    library: 'Library',
    health: 'Health & Clinical',
    laboratories: 'Hostel & Welfare',
    inventory: 'Inventory & Property',
    communication: 'Announcements',
    guild: 'Guild',
    reports: 'Reports & Analytics',
    timetable: 'Timetables',
    'system-administration': 'System Administration'
  };

  function canSeeSidebarItem(item: SidebarItem) {
    if (item.module === 'dashboard') return true;
    if (item.module === 'administration') return true && !isAdminSecretary;
    if (item.module === 'students') return st || ac || s360 || studentRead || admissionRead || r.includes('HR Manager') || r.includes('Records Officer');
    if (item.module === 'academics') return ac || lecturer || r.includes('HeadOfDepartment') || r.includes('HR Manager') || r.includes('AssistantPrincipal') || r.includes('Principal') || isAdminSecretary;
    if (item.module === 'timetable') return canReadTimetable(r) || isAdminSecretary;
    if (item.module === 'finance') return fi && !isAdminSecretary;
    if (item.module === 'staff') return sr || r.includes('HeadOfDepartment') || r.includes('HR Manager') || r.includes('Records Officer') || isAdminSecretary;
    if (item.module === 'attendance') return att || isAdminSecretary;
    if (item.module === 'library') return lr || isAdminSecretary;
    if (item.module === 'health') return att || r.includes('Nurse') || r.includes('ClinicalInstructor') || r.includes('SystemAdministrator') || r.includes('HR Manager') || isAdminSecretary;
    if (item.module === 'laboratories') return inv || r.includes('SchoolWarden') || r.includes('SystemAdministrator') || r.includes('HR Manager') || isAdminSecretary;
    if (item.module === 'inventory') return inv || isAdminSecretary;
    if (item.module === 'communication') return cm || r.includes('HR Manager') || isAdminSecretary;
    if (item.module === 'guild') return st || r.includes('Guild') || r.includes('SystemAdministrator') || r.includes('HR Manager') || isAdminSecretary;
    if (item.module === 'reports') return rp || analytics || isAdminSecretary;
    if (item.module === 'system-administration') return !isAdminSecretary && (r.includes('SystemAdministrator') || (!item.child && (r.includes('Principal') || r.includes('AssistantPrincipal'))));
    return false;
  }

  const visibleSidebarGroups = useMemo(() => sidebarGroups.map(group => ({
    ...group,
    items: group.items.filter(item => !(isAdminSecretary && (item.module === 'finance' || item.label === 'Payroll' || item.module === 'administration' || item.module === 'system-administration')) && canSeeSidebarItem(item))
  })).filter(group => group.items.length > 0), [sidebarGroups, isAdminSecretary]);

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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20" style="will-change: transform">
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex items-center px-4 py-6 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">SMIS</span>
          </div>
          
          {/* Sidebar Groups */}
          <div className="flex-1 overflow-y-auto">
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
          </div>
          
          {/* User Info */}
          <div className="flex items-center px-4 py-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <img src="/user.png" alt="User" className="w-10 h-10 rounded-full" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sessionUsername || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{isAdminSecretary ? 'Admin Secretary' : 'User'}</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full ms-64">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeModule ? moduleLabels[activeModule as ModuleKey] : 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-3">
            <button type="button" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
              Notifications
            </button>
            <button type="button" className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900">
              <span className="text-indigo-600 dark:text-indigo-400">{sessionUsername ? sessionUsername[0] : 'U'}</span>
            </button>
          </div>
        </header>
        
        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto h-full">
          {!activeModule && <Dashboard />}
          {activeModule === 'dashboard' && <Dashboard />}
          {activeModule === 'administration' && <AdministrationManagement onInstitutionSaved={() => {}} />}
          {activeModule === 'system-administration' && activeSubsection === 'logs' && <SystemLogs />}
          {activeModule === 'system-administration' && activeSubsection === 'backups' && <SystemBackups />}
          {activeModule === 'system-administration' && (!activeSubsection || activeSubsection === 'settings') && <SystemAdministration />}
          {activeModule === 'students' && <AdmissionsStudentManagement />}
          {activeModule === 'academics' && <AcademicManagement />}
          {activeModule === 'finance' && <FinanceManagement />}
          {activeModule === 'staff' && <StaffManagement />}
          {activeModule === 'health' && <HealthRecordsManagement />}
          {activeModule === 'inventory' && <InventoryManagement />}
          {activeModule === 'library' && <LibraryManagement />}
          {activeModule === 'communication' && <CommunicationManagement />}
          {activeModule === 'timetable' && <TimetableManagement />}
          {activeModule === 'guild' && <GuildManagement />}
          {activeModule === 'reports' && <Reports tab={rptTab} onTabChange={setRptTab} />}
        </div>
      </main>
    </div>
  );
}

export default App;
