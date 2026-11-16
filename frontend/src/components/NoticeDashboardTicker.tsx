import { useEffect, useState } from 'react';
import { BellRing, ChevronRight } from 'lucide-react';
import { listNotices, type Notice } from '../api/notices';
import './NoticeDashboardTicker.css';

export function NoticeDashboardTicker({ onOpen }: { onOpen: () => void }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        const result = await listNotices();
        if (mounted) {
          setNotices(result.filter(notice => !notice.expiresAt || new Date(notice.expiresAt).getTime() > Date.now()));
          setActiveIndex(0);
        }
      } catch {
        // The dashboard stays usable if the notice service is temporarily unavailable.
      }
    };
    void refresh();
    const refreshId = window.setInterval(() => { void refresh(); }, 60_000);
    return () => { mounted = false; window.clearInterval(refreshId); };
  }, []);

  useEffect(() => {
    if (notices.length < 2) return;
    const rotateId = window.setInterval(() => setActiveIndex(index => (index + 1) % notices.length), 5_000);
    return () => window.clearInterval(rotateId);
  }, [notices.length]);

  if (!notices.length) return null;
  const notice = notices[activeIndex % notices.length];

  return (
    <aside className="smis-notice-dashboard-ticker" aria-label="Important internal notices">
      <button type="button" className="smis-notice-ticker-button" onClick={onOpen}>
        <span className="smis-notice-ticker-indicator"><BellRing size={17} aria-hidden="true" /></span>
        <span className="smis-notice-ticker-copy">
          <strong>NOTICE BOARD</strong>
          <span>{notice.title}</span>
        </span>
        <span className="smis-notice-ticker-count">{notices.length}</span>
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}
