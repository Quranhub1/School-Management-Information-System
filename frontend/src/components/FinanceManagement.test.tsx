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
  getFinanceOverdueSummary: vi.fn().mockResolvedValue({ totalOutstanding: 0, installmentCount: 0, studentCount: 0, currency: 'UGX' }),
  getPayments: vi.fn().mockResolvedValue([]),
  getFinanceReceivablesAgeing: vi.fn().mockResolvedValue([]),
  getFinanceReceivablesReconciliation: vi.fn().mockResolvedValue([]),
  getFinanceAccounts: vi.fn().mockResolvedValue([]),
  getBankReconciliations: vi.fn().mockResolvedValue([]),
  getFinanceStudents: vi.fn().mockResolvedValue([]),
  getBudgets: vi.fn().mockResolvedValue([]),
  getAccountsOverviewPayments: vi.fn().mockResolvedValue([]),
  getFeeStructures: vi.fn().mockResolvedValue([]),
}))

import { FinanceManagement } from './FinanceManagement'
import { InstitutionSettingsProvider } from './InstitutionSettingsContext'

function renderFinance(ui: React.ReactElement) {
  return render(<InstitutionSettingsProvider>{ui}</InstitutionSettingsProvider>)
}

describe('FinanceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the finance management shell', () => {
    renderFinance(<FinanceManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('exposes a readOnly mode', () => {
    renderFinance(<FinanceManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
