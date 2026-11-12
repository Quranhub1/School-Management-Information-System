import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/finance', () => ({
  getFinanceStudents: vi.fn().mockResolvedValue([]),
  getFeeStructures: vi.fn().mockResolvedValue([]),
  getInvoices: vi.fn().mockResolvedValue([]),
  getPayments: vi.fn().mockResolvedValue([]),
  getStudentFinanceProfile: vi.fn().mockResolvedValue(null),
  getStudentFinancialStatement: vi.fn().mockResolvedValue(null),
  recordPayment: vi.fn().mockResolvedValue(null),
}))

import { StudentFinanceDashboard } from './StudentFinanceDashboard'

describe('StudentFinanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the student finance dashboard shell', () => {
    render(<StudentFinanceDashboard />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('accepts an initial search query', () => {
    render(<StudentFinanceDashboard initialSearch="STU-001" />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
