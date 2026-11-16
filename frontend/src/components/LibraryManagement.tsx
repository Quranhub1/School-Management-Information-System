import { useEffect, useMemo, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import type { FormEvent } from 'react';
import { validateForm } from '../lib/validation';
import { formatIsbnInput, isValidIsbn, normalizeIsbnDigits, toBooklandEan13 } from '../lib/isbn';
import { libraryBookCreateRequestSchema, libraryLoanCreateRequestSchema } from '../schemas';
import { getCurrencyInputStep, SYSTEM_CURRENCY, SYSTEM_LOCALE } from '../lib/currency';
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
  listProgrammeRequirements,
  setProgrammeRequirement,
  setProgrammeRequirementActive,
  type LibraryProgrammeRequirement,
} from '../api/library';
import { getProgrammes, type Programme } from '../api/programmes';

const dateInput = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(SYSTEM_LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export function LibraryManagement({ canManage }: { canManage?: boolean }) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [requirements, setRequirements] = useState<LibraryProgrammeRequirement[]>([]);
  const [requirementForm, setRequirementForm] = useState({ programmeId: '', name: 'Required course book', amount: '' });
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'books' | 'issue' | 'cards' | 'clearance'>('dashboard');
  const [selectedCardMember, setSelectedCardMember] = useState<LibraryMember | null>(null);
  const [tab, setTab] = useState<'recent' | 'overdue'>('recent');
  const [error, setError] = useState('');
  const [bookValidationErrors, setBookValidationErrors] = useState<Record<string, string>>({});
  const [loanValidationErrors, setLoanValidationErrors] = useState<Record<string, string>>({});
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
  const [barcodeBookId, setBarcodeBookId] = useState<string | null>(null);
  const [isbnEntryMethod, setIsbnEntryMethod] = useState<'manual' | 'scan'>('manual');
  const [isbnScanValue, setIsbnScanValue] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const barcodeSvgRef = useRef<SVGSVGElement>(null);
  const isbnPreviewSvgRef = useRef<SVGSVGElement>(null);

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
    if (canManage) {
      Promise.all([getProgrammes(), listProgrammeRequirements()])
        .then(([programmeRows, requirementRows]) => {
          setProgrammes(programmeRows.filter(programme => programme.isActive));
          setRequirements(requirementRows);
        })
        .catch(e => setError(e instanceof Error ? e.message : 'Unable to load course book requirements.'));
    }
  }, [canManage]);

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
  const isbnDigits = normalizeIsbnDigits(form.isbn);
  const isbnComplete = isbnDigits.length === 10 || isbnDigits.length === 13;
  const isbnValid = isbnComplete && isValidIsbn(isbnDigits);
  const selectedMember = useMemo(
    () => members.find((m) => m.studentNumber === issue.memberNumber),
    [members, issue.memberNumber],
  );

  const barcodeBook = books.find(book => book.id === barcodeBookId);
  useEffect(() => {
    const svg = barcodeSvgRef.current;
    if (!barcodeBookId || !barcodeBook || !svg) return;
    const ean13 = toBooklandEan13(barcodeBook.isbn);
    svg.replaceChildren();
    if (!ean13) {
      setBarcodeError('This book does not have a valid ISBN-10 or ISBN-13 for barcode generation.');
      return;
    }
    try {
      JsBarcode(svg, ean13, {
        format: 'EAN13',
        width: 2,
        height: 88,
        displayValue: true,
        fontSize: 16,
        margin: 12,
        background: '#ffffff',
        lineColor: '#111827',
      });
      setBarcodeError('');
    } catch {
      setBarcodeError('The ISBN barcode could not be generated.');
    }
  }, [barcodeBookId, barcodeBook]);

  // Generate a preview as soon as a complete, checksum-valid ISBN is typed.
  // JsBarcode is bundled with the app, so this works without a CDN or network.
  useEffect(() => {
    const svg = isbnPreviewSvgRef.current;
    if (!svg) return;
    svg.replaceChildren();
    if (!isbnValid) return;
    const ean13 = toBooklandEan13(isbnDigits);
    if (!ean13) return;
    try {
      JsBarcode(svg, ean13, {
        format: 'EAN13',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        margin: 8,
        background: '#ffffff',
        lineColor: '#111827',
      });
    } catch {
      svg.replaceChildren();
    }
  }, [isbnDigits, isbnValid]);

  async function submitProgrammeRequirement(e: FormEvent) {
    e.preventDefault();
    if (!requirementForm.programmeId || !requirementForm.name.trim() || Number(requirementForm.amount) <= 0) {
      setError('Select a programme, enter the book requirement and a fee greater than zero.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await setProgrammeRequirement({
        programmeId: requirementForm.programmeId,
        name: requirementForm.name.trim(),
        amount: Number(requirementForm.amount),
        currency: SYSTEM_CURRENCY,
      });
      setRequirements(await listProgrammeRequirements());
      setRequirementForm(current => ({ ...current, amount: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save course book requirement.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleProgrammeRequirement(id: string, active: boolean) {
    setBusy(true);
    try {
      await setProgrammeRequirementActive(id, active);
      setRequirements(await listProgrammeRequirements());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update requirement.');
    } finally {
      setBusy(false);
    }
  }

  async function submitBook(e: FormEvent) {
    e.preventDefault();
    setError('');
    const selectedIsbn = isbnEntryMethod === 'scan' ? form.isbn : form.isbn;
    if (!selectedIsbn.trim()) {
      setBookValidationErrors(current => ({ ...current, isbn: isbnEntryMethod === 'scan' ? 'Scan the book ISBN barcode before saving.' : 'Enter the book ISBN before saving.' }));
      setError('Book was not added. Provide the ISBN using the selected method.');
      return;
    }
    const validation = validateForm(libraryBookCreateRequestSchema, form);
    if (!validation.success) {
      setBookValidationErrors(validation.errors);
      setError('Book was not added. Correct the catalogue fields shown below.');
      return;
    }
    setBookValidationErrors({});
    setBusy(true);
    try {
      await addBook(validation.data);
      setForm({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        totalCopies: 1,
      });
      setIsbnScanValue('');
      setIsbnEntryMethod('manual');
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

    const loanInput = {
      bookId: issue.bookId,
      studentId: selectedMember.id,
      dueAtUtc: new Date(`${issue.dueDate}T23:59:59`).toISOString(),
    };
    const validation = validateForm(libraryLoanCreateRequestSchema, loanInput);
    if (!validation.success) {
      setLoanValidationErrors(validation.errors);
      setError('Book loan was not issued. Correct the loan details shown below.');
      return;
    }
    setLoanValidationErrors({});
    setBusy(true);
    setError('');
    try {
      await issueBook(validation.data);
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
          
        </div>
      </div>


      {activeView !== 'dashboard' && (
        <button type="button" className="secondary-button" style={{ marginBottom: 16 }} onClick={() => setActiveView('dashboard')}>
          ← Back to Library Dashboard
        </button>
      )}
      {activeView === 'dashboard' && (
        <section className="library-dashboard-options" aria-label="Library services">
          {[
            { key: 'books' as const, icon: '▤', title: 'Books', description: 'Browse and manage the book catalogue.', links: [{ label: 'View Books', view: 'books' as const }, { label: 'Add New Book', view: 'books' as const }] },
            { key: 'issue' as const, icon: '↗', title: 'Issue Books', description: 'Issue books to students and monitor active loans.', links: [{ label: 'Issue Book', view: 'issue' as const }, { label: 'View Books Issued', view: 'issue' as const }] },
            { key: 'cards' as const, icon: '▣', title: 'Library Cards', description: 'Prepare student library membership cards and view the register.', links: [{ label: 'Issue Library Cards', view: 'cards' as const }, { label: 'View Library Cards', view: 'cards' as const }] },
            { key: 'clearance' as const, icon: '✓', title: 'Library Clearance', description: 'Manage programme course-book requirements and related fees.', links: [{ label: 'Course-book Requirements', view: 'clearance' as const }, { label: 'Fees & Settings', view: 'clearance' as const }] },
          ].map(item => (
            <article key={item.key} className="library-main-card" style={{ padding: 18, borderTop: '3px solid var(--primary, #16834a)' }}>
              <button type="button" onClick={() => setActiveView(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 0, border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 10, background: 'rgba(22,131,74,.10)', color: 'var(--primary, #16834a)', fontSize: 23 }}>{item.icon}</span>
                <strong style={{ fontSize: 17 }}>{item.title}</strong>
              </button>
              <p style={{ minHeight: 42, margin: '12px 0', color: 'var(--text-muted, #64748b)', fontSize: 13 }}>{item.description}</p>
              <div className="library-dashboard-card-actions">
                {item.links.map(link => (
                  <button key={link.label} type="button" className="secondary-button" onClick={() => setActiveView(link.view)}>
                    {link.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
      {activeView === 'books' && (
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
      )}

      {canManage && activeView === 'clearance' && <section className="library-main-card" style={{ marginBottom: 18, padding: 16 }}>
        <h3>Course book requirements and fees</h3>
        <p>Set the required book or book-purchase amount for each programme. These charges are added to the student's Finance account automatically on admission.</p>
        <form onSubmit={submitProgrammeRequirement} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1.5fr) minmax(160px, 1fr) minmax(120px, .7fr) auto', gap: 10, alignItems: 'end' }}>
          <label>Programme
            <select value={requirementForm.programmeId} onChange={e => setRequirementForm(v => ({ ...v, programmeId: e.target.value }))} required>
              <option value="">Select course/programme</option>
              {programmes.map(programme => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
            </select>
          </label>
          <label>Book / requirement
            <input value={requirementForm.name} onChange={e => setRequirementForm(v => ({ ...v, name: e.target.value }))} required />
          </label>
          <label>Amount ({SYSTEM_CURRENCY})
            <input type="number" min={getCurrencyInputStep(SYSTEM_CURRENCY)} step={getCurrencyInputStep(SYSTEM_CURRENCY)} value={requirementForm.amount} onChange={e => setRequirementForm(v => ({ ...v, amount: e.target.value }))} required />
          </label>
          <button className="library-primary" type="submit" disabled={busy}>Save requirement</button>
        </form>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table><thead><tr><th>Programme</th><th>Requirement</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{requirements.map(item => <tr key={item.id}>
              <td>{programmes.find(p => p.id === item.programmeId)?.name ?? item.programmeId}</td>
              <td>{item.name}</td>              <td>{item.currency} {item.totalAmount.toLocaleString(SYSTEM_LOCALE)}</td>
              <td>{item.isActive ? 'Active' : 'Inactive'}</td>
              <td><button type="button" className="secondary-button" disabled={busy} onClick={() => void toggleProgrammeRequirement(item.id, !item.isActive)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>)}
            {requirements.length === 0 && <tr><td colSpan={5}>No course book requirements configured.</td></tr>}</tbody>
          </table>
        </div>
      </section>}
      {error && <div className="error" role="alert">{error}</div>}
      {Object.keys(loanValidationErrors).length > 0 && <div className="error" role="alert"><strong>Loan fields requiring attention</strong><ul>{Object.entries(loanValidationErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul></div>}

      {activeView === 'cards' && <section className="library-main-card" style={{ marginBottom: 18, padding: 14 }}>
        <div className="library-toolbar"><div><h3>Student library register</h3><small>{members.length} students linked from the central student register</small></div></div>
        <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table><thead><tr><th>Student number</th><th>Student name</th><th>Library membership</th></tr></thead>
            <tbody>{members.map(member => <tr key={member.id}><td><strong>{member.studentNumber}</strong></td><td>{member.name}</td><td>Registered from Admissions</td></tr>)}
            {members.length === 0 && <tr><td colSpan={3}>No admitted students are available in the Library register.</td></tr>}</tbody>
          </table>
        </div>
      </section>}
      {activeView === 'cards' && selectedCardMember && <section className="library-main-card" style={{ marginBottom: 18, padding: 20 }}><div style={{ maxWidth: 440, border: '1px solid #cbd5e1', borderRadius: 12, padding: 20, background: '#fff', color: '#111827' }}><strong>KAMPALA SCHOOL OF HEALTH SCIENCES</strong><h3 style={{ margin: '16px 0 6px' }}>LIBRARY MEMBERSHIP CARD</h3><p>{selectedCardMember.name}</p><strong>{selectedCardMember.studentNumber}</strong><p style={{ fontSize: 12 }}>Student Library Member</p></div><button type="button" className="library-primary" style={{ marginTop: 12 }} onClick={() => window.print()}>Print Library Card</button><button type="button" className="secondary-button" style={{ margin: '12px 0 0 8px' }} onClick={() => setSelectedCardMember(null)}>Close Preview</button></section>}
      {activeView === 'issue' && <div className="library-grid">
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
            onClick={() => setActiveView('books')}
          >
            ▣ Browse Book Catalogue
          </button>
        </aside>
      </div>}

      {activeView === 'books' && <section className="library-catalogue" id="library-books">
        <div className="library-toolbar">
          <div>
            <h3>Book Catalogue</h3>
            
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="status">{books.length} titles</span>
            {canManage && (
              <button
                type="button"
                className="library-primary"
                onClick={() => document.getElementById('library-add-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Add New Book
              </button>
            )}
          </div>
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
                  <td><button className="secondary-button" onClick={() => setBarcodeBookId(book.id)}>View Barcode</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>}

      {canManage && activeView === 'books' && (
        <section className="library-add-card" id="library-add-book">
          <div>
            <span className="eyebrow">CATALOGUE</span>
            <h3>Add New Book</h3>
            
          </div>
          <form className="library-book-form" onSubmit={submitBook}>
            {Object.keys(bookValidationErrors).length > 0 && <div className="error" role="alert"><strong>Catalogue fields requiring attention</strong><ul>{Object.entries(bookValidationErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul></div>}
            <fieldset className="library-isbn-method" style={{ border: 0, padding: 0, margin: '0 0 12px' }}>
              <legend style={{ fontWeight: 600, marginBottom: 8 }}>ISBN entry method <span aria-hidden="true">*</span></legend>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 18 }}>
                <input type="radio" name="isbnEntryMethod" value="manual" checked={isbnEntryMethod === 'manual'} onChange={() => {
                  setIsbnEntryMethod('manual');
                  setForm(current => ({ ...current, isbn: '' }));
                  setIsbnScanValue('');
                  setBookValidationErrors(current => ({ ...current, isbn: '' }));
                }} />
                Enter ISBN manually
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input type="radio" name="isbnEntryMethod" value="scan" checked={isbnEntryMethod === 'scan'} onChange={() => {
                  setIsbnEntryMethod('scan');
                  setForm(current => ({ ...current, isbn: '' }));
                  setIsbnScanValue('');
                  setBookValidationErrors(current => ({ ...current, isbn: '' }));
                }} />
                Scan book barcode
              </label>
            </fieldset>
            {isbnEntryMethod === 'scan' ? (
              <div className="library-isbn-scanner">
                <label htmlFor="library-isbn-scanner-input">Scan book ISBN barcode <span aria-hidden="true">*</span></label>
                <input
                  id="library-isbn-scanner-input"
                  value={isbnScanValue}
                  onChange={e => setIsbnScanValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const scannedIsbn = formatIsbnInput(isbnScanValue);
                    setForm(current => ({ ...current, isbn: scannedIsbn }));
                    setBookValidationErrors(current => ({ ...current, isbn: '' }));
                    setIsbnScanValue('');
                  }}
                  placeholder="Scan the ISBN barcode on the book"
                  autoComplete="off"
                  inputMode="none"
                />
                <small>Use a USB barcode reader configured to append Enter. The scanned ISBN is checked before the book can be saved.</small>
                {form.isbn && <small role="status">Scanned ISBN: {form.isbn} {isbnValid ? '· valid checksum' : '· check digit needs correction'}</small>}
              </div>
            ) : (
            <label className="library-isbn-field">
              <span>ISBN <span aria-hidden="true">*</span></span>
              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                placeholder="Enter ISBN digits (10 or 13)"
                aria-label="ISBN-10 or ISBN-13"
                aria-invalid={Boolean(bookValidationErrors.isbn) || (isbnComplete && !isbnValid)}
                aria-describedby="library-isbn-help"
                value={form.isbn}
                onChange={(e) => {
                  const formatted = formatIsbnInput(e.target.value);
                  setForm(current => ({ ...current, isbn: formatted }));
                  setBookValidationErrors(current => ({ ...current, isbn: '' }));
                }}
                required
              />
              <small id="library-isbn-help" role="status">
                {isbnValid
                  ? `Valid ISBN-${isbnDigits.length === 10 ? '10' : '13'} · check digit verified`
                  : isbnComplete
                    ? 'ISBN check digit is invalid. Check the digits.'
                    : 'Type digits only. Prefix and check digit separators are added automatically; publisher/title hyphens require the assigned ISBN range.'}
              </small>
              {bookValidationErrors.isbn && <small className="field-error">{bookValidationErrors.isbn}</small>}
              {isbnValid && (
                <div className="library-isbn-barcode-preview">
                  <span>Live barcode preview</span>
                  <svg
                    ref={isbnPreviewSvgRef}
                    role="img"
                    aria-label="Live EAN-13 barcode preview for the entered ISBN"
                    style={{ display: 'block', width: '100%', maxWidth: 360, height: 'auto', background: '#fff' }}
                  />
                </div>
              )}
            </label>
            )}
            <input
              placeholder="Book title"
              aria-invalid={Boolean(bookValidationErrors.title)}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Author"
              aria-invalid={Boolean(bookValidationErrors.author)}
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
              aria-invalid={Boolean(bookValidationErrors.totalCopies)}
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
      {activeView === 'cards' && <section className="library-main-card" style={{ padding: 16 }}><div className="library-toolbar"><div><h3>Library Card Register</h3><small>{members.length} students available for library membership cards</small></div></div><div className="table-wrap"><table><thead><tr><th>Student Number</th><th>Student Name</th><th>Card</th></tr></thead><tbody>{members.map(member => <tr key={member.id}><td><strong>{member.studentNumber}</strong></td><td>{member.name}</td><td><button type="button" className="secondary-button" onClick={() => setSelectedCardMember(member)}>Issue / View Card</button></td></tr>)}{members.length === 0 && <tr><td colSpan={3}>No students are available in the library register.</td></tr>}</tbody></table></div></section>}
      {barcodeBookId && (
        <div className="modal-backdrop" onClick={() => setBarcodeBookId(null)}>
          <div className="auth-card library-barcode-dialog" onClick={e => e.stopPropagation()}>
            <h3>{barcodeBook?.title ?? 'Book Barcode'}</h3>
            <p>{barcodeBook?.isbn ?? ''}</p>
            {barcodeError
              ? <p className="error" role="alert">{barcodeError}</p>
              : <svg ref={barcodeSvgRef} role="img" aria-label={`EAN-13 barcode for ${barcodeBook?.title ?? 'book'}`} style={{ display: 'block', width: '100%', maxWidth: 420, height: 'auto', margin: '12px auto', background: '#fff' }} />}
            <button className="secondary-button" style={{ marginTop: 12 }} onClick={() => setBarcodeBookId(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
