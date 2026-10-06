import { getAccessToken } from './auth'

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch('/api' + path, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export type CheckInCheckOutRecord = {
  id: string;
  studentId: string;
  studentName: string;
  checkInTime: string;
  checkOutTime?: string | null;
  checkInBy: string;
  checkOutBy?: string | null;
  purpose: string;
  notes?: string | null;
}

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  location: string;
  requestedBy: string;
  requestedAt: string;
  assignedTo?: string | null;
  status: string; // Pending, In Progress, Completed, Cancelled
  priority: string; // Low, Medium, High, Urgent
  completedAt?: string | null;
  resolutionNotes?: string | null;
}

export type HostelInspection = {
  id: string;
  inspectorName: string;
  inspectionDate: string;
  areasInspected: string[];
  findings: string;
  recommendations: string;
  status: string; // Pass, Fail, Needs Improvement
  followUpRequired: boolean;
  followUpDate?: string | null;
}

export const getCheckInCheckOutRecords = (fromDate?: string, toDate?: string) => 
  api<CheckInCheckOutRecord[]>(`/hostel/check-in-out?fromDate=${fromDate ?? ''}&toDate=${toDate ?? ''}`)

export const createCheckInCheckOutRecord = (data: Omit<CheckInCheckOutRecord, 'id'>) => 
  api<CheckInCheckOutRecord>('/hostel/check-in-out', { method: 'POST', body: JSON.stringify(data) })

export const getMaintenanceRequests = (status?: string, priority?: string) => 
  api<MaintenanceRequest[]>(`/hostel/maintenance-requests?status=${status ?? ''}&priority=${priority ?? ''}`)

export const createMaintenanceRequest = (data: Omit<MaintenanceRequest, 'id' | 'requestedAt'>) => 
  api<MaintenanceRequest>('/hostel/maintenance-requests', { method: 'POST', body: JSON.stringify(data) })

export const getHostelInspections = (fromDate?: string, toDate?: string) => 
  api<HostelInspection[]>(`/hostel/inspections?fromDate=${fromDate ?? ''}&toDate=${toDate ?? ''}`)

export const createHostelInspection = (data: Omit<HostelInspection, 'id'>) => 
  api<HostelInspection>('/hostel/inspections', { method: 'POST', body: JSON.stringify(data) })