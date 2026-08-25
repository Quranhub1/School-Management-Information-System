const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json() as { message?: string; title?: string };
      message = payload.message ?? payload.title ?? message;
    } catch { /* fall back to the HTTP status */ }
    throw new Error(message);
  }

  return response.status === 204 ? undefined as T : await response.json() as T;
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

export const addLibrarian = (staffMemberId: string, libraryRole: string) => {
  if (!staffMemberId || !libraryRole.trim()) throw new Error('Staff member and library role are required.');
  return request<Librarian>('/api/library/librarians', {
    method: 'POST',
    body: JSON.stringify({ staffMemberId, libraryRole: libraryRole.trim() }),
  });
};

export const updateLibrarian = (id: string, libraryRole: string, isActive: boolean) => {
  if (!id || !libraryRole.trim()) throw new Error('Librarian and library role are required.');
  return request<Librarian>(`/api/library/librarians/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ libraryRole: libraryRole.trim(), isActive }),
  });
};
