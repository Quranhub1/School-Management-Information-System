import { getAccessToken } from './auth'

const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch('/api' + path, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  if (!response.ok) throw new Error(await response.text() || `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export type StockItem = { 
  id: string; 
  name: string; 
  category: string; 
  unit: string; 
  quantity: number; 
  reorderLevel: number; 
  location?: string | null; 
  supplierId?: string | null; 
  expiryDate?: string | null; 
  description?: string | null; 
  isActive: boolean 
}

export type StockTransaction = {
  id: string;
  stockItemId: string;
  transactionDate: string;
  transactionType: string;
  quantity: number;
  issuedTo?: string | null;
  issuedBy?: string | null;
  receivedFrom?: string | null;
  referenceNumber?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  recordedBy: string;
}

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  category: string;
  isActive: boolean;
}

export const getStockItems = () => api<StockItem[]>('/inventory/stock')
export const getStockItem = (id: string) => api<StockItem>(`/inventory/stock/${id}`)
export const createStockItem = (data: Omit<StockItem, 'id'>) => api<StockItem>('/inventory/stock', { method: 'POST', body: JSON.stringify(data) })
export const updateStockItem = (id: string, data: Partial<StockItem>) => api<StockItem>(`/inventory/stock/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteStockItem = (id: string) => api(`/inventory/stock/${id}`, { method: 'DELETE' })
export const getLowStockItems = () => api<StockItem[]>('/inventory/stock/low-stock')

export const getStockTransactions = (stockItemId?: string, fromDate?: string, toDate?: string, transactionType?: string) => 
  api<StockTransaction[]>(`/inventory/stock-transactions?stockItemId=${stockItemId ?? ''}&fromDate=${fromDate ?? ''}&toDate=${toDate ?? ''}&transactionType=${transactionType ?? ''}`)

export const recordStockTransaction = (data: Omit<StockTransaction, 'id'>) => 
  api<StockTransaction>('/inventory/stock-transactions', { method: 'POST', body: JSON.stringify(data) })

export const getSuppliers = () => api<Supplier[]>('/inventory/suppliers')
export const getSupplier = (id: string) => api<Supplier>(`/inventory/suppliers/${id}`)
export const createSupplier = (data: Omit<Supplier, 'id'>) => api<Supplier>('/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) })
export const updateSupplier = (id: string, data: Partial<Supplier>) => api<Supplier>(`/inventory/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSupplier = (id: string) => api(`/inventory/suppliers/${id}`, { method: 'DELETE' })