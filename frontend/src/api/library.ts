const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('smis.accessToken');
  const response = await fetch(`${BASE}${path}`, {
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
    } catch { /* use status fallback */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

export type LibraryBook = { id:string; isbn:string; title:string; author:string; publisher?:string; totalCopies:number; availableCopies:number; isActive:boolean };
export type LibraryMember = { id:string; studentNumber:string; name:string };
export type LibraryLoan = { id:string; bookId:string; bookTitle:string; bookIsbn:string; studentId:string; studentNumber:string; studentName:string; issuedAtUtc:string; dueAtUtc:string; returnedAtUtc?:string; fineAmount:number };

export const listBooks = (search = '') => request<LibraryBook[]>(`/api/library/books${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
export const listMembers = (search = '') => request<LibraryMember[]>(`/api/library/members${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
export const listLoans = (activeOnly = true) => request<LibraryLoan[]>(`/api/library/loans?activeOnly=${activeOnly}`);

export const addBook = (input: Omit<LibraryBook,'id'|'availableCopies'|'isActive'>) => {
  if (!input.isbn.trim() || !input.title.trim() || !input.author.trim()) throw new Error('ISBN, title and author are required.');
  if (!Number.isInteger(input.totalCopies) || input.totalCopies < 1) throw new Error('Total copies must be at least 1.');
  return request<LibraryBook>('/api/library/books', { method:'POST', body:JSON.stringify({ ...input, isbn:input.isbn.trim(), title:input.title.trim(), author:input.author.trim(), publisher:input.publisher?.trim() }) });
};

export const issueBook = (input:{bookId:string;studentId:string;dueAtUtc:string}) => {
  if (!input.bookId || !input.studentId || !input.dueAtUtc) throw new Error('Book, student and due date are required.');
  return request<LibraryLoan>('/api/library/loans', { method:'POST', body:JSON.stringify(input) });
};

export const returnBook = (id:string) => {
  if (!id) throw new Error('Loan id is required.');
  return request<LibraryLoan>(`/api/library/loans/${id}/return`, { method:'PATCH' });
};

export const getBookBarcode = (id: string) => `${BASE}/api/library/books/${id}/barcode`
