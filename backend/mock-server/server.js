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

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: 'Invalid username or password.' });
  const token = signToken(user);
  return res.json({ accessToken: token, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), username: user.username, roles: user.roles });
});

app.get('/api/student-portal/me', authMiddleware, (req, res) => {
  const username = req.user.name;
  const user = users.find(u => u.username === username);
  const student = students.find(s => s.studentNumber === (user?.studentNumber || username));
  if (!student) return res.status(404).json({ message: 'Student record not found. Contact administration.' });
  const profile = {
    studentId: student.id,
    studentNumber: student.studentNumber,
    fullName: `${student.firstName} ${student.lastName}`.trim(),
    status: student.status,
    firstName: student.firstName,
    lastName: student.lastName,
    otherNames: student.otherNames,
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    nationalId: student.nationalId,
    phoneNumber: student.phoneNumber,
    email: student.email,
    createdAt: student.createdAt,
    admissionId: student.admissionId
  };
  res.json(profile);
});

app.get('/api/student-portal/me/transcript', authMiddleware, (req, res) => {
  const username = req.user.name;
  const student = students.find(s => s.studentNumber === username);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentTranscripts = transcripts.filter(t => t.studentId === student.id);
  res.json(studentTranscripts);
});

app.get('/api/student-portal/me/summaries', authMiddleware, (req, res) => {
  const username = req.user.name;
  const student = students.find(s => s.studentNumber === username);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  const studentSummaries = summaries.filter(s => s.studentId === student.id);
  res.json(studentSummaries);
});

app.get('/api/student-portal/me/transcript/pdf', authMiddleware, (req, res) => {
  const username = req.user.name;
  const student = students.find(s => s.studentNumber === username);
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

app.get('/api/notices/board', authMiddleware, (req, res) => {
  res.json(notices.filter(n => n.isActive));
});

app.get('/api/search', authMiddleware, (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  if (!q || q.length < 2) return res.json({ query: q, students: [], staff: [], courses: [], programmes: [], academicYears: [], semesters: [], teachingGroups: [], applicants: [], alumni: [] });

  const results = {
    query: q,
    students: students.filter(s => !from && !to ? true : new Date(s.createdAt) >= from && new Date(s.createdAt) <= to).filter(s => s.studentNumber.toLowerCase().includes(q) || s.firstName.toLowerCase().includes(q) || s.lastName.toLowerCase().includes(q)).slice(0, 20).map(s => ({ id: s.id, studentNumber: s.studentNumber, fullName: `${s.firstName} ${s.lastName}`, status: s.status })),
    staff: [],
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

app.get('/api/academic-structure/streams', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/messages/conversations', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/messages/:conversationId', authMiddleware, (req, res) => {
  res.json([]);
});

app.post('/api/messages/send', authMiddleware, (req, res) => {
  res.status(201).json({ id: Date.now().toString(), ...req.body, sentAt: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SMIS Mock API running at http://localhost:${PORT}`);
  console.log(`Test accounts:`);
  console.log(`  student1 / password (Student)`);
  console.log(`  admin / password (System Administrator)`);
});
