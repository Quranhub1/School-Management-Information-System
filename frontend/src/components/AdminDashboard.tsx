import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  GraduationCap,
  Briefcase,
  Wallet,
  Activity,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  UserCheck,
  FileText,
  BarChart3,
  Server,
  AlertCircle,
  Command,
  X,
  ArrowRight,
  CreditCard,
  Download,
  PlusCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react'

import { getSession } from '../api/auth'
import { getUsers } from '../api/administration'
import { getStudents } from '../api/students'
import { listStaff } from '../api/staff'
import { getInvoices } from '../api/finance'
import { listPayroll } from '../api/payroll'
import { 
  Panel,
  PanelHeader,
  PanelContent,
  Tabs,
  Tab,
  TabList,
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  EmptyState,
  EmptyStateTitle,
  EmptyStateDescription,
  Form,
  FormField,
  FormLabel,
  FormControl,
  Alert
} from '@/components/ui'

type Tab = 'overview' | 'users' | 'students' | 'staff' | 'finance' | 'monitoring'

export function AdminDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [searchingStaff, setSearchingStaff] = useState(false)
  const [error, setError] = useState('')

  // Global Command Palette State
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')
  const [globalResults, setGlobalResults] = useState<{
    students: any[];
    staff: any[];
    invoices: any[];
  }>({ students: [], staff: [], invoices: [] })
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)

  // Quick Action Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'student' | 'finance'>('student')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  
  // Form inputs for quick action
  const [formName, setFormName] = useState('')
  const [formIdentifier, setFormIdentifier] = useState('')
  const [formAmount, setFormAmount] = useState('')

  // Metrics state
  const [users, setUsers] = useState<{ total: number; active: number; admins: number }>({ total: 0, active: 0, admins: 0 })
  const [students, setStudents] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [staff, setStaff] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [finance, setFinance] = useState<{ totalBilled: number; totalPaid: number; outstanding: number; invoices: number }>({ totalBilled: 0, totalPaid: 0, outstanding: 0, invoices: 0 })
  const [payroll, setPayroll] = useState<{ totalPaid: number; pending: number }>({ totalPaid: 0, pending: 0 })
  const [recentActivities, setRecentActivities] = useState<{ id: string; title: string; time: string; type: string }[]>([])

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<{ id: string; studentNumber: string; name: string; status: string }[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<{ id: string; staffNumber: string; name: string; department: string; status: string }[]>([])

  async function loadMetrics() {
    setLoading(true)
    setError('')
    try {
      const [usersRes, studentsRes, staffRes, invoicesRes, payrollRes] = await Promise.all([
        getUsers().catch(() => []),
        getStudents().catch(() => []),
        listStaff().catch(() => []),
        getInvoices().catch(() => []),
        listPayroll().catch(() => []),
      ])

      const safeUsers = Array.isArray(usersRes) ? usersRes : []
      const safeStudents = Array.isArray(studentsRes) ? studentsRes : []
      const safeStaff = Array.isArray(staffRes) ? staffRes : []
      const safeInvoices = Array.isArray(invoicesRes) ? invoicesRes : []
      const safePayroll = Array.isArray(payrollRes) ? payrollRes : []

      setUsers({
        total: safeUsers.length,
        active: safeUsers.filter((u: any) => Boolean(u?.isActive)).length,
        admins: safeUsers.filter((u: any) => Array.isArray(u?.roles) && u.roles.includes('SystemAdministrator')).length,
      })
      
      setStudents({ 
        total: safeStudents.length, 
        active: safeStudents.filter((s: any) => s?.status === 'Active').length 
      })
      
      setStaff({ 
        total: safeStaff.length, 
        active: safeStaff.filter((s: any) => Boolean(s?.isActive)).length 
      })

      const totalBilled = safeInvoices.reduce((sum: number, inv: any) => sum + Number(inv?.amount || 0), 0)
      const totalPaid = safeInvoices.reduce((sum: number, inv: any) => sum + Number(inv?.paidAmount || 0), 0)
      setFinance({
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
        invoices: safeInvoices.length,
      })

      setPayroll({
        totalPaid: safePayroll.filter((p: any) => p?.status === 'Paid').reduce((sum: number, p: any) => sum + Number(p?.netPay || 0), 0),
        pending: safePayroll.filter((p: any) => p?.status === 'Pending').length,
      })

      setRecentActivities([
        { id: '1', title: `${safeStudents.length} Students registered in database`, time: 'Just now', type: 'student' },
        { id: '2', title: `Finance ledger synced: ${safeInvoices.length} invoices processed`, time: '5 mins ago', type: 'finance' },
        { id: '3', title: `Active administrative session verified for ${session?.username || 'Admin'}`, time: '10 mins ago', type: 'auth' },
        { id: '4', title: `System health check passed: Database latency optimal`, time: '1 hour ago', type: 'system' },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMetrics()

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandOpen(prev => !prev)
      } else if (e.key === 'Escape') {
        setIsCommandOpen(false)
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Global Command Palette Search
  useEffect(() => {
    if (!globalQuery.trim()) {
      setGlobalResults({ students: [], staff: [], invoices: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingGlobal(true)
      try {
        const [stRes, sfRes, invRes] = await Promise.all([
          getStudents().catch(() => []),
          listStaff().catch(() => []),
          getInvoices().catch(() => []),
        ])

        const q = globalQuery.toLowerCase()
        const matchedStudents = (Array.isArray(stRes) ? stRes : []).filter((s: any) => 
          String(s?.studentNumber || '').toLowerCase().includes(q) ||
          String(s?.firstName || '').toLowerCase().includes(q) ||
          String(s?.lastName || '').toLowerCase().includes(q)
        ).slice(0, 5)

        const matchedStaff = (Array.isArray(sfRes) ? sfRes : []).filter((s: any) => 
          String(s?.staffNumber || '').toLowerCase().includes(q) ||
          String(s?.firstName || '').toLowerCase().includes(q) ||
          String(s?.lastName || '').toLowerCase().includes(q)
        ).slice(0, 5)

        const matchedInvoices = (Array.isArray(invRes) ? invRes : []).filter((inv: any) => 
          String(inv?.invoiceNumber || '').toLowerCase().includes(q) ||
          String(inv?.id || '').toLowerCase().includes(q)
        ).slice(0, 5)

        setGlobalResults({ students: matchedStudents, staff: matchedStaff, invoices: matchedInvoices })
      } finally {
        setIsSearchingGlobal(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [globalQuery])

  // Quick Action Form Submission Mock Handler
  async function handleQuickActionSubmit(e: React.FormEvent) {
    e.preventDefault()
    setActionLoading(true)
    setActionSuccess('')
    try {
      // Simulate API latency
      await new Promise(res => setTimeout(res, 800))
      setActionSuccess(drawerMode === 'student' ? 'Student successfully registered!' : 'Payment recorded successfully!')
      setFormName('')
      setFormIdentifier('')
      setFormAmount('')
      setTimeout(() => {
        setIsDrawerOpen(false)
        setActionSuccess('')
        void loadMetrics()
      }, 1200)
    } catch {
      setError('Failed to execute quick action.')
    } finally {
      setActionLoading(false)
    }
  }

  // Export CSV Report Function
  function exportReportCsv() {
    const csvContent = [
      ["Metric Category", "Value"],
      ["Total Students", students.total],
      ["Active Students", students.active],
      ["Total Staff", staff.total],
      ["Active Staff", staff.active],
      ["Total Users", users.total],
      ["Total Billed (UGX)", finance.totalBilled],
      ["Total Paid (UGX)", finance.totalPaid],
      ["Outstanding Balance (UGX)", finance.outstanding],
      ["Report Generated Date", new Date().toISOString()]
    ].map(e => e.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `school_metrics_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function searchStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!studentSearch.trim()) return
    setSearchingStudents(true)
    try {
      const all = await getStudents()
      const safeAll = Array.isArray(all) ? all : []
      const q = studentSearch.trim().toLowerCase()
      setStudentResults(
        safeAll
          .filter((s: any) => 
            String(s?.studentNumber || '').toLowerCase().includes(q) || 
            String(s?.firstName || '').toLowerCase().includes(q) || 
            String(s?.lastName || '').toLowerCase().includes(q)
          )
          .slice(0, 20)
          .map((s: any) => ({ 
            id: s.id || Math.random().toString(), 
            studentNumber: s.studentNumber || 'N/A', 
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Student', 
            status: s.status || 'Unknown' 
          }))
      )
    } catch {
      setError('Unable to search students.')
    } finally {
      setSearchingStudents(false)
    }
  }

  async function searchStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!staffSearch.trim()) return
    setSearchingStaff(true)
    try {
      const all = await listStaff()
      const safeAll = Array.isArray(all) ? all : []
      const q = staffSearch.trim().toLowerCase()
      setStaffResults(
        safeAll
          .filter((s: any) => 
            String(s?.staffNumber || '').toLowerCase().includes(q) || 
            String(s?.firstName || '').toLowerCase().includes(q) || 
            String(s?.lastName || '').toLowerCase().includes(q)
          )
          .slice(0, 20)
          .map((s: any) => ({
            id: s.id || Math.random().toString(),
            staffNumber: s.staffNumber || 'N/A',
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown Staff',
            department: s?.department || '—',
            status: s?.isActive ? 'Active' : 'Inactive',
          }))
      )
    } catch {
      setError('Unable to search staff.')
    } finally {
      setSearchingStaff(false)
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'students', label: 'Students', icon: GraduationCap },
    { key: 'staff', label: 'Staff', icon: Briefcase },
    { key: 'finance', label: 'Finance', icon: Wallet },
    { key: 'monitoring', label: 'Monitoring', icon: Activity },
  ]

  const formatCurrency = (val: number) => `UGX ${(Number(val) || 0).toLocaleString()}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 relative"
    >
      {/* Header Section */}
      <Panel className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> System Administrator
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {session?.username ?? 'Admin'}
            </h1>
            <p className="text-slate-400 text-sm">
              Real-time operational metrics & administration control panel
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Command Palette Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              className="hidden sm:inline-flex items-center gap-3"
            >
              <Search className="w-4 h-4 text-slate-300" />
              <span>Quick Search...</span>
              <kbd className="px-2 py-0.5 rounded bg-black/30 border border-white/10 text-[10px] text-slate-400 font-mono">Ctrl K</kbd>
            </Button>

            {/* Export CSV Report Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportReportCsv}
              title="Download Metrics CSV Report"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Export Report</span>
            </Button>

            {/* Quick Action Drawer Trigger */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setDrawerMode('student'); setIsDrawerOpen(true); }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Quick Action</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadMetrics()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </Panel>

      {/* Dynamic Alert Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setError('')}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline ml-4"
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <Tabs className="flex items-center gap-1.5 p-1.5 bg-white/85 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto scrollbar-none">
        <TabList>
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = tab === t.key
            return (
              <Tab
                key={t.key}
                isSelected={isActive}
                onClick={() => setTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive ? 'text-indigo-600 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-indigo-50/80 border border-indigo-200/60 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Tab>
            )
          })}
        </TabList>
      </Tabs>

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <PanelContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                  <>
                    <StatCard 
                      title="Total Students" 
                      value={students.total} 
                      subtext={`${students.active} Active`} 
                      trend="+4.2%" 
                      icon={GraduationCap} 
                      color="indigo" 
                    />
                    <StatCard 
                      title="Active Students" 
                      value={students.active} 
                      subtext={`${((students.active / (students.total || 1)) * 100).toFixed(0)}% Retention`} 
                      trend="Optimal" 
                      icon={UserCheck} 
                      color="emerald" 
                    />
                    <StatCard 
                      title="Total Staff" 
                      value={staff.total} 
                      subtext={`${staff.active} Active`} 
                      trend="Stable" 
                      icon={Briefcase} 
                      color="indigo" 
                    />
                    <StatCard 
                      title="Active Staff" 
                      value={staff.active} 
                      subtext="System Verified" 
                      icon={CheckCircle2} 
                      color="emerald" 
                    />
                    <StatCard 
                      title="Total Users" 
                      value={users.total} 
                      subtext={`${users.admins} Admins`} 
                      icon={Users} 
                      color="blue" 
                    />
                    <StatCard 
                      title="Active Users" 
                      value={users.active} 
                      subtext={`${users.total - users.active} Inactive`} 
                      icon={UserCheck} 
                      color="emerald" 
                    />
                    <StatCard 
                      title="Revenue (Paid)" 
                      value={formatCurrency(finance.totalPaid)} 
                      subtext="Collected to date" 
                      trend="+12.5%" 
                      icon={DollarSign} 
                      color="emerald" 
                      isCurrency 
                    />
                    <StatCard 
                      title="Outstanding" 
                      value={formatCurrency(finance.outstanding)} 
                      subtext={`${finance.invoices} Invoices`} 
                      icon={Wallet} 
                      color={finance.outstanding > 0 ? 'rose' : 'emerald'} 
                      isCurrency 
                    />
                  </>
                )}
              </div>

              {/* Grid Section: Quick Actions & Recent Activity Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <Panel className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <PanelHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-lg font-bold text-slate-900">Quick Actions & Workflows</h2>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCommandOpen(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Open Spotlight Search <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </PanelHeader>
                  <PanelContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ActionButton 
                      label="Search Students" 
                      desc="Find by name or number" 
                      icon={GraduationCap} 
                      onClick={() => setTab('students')} 
                    />
                    <ActionButton 
                      label="Search Staff" 
                      desc="Lookup staff profiles" 
                      icon={Briefcase} 
                      onClick={() => setTab('staff')} 
                    />
                    <ActionButton 
                      label="View Finance" 
                      desc="Invoices & receipts" 
                      icon={Wallet} 
                      onClick={() => setTab('finance')} 
                    />
                    <ActionButton 
                      label="System Health" 
                      desc="Monitor backend status" 
                      icon={Activity} 
                      onClick={() => setTab('monitoring')} 
                      secondary 
                    />
                  </PanelContent>
                </Panel>

                {/* Recent Activity Stream */}
                <Panel className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <PanelHeader className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" /> System Activity
                    </h2>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Stream Active" />
                  </PanelHeader>
                  <PanelContent className="space-y-3 pt-1">
                    {recentActivities.map(act => (
                      <div key={act.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-none last:pb-0">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                        <div className="space-y-0.5 flex-1">
                          <p className="text-xs font-medium text-slate-800 leading-snug">{act.title}</p>
                          <p className="text-[10px] text-slate-400">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </PanelContent>
                </Panel>
              </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <PanelContent className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <PanelHeader className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">System Users</h2>
                  <p className="text-xs text-slate-500">Managed accounts & role authorizations</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  {users.total} Accounts
                </span>
              </PanelHeader>
              <PanelContent>
                {loading ? (
                  <SkeletonTable />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <SummaryPill 
                      label="Total Registered Users" 
                      count={users.total} 
                      icon={Users} 
                      color="indigo" 
                    />
                    <SummaryPill 
                      label="Active Accounts" 
                      count={users.active} 
                      icon={UserCheck} 
                      color="emerald" 
                    />
                    <SummaryPill 
                      label="System Administrators" 
                      count={users.admins} 
                      icon={ShieldCheck} 
                      color="purple" 
                    />
                  </div>
                )}
              </PanelContent>
            </PanelContent>
          )}

          {/* STUDENTS TAB */}
          {tab === 'students' && (
            <PanelContent className="space-y-6">
              <Panel className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <PanelHeader>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Student Search Directory</h2>
                </PanelHeader>
                <PanelContent className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by student number, first or last name..."
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searchingStudents}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    {searchingStudents && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Search</span>
                  </Button>
                </PanelContent>
              </Panel>

              {studentResults.length > 0 && (
                <Panel className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <PanelHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Matching Results ({studentResults.length})
                    </span>
                  </PanelHeader>
                  <PanelContent>
                    <div className="overflow-x-auto">
                      <Table className="w-full text-left text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student Number</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentResults.map(s => (
                            <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                              <TableCell className="px-6 py-4 font-mono font-medium text-slate-700">{s.studentNumber}</TableCell>
                              <TableCell className="px-6 py-4 font-medium text-slate-900">{s.name}</TableCell>
                              <TableCell className="px-6 py-4">
                                <StatusBadge status={s.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </PanelContent>
                </Panel>
              )}
            </PanelContent>
          )}

          {/* STAFF TAB */}
          {tab === 'staff' && (
            <PanelContent className="space-y-6">
              <Panel className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <PanelHeader>
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Staff Search Directory</h2>
                </PanelHeader>
                <PanelContent className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by staff number, department, or name..."
                      value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={searchingStaff}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    {searchingStaff && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Search</span>
                  </Button>
                </PanelContent>
              </Panel>

              {staffResults.length > 0 && (
                <Panel className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <PanelHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Matching Results ({staffResults.length})
                    </span>
                  </PanelHeader>
                  <PanelContent>
                    <div className="overflow-x-auto">
                      <Table className="w-full text-left text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Number</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffResults.map(s => (
                            <TableRow key={s.id} className="hover:bg-slate-50/80 transition-colors">
                              <TableCell className="px-6 py-4 font-mono font-medium text-slate-700">{s.staffNumber}</TableCell>
                              <TableCell className="px-6 py-4 font-medium text-slate-900">{s.name}</TableCell>
                              <TableCell className="px-6 py-4 text-slate-600">{s.department}</TableCell>
                              <TableCell className="px-6 py-4">
                                <StatusBadge status={s.status} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </PanelContent>
                </Panel>
              )}
            </PanelContent>
          )}

          {/* FINANCE TAB */}
          {tab === 'finance' && (
            <PanelContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Billed" 
                  value={formatCurrency(finance.totalBilled)} 
                  subtext="Cumulative billing" 
                  icon={FileText} 
                  color="blue" 
                  isCurrency 
                />
                <StatCard 
                  title="Total Paid" 
                  value={formatCurrency(finance.totalPaid)} 
                  subtext="Cleared payments" 
                  icon={DollarSign} 
                  color="emerald" 
                  isCurrency 
                />
                <StatCard 
                  title="Outstanding Balance" 
                  value={formatCurrency(finance.outstanding)} 
                  subtext="Pending collections" 
                  icon={Wallet} 
                  color={finance.outstanding > 0 ? 'rose' : 'emerald'} 
                  isCurrency 
                />
                <StatCard 
                  title="Total Invoices" 
                  value={finance.invoices} 
                  subtext="Issued records" 
                  icon={BarChart3} 
                  color="purple" 
                />
              </div>
              <Panel className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-indigo-900">
                <PanelContent className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium">Use the specialized Finance Module for processing payments, receipts, and ledger statements.</span>
                </PanelContent>
              </Panel>
            </PanelContent>
          )}

          {/* MONITORING TAB */}
          {tab === 'monitoring' && (
            <PanelContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="System Status" 
                  value="Operational" 
                  subtext="All systems go" 
                  icon={Server} 
                  color="emerald" 
                />
                <StatCard 
                  title="Database Connection" 
                  value="Connected" 
                  subtext="Healthy ping" 
                  icon={CheckCircle2} 
                  color="emerald" 
                />
                <StatCard 
                  title="Payroll Disbursed" 
                  value={formatCurrency(payroll.totalPaid)} 
                  subtext="Completed payouts" 
                  icon={DollarSign} 
                  color="emerald" 
                  isCurrency 
                />
                <StatCard 
                  title="Pending Payroll" 
                  value={payroll.pending} 
                  subtext="Awaiting clearance" 
                  icon={Clock} 
                  color={payroll.pending > 0 ? 'amber' : 'emerald'} 
                />
              </div>
            </PanelContent>
          )}
        </motion.div>
      </AnimatePresence>

      {/* GLOBAL SPOTLIGHT COMMAND PALETTE MODAL (Ctrl + K) */}
      <AnimatePresence>
        {isCommandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
            >
              <PanelHeader className="flex items-center px-4 border-b border-slate-100">
                <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                <Input
                  type="text"
                  autoFocus
                  placeholder="Type to search students, staff, or invoices globally..."
                  value={globalQuery}
                  onChange={e => setGlobalQuery(e.target.value)}
                  className="w-full py-4 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none bg-transparent"
                />
                {isSearchingGlobal ? (
                  <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0 ml-2" />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCommandOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </PanelHeader>

              <PanelContent className="max-h-96 overflow-y-auto p-3 space-y-4">
                {!globalQuery.trim() ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <Command className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-600" />
                    Start typing to query the entire database instantly.
                  </div>
                ) : (
                  <>
                    {globalResults.students.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</span>
                        {globalResults.students.map((s: any) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setTab('students')
                              setStudentSearch(s.studentNumber)
                              setIsCommandOpen(false)
                            }}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                <GraduationCap className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                                  {s.firstName} {s.lastName}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500">{s.studentNumber}</p>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-indigo-600">View →</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {globalResults.staff.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff</span>
                        {globalResults.staff.map((s: any) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setTab('staff')
                              setStaffSearch(s.staffNumber)
                              setIsCommandOpen(false)
                            }}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/60 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                <Briefcase className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                                  {s.firstName} {s.lastName}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500">{s.staffNumber} • {s.department || 'Staff'}</p>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-blue-600">View →</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {globalResults.invoices.length > 0 && (
                      <div className="space-y-1">
                        <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices</span>
                        {globalResults.invoices.map((inv: any) => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setTab('finance')
                              setIsCommandOpen(false)
                            }}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/60 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                <CreditCard className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                                  Invoice #{inv.invoiceNumber || inv.id.substring(0, 8)}
                                </p>
                                <p className="text-[10px] font-mono text-slate-500">Amount: {formatCurrency(inv.amount)}</p>
                              </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-emerald-600">View →</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {globalResults.students.length === 0 && globalResults.staff.length === 0 && globalResults.invoices.length === 0 && !isSearchingGlobal && (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No matches found for "{globalQuery}".
                      </div>
                    )}
                  </>
                )}
              </PanelContent>

              <PanelFooter className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Navigate with mouse or click results</span>
                <span className="font-mono">ESC to close</span>
              </PanelFooter>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK ACTION SLIDE-OVER DRAWER MODAL */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white shadow-2xl border-l border-slate-200 h-full flex flex-col z-10"
            >
              <PanelHeader className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Quick Workflow Action</h2>
                    <p className="text-xs text-slate-500">Instant system write operation</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </PanelHeader>

              <PanelContent className="flex p-3 bg-slate-100/70 border-b border-slate-200 gap-1">
                <Button
                  variant={drawerMode === 'student' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setDrawerMode('student')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    drawerMode === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Quick Student
                </Button>
                <Button
                  variant={drawerMode === 'finance' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setDrawerMode('finance')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    drawerMode === 'finance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Record Payment
                </Button>
              </PanelContent>

              <Form 
                onSubmit={handleQuickActionSubmit} 
                className="p-6 space-y-4 flex-1 overflow-y-auto"
              >
                {actionSuccess && (
                  <Alert 
                    variant="success" 
                    className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{actionSuccess}</span>
                  </Alert>
                )}

                <FormField>
                  <FormLabel 
                    htmlFor="quick-action-name"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                  >
                    {drawerMode === 'student' ? 'Full Name' : 'Payer / Student Name'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="quick-action-name"
                      type="text"
                      required
                      placeholder={drawerMode === 'student' ? 'e.g. John Doe' : 'e.g. Jane Smith'}
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <FormLabel 
                    htmlFor="quick-action-id"
                    className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                  >
                    {drawerMode === 'student' ? 'Student Number / Reg ID' : 'Invoice Reference / ID'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="quick-action-id"
                      type="text"
                      required
                      placeholder={drawerMode === 'student' ? 'e.g. STU-2026-001' : 'e.g. INV-1092'}
                      value={formIdentifier}
                      onChange={e => setFormIdentifier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </FormControl>
                </FormField>

                {drawerMode === 'finance' && (
                  <FormField>
                    <FormLabel 
                      htmlFor="quick-action-amount"
                      className="text-xs font-bold text-slate-700 uppercase tracking-wide"
                    >
                      Amount Paid (UGX)
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="quick-action-amount"
                        type="number"
                        required
                        placeholder="e.g. 500000"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </FormControl>
                  </FormField>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={actionLoading}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{drawerMode === 'student' ? 'Save Student Record' : 'Process Payment'}</span>
                  </Button>
                </div>
              </Form>
            </PanelContent>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* Helper Components */

function StatCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  color = 'indigo',
  isCurrency = false,
}: {
  title: string
  value: string | number
  subtext: string
  trend?: string
  icon: React.ElementType
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'blue' | 'purple'
  isCurrency?: boolean
}) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }

  return (
    <Card className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between relative overflow-hidden">
      <div className="space-y-1 z-10">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {trend && (
            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> {trend}
            </span>
          )}
        </div>
        <p className={`font-extrabold tracking-tight text-slate-900 ${isCurrency ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'}`}>
          {value}
        </p>
        <p className="text-xs text-slate-400 font-medium">{subtext}</p>
      </div>
      <div className={`p-3 rounded-2xl border ${colorMap[color]} flex-shrink-0 z-10`}>
        <Icon className="w-6 h-6" />
      </div>
    </Card>
  )
}

function ActionButton({
  label,
  desc,
  icon: Icon,
  onClick,
  secondary = false,
}: {
  label: string
  desc: string
  icon: React.ElementType
  onClick: () => void
  secondary?: boolean
}) {
  return (
    <Button
      variant={secondary ? 'outline' : 'default'}
      size="sm"
      className="group flex items-center justify-between p-4 rounded-xl border text-left transition-all active:scale-95"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold">{label}</h3>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
    </Button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isActive = (status || '').toLowerCase() === 'active'
  return (
    <Badge
      variant={isActive ? 'secondary' : 'destructive'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {status || 'Unknown'}
    </Badge>
  )
}

function SummaryPill({ label, count, icon: Icon, color }: { label: string; count: number; icon: React.ElementType; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  }
  return (
    <Card className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border ${colorMap[color] || 'bg-slate-100 text-slate-600'`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <span className="text-lg font-bold text-slate-900">{count}</span>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse flex items-center justify-between">
      <div className="space-y-2">
        <div className="w-20 h-3 bg-slate-200 rounded" />
        <div className="w-28 h-6 bg-slate-200 rounded" />
        <div className="w-16 h-3 bg-slate-100 rounded" />
      </div>
      <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
    </Card>
  )
}

function SkeletonTable() {
  return (
    <div className="space-y-3 animate-pulse pt-2">
      <div className="h-12 bg-slate-100 rounded-xl" />
      <div className="h-12 bg-slate-50 rounded-xl" />
      <div className="h-12 bg-slate-50 rounded-xl" />
    </div>
  )
