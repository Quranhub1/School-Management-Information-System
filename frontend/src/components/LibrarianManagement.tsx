import { useEffect, useState } from 'react';
import { addLibrarian, listLibrarians, updateLibrarian, type Librarian } from '../api/librarians';
import { listStaff, type StaffMember } from '../api/staff';

export function LibrarianManagement() {
  const [librarians, setLibrarians] = useState<Librarian[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffMemberId, setStaffMemberId] = useState('');
  const [libraryRole, setLibraryRole] = useState('Librarian');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const [current, availableStaff] = await Promise.all([listLibrarians(), listStaff(true)]);
      setLibrarians(current);
      setStaff(availableStaff.filter(person => !current.some(librarian => librarian.staffMemberId === person.id)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load librarian records.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!staffMemberId || !libraryRole.trim()) return;
    try {
      await addLibrarian(staffMemberId, libraryRole);
      setStaffMemberId('');
      setMessage('Librarian added successfully.');
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to add librarian.'); }
  }

  async function toggle(librarian: Librarian) {
    try {
      await updateLibrarian(librarian.id, librarian.libraryRole, !librarian.isActive);
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update librarian.'); }
  }

  return <section aria-labelledby="librarian-management-title">
    <div className="library-toolbar"><div><span className="eyebrow">LIBRARY STAFF</span><h3 id="librarian-management-title">Librarian Management</h3><p>Assign staff to library operations and control their library status.</p></div></div>
    <form onSubmit={add} className="library-form">
      <label>Staff member<select value={staffMemberId} onChange={event => setStaffMemberId(event.target.value)}><option value="">Select staff member</option>{staff.map(person => <option key={person.id} value={person.id}>{person.staffNumber} — {person.firstName} {person.lastName}</option>)}</select></label>
      <label>Library role<input value={libraryRole} onChange={event => setLibraryRole(event.target.value)} placeholder="Librarian" /></label>
      <button type="submit" disabled={!staffMemberId}>Assign librarian</button>
    </form>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading librarians…</p> : <div className="table-wrap"><table><thead><tr><th>Staff</th><th>Contact</th><th>Library role</th><th>Status</th><th>Action</th></tr></thead><tbody>{librarians.map(librarian => <tr key={librarian.id}><td>{librarian.staffNumber} — {librarian.firstName} {librarian.lastName}</td><td>{librarian.email || librarian.phoneNumber || '—'}</td><td>{librarian.libraryRole}</td><td>{librarian.isActive ? 'Active' : 'Inactive'}</td><td><button className="secondary-button" onClick={() => void toggle(librarian)}>{librarian.isActive ? 'Deactivate' : 'Activate'}</button></td></tr>)}</tbody></table></div>}
  </section>;
}
