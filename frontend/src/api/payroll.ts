const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return localStorage.getItem('accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type PayrollRecord = { id:string; staffMemberId:string; month:number; year:number; basicSalary:number; allowances:number; deductions:number; netPay:number; paymentDate:string | null; status:string; paymentMethod?: string; reference?: string }
export function listPayroll(staffMemberId?:string){ return request<PayrollRecord[]>(`/api/staff/payroll${staffMemberId ? `?staffMemberId=${staffMemberId}` : ''}`); }
export function generatePayroll(month:number,year:number){ return request<void>('/api/staff/payroll/generate',{method:'POST',body:JSON.stringify({month,year})}); }
export function markPayrollPaid(id:string, paymentMethod?: string, reference?: string){ return request<void>(`/api/staff/payroll/${id}/pay`,{method:'PATCH',body:JSON.stringify({ paymentMethod, reference })}); }
