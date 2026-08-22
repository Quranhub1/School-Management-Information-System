const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  }).then(async response => {
    if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
    return response.status === 204 ? undefined as T : response.json() as Promise<T>;
  });
}

export type Librarian = {
  id: string;
  staffMemberId: string;
  staffNumber: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  libraryRole: string;
  isActive: boolean;
  assignedAtUtc: string;
  deactivatedAtUtc?: string;
};

export const listLibrarians = () => request<Librarian[]>('/api/library/librarians');
export const addLibrarian = (staffMemberId: string, libraryRole: string) => request<Librarian>('/api/library/librarians', { method: 'POST', body: JSON.stringify({ staffMemberId, libraryRole }) });
export const updateLibrarian = (id: string, libraryRole: string, isActive: boolean) => request<Librarian>(`/api/library/librarians/${id}`, { method: 'PATCH', body: JSON.stringify({ libraryRole, isActive }) });
