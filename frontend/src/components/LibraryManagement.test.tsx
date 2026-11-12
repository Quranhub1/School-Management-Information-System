import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

vi.mock('../api/library', () => ({
  listBooks: vi.fn().mockResolvedValue([]),
  listLoans: vi.fn().mockResolvedValue([]),
  listMembers: vi.fn().mockResolvedValue([]),
  addBook: vi.fn().mockResolvedValue(null),
  issueBook: vi.fn().mockResolvedValue(null),
  returnBook: vi.fn().mockResolvedValue(null),
  getBookBarcode: vi.fn().mockResolvedValue(null),
}))

vi.mock('../api/programmes', () => ({
  getProgrammes: vi.fn().mockResolvedValue([]),
}))

import { LibraryManagement } from './LibraryManagement'

describe('LibraryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the library management shell', () => {
    render(<LibraryManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('supports canManage flag', () => {
    render(<LibraryManagement canManage />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })
})
