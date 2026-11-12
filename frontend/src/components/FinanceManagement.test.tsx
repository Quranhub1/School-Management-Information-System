import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/auth', () => ({
  getSession: vi.fn(() => ({ roles: [] })),
}))

vi.mock('../api/finance', () => ({
  getDashboard: vi.fn().mockResolvedValue({
    totalBilled: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    studentCount: 0,
    paidCount: 0,
    overdueCount: 0,
  }),
  getOutstandingBalances: vi.fn().mockResolvedValue([]),
  getPayments: vi.fn().mockResolvedValue([]),
}))

import { FinanceManagement } from './FinanceManagement'

describe('FinanceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the finance management shell', () => {
    render(<FinanceManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('exposes a readOnly mode', () => {
    render(<FinanceManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
