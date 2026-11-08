import { getAccessToken } from './auth'
import { parseApiInput, parseApiResponse } from '../lib/validation'
import { inventoryRegisterResponseSchema, inventoryRegisterSaveRequestSchema } from '../schemas'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export type InventoryColumn = { id: string; label: string }
export type InventoryRow = { id: string; values: Record<string, string> }
export type InventoryRegister = {
  sectionId: string
  columns: InventoryColumn[]
  rows: InventoryRow[]
  updatedAtUtc: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/inventory/registers${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Inventory request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export async function getInventoryRegister(sectionId: string) {
  if (!sectionId.trim()) throw new Error('Inventory section is required.')
  const register = await request<unknown>(`/${encodeURIComponent(sectionId)}`)
  return parseApiResponse(inventoryRegisterResponseSchema, register, 'inventory register') as InventoryRegister
}

export async function saveInventoryRegister(sectionId: string, data: Pick<InventoryRegister, 'columns' | 'rows'>) {
  if (!sectionId.trim()) throw new Error('Inventory section is required.')
  const validated = parseApiInput(inventoryRegisterSaveRequestSchema, data, 'save inventory register')
  const saved = await request<unknown>(`/${encodeURIComponent(sectionId)}`, { method: 'PUT', body: JSON.stringify(validated) })
  return parseApiResponse(inventoryRegisterResponseSchema, saved, 'saved inventory register') as InventoryRegister
}


export type InventoryStockAlert = {
  sectionId: string
  sectionName: string
  rowId: string
  itemName: string
  quantity: number
  reorderLevel: number
  status: 'Low stock' | 'Out of stock'
}

export async function getInventoryStockAlerts(): Promise<InventoryStockAlert[]> {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}/api/inventory/stock-alerts`, {
    headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Inventory alerts request failed (${response.status})`)
  }
  return response.json() as Promise<InventoryStockAlert[]>
}
