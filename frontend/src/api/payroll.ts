import { z } from 'zod'
import { readApiErrorMessage } from './errors'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import {
  payrollAdjustmentRequestSchema,
  payrollGenerateRequestSchema,
  payrollPaymentRequestSchema,
  payrollRecordResponseSchema,
} from '../schemas'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(await readApiErrorMessage(response));
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type PayrollRecord = { id:string; staffMemberId:string; month:number; year:number; basicSalary:number; allowances:number; deductions:number; netPay:number; paymentDate:string | null; status:string; paymentMethod?: string; reference?: string }
export async function listPayroll(staffMemberId?:string) {
  const result = await request<unknown>(`/api/accounts-overview/payroll${staffMemberId ? `?staffMemberId=${encodeURIComponent(staffMemberId)}` : ''}`);
  return parseApiResponse(z.array(payrollRecordResponseSchema), result, 'payroll list') as PayrollRecord[];
}
export function generatePayroll(month:number,year:number) {
  const data = parseApiInput(payrollGenerateRequestSchema, { month, year }, 'generate payroll');
  return request<void>('/api/staff/payroll/generate',{method:'POST',body:JSON.stringify(data)});
}
export function markPayrollPaid(id:string, method?: string) {
  const data = parseApiInput(payrollPaymentRequestSchema, { paymentMethod: method }, 'mark payroll paid');
  if (!id.trim()) throw new Error('Payroll record ID is required.');
  return request<void>(`/api/staff/payroll/${encodeURIComponent(id)}/pay`,{method:'PATCH',body:JSON.stringify(data)});
}
export function updatePayrollAllowances(id:string,allowances:number,deductions:number) {
  const data = parseApiInput(payrollAdjustmentRequestSchema, { allowances, deductions }, 'update payroll allowances');
  if (!id.trim()) throw new Error('Payroll record ID is required.');
  return request<void>(`/api/staff/payroll/${encodeURIComponent(id)}/allowances`,{method:'PATCH',body:JSON.stringify(data)});
}
