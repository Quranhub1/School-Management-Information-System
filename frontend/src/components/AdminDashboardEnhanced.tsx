import { useEffect, useState } from 'react'
import { getSession } from '../api/auth'
import { getUsers } from '../api/administration'
import { getStudents } from '../api/students'
import { listStaff } from '../api/staff'
import { getInvoices } from '../api/finance'
import { listPayroll } from '../api/payroll'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

type Tab = 'overview' | 'users' | 'students' | 'staff' | 'finance' | 'monitoring'

// Enhanced notification system
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

const toastStyles: Record<ToastProps['type'], string> = {
  success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
  error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
  warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800',
  info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800',
};

const IconMap: Record<ToastProps['type'], any> = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function AdminDashboard() {
  const session = getSession()
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const [users, setUsers] = useState<{ total: number; active: number; admins: number }>({ total: 0, active: 0, admins: 0 })
  const [students, setStudents] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [staff, setStaff] = useState<{ total: number; active: number }>({ total: 0, active: 0 })
  const [finance, setFinance] = useState<{ totalBilled: number; totalPaid: number; outstanding: number; invoices: number }>({ totalBilled: 0, totalPaid: 0, outstanding: 0, invoices: 0 })
  const [payroll, setPayroll] = useState<{ totalPaid: number; pending: number }>({ totalPaid: 0, pending: 0 })

  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState<{ id: string; studentNumber: string; name: string; status: string }[]>([])
  const [staffSearch, setStaffSearch] = useState('')
  const [staffResults, setStaffResults] = useState<{ id: string; staffNumber: string; name: string; department: string; status: string }[]>([])

  // Toast management
  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  async function loadMetrics() {
    setLoading(true); setError('')
    try {
      const [usersRes, studentsRes, staffRes, invoicesRes, payrollRes] = await Promise.all([
        getUsers(),
        getStudents(),
        listStaff(),
        getInvoices(),
        listPayroll(),
      ])
      
      setUsers({
        total: usersRes.length,
        active: usersRes.filter(u => u.isActive).length,
        admins: usersRes.filter(u => u.roles.includes('SystemAdministrator')).length,
      })
      setStudents({ total: studentsRes.length, active: studentsRes.filter(s => s.status === 'Active').length })
      setStaff({ total: staffRes.length, active: staffRes.filter(s => s.isActive).length })
      
      const totalBilled = invoicesRes.reduce((sum, inv) => sum + inv.amount, 0)
      const totalPaid = invoicesRes.reduce((sum, inv) => sum + inv.paidAmount, 0)
      setFinance({
        totalBilled,
        totalPaid,
        outstanding: totalBilled - totalPaid,
        invoices: invoicesRes.length,
      })
      
      const payrollRecords = payrollRes as { status?: string; netPay?: number }[]
      setPayroll({
        totalPaid: payrollRecords.filter(p => p.status === 'Paid').reduce((sum, p) => sum + (p.netPay || 0), 0),
        pending: payrollRecords.filter(p => p.status === 'Pending').length,
      })
      
      // Success toast
      addToast({
        type: 'success',
        title: 'Dashboard Updated',
        description: 'All metrics have been refreshed successfully.'
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard data.')
      addToast({
        type: 'error',
        title: 'Load Error',
        description: 'Failed to load dashboard data. Please try again.'
      })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadMetrics() }, [])

  async function searchStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!studentSearch.trim()) return
    try {
      const all = await getStudents()
      const q = studentSearch.trim().toLowerCase()
      setStudentResults(all.filter(s => s.studentNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, studentNumber: s.studentNumber, name: `${s.firstName} ${s.lastName}`.trim(), status: s.status })))
      
      addToast({
        type: 'info',
        title: 'Search Complete',
        description: `Found ${studentResults.length} matching students.`
      })
    } catch { 
      setError('Unable to search students.')
      addToast({
        type: 'error',
        title: 'Search Error',
        description: 'Failed to search for students.'
      })
    }
  }

  async function searchStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!staffSearch.trim()) return
    try {
      const all = await listStaff()
      const q = staffSearch.trim().toLowerCase()
      setStaffResults(all.filter(s => s.staffNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, staffNumber: s.staffNumber, name: `${s.firstName} ${s.lastName}`.trim(), department: (s as { department?: string }).department || '—', status: s.isActive ? 'Active' : 'Inactive' })))
      
      addToast({
        type: 'info',
        title: 'Search Complete',
        description: `Found ${staffResults.length} matching staff members.`
      })
    } catch { 
      setError('Unable to search staff.')
      addToast({
        type: 'error',
        title: 'Search Error',
        description: 'Failed to search for staff.'
      })
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'students', label: 'Students' },
    { key: 'staff', label: 'Staff' },
    { key: 'finance', label: 'Finance' },
    { key: 'monitoring', label: 'Monitoring' },
  ]

  // Animated counter component
  const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0)
    
    useEffect(() => {
      if (value === displayValue) return
      
      const duration = 1200
      const startTime = performance.now()
      
      function updateCount(currentTime: number) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress
        
        const currentValue = Math.floor(easedProgress * value)
        setDisplayValue(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(updateCount)
        }
      }
      
      requestAnimationFrame(updateCount)
    }, [value])
    
    return (
      <span className="font-bold text-xl tracking-tight">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </span>
    )
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={`${toastStyles[toast.type]} rounded-lg p-4 flex items-start gap-3 shadow-lg`}
          >
            <motion.icon
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex-shrink-0 mt-1"
              size={20}
            >
              <IconMap[toast.type] />
            </motion.icon>
            <div className="flex-1">
              <h4 className="font-medium mb-1">{toast.title}</h4>
              {toast.description && <p className="text-sm">{toast.description}</p>}
            </div>
            <motion.button
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-2 mt-1 text-[its-type] hover:underline"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Admin Dashboard */}
      <section className="panel" aria-label="Administrator dashboard">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Administrator</p>
            <h2>Welcome, {session?.username ?? 'Admin'}</h2>
          </div>
          <span className="status">{new Date().toLocaleDateString('en-UG')}</span>
        </div>

        <div className="library-workspace-tabs" role="tablist" aria-label="Admin sections" style={{ marginBottom: 18 }}>
          {tabs.map(t => (
            <motion.button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              initial={{ scale: 0.95 }}
              animate={{ scale: tab === t.key ? 1 : 0.95 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
              className={[
                'transition-all duration-300 ease-in-out',
                tab === t.key 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-400 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              ].join(' ')}
            >
              {t.label}
            </motion.button>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="error mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        {tab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="animate-fade-in"
          >
            <div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                {/* Enhanced summary cards with hover effects */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Students</span>
                    <AnimatedCounter value={students.total} />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Active Students</span>
                    <AnimatedCounter 
                      value={students.active} 
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Staff</span>
                    <AnimatedCounter value={staff.total} />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Active Staff</span>
                    <AnimatedCounter 
                      value={staff.active} 
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Users</span>
                    <AnimatedCounter value={users.total} />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Active Users</span>
                    <AnimatedCounter 
                      value={users.active} 
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Revenue</span>
                    <AnimatedCounter 
                      value={finance.totalPaid} 
                      prefix="UGX "
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Outstanding</span>
                    <AnimatedCounter 
                      value={finance.outstanding} 
                      prefix="UGX "
                      className={finance.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="card"
                style={{ marginBottom: 20 }}
              >
                <h3>Quick Actions</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn transition-all duration-200"
                    onClick={() => setTab('students')}
                  >
                    Search Students
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn transition-all duration-200"
                    onClick={() => setTab('staff')}
                  >
                    Search Staff
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn transition-all duration-200"
                    onClick={() => setTab('finance')}
                  >
                    View Finance
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-secondary transition-all duration-200"
                    onClick={() => setTab('monitoring')}
                  >
                    System Monitoring
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        )}

        {tab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="table-wrap">
              <h3>All Users</h3>
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="empty p-4 text-center"
                >
                  Loading users…
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="empty p-4 text-center"
                >
                  {users.total} total users, {users.active} active, {users.admins} administrators
                </motion.div>
              )}
            </div>
          )
        )}

        {tab === 'students' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <form className="student-form" onSubmit={searchStudent} style={{ marginBottom: 22 }}>
                <h3>Student Search</h3>
                <div className="form-row">
                  <motion.input
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Student search"
                    placeholder="Search by student number or name..."
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    className="transition-all duration-200"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn transition-all duration-200"
                  >
                    Search
                  </motion.button>
                </div>
              </form>
              {studentResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="table-wrap"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Student Number</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map(s => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: s.id.length * 0.01 }}
                          className="transition-all duration-200 hover:bg-gray-50"
                        >
                          <td>{s.studentNumber}</td>
                          <td>{s.name}</td>
                          <td>
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className={`
                                inline-flex min-w-[34px] items-center justify-center 
                                px-2 py-1 rounded 
                                ${s.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : 'bg-rose-50 text-rose-800'
                                }
                              `}
                            >
                              {s.status}
                            </motion.span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </div>
          )
        )}

        {tab === 'staff' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <form className="student-form" onSubmit={searchStaff} style={{ marginBottom: 22 }}>
                <h3>Staff Search</h3>
                <div className="form-row">
                  <motion.input
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.01 }}
                    aria-label="Staff search"
                    placeholder="Search by staff number or name..."
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                    className="transition-all duration-200"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn transition-all duration-200"
                  >
                    Search
                  </motion.button>
                </div>
              </form>
              {staffResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="table-wrap"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Staff Number</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffResults.map(s => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: s.id.length * 0.01 }}
                          className="transition-all duration-200 hover:bg-gray-50"
                        >
                          <td>{s.staffNumber}</td>
                          <td>{s.name}</td>
                          <td>{s.department}</td>
                          <td>
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className={`
                                inline-flex min-w-[34px] items-center justify-center 
                                px-2 py-1 rounded 
                                ${s.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : 'bg-rose-50 text-rose-800'
                                }
                              `}
                            >
                              {s.status}
                            </motion.span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </div>
          )
        )}

        {tab === 'finance' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Total Billed</span>
                    <AnimatedCounter 
                      value={finance.totalBilled} 
                      prefix="UGX "
                      className="text-indigo-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Total Paid</span>
                    <AnimatedCounter 
                      value={finance.totalPaid} 
                      prefix="UGX "
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Outstanding</span>
                    <AnimatedCounter 
                      value={finance.outstanding} 
                      prefix="UGX "
                      className={finance.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Invoices</span>
                    <AnimatedCounter value={finance.invoices} />
                  </div>
                </motion.div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="empty mt-4"
              >
                Use the Finance module for detailed invoices, payments, and receipts.
              </motion.p>
            </div>
          )
        )}

        {tab === 'monitoring' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div>
              <div className="summary-grid" style={{ marginBottom: 22 }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>System Status</span>
                    <motion.span
                      className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium"
                    >
                      Operational
                    </motion.span>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Database</span>
                    <motion.span
                      className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium"
                    >
                      Connected
                    </motion.span>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Payroll Paid</span>
                    <AnimatedCounter 
                      value={payroll.totalPaid} 
                      prefix="UGX "
                      className="text-emerald-600"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="transition-all duration-300"
                >
                  <div className="summary-card">
                    <span>Payroll Pending</span>
                    <AnimatedCounter 
                      value={payroll.pending} 
                      className={payroll.pending > 0 ? 'text-amber-600' : 'text-emerald-600'}
                    />
                  </div>
                </motion.div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="empty mt-4"
              >
                System monitoring and audit logs are available in the respective modules.
              </motion.p>
            </div>
          )
        )}
      </section>
    </>
  )
}

export default AdminDashboard