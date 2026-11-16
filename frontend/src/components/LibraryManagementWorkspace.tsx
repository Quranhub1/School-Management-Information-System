import { LibraryManagement } from './LibraryManagement';
import './LibraryManagementWorkspace.css';

export function LibraryManagementWorkspace({ canManage }: { canManage?: boolean }) {
  return (
    <section className="library-workspace-shell" aria-labelledby="library-management-workspace-title">
      <div id="library-management-workspace-title">
        <LibraryManagement canManage={canManage} />
      </div>
    </section>
  );
}
