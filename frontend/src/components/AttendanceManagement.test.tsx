import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('../api/auth', () => ({
  getAccessToken: vi.fn(() => 'mock-access-token'),
}))

global.fetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
  } as any)
})

import { AttendanceManagement } from './AttendanceManagement'

describe('AttendanceManagement', () => {
  it('renders the attendance management shell', () => {
    render(<AttendanceManagement />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('renders readOnly mode', () => {
    render(<AttendanceManagement readOnly />)
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0)
  })

  it('switches between tabs', () => {
    render(<AttendanceManagement />)
    expect(screen.getByRole('tab', { name: 'Daily' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Student history' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'QR attendance' })).toBeInTheDocument()
  })

  it('switches tabs when clicked', () => {
    render(<AttendanceManagement />)
    fireEvent.click(screen.getByRole('tab', { name: 'Student history' }))
    expect(screen.getByRole('tab', { name: 'Student history' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders daily tab form elements', () => {
    render(<AttendanceManagement />)
    expect(screen.getByLabelText(/timetable entry id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/session date/i)).toBeInTheDocument()
  })

  it('renders history tab elements', () => {
    render(<AttendanceManagement />)
    fireEvent.click(screen.getByRole('tab', { name: 'Student history' }))
    expect(screen.getByLabelText(/student id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument()
  })
})
