# Modern Offline Information System

The SMIS is being evolved into an offline-first institutional information platform. Existing operational modules remain authoritative; the modern layer connects them through a command centre rather than duplicating transactional data.

## Integrated capabilities

- AI-assisted administration with a local, deterministic assistant endpoint that works without cloud services.
- Executive KPIs and Apache Superset business intelligence on the local network.
- Student 360° view combining identity, attendance, assessments, finance, clinical placements, certificates and admission-document counts.
- Admission document capture: after an application is filled, a signed/scanned form can be attached to the applicant and stored on the local server under the admission record.
- Academic/learning management through the existing academic, curriculum, assessment and progression modules.
- Timetable management through the existing timetable module, with a foundation for conflict-aware optimization.
- Attendance automation through the existing attendance model and predictive calculations.
- Finance/fees through the existing invoice, payment and accounting modules.
- Staff teaching/workload through the existing staff and teaching allocation models.
- Examination analytics through the existing examination/result and assessment data.
- Clinical/practical placement tracking through placement and student-placement records.
- Identity, authorization and audit through the existing JWT/RBAC/audit infrastructure.
- Digital certificates through the existing certificate module and local verification workflow.
- Workflow automation through admissions, assessment, finance, attendance and progression workflow services plus the command-centre action queue.
- Predictive analytics using local attendance, assessment and financial signals to produce explainable risk levels.
- Document management foundation using local server-side admission document storage; it is intentionally not a cloud dependency.
- Global search through the existing search module plus the modern cross-module endpoint.
- Offline-first PWA infrastructure already present in the frontend, with the modern layer using only local `/api` routes.

## Offline boundary

Normal operation must not depend on OpenAI, Gemini, Firebase, WhatsApp, cloud storage, external identity providers or Internet connectivity. Apache Superset is self-hosted and is an optional local analytics service.

## Data flow

`React/PWA -> ASP.NET Core API -> PostgreSQL -> existing operational modules -> local analytics/AI/document services`

The modern layer is deliberately read-heavy for analytics and uses existing authorization before exposing institutional data.
