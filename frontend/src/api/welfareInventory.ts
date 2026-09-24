import { getAccessToken } from './auth'

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch('/api' + path, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
  return response.json() as Promise<T>
}
export type WelfareCommodity = { id:string; name:string; category:string; unit:string; reorderLevel:number }
export type WelfareRow = { date:string; commodityId:string; commodity:string; unit:string; opening:number; received:number; used:number; wastage:number; adjustment:number; balance:number; reorderLevel:number }
export const getWelfareCommodities = () => api<WelfareCommodity[]>('/inventory/welfare/commodities')
export const getWelfareDaily = (from?:string,to?:string,commodityId?:string) => api<WelfareRow[]>(`/inventory/welfare/daily?from=${from ?? ''}&to=${to ?? ''}&commodityId=${commodityId ?? ''}`)
export const createWelfareCommodity = (data:Omit<WelfareCommodity,'id'>) => api<WelfareCommodity>('/inventory/welfare/commodities',{method:'POST',body:JSON.stringify(data)})
export const recordWelfareTransaction = (data:{commodityId:string;date:string;type:string;quantity:number;supplier?:string;reference?:string;batchNumber?:string;expiryDate?:string;notes?:string}) => api('/inventory/welfare/transactions',{method:'POST',body:JSON.stringify(data)})