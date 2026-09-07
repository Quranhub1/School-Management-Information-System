const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'mock-secret-key-change-in-production';
const PORT = process.env.PORT || 5000;

function signToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    unique_name: user.username,
    name: user.username,
    roles: user.roles,
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60)
  })).toString('base64');
  const signature = Buffer.from(`${header}.${payload}.${JWT_SECRET}`).toString('base64');
  return `${header}.${payload}.${signature}`;
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.sendStatus(401);
  const token = auth.slice(7);
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return res.sendStatus(401);
    req.user = payload;
    next();
  } catch {
    return res.sendStatus(401);
  }
}

const students = [
  { id: '1', studentNumber: 'HTIN-2024-001', firstName: 'Alice', lastName: 'Nakibuule', otherNames: '', dateOfBirth: '2000-05-15', gender: 'Female', nationalId: 'CM1234567890', phoneNumber: '0700123456', email: 'alice@student.ac.ug', status: 'Active', createdAt: '2024-08-01T00:00:00Z', admissionId: null },
  { id: '2', studentNumber: 'HTIN-2024-002', firstName: 'Brian', lastName: 'Mukasa', otherNames: '', dateOfBirth: '1999-12-03', gender: 'Male', nationalId: 'CM0987654321', phoneNumber: '0700654321', email: 'brian@student.ac.ug', status: 'Active', createdAt: '2024-08-05T00:00:00Z', admissionId: null },
];

const users = [
  { id: 'u1', username: 'student1', passwordHash: '$2b$10$mock', firstName: 'Alice', lastName: 'Nakibuule', roles: ['Student'], isActive: true, studentNumber: 'HTIN-2024-001' },
  { id: 'u2', username: 'admin', passwordHash: '$2b$10$mock', firstName: 'System', lastName: 'Admin', roles: ['SystemAdministrator'], isActive: true },
];

const notices = [
  { id: 'n1', title: 'Welcome Back', body: 'Welcome to the new semester.', priority: 'General', audience: 'All', expiresAt: null, createdBy: 'admin', createdAt: new Date().toISOString(), isActive: true },
  { id: 'n2', title: 'Exam Schedule', body: 'Exams start next Monday.', priority: 'Important', audience: 'Students', expiresAt: null, createdBy: 'admin', createdAt: new Date().toISOString(), isActive: true },
];

const transcripts = [
  { id: 't1', studentId: '1', courseRegistrationId: 'r1', academicYearId: '2024', semesterId: '1', courseCode: 'CS101', courseTitle: 'Intro to Computing', creditUnits: 3, score: 85, grade: 'A', gradePoint: 5, isPass: true, status: 'Recorded' },
  { id: 't2', studentId: '1', courseRegistrationId: 'r2', academicYearId: '2024', semesterId: '1', courseCode: 'MTH101', courseTitle: 'Calculus I', creditUnits: 4, score: 72, grade: 'B', gradePoint: 4, isPass: true, status: 'Recorded' },
  { id: 't3', studentId: '1', courseRegistrationId: 'r3', academicYearId: '2024', semesterId: '2', courseCode: 'CS201', courseTitle: 'Data Structures', creditUnits: 3, score: 90, grade: 'A', gradePoint: 5, isPass: true, status: 'Recorded' },
];

const summaries = [
  { id: 's1', studentId: '1', academicYearId: '2024', semesterId: '1', totalCreditUnits: 7, totalGradePoints: 31, gpa: 4.43, cgpa: 4.43, standing: 'Good', isApproved: true, approvedAt: new Date().toISOString() },
  { id: 's2', studentId: '1', academicYearId: '2024', semesterId: '2', totalCreditUnits: 3, totalGradePoints: 15, gpa: 5.0, cgpa: 4.64, standing: 'Excellent', isApproved: true, approvedAt: new Date().toISOString() },
];

const courses = [
  { id: 'c1', code: 'CS101', name: 'Intro to Computing', creditUnits: 3, isActive: true },
  { id: 'c2', code: 'MTH101', name: 'Calculus I', creditUnits: 4, isActive: true },
  { id: 'c3', code: 'CS201', name: 'Data Structures', creditUnits: 3, isActive: true },
];

const programmes = [
  { id: 'p1', code: 'BSCS', name: 'Bachelor of Science in Computer Science', award: 'Bachelor of Science', durationYears: 3, isActive: true },
];

const academicYears = [
  { id: 'ay1', name: '2024/2025', startDate: '2024-08-01', endDate: '2025-07-31', isCurrent: true, isActive: true },
];

const semesters = [
  { id: 'sem1', academicYearId: 'ay1', name: 'Semester 1', sequence: 1, startDate: '2024-08-01', endDate: '2024-12-20', isCurrent: false, isActive: true },
  { id: 'sem2', academicYearId: 'ay1', name: 'Semester 2', sequence: 2, startDate: '2025-01-06', endDate: '2025-05-30', isCurrent: true, isActive: true },
];

const teachingGroups = [
  { id: 'tg1', courseOfferingId: 'co1', groupCode: 'CS101-A', name: 'Group A', capacity: 50, isActive: true },
];

const applicants = [
  { id: 'a1', applicationNumber: 'APP-2024-001', firstName: 'John', lastName: 'Doe', otherNames: '', dateOfBirth: '2001-03-10', gender: 'Male', nationalId: 'CM1111111111', phoneNumber: '0700111111', email: 'john@apply.ac.ug', status: 'Submitted', appliedAt: new Date().toISOString() },
];

const alumni = [
  { id: 'al1', studentId: '1', firstName: 'Alice', lastName: 'Nakibuule', otherNames: '', graduationDate: '2024-06-15', programme: 'BSCS', currentOccupation: 'Software Engineer', employer: 'Tech Co', contactInfo: '', isActive: true },
];

const invoices = [
  { id: 'inv1', studentId: '1', invoiceNumber: 'INV-2024-001', amount: 1500000, paidAmount: 500000, balance: 1000000, currency: 'UGX', status: 'Partially Paid', issuedAt: new Date().toISOString() },
];

const payments = [
  { id: 'pay1', studentInvoiceId: 'inv1', invoiceNumber: 'INV-2024-001', studentId: '1', receiptNumber: 'RCP-001', amount: 500000, currency: 'UGX', paymentMethod: 'Cash', reference: 'CASH-001', paidAt: new Date().toISOString() },
];

let nextId = 100;
function genId(prefix = 'id') { return `${prefix}${nextId++}` }

function getStudentByUsername(username) {
  const user = users.find(u => u.username === username);
  const student = students.find(s => s.studentNumber === (user?.studentNumber || username));
  return student;
}

function getUserById(userId) {
  return users.find(u => u.id === userId);
}

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: 'Invalid username or password.' });
  const token = signToken(user);
  return res.json({ accessToken: token, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), username: user.username, roles: user.roles });
});

// STUDENT PORTAL
app.get('/api/student-portal/me', authMiddleware, (req, res) => {
  const student = getStudentByUsername(req.user.name);
  if (!student) return res.status(404).json({ message: 'Student record not found. Contact administration.' });
  res.json({
    studentId: student.id, studentNumber: student.studentNumber,
    fullName: `${student.firstName} ${student.lastName}`.trim(), status: student.status,
    firstName: student.firstName, lastName: student.lastName, otherNames: student.otherNames,
    dateOfBirth: student.dateOfBirth, gender: student.gender, nationalId: student.nationalId,
    phoneNumber: student.phoneNumber, email: student.email, createdAt: student.createdAt, admissionId: student.admissionId
  });
});

app.get('/api/student-portal/me/transcript', authMiddleware, (req, res) => {
  const student = getStudentByUsername(req.user.name);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(transcripts.filter(t => t.studentId === student.id));
});

app.get('/api/student-portal/me/summaries', authMiddleware, (req, res) => {
  const student = getStudentByUsername(req.user.name);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(summaries.filter(s => s.studentId === student.id));
});

app.get('/api/student-portal/me/transcript/pdf', authMiddleware, (req, res) => {
  const student = getStudentByUsername(req.user.name);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentTranscripts = transcripts.filter(t => t.studentId === student.id);
  const studentSummaries = summaries.filter(s => s.studentId === student.id);
  const pdf = generateMockPdf(student, studentTranscripts, studentSummaries);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="transcript-${student.studentNumber}.pdf"`);
  res.send(pdf);
});

function generateMockPdf(student, entries, summaries) {
  const lines = [
    `Academic Transcript - ${student.firstName} ${student.lastName}`,
    `Student Number: ${student.studentNumber}`,
    '',
    'Course Results:',
    ...entries.map(e => `  ${e.courseCode}: ${e.courseTitle} | Credits: ${e.creditUnits} | Score: ${e.score} | Grade: ${e.grade || '—'}`),
    '',
    'Semester Summaries:',
    ...summaries.map(s => `  AY ${s.academicYearId} / Sem ${s.semesterId} | GPA: ${s.gpa.toFixed(2)} | CGPA: ${s.cgpa?.toFixed(2) || '—'} | Standing: ${s.standing}`)
  ];
  return Buffer.from(lines.join('\n'));
}

// ADMISSIONS
app.get('/api/admissions', authMiddleware, (req, res) => {
  res.json(applicants.map(a => ({ ...a, applicationNumber: a.applicationNumber, status: a.status, appliedAt: a.appliedAt })));
});

app.post('/api/admissions', authMiddleware, (req, res) => {
  const { firstName, lastName, otherNames, dateOfBirth, gender, nationalId, phoneNumber, email } = req.body;
  const id = genId('a');
  const applicationNumber = `APP-${new Date().getFullYear()}-${String(applicants.length + 1).padStart(3, '0')}`;
  const applicant = { id, applicationNumber, firstName, lastName, otherNames, dateOfBirth, gender, nationalId, phoneNumber, email, status: 'Submitted', appliedAt: new Date().toISOString() };
  applicants.push(applicant);
  res.status(201).json(applicant);
});

app.post('/api/admissions/:id/decision', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;
  const applicant = applicants.find(a => a.id === id);
  if (!applicant) return res.status(404).json({ message: 'Applicant not found' });
  if (['Accepted', 'Rejected'].includes(decision)) {
    applicant.status = decision;
  }
  res.json(applicant);
});

// STUDENTS
app.get('/api/students', authMiddleware, (req, res) => {
  res.json(students.map(s => ({ ...s })));
});

app.get('/api/students/:id', authMiddleware, (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

app.post('/api/students', authMiddleware, (req, res) => {
  const { studentNumber, firstName, lastName, otherNames, dateOfBirth, gender, nationalId, phoneNumber, email } = req.body;
  if (!studentNumber || !firstName || !lastName) return res.status(400).json({ message: 'studentNumber, firstName, lastName are required' });
  if (students.some(s => s.studentNumber === studentNumber)) return res.status(409).json({ message: 'Student number already exists' });
  const id = genId('stu');
  const student = { id, studentNumber, firstName, lastName, otherNames: otherNames || '', dateOfBirth: dateOfBirth || null, gender: gender || null, nationalId: nationalId || null, phoneNumber: phoneNumber || null, email: email || null, status: 'Active', createdAt: new Date().toISOString(), admissionId: null };
  students.push(student);
  res.status(201).json(student);
});

app.get('/api/students/:id/qrcode', authMiddleware, (req, res) => {
  const student = students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const qrData = Buffer.from(JSON.stringify({ studentId: student.id, studentNumber: student.studentNumber, name: `${student.firstName} ${student.lastName}` }));
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="qrcode-${student.studentNumber}.txt"`);
  res.send(qrData);
});

// FINANCE
app.get('/api/finance/invoices', authMiddleware, (req, res) => {
  const studentId = req.query.studentId;
  let results = invoices;
  if (studentId) results = results.filter(i => i.studentId === studentId);
  res.json(results);
});

app.post('/api/finance/invoices', authMiddleware, (req, res) => {
  const { studentId, invoiceNumber, amount, currency } = req.body;
  if (!studentId || !invoiceNumber || !amount) return res.status(400).json({ message: 'studentId, invoiceNumber, amount are required' });
  const id = genId('inv');
  const invoice = { id, studentId, invoiceNumber, amount: Number(amount), paidAmount: 0, balance: Number(amount), currency: currency || 'UGX', status: 'Unpaid', issuedAt: new Date().toISOString() };
  invoices.push(invoice);
  res.status(201).json(invoice);
});

app.post('/api/finance/invoices/:id/payments', authMiddleware, (req, res) => {
  const invoiceId = req.params.id;
  const { amount, receiptNumber, paymentMethod, reference, currency } = req.body;
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  const paymentAmount = Number(amount);
  invoice.paidAmount += paymentAmount;
  invoice.balance = Math.max(0, invoice.amount - invoice.paidAmount);
  invoice.status = invoice.balance === 0 ? 'Paid' : 'Partially Paid';
  const payment = { id: genId('pay'), studentInvoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, studentId: invoice.studentId, receiptNumber: receiptNumber || genId('rcp'), amount: paymentAmount, currency: currency || invoice.currency, paymentMethod: paymentMethod || 'Cash', reference: reference || '', paidAt: new Date().toISOString() };
  payments.push(payment);
  res.status(201).json(payment);
});

// REPORTS
app.get('/api/reports/summary', authMiddleware, (req, res) => {
  res.json({
    students: students.length,
    staff: staff.length,
    programmes: programmes.length,
    courses: courses.length,
    academicYears: academicYears.length,
    currentAcademicYears: academicYears.filter(y => y.isCurrent).length,
    activeLibraryBooks: 0,
    activeLibraryLoans: 0
  });
});

app.get('/api/reports/student/:studentId/report-card', authMiddleware, (req, res) => {
  const student = students.find(s => s.id === req.params.studentId);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentTranscripts = transcripts.filter(t => t.studentId === student.id);
  const studentSummaries = summaries.filter(s => s.studentId === student.id);
  const latestSummary = studentSummaries[0];
  const gpa = latestSummary ? latestSummary.gpa : 0;
  res.json({
    studentNumber: student.studentNumber,
    studentName: `${student.firstName} ${student.lastName}`,
    results: studentTranscripts.map(t => ({
      courseCode: t.courseCode,
      courseName: t.courseTitle,
      score: t.score,
      grade: t.grade,
      gradePoint: t.gradePoint,
      status: t.status,
      isFinal: true
    })),
    gpa
  });
});

// NOTICES
app.get('/api/notices/board', authMiddleware, (req, res) => {
  res.json(notices.filter(n => n.isActive));
});

// SEARCH
app.get('/api/search', authMiddleware, (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if (!q || q.length < 2) return res.json({ query: q, students: [], staff: [], courses: [], programmes: [], academicYears: [], semesters: [], teachingGroups: [], applicants: [], alumni: [] });

  const results = {
    query: q,
    students: students.filter(s => (!from || new Date(s.createdAt) >= from) && (!to || new Date(s.createdAt) <= to)).filter(s => s.studentNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, studentNumber: s.studentNumber, fullName: `${s.firstName} ${s.lastName}`, status: s.status })),
    staff: staff.filter(s => s.staffNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q) || s.staffType.toLowerCase().includes(q) || s.employmentType.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, staffNumber: s.staffNumber, fullName: `${s.firstName} ${s.lastName}`, employmentType: s.employmentType, staffType: s.staffType })),
    courses: courses.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)).slice(0, 20).map(c => ({ id: c.id, code: c.code, name: c.name, creditUnits: c.creditUnits })),
    programmes: programmes.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 20).map(p => ({ id: p.id, code: p.code, name: p.name, award: p.award })),
    academicYears: academicYears.filter(y => y.name.toLowerCase().includes(q)).slice(0, 20).map(y => ({ id: y.id, name: y.name, startDate: y.startDate, endDate: y.endDate, isCurrent: y.isCurrent })),
    semesters: semesters.filter(s => s.name.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, name: s.name, sequence: s.sequence, startDate: s.startDate, endDate: s.endDate, academicYearId: s.academicYearId })),
    teachingGroups: teachingGroups.filter(g => g.groupCode.toLowerCase().includes(q) || (g.name && g.name.toLowerCase().includes(q))).slice(0, 20).map(g => ({ id: g.id, groupCode: g.groupCode, name: g.name, courseOfferingId: g.courseOfferingId })),
    applicants: applicants.filter(a => a.applicationNumber.toLowerCase().includes(q) || a.firstName.toLowerCase().includes(q) || a.lastName.toLowerCase().includes(q)).slice(0, 20).map(a => ({ id: a.id, applicationNumber: a.applicationNumber, fullName: `${a.firstName} ${a.lastName}`, status: a.status })),
    alumni: alumni.filter(a => a.firstName.toLowerCase().includes(q) || a.lastName.toLowerCase().includes(q)).slice(0, 20).map(a => ({ id: a.id, studentId: a.studentId, fullName: `${a.firstName} ${a.lastName}`, graduationDate: a.graduationDate }))
  };
  res.json(results);
});

// MESSAGES
app.get('/api/messages/conversations', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/messages/:conversationId', authMiddleware, (req, res) => {
  res.json([]);
});

app.post('/api/messages/send', authMiddleware, (req, res) => {
  res.status(201).json({ id: genId('msg'), ...req.body, sentAt: new Date().toISOString() });
});

const staff = [
  { id: 'stf1', staffNumber: 'STF-001', firstName: 'Jane', lastName: 'Teacher', nationalId: '', phoneNumber: '0700111111', email: 'jane@school.ac.ug', employmentType: 'Permanent', staffType: 'Teaching', isActive: true },
  { id: 'stf2', staffNumber: 'STF-002', firstName: 'John', lastName: 'Clerk', nationalId: '', phoneNumber: '0700222222', email: 'john@school.ac.ug', employmentType: 'Contract', staffType: 'NonTeaching', isActive: true }
];

const payrollRecords = [
  { id: 'pay1', staffMemberId: 'stf1', month: 1, year: 2025, basicSalary: 50000, allowances: 15000, deductions: 5000, netPay: 60000, paymentDate: null, status: 'Pending' },
  { id: 'pay2', staffMemberId: 'stf2', month: 1, year: 2025, basicSalary: 50000, allowances: 8000, deductions: 5000, netPay: 53000, paymentDate: null, status: 'Pending' }
];

const timetableEntries = [
  { id: 'tt1', teachingGroupId: 'tg1', staffMemberId: 'stf1', dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00', room: 'Room 1', sessionType: 'Lecture', isActive: true }
];

const leaveRequests = [];

// STAFF
app.get('/api/staff', authMiddleware, (req, res) => {
  const activeOnly = req.query.activeOnly !== 'false';
  const results = activeOnly ? staff.filter(s => s.isActive) : staff;
  res.json(results);
});

app.post('/api/staff', authMiddleware, (req, res) => {
  const { staffNumber, firstName, lastName, nationalId, phoneNumber, email, employmentType, staffType } = req.body;
  if (!staffNumber || !firstName || !lastName || !employmentType || !staffType) return res.status(400).json({ message: 'staffNumber, firstName, lastName, employmentType and staffType are required' });
  if (staff.some(s => s.staffNumber === staffNumber)) return res.status(409).json({ message: 'Staff number already exists' });
  const id = genId('stf');
  const s = { id, staffNumber, firstName, lastName, nationalId: nationalId || '', phoneNumber: phoneNumber || '', email: email || '', employmentType, staffType, isActive: true };
  staff.push(s);
  res.status(201).json(s);
});

app.get('/api/staff/:id/leave', authMiddleware, (req, res) => {
  res.json(leaveRequests.filter(l => l.staffMemberId === req.params.id));
});

app.post('/api/staff/:id/leave', authMiddleware, (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  const id = genId('leave');
  const leave = { id, staffMemberId: req.params.id, leaveType, startDate, endDate, reason, status: 'Pending', approvedBy: null, approvedAt: null };
  leaveRequests.push(leave);
  res.status(201).json(leave);
});

app.patch('/api/staff/leave/:id/approve', authMiddleware, (req, res) => {
  const leave = leaveRequests.find(l => l.id === req.params.id);
  if (!leave) return res.status(404).json({ message: 'Leave not found' });
  leave.status = req.body.approved ? 'Approved' : 'Rejected';
  leave.approvedBy = req.body.approvedBy;
  leave.approvedAt = new Date().toISOString();
  res.sendStatus(204);
});

app.get('/api/staff/payroll', authMiddleware, (req, res) => {
  const staffMemberId = req.query.staffMemberId;
  let results = payrollRecords;
  if (staffMemberId) results = results.filter(r => r.staffMemberId === staffMemberId);
  res.json(results);
});

app.post('/api/staff/payroll/generate', authMiddleware, (req, res) => {
  const { month, year } = req.body;
  staff.filter(s => s.isActive).forEach(s => {
    if (payrollRecords.some(r => r.staffMemberId === s.id && r.month === month && r.year === year)) return;
    const isTeaching = s.staffType === 'Teaching';
    const allowances = isTeaching ? 15000 : 8000;
    const deductions = 5000;
    const basicSalary = 50000;
    payrollRecords.push({ id: genId('pay'), staffMemberId: s.id, month, year, basicSalary, allowances, deductions, netPay: basicSalary + allowances - deductions, paymentDate: null, status: 'Pending' });
  });
  res.json({ message: 'Payroll generated.' });
});

app.patch('/api/staff/payroll/:id/pay', authMiddleware, (req, res) => {
  const record = payrollRecords.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ message: 'Payroll record not found' });
  record.paymentDate = new Date().toISOString();
  record.status = 'Paid';
  res.sendStatus(204);
});

app.patch('/api/staff/payroll/:id/allowances', authMiddleware, (req, res) => {
  const record = payrollRecords.find(r => r.id === req.params.id);
  if (!record) return res.status(404).json({ message: 'Payroll record not found' });
  record.allowances = Number(req.body.allowances);
  record.deductions = Number(req.body.deductions);
  record.netPay = record.basicSalary + record.allowances - record.deductions;
  res.sendStatus(204);
});

app.get('/api/staff/:id', authMiddleware, (req, res) => {
  const s = staff.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ message: 'Staff not found' });
  res.json(s);
});

app.patch('/api/staff/:id/deactivate', authMiddleware, (req, res) => {
  const s = staff.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ message: 'Staff not found' });
  s.isActive = false;
  res.sendStatus(204);
});

// TIMETABLE
app.get('/api/timetable', authMiddleware, (req, res) => {
  res.json(timetableEntries);
});

app.post('/api/timetable', authMiddleware, (req, res) => {
  const { teachingGroupId, staffMemberId, dayOfWeek, startTime, endTime, room, sessionType } = req.body;
  if (!teachingGroupId || dayOfWeek === undefined || !startTime || !endTime) return res.status(400).json({ message: 'teachingGroupId, dayOfWeek, startTime and endTime are required' });
  const id = genId('tt');
  const entry = { id, teachingGroupId, staffMemberId: staffMemberId || null, dayOfWeek, startTime, endTime, room: room || null, sessionType: sessionType || null, isActive: true };
  timetableEntries.push(entry);
  res.status(201).json(entry);
});

app.delete('/api/timetable/:id', authMiddleware, (req, res) => {
  const idx = timetableEntries.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Timetable entry not found' });
  timetableEntries[idx].isActive = false;
  res.sendStatus(204);
});

// ACADEMIC STRUCTURE
app.get('/api/academic-structure/streams', authMiddleware, (req, res) => {
  res.json([]);
});

// HEALTH
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SMIS Mock API running at http://localhost:${PORT}`);
  console.log(`Test accounts:`);
  console.log(`  student1 / password (Student)`);
  console.log(`  admin / password (System Administrator)`);
});
