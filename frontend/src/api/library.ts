const BASE=import.meta.env.VITE_API_BASE_URL??'http://localhost:5000';
async function request<T>(path:string,init:RequestInit={}):Promise<T>{const r=await fetch(`${BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...(localStorage.getItem('accessToken')?{Authorization:`Bearer ${localStorage.getItem('accessToken')}`}:{})}});if(!r.ok)throw new Error((await r.text())||`Request failed (${r.status})`);return r.status===204?undefined as T:r.json()}
export type LibraryBook={id:string;isbn:string;title:string;author:string;publisher?:string;totalCopies:number;availableCopies:number;isActive:boolean};
export type LibraryMember={id:string;studentNumber:string;name:string};
export type LibraryLoan={id:string;bookId:string;bookTitle:string;bookIsbn:string;studentId:string;studentNumber:string;studentName:string;issuedAtUtc:string;dueAtUtc:string;returnedAtUtc?:string;fineAmount:number};
export const listBooks=(search='')=>request<LibraryBook[]>(`/api/library/books${search?`?search=${encodeURIComponent(search)}`:''}`);
export const listMembers=(search='')=>request<LibraryMember[]>(`/api/library/members${search?`?search=${encodeURIComponent(search)}`:''}`);
export const listLoans=(activeOnly=true)=>request<LibraryLoan[]>(`/api/library/loans?activeOnly=${activeOnly}`);
export const addBook=(input:Omit<LibraryBook,'id'|'availableCopies'|'isActive'>)=>request<LibraryBook>('/api/library/books',{method:'POST',body:JSON.stringify(input)});
export const issueBook=(input:{bookId:string;studentId:string;dueAtUtc:string})=>request<LibraryLoan>('/api/library/loans',{method:'POST',body:JSON.stringify(input)});
export const returnBook=(id:string)=>request<LibraryLoan>(`/api/library/loans/${id}/return`,{method:'PATCH'});
