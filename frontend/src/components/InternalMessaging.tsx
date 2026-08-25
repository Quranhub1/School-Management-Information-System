import { useEffect, useState } from 'react';
import { getConversations, getMessages, sendMessage, type Conversation, type Message } from '../api/messages';

export function InternalMessaging() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  async function loadConversations() { try { setConversations(await getConversations()) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load conversations.') } }
  useEffect(() => { void loadConversations() }, []);

  async function openConversation(conversationId: string) { setActiveConversation(conversationId); try { setMessages(await getMessages(conversationId)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load messages.') } }

  async function send(e: React.FormEvent) { e.preventDefault(); if (!activeConversation || !body.trim()) return; try { await sendMessage({ conversationId: activeConversation, body: body.trim() }); setBody(''); const updated = await getMessages(activeConversation); setMessages(updated) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to send message.') } }

  return (
    <section className="panel" aria-label="Internal messaging">
      <div className="panel-heading"><div><span className="eyebrow">COMMUNICATION</span><h2>Internal Messaging</h2></div></div>
      {error && <div className="error" role="alert">{error}</div>}
      <div className="library-grid">
        <div className="library-main-card">
          <div className="library-tabs" role="tablist"><button role="tab" className="active">Conversations</button></div>
          <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Last Message</th></tr></thead><tbody>{conversations.map(c => <tr key={c.conversationId} style={{ cursor: 'pointer' }} onClick={() => void openConversation(c.conversationId)}><td>{c.subject || 'No subject'}</td><td>{new Date(c.lastMessageAt).toLocaleString()}</td></tr>)}</tbody></table></div>
        </div>
        <div className="library-side-card">
          <h3>{activeConversation ? 'Messages' : 'Select a conversation'}</h3>
          {activeConversation && <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12 }}>{messages.map(m => <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid #f5f5f4' }}><strong>{m.senderId}</strong><p style={{ margin: 0, fontSize: '.85rem' }}>{m.body}</p><small style={{ color: '#a8a29e' }}>{new Date(m.sentAt).toLocaleString()}</small></div>)}</div>}
          {activeConversation && <form onSubmit={send}><input value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message…" required /><button type="submit" style={{ marginTop: 8 }}>Send</button></form>}
        </div>
      </div>
    </section>
  );
}
