import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExaminationManagement } from './ExaminationManagement'

vi.mock('../api/examinationResults', () => ({
  createAssessmentPlan: vi.fn().mockResolvedValue({}),
  finalizeAssessment: vi.fn().mockResolvedValue({}),
  getAssessmentPlans: vi.fn().mockResolvedValue([]),
  getExaminationTranscript: vi.fn().mockResolvedValue([]),
  getStudentAssessments: vi.fn().mockResolvedValue([]),
  recordAssessment: vi.fn().mockResolvedValue({}),
}))

describe('ExaminationManagement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the redesigned exam management workflow', async () => {
    render(<ExaminationManagement canManage />)
    expect(await screen.findByRole('heading', { name: 'Manage exams' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'View Exams' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add New Exam' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Add Exam Result' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Print Exam Results' })).toBeTruthy()
  })

  it('opens the add-exam form from the Add New Exam action', async () => {
    render(<ExaminationManagement canManage />)
    await screen.findByRole('heading', { name: 'Manage exams' })
    screen.getByRole('button', { name: 'Add New Exam' }).click()
    expect(await screen.findByRole('heading', { name: 'Add new exam' })).toBeTruthy()
  })
})
