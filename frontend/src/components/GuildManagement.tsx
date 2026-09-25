import { useState } from 'react'

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

export function GuildManagement() {
  const [selected, setSelected] = useState(0)
  const portfolio = portfolios[selected]

  return (
    <section className="panel" aria-label="Guild management">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Student Governance</p>
          <h2>Guild Cabinet & Council</h2>
          <p>Manage the student representative structure, portfolios, resolutions and institutional communication from one workspace.</p>
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="panel" style={{ padding: 12 }}>
          <div className="library-workspace-tabs" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            {portfolios.map((item, index) => (
              <button key={item.title} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)} style={{ textAlign: 'left' }}>
                <strong>{item.title}</strong>
                <span style={{ display: 'block', fontSize: 12, marginTop: 3, opacity: .75 }}>{item.role}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="panel">
          <p className="eyebrow">{portfolio.role}</p>
          <h3>{portfolio.title}</h3>
          <div className="feature-grid">
            {portfolio.responsibilities.map(item => <div className="feature-card" key={item}><strong>{item}</strong><span>Govern this portfolio through recorded actions, notices and appropriate institutional escalation.</span></div>)}
          </div>
          <div className="info-banner" style={{ marginTop: 18 }}>
            Guild records remain part of student governance and do not create separate staff-style operational roles for cooks, askaris or watchmen.
          </div>
        </article>
      </div>
    </section>
  )
}
