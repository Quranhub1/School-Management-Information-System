import { ArrowUpRight, Code2, Database, Layers3, Server, ShieldCheck } from 'lucide-react'
import './DeveloperIntroduction.css'

// The image files live at the repository root. Importing them bundles the assets
// into Vite's production output, so the profile also works without internet access.
import joesTechnologiesLogo from '../../../joes tech logo.jpg'
import developerPhotograph from '../../../joes technologies photograph.jpg'

const capabilities = [
  { icon: Code2, title: 'Application development', description: 'Design and implementation of practical software workflows.' },
  { icon: Layers3, title: 'Frontend engineering', description: 'Responsive interfaces built with React and TypeScript.' },
  { icon: Server, title: 'Backend engineering', description: 'Application services and APIs built with .NET.' },
  { icon: Database, title: 'Data management', description: 'Relational data storage and persistence with PostgreSQL.' },
  { icon: ShieldCheck, title: 'Access and security', description: 'Role-aware workflows and controlled access to system functions.' },
]

export function DeveloperIntroduction() {
  return (
    <section className="developer-introduction" aria-labelledby="developer-introduction-title">
      <header className="developer-intro-hero">
        <div className="developer-intro-brand">
          <img src={joesTechnologiesLogo} alt="JOES TECHNOLOGIES official logo" />
        </div>
        <div className="developer-intro-heading">
          <p className="developer-intro-eyebrow">SOFTWARE DEVELOPMENT & TECHNOLOGY</p>
          <h2 id="developer-introduction-title">JOES TECHNOLOGIES</h2>
          <p className="developer-intro-tagline">Building practical digital systems through thoughtful software engineering.</p>
        </div>
      </header>

      <div className="developer-intro-profile">
        <div className="developer-intro-photo-wrap">
          <img src={developerPhotograph} alt="Joes Tech, founder and lead developer" />
        </div>
        <div className="developer-intro-profile-copy">
          <p className="developer-intro-eyebrow">FOUNDER & LEAD DEVELOPER</p>
          <h3>Joes Tech</h3>
          <p>Developer behind the School Management Information System (SMIS), bringing together application design, frontend development, backend services and database engineering in one integrated platform.</p>
          <p className="developer-intro-company">JOES TECHNOLOGIES</p>
        </div>
      </div>

      <section className="developer-intro-project" aria-labelledby="developer-intro-project-title">
        <div>
          <p className="developer-intro-eyebrow">FEATURED PROJECT</p>
          <h3 id="developer-intro-project-title">School Management Information System</h3>
          <p>SMIS is an integrated platform for coordinating institutional administration, student records, academic operations, finance, human resources, attendance, inventory and reporting.</p>
        </div>
        <span className="developer-intro-project-mark">SMIS</span>
      </section>

      <section className="developer-intro-capabilities" aria-labelledby="developer-intro-capabilities-title">
        <div className="developer-intro-section-heading">
          <p className="developer-intro-eyebrow">ENGINEERING AREAS</p>
          <h3 id="developer-intro-capabilities-title">Technology and implementation</h3>
        </div>
        <div className="developer-intro-capability-grid">
          {capabilities.map(({ icon: Icon, title, description }) => (
            <article className="developer-intro-capability" key={title}>
              <span className="developer-intro-capability-icon"><Icon size={19} aria-hidden="true" /></span>
              <div><h4>{title}</h4><p>{description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="developer-intro-footer">
        <span>JOES TECHNOLOGIES</span>
        <span>Software development · Systems engineering</span>
        <a href="https://github.com/Quranhub1/School-Management-Information-System" target="_blank" rel="noreferrer">SMIS repository <ArrowUpRight size={14} aria-hidden="true" /></a>
      </footer>
    </section>
  )
}
