import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/admissions', () => ({
  listAdmissions: vi.fn().mockResolvedValue([]),
  getAdmission: vi.fn().mockResolvedValue(null),
  createAdmission: vi.fn().mockResolvedValue(null),
  updateAdmission: vi.fn().mockResolvedValue(null),
  listProgrammes: vi.fn().mockResolvedValue([]),
  listIntakes: vi.fn().mockResolvedValue([]),
}))

import { AdmissionsStudentManagement } from './AdmissionsStudentManagement'

describe('AdmissionsStudentManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the admissions student management shell', () => {
    render(<AdmissionsStudentManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
