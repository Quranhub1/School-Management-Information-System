import { getAccessToken } from './auth'

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch('/api' + path, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export type IndisciplineCase = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  hostelLocation: string;
  incidentType: string;
  description: string;
  witnesses: string[];
  evidenceAttachments: string[];
  reportedBy: string;
  immediateAction: string;
  severity: string;
  status: string; // Reported, Under Investigation, Evidence/Statements, Warden Decision, Action/Recommendation, Referral if required, Resolved
  createdAt: string;
  updatedAt: string;
}

export type IndisciplineSummary = {
  openCases: number;
  underInvestigation: number;
  pendingAction: number;
  resolved: number;
  seriousCases: number;
  byCategory: Record<string, number>;
}

export const getIndisciplineCases = () => api<IndisciplineCase[]>('/indiscipline/cases')
export const getIndisciplineCase = (id: string) => api<IndisciplineCase>(`/indiscipline/cases/${id}`)
export const createIndisciplineCase = (data: Omit<IndisciplineCase, 'id' | 'createdAt' | 'updatedAt'>) => 
  api<IndisciplineCase>('/indiscipline/cases', { method: 'POST', body: JSON.stringify(data) })
export const updateIndisciplineCase = (id: string, data: Partial<IndisciplineCase>) => 
  api<IndisciplineCase>(`/indiscipline/cases/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const getIndisciplineSummary = () => api<IndisciplineSummary>('/indiscipline/cases/summary')