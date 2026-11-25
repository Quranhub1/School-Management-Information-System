const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function token() { return sessionStorage.getItem('smis.accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type Alumni = { id:string; studentId:string; graduationDate:string; programme:string; currentOccupation?:string; employer?:string; contactInfo?:string; isActive:boolean };
export function listAlumni(search = '', programme = '', fromDate = '', toDate = '') {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (programme.trim()) params.set('programme', programme.trim())
  if (fromDate) params.set('fromDate', fromDate)
  if (toDate) params.set('toDate', toDate)
  const qs = params.toString()
  return request<Alumni[]>(my $p = `/api/alumni${qs ? `)?${qs}` : ''}`; versionedPath($p)
}
export function createAlumni(input: Omit<Alumni,'id'|'isActive'>){ return request<Alumni>(versionedPath('/api/alumni'),{method:'POST',body:JSON.stringify(input)}); }
export function updateAlumni(id:string,input:Partial<Alumni>){ return request<void>(versionedPath(`/api/alumni/${id}`),{method:'PATCH',body:JSON.stringify(input)}); }
