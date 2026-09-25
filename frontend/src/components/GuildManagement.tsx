import { useMemo, useState } from 'react'
import { CalendarDays, FileText, Megaphone, Plus, UsersRound, WalletCards } from 'lucide-react'

type Portfolio = {
  title: string
  role: string
  responsibilities: string[]
}

const portfolios: Portfolio[] = [
  { title: 'Guild Executive', role: 'President & Vice President', responsibilities: ['Student representation and institutional engagement', 'Coordinate cabinet priorities and student concerns', 'Track resolutions and executive actions'] },
  { title: 'Guild Parliament', role: 'Speaker & Deputy Speaker', responsibilities: ['Coordinate council proceedings', 'Record motions, resolutions and sittings', 'Support orderly student governance'] },
  { title: 'General Secretariat', role: 'General Secretary', responsibilities: ['Official guild correspondence', 'Meeting minutes and records', 'Maintain resolutions and notices'] },
  { title: 'Academic Affairs', role: 'Minister of Academic Affairs', responsibilities: ['Academic student concerns', 'Liaison with Academic Management', 'Track academic petitions and resolutions'] },
  { title: 'Finance', role: 'Minister of Finance / Treasurer', responsibilities: ['Guild budget records', 'Approved expenditure tracking', 'Financial accountability and reporting'] },
  { title: 'Health & Clinical Affairs', role: 'Minister of Health & Clinical Affairs', responsibilities: ['Student health concerns', 'Liaison with Health & Clinical services', 'Health awareness activities'] },
  { title: 'Welfare & Catering', role: 'Minister of Welfare & Catering', responsibilities: ['Student welfare matters', 'Catering and welfare concerns', 'Escalation of welfare cases'] },
  { title: 'Sports, Culture & Entertainment', role: 'Minister of Sports, Culture & Entertainment', responsibilities: ['Sports programmes', 'Cultural activities', 'Student events and entertainment coordination'] },
  { title: 'Information & Public Relations', role: 'Minister of Information / PRO', responsibilities: ['Guild announcements', 'Student communications', 'Public information and approved notices'] },
  { title: 'Religious Affairs', role: 'Minister of Religious Affairs', responsibilities: ['Faith-related student activities', 'Interfaith coordination', 'Religious welfare concerns'] },
  { title: 'Guild Patron', role: 'Institutional liaison', responsibilities: ['Provide institutional guidance', 'Support constructive student administration engagement', 'Escalate matters through the appropriate office'] },
]

const activity = [
  ['Resolution', 'Academic calendar concerns submitted for review', 'Today'],
  ['Notice', 'Guild general assembly communication prepared', 'Yesterday'],
  ['Meeting', 'Executive and cabinet sitting recorded', '2 days ago'],
]

export function GuildManagement() {
  const [selected, setSelected] = useState(0)
  const [showPortfolioList, setShowPortfolioList] = useState(true)
  const portfolio = portfolios[selected]
  const executiveCount = useMemo(() => 2, [])

  return (
    <section className="guild-page" aria-label="Guild management">
      <header className="page-header guild-header">
        <div>
          <p className="eyebrow">Student Governance</p>
          <h2>Guild</h2>
          <p>Coordinate student leadership, council business, portfolios, meetings, resolutions and official communication in one structured area.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" type="button"><CalendarDays size={16} /> Record meeting</button>
          <button className="primary-button" type="button"><Plus size={16} /> New record</button>
        </div>
      </header>

      <div className="guild-kpi-grid">
        <div className="guild-kpi"><span><UsersRound size={16} /> Executive</span><strong>{executiveCount}</strong><small>President and Vice President</small></div>
        <div className="guild-kpi"><span><UsersRound size={16} /> Portfolios</span><strong>{portfolios.length}</strong><small>Active governance areas</small></div>
        <div className="guild-kpi"><span><FileText size={16} /> Records</span><strong>12</strong><small>Meetings, resolutions and notices</small></div>
        <div className="guild-kpi"><span><WalletCards size={16} /> Finance</span><strong>UGX</strong><small>Guild budget and accountability</small></div>
      </div>

      <div className="guild-layout">
        <div className="guild-main-column">
          <section className="guild-surface">
            <div className="guild-section-heading">
              <div>
                <p className="eyebrow">Governance structure</p>
                <h3>Guild leadership & portfolios</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => setShowPortfolioList(v => !v)}>
                {showPortfolioList ? 'Hide list' : 'Show list'}
              </button>
            </div>

            {showPortfolioList && (
              <div className="guild-portfolio-grid">
                {portfolios.map((item, index) => (
                  <button key={item.title} type="button" className={`guild-portfolio-card ${selected === index ? 'active' : ''}`} onClick={() => setSelected(index)}>
                    <span className="guild-portfolio-index">{String(index + 1).padStart(2, '0')}</span>
                    <span><strong>{item.title}</strong><small>{item.role}</small></span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="guild-surface guild-detail">
            <div className="guild-section-heading">
              <div>
                <p className="eyebrow">{portfolio.role}</p>
                <h3>{portfolio.title}</h3>
              </div>
              <span className="guild-status">Active portfolio</span>
            </div>
            <div className="guild-responsibility-grid">
              {portfolio.responsibilities.map((item, index) => (
                <div className="guild-responsibility" key={item}>
                  <span>{index + 1}</span>
                  <div><strong>{item}</strong><small>Record actions, follow-ups and institutional escalation against this responsibility.</small></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="guild-side-column">
          <section className="guild-surface">
            <div className="guild-section-heading compact">
              <div><p className="eyebrow">Governance controls</p><h3>Quick actions</h3></div>
            </div>
            <div className="guild-quick-actions">
              <button type="button"><CalendarDays size={17} /><span><strong>Meetings</strong><small>Record sittings and minutes</small></span></button>
              <button type="button"><FileText size={17} /><span><strong>Resolutions</strong><small>Track decisions and follow-up</small></span></button>
              <button type="button"><Megaphone size={17} /><span><strong>Notices</strong><small>Prepare approved student notices</small></span></button>
              <button type="button"><WalletCards size={17} /><span><strong>Budget</strong><small>Maintain guild accountability</small></span></button>
            </div>
          </section>

          <section className="guild-surface">
            <div className="guild-section-heading compact">
              <div><p className="eyebrow">Recent activity</p><h3>Governance record</h3></div>
            </div>
            <div className="guild-activity-list">
              {activity.map(([type, title, time]) => (
                <div className="guild-activity" key={title}>
                  <span>{type}</span><div><strong>{title}</strong><small>{time}</small></div>
                </div>
              ))}
            </div>
          </section>

          <div className="guild-note">
            <strong>Role boundary</strong>
            <span>Guild governance is for elected student leadership and institutional liaison. Operational workers such as cooks, askaris and watchmen remain staff records rather than application governance roles.</span>
          </div>
        </aside>
      </div>
    </section>
  )
}
