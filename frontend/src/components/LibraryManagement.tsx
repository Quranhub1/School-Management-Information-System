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
  recordLibraryStudentPayment,
  type LibraryProgrammeRequirement,
  listPaidLibraryClearanceStudents,
  getLibraryClearanceAcademicOptions,
  type LibraryClearanceAcademicOptions,
  type PaidLibraryClearanceStudent,
} from '../api/library';
import { getProgrammes, type Programme } from '../api/programmes';
import { getAccessToken } from '../api/auth';
import { useOptionalInstitutionSettings } from './InstitutionSettingsContext';

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
  const institutionContext = useOptionalInstitutionSettings();
  const institutionName = institutionContext?.institution?.institutionName?.trim() || 'Institution';
  const institutionShortName = institutionContext?.institution?.abbreviation?.trim() || institutionName;
  const institutionPrimaryColor = institutionContext?.institution?.primaryColor?.trim() || '#176b43';
  const institutionAccentColor = institutionContext?.institution?.accentColor?.trim() || '#8eb79b';
  const cardIssueDate = new Date();
  const cardExpiryDate = new Date(cardIssueDate);
  cardExpiryDate.setFullYear(cardExpiryDate.getFullYear() + 1);
  const formatCardDate = (value: Date) => new Intl.DateTimeFormat(SYSTEM_LOCALE, {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(value);
  function printLibraryCard() {
    if (!selectedCardMember || selectedCardClearance?.paymentStatus !== 'Paid') {
      window.alert('The full library course-book fee must be paid before this card can be printed.');
      return;
    }
    const card = document.querySelector<HTMLElement>('.library-print-card');
    if (!card) return;

    const printWindow = window.open('', '_blank', 'width=1000,height=750');
    if (!printWindow) {
      window.alert('Please allow pop-ups for this site to preview and print the library card.');
      return;
    }

    const styles = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map(link => `<link rel="stylesheet" href="${link.href}">`)
      .join('');
    const inlineStyles = Array.from(document.querySelectorAll<HTMLStyleElement>('style'))
      .map(style => style.outerHTML)
      .join('');

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Library Membership Card Preview</title>${styles}${inlineStyles}
      <style>
        @page { size: 85.6mm 54mm; margin: 0; }
        html, body { min-height: 100%; margin: 0; padding: 0; background: #eef2ef; }
        body { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 28px; box-sizing: border-box; }
        .library-print-card { display:block !important; position:relative !important; inset:auto !important; flex:none !important; width:85.6mm !important; height:54mm !important; max-width:none !important; margin:0 !important; padding:3mm !important; box-sizing:border-box !important; aspect-ratio:auto !important; overflow:hidden !important; border:.25mm solid #aab8ae !important; border-radius:2mm !important; box-shadow:0 8px 28px rgba(20,40,28,.18) !important; visibility:visible !important; print-color-adjust:exact !important; -webkit-print-color-adjust:exact !important; }
        .library-print-card, .library-print-card * { visibility:visible !important; }
        .library-print-card-header { display:grid !important; grid-template-columns:13mm minmax(0,1fr) 15mm !important; gap:2mm !important; min-height:17mm !important; }
        .library-card-institution-badge { width:13mm !important; height:13mm !important; }
        .library-card-student-photo { width:15mm !important; height:17mm !important; }
        .library-card-heading { gap:1.5mm !important; padding-top:1mm !important; }
        .library-card-heading strong { font-size:7pt !important; }
        .library-card-heading span { font-size:6pt !important; }
        .library-card-student-details { align-items:center !important; text-align:center !important; gap:1.5mm !important; margin-top:2mm !important; padding-top:2mm !important; }
        .library-card-student-details strong { width:100%; text-align:center !important; font-size:10pt !important; }
        .library-card-student-details span, .library-card-student-details small { width:100%; text-align:center !important; font-size:7pt !important; }
        .library-card-student-details small { font-size:6pt !important; }
        .library-card-membership-status { display:inline-flex !important; align-self:center !important; padding:1mm 2.5mm !important; border-radius:8mm !important; background:#e5f4e9 !important; color:#176b43 !important; font-size:6pt !important; font-weight:800 !important; letter-spacing:.08em !important; }
        .library-card-dates { display:flex !important; justify-content:space-between !important; gap:3mm !important; margin-top:1.5mm !important; font-size:6pt !important; }
        .library-card-signature { display:flex !important; justify-content:flex-end !important; align-items:flex-end !important; margin-top:1.5mm !important; font-size:5.5pt !important; }
        .library-card-signature-line { display:inline-block !important; width:27mm !important; margin-left:2mm !important; border-bottom:.2mm solid #53665a !important; height:3mm !important; }
        .library-card-colour-strip { position:absolute !important; z-index:3 !important; right:0 !important; bottom:0 !important; left:0 !important; height:2mm !important; }
        .library-preview-print-button { border:0; border-radius:6px; padding:11px 22px; background:#176b43; color:white; font:600 14px Arial,sans-serif; cursor:pointer; }
        @media print {
          html, body { width:85.6mm !important; height:54mm !important; min-height:54mm !important; background:#fff !important; overflow:hidden !important; }
          body { display:block !important; padding:0 !important; }
          .library-preview-print-button { display:none !important; }
          .library-print-card { box-shadow:none !important; }
        }
      </style></head><body>${card.outerHTML}<button class="library-preview-print-button" type="button" id="library-preview-print">Print card</button>
      <script>
        document.getElementById('library-preview-print').addEventListener('click', function () { window.print(); });
      </script>
      </body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [requirements, setRequirements] = useState<LibraryProgrammeRequirement[]>([]);
  const [clearanceStudents, setClearanceStudents] = useState<PaidLibraryClearanceStudent[]>([]);
  const [clearanceAcademicOptions, setClearanceAcademicOptions] = useState<LibraryClearanceAcademicOptions>({ courses: [], programmes: [], years: [], semesters: [], academicYears: [], mappings: [] });
  const [clearanceFilters, setClearanceFilters] = useState({ name: '', course: '', semester: '', year: '', academicYear: '' });
  const [clearanceSearchFocused, setClearanceSearchFocused] = useState(false);
  const [requirementForm, setRequirementForm] = useState({ programmeId: '', name: 'Required course book', amount: '' });
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState<'dashboard' | 'books' | 'issue' | 'overdue' | 'cards' | 'clearance-students' | 'clearance-settings'>('dashboard');
  const [openAddBookForm, setOpenAddBookForm] = useState(false);
  const [selectedCardMember, setSelectedCardMember] = useState<LibraryMember | null>(null);
  const [selectedCardPhotoUrl, setSelectedCardPhotoUrl] = useState<string | null>(null);
  const institutionLogoUrl = `${(import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? ''}/api/public/institution-settings/logo`;
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
    if (activeView !== 'books' || !openAddBookForm) return;
    document.getElementById('library-add-book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setOpenAddBookForm(false);
  }, [activeView, openAddBookForm]);

  useEffect(() => {
    setSelectedCardPhotoUrl(null);
    if (!selectedCardMember) {
      setSelectedCardPhotoUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    const token = getAccessToken();
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';
    void fetch(`${base}/api/students/${encodeURIComponent(selectedCardMember.id)}/application-form/photograph`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    }).then(async response => {
      if (!response.ok) return;
      const blob = await response.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setSelectedCardPhotoUrl(objectUrl);
    }).catch(() => {
      if (!cancelled) setSelectedCardPhotoUrl(null);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedCardMember]);

  useEffect(() => {
    if (activeView === 'cards') {
      setClearanceStudents([]);
      listPaidLibraryClearanceStudents()
        .then(setClearanceStudents)
        .catch(e => setError(e instanceof Error ? e.message : 'Unable to load student library fee balances.'));
      return;
    }
    if (activeView === 'clearance-students') {
      Promise.all([listPaidLibraryClearanceStudents(), getLibraryClearanceAcademicOptions()])
        .then(([students, options]) => { setClearanceStudents(students); setClearanceAcademicOptions(options); })
        .catch(e => setError(e instanceof Error ? e.message : 'Unable to load students and curriculum filters.'));
    }
  }, [activeView]);

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
  const visibleLoans = activeView === 'overdue' ? overdue : loans;
  const filteredClearanceStudents = useMemo(() => clearanceStudents.filter(student =>
    (!clearanceFilters.name || (student.studentName + ' ' + student.studentNumber).toLowerCase().includes(clearanceFilters.name.toLowerCase())) &&
    (!clearanceFilters.course || student.courseNames.includes(clearanceFilters.course)) &&
    (!clearanceFilters.semester || (student.semesterName ?? '') === clearanceFilters.semester) &&
    (!clearanceFilters.year || String(student.classYear ?? '') === clearanceFilters.year) &&
    (!clearanceFilters.academicYear || (student.academicYearName ?? '') === clearanceFilters.academicYear)
  ), [clearanceStudents, clearanceFilters]);
  const clearanceStudentSuggestions = useMemo(() => {
    const query = clearanceFilters.name.trim().toLowerCase();
    if (!query) return [];
    const seen = new Set<string>();
    return clearanceStudents.filter(student => {
      const matches = student.studentName.toLowerCase().includes(query) ||
        student.studentNumber.toLowerCase().includes(query);
      if (!matches || seen.has(student.studentId)) return false;
      seen.add(student.studentId);
      return true;
    }).slice(0, 8);
  }, [clearanceStudents, clearanceFilters.name]);
  const clearanceCourses = clearanceAcademicOptions.courses;
  const clearanceSemesters = clearanceAcademicOptions.semesters;
  const clearanceYears = clearanceAcademicOptions.years;
  const clearanceAcademicYears = clearanceAcademicOptions.academicYears;
  const selectedCardClearance = useMemo(
    () => clearanceStudents.find(student => student.studentId === selectedCardMember?.id),
    [clearanceStudents, selectedCardMember],
  );
  const selectedCardIsPaid = selectedCardClearance?.paymentStatus === 'Paid';
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
    setBarcodeError('');
    const ean13 = barcodeBook.barcodeValue || toBooklandEan13(barcodeBook.isbn);
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

  async function recordStudentBookPayment(student: PaidLibraryClearanceStudent) {
    const enteredAmount = window.prompt(
      `Enter payment amount for ${student.studentName}. Outstanding: ${student.currency} ${student.outstandingAmount.toLocaleString(SYSTEM_LOCALE)}`,
      String(student.outstandingAmount),
    );
    if (enteredAmount === null) return;
    const amount = Number(enteredAmount);
    if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) !== amount * 100) {
      setError('Enter a valid payment amount with no more than two decimal places.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await recordLibraryStudentPayment(student.studentId, { amount });
      setClearanceStudents(await listPaidLibraryClearanceStudents());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the library payment.');
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
          <h2>{activeView === 'books' ? 'Books' : activeView === 'issue' ? 'Issue & Return Books' : activeView === 'overdue' ? 'Overdue Loans' : activeView === 'cards' ? 'Library Cards' : activeView === 'clearance-students' ? 'Course-book Requirements' : activeView === 'clearance-settings' ? 'Fees & Settings' : 'Library Management'}</h2>
          
        </div>
      </div>


      {activeView !== 'dashboard' && (
        <button type="button" className="secondary-button" style={{ marginBottom: 16 }} onClick={() => setActiveView('dashboard')}>
          ← Back to Library Dashboard
        </button>
      )}
      {activeView === 'dashboard' && (
        <>
          <section className="library-dashboard-options" aria-label="Library services">
            {[
              { key: 'books' as const, icon: '▤', title: 'Books Catalogue', description: 'Browse, register and manage books, ISBNs and barcodes.', links: [{ label: 'View Catalogue', view: 'books' as const }, { label: 'Add New Book', view: 'books' as const }] },
              { key: 'issue' as const, icon: '↗', title: 'Issue & Return Books', description: 'Issue books, process returns and follow up overdue loans.', links: [{ label: 'Issue a Book', view: 'issue' as const }, { label: 'View Active Loans', view: 'issue' as const }, { label: `Overdue Loans (${overdue.length})`, view: 'overdue' as const }] },
              { key: 'cards' as const, icon: '▣', title: 'Library Cards', description: 'Prepare student library membership cards and view the register.', links: [{ label: 'Issue Library Cards', view: 'cards' as const }, { label: 'View Library Cards', view: 'cards' as const }] },
              { key: 'clearance-students' as const, icon: '✓', title: 'Library Clearance', description: 'View students who have fully paid their required course-book fees and configure course fees.', links: [{ label: 'Course-book Requirements', view: 'clearance-students' as const }, { label: 'Fees & Settings', view: 'clearance-settings' as const }] },
            ].map(item => (
              <article key={item.key} className="library-main-card" style={{ padding: 18, borderTop: '3px solid var(--primary, #16834a)' }}>
                <button type="button" onClick={() => setActiveView(item.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 0, border: 0, background: 'transparent', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
                  <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 10, background: 'var(--primary, #16834a)', color: '#ffffff', fontSize: 23 }}>{item.icon}</span>
                  <strong style={{ fontSize: 17 }}>{item.title}</strong>
                </button>
                <p style={{ minHeight: 42, margin: '12px 0', color: 'var(--text-muted, #64748b)', fontSize: 13 }}>{item.description}</p>
                <div className="library-dashboard-card-actions">
                  {item.links.map(link => (
                    <button key={link.label} type="button" className="secondary-button" onClick={() => {
                      setActiveView(link.view);
                      if (link.label === 'Add New Book') setOpenAddBookForm(true);
                    }}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </>
      )}

      {canManage && activeView === 'clearance-settings' && <section className="library-main-card" style={{ marginBottom: 18, padding: 16 }}>
        <h3>Course book requirements and fees</h3>
        <p>Set the required course-book amount for each programme. Record student payments here and track the remaining balance in Library Clearance.</p>
        <form className="library-requirement-form" onSubmit={submitProgrammeRequirement}>
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
          <table><thead><tr><th>ID</th><th>Programme</th><th>Requirement</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{requirements.map((item, index) => <tr key={item.id}><td>{index + 1}</td>
              <td>{programmes.find(p => p.id === item.programmeId)?.name ?? item.programmeId}</td>
              <td>{item.name}</td>              <td>{item.currency} {item.totalAmount.toLocaleString(SYSTEM_LOCALE)}</td>
              <td>{item.isActive ? 'Active' : 'Inactive'}</td>
              <td><button type="button" className="secondary-button" disabled={busy} onClick={() => void toggleProgrammeRequirement(item.id, !item.isActive)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></td>
            </tr>)}
            {requirements.length === 0 && <tr><td colSpan={6}>No course book requirements configured.</td></tr>}</tbody>
          </table>
        </div>
      </section>}
      {activeView === 'clearance-students' && <section className="library-main-card" style={{ marginBottom: 18, padding: 16 }}>
        <div className="library-toolbar"><div><h3>Students — Course-book Requirements</h3><small>{filteredClearanceStudents.length} of {clearanceStudents.length} students</small></div></div>
        <div className="library-clearance-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 10, margin: '14px 0' }}>
          <label className="library-clearance-search-label">Search student
            <div className="library-clearance-autocomplete">
              <span className="library-clearance-search-icon" aria-hidden="true">⌕</span>
              <input
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={clearanceSearchFocused && clearanceStudentSuggestions.length > 0}
                aria-controls="library-clearance-student-suggestions"
                aria-label="Search by student name or student number"
                value={clearanceFilters.name}
                onFocus={() => setClearanceSearchFocused(true)}
                onBlur={() => setClearanceSearchFocused(false)}
                onChange={e => setClearanceFilters(current => ({ ...current, name: e.target.value }))}
                placeholder="Start typing a name or student number"
                autoComplete="off"
              />
              {clearanceFilters.name && <button type="button" className="library-clearance-clear-search" aria-label="Clear student search" onMouseDown={e => e.preventDefault()} onClick={() => setClearanceFilters(current => ({ ...current, name: '' }))}>×</button>}
              {clearanceSearchFocused && clearanceStudentSuggestions.length > 0 && (
                <div className="library-clearance-suggestions" id="library-clearance-student-suggestions" role="listbox">
                  {clearanceStudentSuggestions.map(student => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      key={student.studentId}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setClearanceFilters(current => ({ ...current, name: student.studentNumber }));
                        setClearanceSearchFocused(false);
                      }}
                    >
                      <span className="library-clearance-suggestion-avatar" aria-hidden="true">{student.studentName.trim().charAt(0).toUpperCase()}</span>
                      <span className="library-clearance-suggestion-details">
                        <strong>{student.studentName}</strong>
                        <small>{student.studentNumber}</small>
                      </span>
                      <span className="library-clearance-suggestion-arrow" aria-hidden="true">↵</span>
                    </button>
                  ))}
                </div>
              )}
              {clearanceSearchFocused && clearanceFilters.name.trim() && clearanceStudentSuggestions.length === 0 && (
                <div className="library-clearance-suggestions library-clearance-no-suggestions" role="status">No matching students</div>
              )}
            </div>
          </label>
          <label>Course
            <select value={clearanceFilters.course} onChange={e => setClearanceFilters(current => ({ ...current, course: e.target.value }))}><option value="">All courses</option>{clearanceCourses.map(course => <option key={course.courseId} value={course.courseName}>{course.courseName}</option>)}</select>
          </label>
          <label>Semester
            <select value={clearanceFilters.semester} onChange={e => setClearanceFilters(current => ({ ...current, semester: e.target.value }))}><option value="">All semesters</option>{clearanceSemesters.map(semester => <option key={semester.semesterId} value={semester.name}>{semester.name}{semester.isCurrent ? ' (Current)' : ''}</option>)}</select>
          </label>
          <label>Year of study
            <select value={clearanceFilters.year} onChange={e => setClearanceFilters(current => ({ ...current, year: e.target.value }))}><option value="">All study years</option>{clearanceYears.map(year => <option key={year} value={String(year)}>Year {year}</option>)}</select>
          </label>
          <label>Academic year
            <select value={clearanceFilters.academicYear} onChange={e => setClearanceFilters(current => ({ ...current, academicYear: e.target.value }))}><option value="">All academic years</option>{clearanceAcademicYears.map(year => <option key={year.academicYearId} value={year.name}>{year.name}{year.isCurrent ? ' (Current)' : ''}</option>)}</select>
          </label>
        </div>
        <div className="table-wrap">
          <table><thead><tr><th>ID</th><th>Student Number</th><th>Student Name</th><th>Course</th><th>Class Year</th><th>Semester</th><th>Academic Year</th><th>Payment Status</th><th>Required Fee</th><th>Amount Paid</th><th>Outstanding</th><th>Action</th></tr></thead>
            <tbody>{filteredClearanceStudents.map((student, index) => <tr key={student.studentId}>
              <td>{index + 1}</td><td><strong>{student.studentNumber}</strong></td><td>{student.studentName}</td><td>{student.programmeName || '—'}</td><td>{student.classYear ? 'Year ' + student.classYear : '—'}</td><td>{student.semesterName || (student.semesterNumber ? 'Semester ' + student.semesterNumber : '—')}</td><td>{student.academicYearName || '—'}</td><td>{student.paymentStatus}</td><td>{student.currency} {student.requiredAmount.toLocaleString(SYSTEM_LOCALE)}</td><td>{student.currency} {student.paidAmount.toLocaleString(SYSTEM_LOCALE)}</td><td>{student.currency} {student.outstandingAmount.toLocaleString(SYSTEM_LOCALE)}</td><td>{canManage && student.requirementId && student.outstandingAmount > 0 ? <button type="button" className="secondary-button" disabled={busy} onClick={() => void recordStudentBookPayment(student)}>Save payment</button> : student.paymentStatus === 'Paid' ? 'Cleared' : '—'}</td>
            </tr>)}
            {filteredClearanceStudents.length === 0 && <tr><td colSpan={12}>No students match these filters.</td></tr>}</tbody>
          </table>
        </div>
      </section>}
      {error && <div className="error" role="alert">{error}</div>}
      {Object.keys(loanValidationErrors).length > 0 && <div className="error" role="alert"><strong>Loan fields requiring attention</strong><ul>{Object.entries(loanValidationErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul></div>}

      {activeView === 'cards' && <section className="library-main-card" style={{ marginBottom: 18, padding: 14 }}>
        <div className="library-toolbar"><div><h3>Student library register</h3><small>{members.length} students linked from the central student register</small></div></div>
        <div className="table-wrap" style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table><thead><tr><th>ID</th><th>Student number</th><th>Student name</th><th>Library membership</th></tr></thead>
            <tbody>{members.map((member, index) => <tr key={member.id}><td>{index + 1}</td><td><strong>{member.studentNumber}</strong></td><td>{member.name}</td><td>Registered from Admissions</td></tr>)}
            {members.length === 0 && <tr><td colSpan={4}>No admitted students are available in the Library register.</td></tr>}</tbody>
          </table>
        </div>
      </section>}
      {activeView === 'cards' && selectedCardMember && <section className="library-main-card library-card-preview-section" style={{ marginBottom: 18, padding: 20 }}>
        <article className="library-print-card" aria-label="Library membership card">
          <svg className="library-card-watermark" viewBox="0 0 856 540" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="library-card-wave-pattern" width="220" height="88" patternUnits="userSpaceOnUse">
                <path id="library-card-wave-one" d="M-10 22 Q45 0 100 22 T220 22" fill="none" />
                <path id="library-card-wave-two" d="M-10 66 Q45 44 100 66 T220 66" fill="none" />
                <g className="library-card-watermark-text">
                  <text><textPath href="#library-card-wave-one">{`${institutionShortName}  •  ${institutionShortName}  •  ${institutionShortName}`}</textPath></text>
                  <text><textPath href="#library-card-wave-two">{`${institutionShortName}  •  ${institutionShortName}  •  ${institutionShortName}`}</textPath></text>
                </g>
              </pattern>
            </defs>
            <rect width="856" height="540" fill="url(#library-card-wave-pattern)" />
          </svg>
          <header className="library-print-card-header">
            <img className="library-card-institution-badge" src={institutionLogoUrl} alt="Institution badge" onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />
            <div className="library-card-heading"><strong>{institutionName}</strong><span>LIBRARY MEMBERSHIP CARD</span></div>
            {selectedCardPhotoUrl
              ? <img className="library-card-student-photo" src={selectedCardPhotoUrl} alt={`Photograph of ${selectedCardMember.name}`} />
              : <div className="library-card-student-photo library-card-photo-placeholder" aria-label="No admission photograph available">PHOTO</div>}
          </header>
          <div className="library-card-student-details">
            <strong>{selectedCardMember.name}</strong>
            <span>Student Number: {selectedCardMember.studentNumber}</span>
            <small>Student Library Member</small>
            <span className="library-card-membership-status">{selectedCardIsPaid ? 'ACTIVE' : 'NOT CLEARED'}</span>
          </div>
          <div className="library-card-dates" aria-label="Library membership dates">
            <span><b>ISSUED:</b> {formatCardDate(cardIssueDate)}</span>
            <span><b>EXPIRES:</b> {formatCardDate(cardExpiryDate)}</span>
          </div>
          <div className="library-card-signature">
            <span>LIBRARIAN</span><span className="library-card-signature-line" aria-hidden="true" />
          </div>
          <div
            className="library-card-colour-strip"
            aria-hidden="true"
            style={{ background: `linear-gradient(90deg, ${institutionPrimaryColor} 0%, ${institutionPrimaryColor} 58%, ${institutionAccentColor} 58%, ${institutionAccentColor} 100%)` }}
          />
        </article>
        <div className="library-card-payment-check" role="status">
          {selectedCardClearance
            ? selectedCardIsPaid
              ? `Course-book fee cleared in full: ${selectedCardClearance.currency} ${selectedCardClearance.requiredAmount.toLocaleString(SYSTEM_LOCALE)}.`
              : `Printing disabled. Required: ${selectedCardClearance.currency} ${selectedCardClearance.requiredAmount.toLocaleString(SYSTEM_LOCALE)}; paid: ${selectedCardClearance.paidAmount.toLocaleString(SYSTEM_LOCALE)}; outstanding: ${selectedCardClearance.outstandingAmount.toLocaleString(SYSTEM_LOCALE)}.`
            : 'Printing disabled until the student's full library course-book requirement is paid.'}
        </div>
        <div className="library-card-preview-actions">
          <button type="button" className="library-primary" disabled={!selectedCardIsPaid} onClick={printLibraryCard}>Print Library Card</button>
          <button type="button" className="secondary-button" onClick={() => setSelectedCardMember(null)}>Close Preview</button>
        </div>
      </section>}
      {activeView === 'issue' && (
        <div className="library-summary" aria-label="Issue and returns summary">
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
              <strong>{loans.length.toLocaleString()}</strong>
              <em>Currently on loan</em>
            </div>
          </div>
        </div>
      )}
      {activeView === 'overdue' && (
        <div className="library-summary" aria-label="Overdue loans summary">
          <div className="library-stat">
            <span className="library-icon overdue">!</span>
            <div>
              <small>Overdue Loans</small>
              <strong className={overdue.length ? 'danger-number' : ''}>{overdue.length.toLocaleString()}</strong>
              <em>Require attention</em>
            </div>
          </div>
        </div>
      )}
      {(activeView === 'issue' || activeView === 'overdue') && <div className="library-grid">
        <div className="library-main-card">
          <div className="library-toolbar">
            <div>
              <h3>{activeView === 'overdue' ? 'Overdue Book Loans' : 'Active Book Loans'}</h3>
            </div>
            <div className="library-search">
              <input
                placeholder={activeView === 'overdue' ? 'Search overdue loans' : 'Search title, author or ISBN'}
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
              {activeView === 'overdue'
                ? 'No overdue loans. The library is up to date.'
                : 'No active loans yet.'}
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Status</th>
                    {canManage && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleLoans.map((loan, index) => {
                    const isOverdue = new Date(loan.dueAtUtc) < new Date();
                    return (
                      <tr key={loan.id}>
                        <td>{index + 1}</td>
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
                          <span className={isOverdue ? 'loan-status overdue' : 'loan-status'}>
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
          <h3>{activeView === 'overdue' ? 'Overdue Follow-up' : 'Quick Actions'}</h3>
          {activeView === 'issue' && canManage && (
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
          {activeView === 'overdue' && canManage && (
            <button className="quick-return" onClick={() => setActiveView('issue')}>
              ↩ Open Issue & Returns
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
        <div className="library-summary library-books-summary" aria-label="Books catalogue summary">
          <div className="library-stat">
            <span className="library-icon">▣</span>
            <div>
              <small>Total Books</small>
              <strong>{totalCopies.toLocaleString()}</strong>
              <em>{books.length} titles</em>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>ISBN</th>
                <th>Title</th>
                <th>Author</th>
                <th>Publisher</th>
                <th>Availability</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, index) => (
                <tr key={book.id}>
                  <td>{index + 1}</td>
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
      {activeView === 'cards' && <section className="library-main-card" style={{ padding: 16 }}>
        <div className="library-toolbar">
          <div><h3>Library Card Register</h3><small>{members.length} students in the central register. Printing is enabled only after the full course-book fee is paid.</small></div>
          <button type="button" className="secondary-button" onClick={() => {
            setClearanceStudents([]);
            listPaidLibraryClearanceStudents()
              .then(setClearanceStudents)
              .catch(e => setError(e instanceof Error ? e.message : 'Unable to refresh student library fee balances.'));
          }}>Refresh payment status</button>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>ID</th><th>Student Number</th><th>Student Name</th><th>Required Fee</th><th>Paid</th><th>Balance</th><th>Payment Status</th><th>Card</th></tr></thead>
          <tbody>{members.map((member, index) => {
            const clearance = clearanceStudents.find(student => student.studentId === member.id);
            const isPaid = clearance?.paymentStatus === 'Paid';
            return <tr key={member.id}>
              <td>{index + 1}</td>
              <td><strong>{member.studentNumber}</strong></td>
              <td>{member.name}</td>
              <td>{clearance ? `${clearance.currency} ${clearance.requiredAmount.toLocaleString(SYSTEM_LOCALE)}` : '—'}</td>
              <td>{clearance ? `${clearance.currency} ${clearance.paidAmount.toLocaleString(SYSTEM_LOCALE)}` : '—'}</td>
              <td>{clearance ? `${clearance.currency} ${clearance.outstandingAmount.toLocaleString(SYSTEM_LOCALE)}` : '—'}</td>
              <td><span className={isPaid ? 'loan-status' : 'loan-status overdue'}>{clearance?.paymentStatus ?? 'Not configured'}</span></td>
              <td><button type="button" className="secondary-button" onClick={() => setSelectedCardMember(member)}>View Card</button></td>
            </tr>;
          })}
          {members.length === 0 && <tr><td colSpan={8}>No students are available in the library register.</td></tr>}
          </tbody>
        </table></div>
      </section>}
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
