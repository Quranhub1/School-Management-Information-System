const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function token() { return localStorage.getItem('accessToken'); }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export type Message = { id:string; conversationId:string; senderId:string; recipientId?:string; subject?:string; body:string; sentAt:string; readAt?:string };
export type Conversation = { conversationId:string; subject?:string; lastMessageAt:string; participants:string[] };
export function getConversations(){ return request<Conversation[]>('/api/messages/conversations'); }
export function getMessages(conversationId:string){ return request<Message[]>(`/api/messages/${conversationId}`); }
export function sendMessage(input:{ conversationId:string; recipientId?:string; subject?:string; body:string }){ return request<Message>('/api/messages/send',{method:'POST',body:JSON.stringify(input)}); }
