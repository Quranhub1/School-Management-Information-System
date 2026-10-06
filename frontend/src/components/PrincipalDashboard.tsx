import { useEffect, useState, type FormEvent } from 'react'
import {
  getPrincipalDashboard,
  getStaffPerformance,
  getDepartmentalSummary,
  type PrincipalDashboard,
  type StaffPerformance,
  type DepartmentalSummary,
} from '../api/principal'
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
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Badge,
  Form,
  FormField,
  FormLabel,
  FormControl
} from '@/components/ui'

type MainTab = 'overview' | 'academics' | 'staff' | 'departments'

export function PrincipalDashboard() {
  const [mainTab, setMainTab] = useState<MainTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dashboard, setDashboard] = useState<PrincipalDashboard | null>(null)
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [departments, setDepartments] = useState<DepartmentalSummary[]>([])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [dash, staff, depts] = await Promise.all([
        getPrincipalDashboard(),
        getStaffPerformance(),
        getDepartmentalSummary(),
      ])
      setDashboard(dash)
      setStaffPerformance(staff)
      setDepartments(depts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load principal dashboard.')
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    if (status === 'Active' || status === 'Paid' || status === 'Accepted' || status === 'Passed') return 'text-success'
    if (status === 'Pending' || status === 'UnderReview' || status === 'Submitted') return 'text-warning'
    return 'text-destructive'
  }

  useEffect(() => {
    void loadAll()
  }, [])

  return (
    <Panel>
      <PanelHeader>
        <div>
          <span className="eyebrow">PRINCIPAL</span>
          <h2>Institutional Dashboard</h2>
        </div>
        <Button variant="secondary" onClick={() => void loadAll()}>
          Refresh
        </Button>
      </PanelHeader>

      {error && <div className="alert alert-destructive mt-4" role="alert">{error}</div>}

      <Tabs className="mt-4">
        <TabList>
          <Tab 
            isSelected={mainTab === 'overview'} 
            onClick={() => setMainTab('overview')}>
            Overview
          </Tab>
          <Tab 
            isSelected={mainTab === 'academics'} 
            onClick={() => setMainTab('academics')}>
            Academics
          </Tab>
          <Tab 
            isSelected={mainTab === 'staff'} 
            onClick={() => setMainTab('staff')}>
            Staff Performance
          </Tab>
          <Tab 
            isSelected={mainTab === 'departments'} 
            onClick={() => setMainTab('departments')}>
            Departments
          </Tab>
        </TabList>
      </Tabs>

      {loading ? (
        <PanelContent className="mt-4">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading principal dashboard…</p>
          </div>
        </PanelContent>
      ) : dashboard ? (
        <PanelContent className="mt-4">
          {mainTab === 'overview' && (
            <>
              <div className="grid gap-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Students</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">{dashboard.totalStudents}</div>
                      <p className="text-muted-foreground">Enrolled Students</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Students</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-success">
                      <div className="text-2xl font-bold">{dashboard.activeStudents}</div>
                      <p className="text-muted-foreground">Currently Attending</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Staff</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">{dashboard.totalStaff}</div>
                      <p className="text-muted-foreground">Employed Staff</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Programmes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">{dashboard.totalProgrammes}</div>
                      <p className="text-muted-foreground">Academic Programs</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">{dashboard.totalCourses}</div>
                      <p className="text-muted-foreground">Course Offerings</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Outstanding Invoices</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-destructive">
                      <div className="text-2xl font-bold">{dashboard.outstandingInvoices}</div>
                      <p className="text-muted-foreground">Unpaid Invoices</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-2xl font-bold">UGX {dashboard.totalInvoiced.toLocaleString()}</div>
                      <p className="text-muted-foreground">Total Billed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Collected</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-success">
                      <div className="text-2xl font-bold">UGX {dashboard.totalPaid.toLocaleString()}</div>
                      <p className="text-muted-foreground">Total Received</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Admissions Overview</h3>
                    <div className="grid gap-4 mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Pending</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-warning">
                          <div className="text-2xl font-bold">{dashboard.pendingAdmissions}</div>
                          <p className="text-muted-foreground">Awaiting Decision</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Accepted</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-success">
                          <div className="text-2xl font-bold">{dashboard.acceptedAdmissions}</div>
                          <p className="text-muted-foreground">Offer Accepted</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Rejected</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-destructive">
                          <div className="text-2xl font-bold">{dashboard.rejectedAdmissions}</div>
                          <p className="text-muted-foreground">Application Denied</p>
                        </CardContent>
                      </Card>
                    </div>

                    <h4 className="text-sm font-medium text-foreground mb-2">Recent Admissions</h4>
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Programme</TableHead>
                            <TableHead>Academic Year</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.recentAdmissions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                                No recent admissions
                              </TableCell>
                            </TableRow>
                          ) : (
                            dashboard.recentAdmissions.map(admission => (
                              <TableRow key={admission.id}>
                                <TableCell>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(admission.status)}`}>
                                    {admission.status}
                                  </span>
                                </TableCell>
                                <TableCell>{admission.programmeId}</TableCell>
                                <TableCell>{admission.academicYearId}</TableCell>
                                <TableCell>{new Date(admission.createdAt).toLocaleDateString('en-UG')}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Outstanding Balances</h3>
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Programme</TableHead>
                            <TableHead>Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.outstandingBalances.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                                No outstanding balances
                              </TableCell>
                            </TableRow>
                          ) : (
                            dashboard.outstandingBalances.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <strong>{item.studentNumber}</strong> {item.studentName}
                                </TableCell>
                                <TableCell>{item.programmeName}</TableCell>
                                <TableCell className="text-destructive font-semibold">
                                  {item.currency} {item.balance.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Payments</h3>
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Receipt No.</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.recentPayments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
                                No recent payments
                              </TableCell>
                            </TableRow>
                          ) : (
                            dashboard.recentPayments.map(payment => (
                              <TableRow key={payment.id}>
                                <TableCell><strong>{payment.receiptNumber}</strong></TableCell>
                                <TableCell>{payment.studentName}</TableCell>
                                <TableCell className="text-success font-semibold">
                                  UGX {payment.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>{payment.paymentMethod}</TableCell>
                                <TableCell>{new Date(payment.paidAt).toLocaleDateString('en-UG')}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {mainTab === 'academics' && (
            <PanelContent className="mt-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Academic Overview</h3>
                  <div className="grid gap-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Total Results</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-2xl font-bold">{dashboard.totalResults}</div>
                          <p className="text-muted-foreground">Assessments Recorded</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Passed</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-success">
                          <div className="text-2xl font-bold">{dashboard.passedResults}</div>
                          <p className="text-muted-foreground">Successful Outcomes</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Failed</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-destructive">
                          <div className="text-2xl font-bold">{dashboard.failedResults}</div>
                          <p className="text-muted-foreground">Needs Improvement</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Pass Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-2xl font-bold">{dashboard.totalResults > 0 ? Math.round((dashboard.passedResults / dashboard.totalResults) * 100) : 0}%</div>
                          <p className="text-muted-foreground">Success Rate</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-2xl font-bold">{dashboard.attendanceSessions}</div>
                          <p className="text-muted-foreground">Session Count</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Records</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-2xl font-bold">{dashboard.attendanceRecords}</div>
                          <p className="text-muted-foreground">Total Records</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Absent</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-destructive">
                          <div className="text-2xl font-bold">{dashboard.absentRecords}</div>
                          <p className="text-muted-foreground">Days Missed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Rate</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                          <div className="text-2xl font-bold">{dashboard.attendanceRecords > 0 ? Math.round(((dashboard.attendanceRecords - dashboard.absentRecords) / dashboard.attendanceRecords) * 100) : 0}%</div>
                          <p className="text-muted-foreground">Attendance Percentage</p>
                        </CardContent>
                      </Card>
                    </div>

                    <h4 className="text-sm font-medium text-foreground mb-2">Recent Results</h4>
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.recentResults.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                                No results found
                              </TableCell>
                            </TableRow>
                          ) : (
                            dashboard.recentResults.map(r => (
                              <TableRow key={r.id}>
                                <TableCell><strong>{r.studentName}</strong></TableCell>
                                <TableCell>{r.score}</TableCell>
                                <TableCell><strong>{r.grade}</strong></TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${r.passed ? 'text-success' : 'text-destructive'}`}>
                                    {r.passed ? 'Pass' : 'Fail'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </PanelContent>
            )}

          {mainTab === 'staff' && (
            <PanelContent className="mt-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Staff Performance Overview</h3>
                  <div className="grid gap-4 mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Payroll</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center text-warning">
                        <div className="text-2xl font-bold">{dashboard.pendingPayroll}</div>
                        <p className="text-muted-foreground">Awaiting Processing</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Paid Payroll</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center text-success">
                        <div className="text-2xl font-bold">{dashboard.paidPayroll}</div>
                        <p className="text-muted-foreground">Successfully Processed</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff No.</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Classes</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Results</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffPerformance.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                              No staff data found
                            </TableRow>
                          ) : (
                            staffPerformance.map(s => (
                              <TableRow key={s.id}>
                                <TableCell><strong>{s.staffNumber}</strong></TableCell>
                                <TableCell>{s.firstName} {s.lastName}</TableCell>
                                <TableCell>{s.department || '—'}</TableCell>
                                <TableCell>{s.position || '—'}</TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(s.status)}`}>
                                    {s.status}
                                  </span>
                                </TableCell>
                                <TableCell>{s.classCount}</TableCell>
                                <TableCell>{s.studentCount}</TableCell>
                                <TableCell>{s.resultCount}</TableCell>
                              </TableRow>
                            ))
                          )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </PanelContent>
            )}

          {mainTab === 'departments' && (
            <PanelContent className="mt-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Departmental Summary</h3>
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead>Programmes</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Students</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {departments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                              No departments found
                            </TableRow>
                          ) : (
                            departments.map(d => (
                              <TableRow key={d.id}>
                                <TableCell><strong>{d.name}</strong></TableCell>
                                <TableCell>{d.programmeCount}</TableCell>
                                <TableCell>{d.staffCount}</TableCell>
                                <TableCell>{d.studentCount}</TableCell>
                              </TableRow>
                            ))
                          )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </PanelContent>
            )}
          </>
        ) : (
          <PanelContent className="mt-4">
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No data available.</p>
            </div>
          </PanelContent>
        )}
      </Panel>
    )
  )
}