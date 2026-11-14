import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  admissionResponseSchema,
  createAdmissionRequestSchema,
  createInvoiceRequestSchema,
  createProgrammeRequestSchema,
  createCourseRequestSchema,
  createCurriculumRequestSchema,
  createCurriculumCourseRequestSchema,
  createSemesterRequestSchema,
  feeStructureCreateRequestSchema,
  invoiceResponseSchema,
  libraryBookCreateRequestSchema,
  libraryLoanCreateRequestSchema,
  programmeResponseSchema,
  courseResponseSchema,
  curriculumResponseSchema,
  curriculumCourseResponseSchema,
  semesterResponseSchema,
  recordPaymentRequestSchema,
  staffCreateRequestSchema,
  studentCreateRequestSchema,
  studentResponseSchema,
  streamCreateRequestSchema,
  streamResponseSchema,
} from '../../schemas/api-contracts.schema'

describe('API contracts — admissions', () => {
  it('validates a create admission request', () => {
    const result = createAdmissionRequestSchema.safeParse({
      applicantId: 'app-1',
      programmeId: 'prog-1',
      academicYearId: 'year-1',
      intakeId: 'intake-1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a create admission request missing required fields', () => {
    const result = createAdmissionRequestSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('parses an admission response', () => {
    const admission = {
      id: 'adm-1',
      applicantId: 'app-1',
      programmeId: 'prog-1',
      academicYearId: 'year-1',
      intakeId: 'intake-1',
      status: 'Submitted',
    }
    expect(admissionResponseSchema.parse(admission)).toEqual(admission)
  })
})

describe('API contracts — students', () => {
  it('validates a student create request', () => {
    const result = studentCreateRequestSchema.safeParse({
      studentNumber: 'STU-001',
      firstName: 'Alice',
      lastName: 'Smith',
      campusId: 'campus-1',
    })
    expect(result.success).toBe(true)
  })

  it('parses a student response', () => {
    const student = {
      id: 'stu-1',
      studentNumber: 'STU-001',
      firstName: 'Alice',
      lastName: 'Smith',
      status: 'Active',
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(studentResponseSchema.parse(student)).toEqual(student)
  })
})

describe('API contracts — staff', () => {
  it('validates a staff create request', () => {
    const result = staffCreateRequestSchema.safeParse({
      staffNumber: 'STF-001',
      firstName: 'Bob',
      lastName: 'Jones',
      employmentType: 'Permanent',
      staffType: 'Teaching',
      departmentId: 'dept-1',
    })
    expect(result.success).toBe(true)
  })
})

describe('API contracts — finance', () => {
  it('validates a create invoice request', () => {
    const result = createInvoiceRequestSchema.safeParse({
      studentId: 'stu-1',
      invoiceNumber: 'INV-001',
      feeType: 'Tuition',
      amount: 500000,
    })
    expect(result.success).toBe(true)
  })

  it('validates a record payment request', () => {
    const result = recordPaymentRequestSchema.safeParse({
      amount: 250000,
      receiptNumber: 'RCPT-001',
      paymentMethod: 'Cash',
    })
    expect(result.success).toBe(true)
  })

  it('validates a fee structure create request', () => {
    const result = feeStructureCreateRequestSchema.safeParse({
      name: 'Tuition 2026',
      feeType: 'Tuition',
      items: [
        { code: 'TUITION', name: 'Tuition', amount: 500000, isOptional: false, sortOrder: 1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('parses an invoice response', () => {
    const invoice = {
      id: 'inv-1',
      studentId: 'stu-1',
      invoiceNumber: 'INV-001',
      feeType: 'Tuition',
      amount: 500000,
      paidAmount: 0,
      balance: 500000,
      currency: 'UGX',
      status: 'Issued',
      issuedAt: '2026-01-01T00:00:00Z',
    }
    expect(invoiceResponseSchema.parse(invoice)).toEqual(invoice)
  })
})

describe('API contracts — library', () => {
  it('validates a library book create request', () => {
    const result = libraryBookCreateRequestSchema.safeParse({
      isbn: '978-0-123456-78-9',
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      totalCopies: 5,
    })
    expect(result.success).toBe(true)
  })

  it('validates a library loan create request', () => {
    const result = libraryLoanCreateRequestSchema.safeParse({
      bookId: 'book-1',
      studentId: 'stu-1',
      dueAtUtc: '2026-02-01T00:00:00Z',
    })
    expect(result.success).toBe(true)
  })
})

describe('API contracts — timetable', () => {
  it('validates a stream create request', () => {
    const result = streamCreateRequestSchema.safeParse({
      academicClassId: 'class-1',
      code: 'STREAM-A',
      name: 'Stream A',
      capacity: 40,
    })
    expect(result.success).toBe(true)
  })

  it('parses a stream response', () => {
    const stream = {
      id: 'stream-1',
      academicClassId: 'class-1',
      code: 'STREAM-A',
      name: 'Stream A',
      capacity: 40,
      isActive: true,
    }
    expect(streamResponseSchema.parse(stream)).toEqual(stream)
  })
})

describe('API contracts — curriculum', () => {
  it('validates a create programme request', () => {
    const result = createProgrammeRequestSchema.safeParse({
      programmeNumber: 'PROG-001',
      programmeName: 'Bachelor of Science',
      awardType: 'Degree',
      durationYears: 3,
      durationUnit: 'Years',
      programmeType: 0,
    })
    expect(result.success).toBe(true)
  })

  it('parses a programme response', () => {
    const programme = {
      id: 'prog-1',
      programmeNumber: 'PROG-001',
      programmeName: 'Bachelor of Science',
      awardType: 'Degree',
      durationYears: 3,
      durationUnit: 'Years',
      programmeType: 0,
      departmentId: 'dept-1',
      campusId: 'campus-1',
      isActive: true,
      isReferenceOnly: false,
      approvalStatus: 'Approved',
    }
    expect(programmeResponseSchema.parse(programme)).toEqual(programme)
  })

  it('validates a create course request', () => {
    const result = createCourseRequestSchema.safeParse({
      courseNumber: 'MATH-101',
      courseName: 'Mathematics I',
      creditUnits: 3,
      courseType: 'Core',
      description: 'Introduction to Mathematics',
    })
    expect(result.success).toBe(true)
  })

  it('parses a course response', () => {
    const course = {
      id: 'course-1',
      courseNumber: 'MATH-101',
      courseName: 'Mathematics I',
      creditUnits: 3,
      courseType: 'Core',
      description: 'Introduction to Mathematics',
      isActive: true,
    }
    expect(courseResponseSchema.parse(course)).toEqual(course)
  })

  it('validates a create curriculum request', () => {
    const result = createCurriculumRequestSchema.safeParse({
      programmeId: 'prog-1',
      version: '1.0',
      title: 'Curriculum v1.0',
      minimumCredits: 120,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      programmeType: 0,
    })
    expect(result.success).toBe(true)
  })

  it('parses a curriculum response', () => {
    const curriculum = {
      id: 'curr-1',
      programmeId: 'prog-1',
      version: '1.0',
      title: 'Curriculum v1.0',
      minimumCredits: 120,
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
      programmeType: 0,
      status: 'Active',
      isActive: true,
    }
    expect(curriculumResponseSchema.parse(curriculum)).toEqual(curriculum)
  })

  it('validates a create curriculum course request', () => {
    const result = createCurriculumCourseRequestSchema.safeParse({
      curriculumId: 'curr-1',
      courseId: 'course-1',
      yearOfStudy: 1,
      semesterNumber: 1,
      isCore: true,
    })
    expect(result.success).toBe(true)
  })

  it('parses a curriculum course response', () => {
    const mapping = {
      id: 'mapping-1',
      curriculumId: 'curr-1',
      courseId: 'course-1',
      yearOfStudy: 1,
      semesterNumber: 1,
      isCore: true,
      courseLabel: 'MATH-101 — Mathematics I',
    }
    expect(curriculumCourseResponseSchema.parse(mapping)).toEqual(mapping)
  })

  it('validates a create semester request', () => {
    const result = createSemesterRequestSchema.safeParse({
      academicYearId: 'year-1',
      name: 'Semester 1',
      sequence: 1,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    })
    expect(result.success).toBe(true)
  })

  it('parses a semester response', () => {
    const semester = {
      id: 'sem-1',
      academicYearId: 'year-1',
      name: 'Semester 1',
      sequence: 1,
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      isCurrent: true,
      isActive: true,
    }
    expect(semesterResponseSchema.parse(semester)).toEqual(semester)
  })
})

describe('API contracts — zod schema integrity', () => {
  it('all contract schemas are defined zod objects', () => {
    const schemas = [
      admissionResponseSchema,
      createAdmissionRequestSchema,
      studentCreateRequestSchema,
      studentResponseSchema,
      staffCreateRequestSchema,
      createInvoiceRequestSchema,
      recordPaymentRequestSchema,
      invoiceResponseSchema,
      feeStructureCreateRequestSchema,
      libraryBookCreateRequestSchema,
      libraryLoanCreateRequestSchema,
      streamCreateRequestSchema,
      streamResponseSchema,
      createProgrammeRequestSchema,
      programmeResponseSchema,
      createCourseRequestSchema,
      courseResponseSchema,
      createCurriculumRequestSchema,
      curriculumResponseSchema,
      createCurriculumCourseRequestSchema,
      curriculumCourseResponseSchema,
      createSemesterRequestSchema,
      semesterResponseSchema,
    ]
    for (const schema of schemas) {
      expect(schema).toBeDefined()
      expect(typeof schema.safeParse).toBe('function')
    }
  })
})
