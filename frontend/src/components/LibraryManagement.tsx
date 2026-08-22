import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  addBook,
  issueBook,
  listBooks,
  listLoans,
  listMembers,
  returnBook,
  type LibraryBook,
  type LibraryLoan,
  type LibraryMember,
} from '../api/library';

const dateInput = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-UG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export function LibraryManagement({ canManage }: { canManage: boolean }) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'recent' | 'overdue'>('recent');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    totalCopies: 1,
  });
  const [issue, setIssue] = useState({
    bookId: '',
    memberNumber: '',
    dueDate: dateInput(),
  });

  async function load() {
    setError('');
    try {
      const [bookData, loanData, memberData] = await Promise.all([
        listBooks(search),
        listLoans(true),
        listMembers(),
      ]);
      setBooks(bookData);
      setLoans(loanData);
      setMembers(memberData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load the library.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const availableCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.availableCopies, 0),
    [books],
  );
  const totalCopies = useMemo(
    () => books.reduce((sum, b) => sum + b.totalCopies, 0),
    [books],
  );
  const overdue = useMemo(
    () => loans.filter((l) => new Date(l.dueAtUtc) < new Date()),
    [loans],
  );
  const visibleLoans = tab === 'overdue' ? overdue : loans;
  const selectedMember = members.find(
    (m) => m.studentNumber === issue.memberNumber,
  );

  async function submitBook(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await addBook(form);
      setForm({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        totalCopies: 1,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to add book.');
    } finally {
      setBusy(false);
    }
  }

  async function submitIssue(e: FormEvent) {
    e.preventDefault();
    if (!issue.bookId || !selectedMember) {
      setError('Select a book and an active library member.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await issueBook({
        bookId: issue.bookId,
        studentId: selectedMember.id,
        dueAtUtc: new Date(`${issue.dueDate}T23:59:59`).toISOString(),
      });
      setIssue({ bookId: '', memberNumber: '', dueDate: dateInput() });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to issue the book.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReturn(id: string) {
    setBusy(true);
    setError('');
    try {
      await returnBook(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to return the book.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="library-workspace">
      <div className="library-heading">
        <div>
          <span className="eyebrow">LIBRARY SERVICES</span>
          <h2>Library Management</h2>
          <p>Manage books, circulation, members and overdue loans from one workspace.</p>
        </div>
        {canManage && (
          <button
            className="library-primary"
            onClick={() =>
              document
                .getElementById('library-add-book')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            ＋ Add New Book
          </button>
        )}
      </div>

      <div className="library-summary">
        <div className="library-stat">
          <span className="library-icon">▣</span>
          <div>
            <small>Total Books</small>
            <strong>{totalCopies.toLocaleString()}</strong>
            <em>{books.length} titles</em>
          </div>
        </div>
        <div className="library-stat">
          <span className="library-icon available">▤</span>
          <div>
            <small>Available Copies</small>
            <strong>{availableCopies.toLocaleString()}</strong>
            <em>Ready to issue</em>
          </div>
        </div>
        <div className="library-stat">
          <span className="library-icon issued">↗</span>
          <div>
            <small>Books Issued</small>
            <strong>
              {Math.max(totalCopies - availableCopies, 0).toLocaleString()}
            </strong>
            <em>Currently on loan</em>
          </div>
        </div>
        <div className="library-stat">
          <span className="library-icon overdue">!</span>
          <div>
            <small>Overdue Loans</small>
            <strong className={overdue.length ? 'danger-number' : ''}>
              {overdue.length}
            </strong>
            <em>Require attention</em>
          </div>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="library-grid">
        <div className="library-main-card">
          <div className="library-tabs">
            <button
              className={tab === 'recent' ? 'active' : ''}
              onClick={() => setTab('recent')}
            >
              Recent Loans
            </button>
            <button
              className={tab === 'overdue' ? 'active' : ''}
              onClick={() => setTab('overdue')}
            >
              Overdue Loans <span>{overdue.length}</span>
            </button>
          </div>

          <div className="library-toolbar">
            <div>
              <h3>{tab === 'recent' ? 'Recent Book Loans' : 'Overdue Book Loans'}</h3>
              <p>Track active circulation and return books when received.</p>
            </div>
            <div className="library-search">
              <input
                placeholder="Search title, author or ISBN"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void load();
                }}
              />
              <button onClick={() => void load()}>Search</button>
            </div>
          </div>

          {visibleLoans.length === 0 ? (
            <p className="empty">
              {tab === 'overdue'
                ? 'No overdue loans. The library is up to date.'
                : 'No active loans yet.'}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Status</th>
                    {canManage && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleLoans.map((loan) => {
                    const isOverdue = new Date(loan.dueAtUtc) < new Date();
                    return (
                      <tr key={loan.id}>
                        <td>
                          <strong>{loan.bookTitle}</strong>
                          <small className="table-subtitle">ISBN: {loan.bookIsbn}</small>
                        </td>
                        <td>
                          <strong>{loan.studentNumber}</strong>
                          <small className="table-subtitle">{loan.studentName}</small>
                        </td>
                        <td>{formatDate(loan.issuedAtUtc)}</td>
                        <td>{formatDate(loan.dueAtUtc)}</td>
                        <td>
                          <span
                            className={
                              isOverdue ? 'loan-status overdue' : 'loan-status'
                            }
                          >
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                        {canManage && (
                          <td>
                            <button
                              className="secondary-button"
                              disabled={busy}
                              onClick={() => void handleReturn(loan.id)}
                            >
                              Return
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="library-side-card">
          <h3>Quick Actions</h3>
          {canManage && (
            <form onSubmit={submitIssue} className="library-action-form">
              <label>Issue a Book</label>
              <select
                value={issue.bookId}
                onChange={(e) => setIssue({ ...issue, bookId: e.target.value })}
              >
                <option value="">Select available book</option>
                {books
                  .filter((b) => b.availableCopies > 0)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} · {b.availableCopies} available
                    </option>
                  ))}
              </select>
              <input
                list="library-members"
                placeholder="Student number or name"
                value={issue.memberNumber}
                onChange={(e) =>
                  setIssue({ ...issue, memberNumber: e.target.value })
                }
              />
              <datalist id="library-members">
                {members.map((m) => (
                  <option key={m.id} value={m.studentNumber}>
                    {m.name}
                  </option>
                ))}
              </datalist>
              <input
                type="date"
                value={issue.dueDate}
                onChange={(e) => setIssue({ ...issue, dueDate: e.target.value })}
              />
              <button className="quick-issue" disabled={busy}>
                Issue Book
              </button>
            </form>
          )}
          {canManage && (
            <button className="quick-return" onClick={() => setTab('recent')}>
              ↩ View Active Loans
            </button>
          )}
          <button
            className="quick-search"
            onClick={() =>
              document
                .getElementById('library-books')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            ▣ Browse Book Catalogue
          </button>
        </aside>
      </div>

      <section className="library-catalogue" id="library-books">
        <div className="library-toolbar">
          <div>
            <h3>Book Catalogue</h3>
            <p>Registered titles and copy availability.</p>
          </div>
          <span className="status">{books.length} titles</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.isbn}</td>
                  <td><strong>{book.title}</strong></td>
                  <td>{book.author}</td>
                  <td>{book.publisher || '—'}</td>
                  <td>
                    <span
                      className={
                        book.availableCopies === 0
                          ? 'stock-badge empty-stock'
                          : 'stock-badge'
                      }
                    >
                      {book.availableCopies}/{book.totalCopies} available
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canManage && (
        <section className="library-add-card" id="library-add-book">
          <div>
            <span className="eyebrow">CATALOGUE</span>
            <h3>Add New Book</h3>
            <p>Register a title and its available physical copies.</p>
          </div>
          <form className="library-book-form" onSubmit={submitBook}>
            <input
              placeholder="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              required
            />
            <input
              placeholder="Book title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Author"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              required
            />
            <input
              placeholder="Publisher"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
            />
            <input
              type="number"
              min="1"
              value={form.totalCopies}
              onChange={(e) =>
                setForm({ ...form, totalCopies: Number(e.target.value) })
              }
            />
            <button className="library-primary" disabled={busy}>
              Add Book
            </button>
          </form>
        </section>
      )}
    </section>
  );
}
