import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CurriculumLogbookManagement } from './CurriculumLogbookManagement'
import { createLogbookRequirement, getLogbookRequirements, getUhpabFeeReferences } from '../api/curriculumManagement'

vi.mock('../api/curriculumManagement', () => ({
  createLogbookCompetency: vi.fn(),
  createLogbookRequirement: vi.fn(async () => ({ id: 'requirement-1' })),
  createUhpabFeeReference: vi.fn(),
  getLogbookRequirements: vi.fn(async () => []),
  getStudentLogbooks: vi.fn(async () => []),
  getUhpabFeeReferences: vi.fn(async () => []),
  issueStudentLogbook: vi.fn(),
}))

const curricula = [{
  id: 'curriculum-1', programmeId: 'programme-1', version: '1.0', title: 'Diploma in Nursing',
  minimumCredits: 0, effectiveFrom: '2026-01-01', status: 'Active', isActive: true, programmeType: 0,
}]

describe('CurriculumLogbookManagement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a mandatory logbook requirement against the selected curriculum', async () => {
    render(<CurriculumLogbookManagement curricula={curricula} />)
    fireEvent.change(screen.getByPlaceholderText('Logbook title / type'), { target: { value: 'Clinical Practice Logbook' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add logbook requirement' }))

    await waitFor(() => expect(createLogbookRequirement).toHaveBeenCalledWith('curriculum-1', {
      title: 'Clinical Practice Logbook', description: '', yearOfStudy: 1, semesterNumber: 1, requiredQuantity: 1, isMandatory: true,
    }))
    expect(getLogbookRequirements).toHaveBeenCalledWith('curriculum-1')
  })

  it('loads UHPAB reference fees separately from student invoice operations', async () => {
    render(<CurriculumLogbookManagement curricula={curricula} />)
    await waitFor(() => expect(getUhpabFeeReferences).toHaveBeenCalled())
    expect(screen.getByText(/These amounts are not KSHS tuition, student charges or invoices/)).toBeInTheDocument()
  })
})
