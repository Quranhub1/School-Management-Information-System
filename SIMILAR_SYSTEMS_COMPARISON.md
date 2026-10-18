# Comparative Analysis: OSRS vs Similar Systems

Based on research of publicly available information (GitHub, official documentation, user manuals), this document compares the UHPAB OSRS with similar systems in the education/health training space.

---

## Systems Analyzed

| System | Type | Tech Stack | Status | Key Focus |
|--------|------|------------|--------|-----------|
| **UHPAB OSRS** (audited) | Production | Laravel + Orchid + Livewire + Turbo | Production (HTTP) | Uganda health trainee registration |
| **LAVSMS** (4jean/lav_sms) | Open Source | Laravel 8 + Blade | Active (1k★) | General school management |
| **KoAkademy** (yukazakiri/koakademy) | Open Source | Laravel 12 + Inertia + React + TS + Filament | Beta (6★) | Modern academic management |
| **Academico** (academico-sis/academico) | Open Source | Laravel + Filament | Active (374★) | Small/medium institutions |
| **CloudSchool** (hrshadhin/school-management-system) | Open Source | Laravel 7+ | Active (1.1k★) | Comprehensive school ERP |
| **gestSchool** (arseniomuanda/gestSchool) | Source-Available | Laravel 13 + Alpine + Tailwind 4 | Active (21★) | Lusophone schools (Angola) |
| **EMIS Uganda** (emis.go.ug) | Government | Unknown (web portal) | Production (HTTPS) | National education MIS |
| **iHRIS Qualify** (iHRIS) | Open Source | PHP (legacy) | Legacy | Health worker lifecycle |
| **OpenEduCat** (Odoo-based) | Commercial/OSS | Odoo (Python) | Commercial | Education ERP |
| **ACADEMICA ERP** (IUIU) | Proprietary | Custom (PHP) | Production | University management |

---

## Feature Comparison Matrix

| Feature | OSRS | LAVSMS | KoAkademy | Academico | CloudSchool | EMIS Uganda |
|---------|------|--------|-----------|-----------|-------------|-------------|
| **Student Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Staff/Teacher Management** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **HTIN/Registration Tracking** | ✅ (Core) | ❌ | ❌ | ❌ | ❌ | ✅ (EMIS#) |
| **Exam Registration** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Continuous Assessment** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Finance/Transactions** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Accounting Periods** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Support Tickets** | ✅ (Restricted) | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Notifications** | ✅ (Polling) | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Role-Based Access** | ✅ (Inferred) | ✅ (7 roles) | ✅ | ✅ | ✅ | ✅ |
| **Multi-Institution** | ✅ (Single ctx) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Bulk Import/Export** | ✅ (TableExport) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Charts/Analytics** | ✅ (Highcharts) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Mobile Responsive** | ✅ | ✅ | ✅ (PWA) | ✅ | ✅ | ✅ |
| **HTTPS** | ❌ (HTTP only) | Depends | ✅ | Depends | ✅ | ✅ |
| **API Layer** | ❌ | ❌ | ✅ (Inertia) | ❌ | ❌ | ❌ |
| **Real-time** | Polling (60s) | ❌ | ✅ (Inertia) | ❌ | ❌ | ❌ |
| **Open Source** | ❌ | ✅ MIT | ✅ AGPL | ✅ MIT | ✅ AGPL | ❌ Govt |

---

## Architecture Comparison

### OSRS (Audited)
```
┌─────────────────────────────────────────────┐
│ Apache 2.4.52 (Ubuntu) → HTTP only          │
├─────────────────────────────────────────────┤
│ Laravel 9/10 + Orchid Platform              │
├─────────────────────────────────────────────┤
│ Blade Templates + Livewire + Turbo          │
├─────────────────────────────────────────────┤
│ MySQL/MariaDB (inferred)                    │
├─────────────────────────────────────────────┤
│ jQuery + Highcharts + TableExport + Pivottable│
└─────────────────────────────────────────────┘
```

### KoAkademy (Modern Open Source)
```
┌─────────────────────────────────────────────┐
│ nginx + PHP-FPM (Docker) → HTTPS            │
├─────────────────────────────────────────────┤
│ Laravel 13 + Filament 5 + Octane            │
├─────────────────────────────────────────────┤
│ Inertia v3 + React 19 + TypeScript + Vite 8 │
├─────────────────────────────────────────────┤
│ PostgreSQL + Redis                          │
├─────────────────────────────────────────────┤
│ Gotenberg (PDF) + S3 Storage                │
└─────────────────────────────────────────────┘
```

### CloudSchool (Mature Open Source)
```
┌─────────────────────────────────────────────┐
│ Apache/Nginx → HTTPS                        │
├─────────────────────────────────────────────┤
│ Laravel 7+ + Blade                          │
├─────────────────────────────────────────────┤
│ MySQL/MariaDB                               │
├─────────────────────────────────────────────┤
│ jQuery + webpack                            │
└─────────────────────────────────────────────┘
```

---

## Key Differentiators

### OSRS Unique Strengths
1. **HTIN-Centric Design** - Purpose-built for Uganda Health Trainee Identification Number workflow
2. **Orchid Platform** - Mature admin panel with built-in CRUD, filters, permissions
3. **Livewire + Turbo Hybrid** - Server-rendered with SPA-like feel
4. **Health-Specific Workflows** - HTIN applications, exam registration, continuous assessment
5. **Regulatory Integration** - Aligned with UHPAB/TVET Act requirements

### OSRS Critical Gaps vs Modern Systems
| Gap | OSRS | Modern Standard (KoAkademy, Academico) |
|-----|------|----------------------------------------|
| **Protocol** | HTTP only | HTTPS enforced |
| **API Layer** | None | Inertia.js / REST / GraphQL |
| **Real-time** | 60s polling | WebSockets / SignalR / Inertia |
| **Database** | MySQL (inferred) | PostgreSQL (preferred) |
| **Auth** | Session only | JWT + MFA + Passkeys |
| **Multi-tenancy** | Single institution context | RLS / Schema-based |
| **Frontend** | jQuery + Livewire | React/TypeScript/Vite |
| **Testing** | Not observed | Pest/PHPUnit + Playwright |
| **CI/CD** | Not observed | GitHub Actions / Docker |
| **Observability** | Not observed | Telescope / Sentry / Logs |

### EMIS Uganda (Government System) - Notable Differences
- **HTTPS enforced** (https://emis.go.ug/)
- **National scale** - All diploma institutions
- **Learner Identification Number (LIN)** - Equivalent to HTIN
- **Excel bulk upload** - Explicitly supported
- **GPS location tracking** - Institutional mapping
- **Hierarchical approval** - CEO/DEO/MEO workflow
- **Offline-capable** - Excel workbook upload for low connectivity

---

## Health-Specific Systems Comparison

| System | Scope | HTIN/LIN Equivalent | Regulatory Body |
|--------|-------|---------------------|-----------------|
| **UHPAB OSRS** | Health trainees (Uganda) | HTIN | UHPAB (TVET Act 2025) |
| **iHRIS Qualify** | Health workers (multi-country) | License/Registration | Health Professional Councils |
| **EMIS Uganda** | All education (incl. health) | LIN | MoES |
| **UNMEB/UAHEB** | Nursing/Allied Health exams | Registration # | Respective boards |
| **iHRIS Train** | Pre-service training | Student ID | Health Professional Councils |

### iHRIS Qualify (Legacy Reference)
- **Purpose**: Track health workers from pre-service through licensure
- **Features**: Deployment tracking, license issuance, private practice, out-migration
- **Status**: Legacy PHP system, being modernized
- **Relevance**: Conceptual predecessor to HTIN tracking

---

## Open Source Alternatives for SMIS Consideration

### 1. KoAkademy (Best Modern Match)
```yaml
Pros:
  - Laravel 12 + React 19 + TypeScript + Filament 5
  - PostgreSQL + Redis (modern stack)
  - Inertia.js for SPA experience
  - PWA support, Docker deployment
  - AGPL (protects institutional data ownership)
  - Modern CI/CD, testing (Pest), code quality (Pint)
  - Enrollment blueprints (versioned, rollbackable)
  
Cons:
  - Beta software (pre-v2)
  - AGPL may require legal review
  - Philippine-centric design (adaptable)
  - Smaller community
```

### 2. Academico (Mature Filament-based)
```yaml
Pros:
  - Laravel + Filament 3 (mature admin panel)
  - PostgreSQL support
  - Docker + FrankenPHP
  - MIT license
  - Active development (2026 rewrite)
  - Small/medium institution focus
  
Cons:
  - Still WIP (2026 version)
  - Filament license for pro features
  - Less health-specific
```

### 3. CloudSchool (Most Feature-Complete)
```yaml
Pros:
  - 1000+ stars, mature (2016+)
  - 40+ reports in EE
  - Comprehensive modules (hostel, library, transport, payroll)
  - AGPL (data ownership)
  - Multi-institution
  
Cons:
  - Laravel 7 (older)
  - Blade-only (no modern frontend)
  - AGPL compliance required
  - Community vs Enterprise split
```

### 4. gestSchool (Lusophone, Modern)
```yaml
Pros:
  - Laravel 13 + Tailwind 4 + Alpine.js
  - 7 pre-configured roles
  - Source-available license (free for public/non-profit)
  - Active development (2026)
  - AI integration (Laravel AI SDK)
  
Cons:
  - Portuguese-focused
  - Non-OSI license (restrictions)
  - SQLite default (MySQL/PostgreSQL supported)
```

---

## Recommendations for SMIS Based on Comparative Analysis

### 1. Adopt Modern Stack (KoAkademy-inspired)
```
Backend:    Laravel 12 + Filament 5 + Octane (FrankenPHP)
Frontend:   Inertia v3 + React 19 + TypeScript + Vite 8
Database:   PostgreSQL 16 + Redis 7
Auth:       JWT + MFA + Passkeys (Laravel Sanctum)
Real-time:  Laravel Reverb (WebSockets) or Pusher
Storage:    S3-compatible (MinIO/AWS/Azure)
PDF:        Gotenberg
Search:     Laravel Scout + Meilisearch/Typesense
```

### 2. Key Features to Adopt from Each System

| From | Feature | SMIS Application |
|------|---------|------------------|
| **OSRS** | HTIN workflow, Orchid table patterns, continuous assessment | Health trainee registration, exam mgmt |
| **KoAkademy** | Enrollment blueprints, Inertia+React, PWA, versioned workflows | Modern UX, offline-capable, audit trail |
| **Academico** | Filament admin, PostgreSQL, Docker/FrankenPHP | Admin velocity, modern deployment |
| **CloudSchool** | 40+ reports, multi-institution, payroll, hostel | Comprehensive reporting, scaling |
| **EMIS Uganda** | LIN generation, Excel bulk upload, GPS, hierarchical approval | National integration, offline support |
| **gestSchool** | AI integration (Laravel AI), 7-role RBAC, Tailwind 4 | Smart features, modern UI |
| **iHRIS** | Health worker lifecycle, deployment tracking | Health workforce continuum |

### 3. Critical Security Improvements (All Modern Systems)
- ✅ HTTPS enforced (all modern systems)
- ✅ JWT + MFA (KoAkademy, gestSchool)
- ✅ PostgreSQL RLS for multi-tenancy (KoAkademy, Academico)
- ✅ CSP headers, secure cookies (all)
- ✅ Audit logging (KoAkademy, gestSchool)
- ✅ Rate limiting (all)

### 4. Health-Specific Additions for SMIS
- **HTIN/LIN Lifecycle** - From application through licensure (iHRIS pattern)
- **Clinical Rotation Tracking** - EMIS + iHRIS pattern
- **Competency-Based Assessment** - OSRS continuous assessment + KoAkademy blueprints
- **Regulatory Reporting** - EMIS Uganda export formats
- **Clinical Site Management** - iHRIS Train + OSRS schedules
- **Supervisor/Preceptor Tracking** - iHRIS + CloudSchool staff mgmt

---

## Licensing Considerations for SMIS

| License | Systems | Implication for SMIS |
|---------|---------|---------------------|
| **MIT** | LAVSMS, Academico, OpenVidra | Permissive - can use freely, even commercially |
| **AGPL** | KoAkademy, CloudSchool | Must open-source modifications if network-deployed |
| **Source-Available** | gestSchool | Free for public/non-profit; commercial prohibited |
| **Proprietary** | OSRS, EMIS, ACADEMICA | Cannot use code; only patterns |

**Recommendation**: Use MIT/BSD-licensed components (Filament, Laravel packages) for core; avoid AGPL unless SMIS will be open-sourced.

---

## Conclusion

The UHPAB OSRS is a **specialized, production system** with deep domain logic for Uganda's health trainee registration, built on a **mature but aging Laravel+Orchid stack** with critical security gaps (HTTP, no API, polling).

Modern open-source alternatives (especially **KoAkademy** and **Academico**) demonstrate the **direction the industry is moving**: React/TypeScript frontends, PostgreSQL, real-time capabilities, containerized deployment, and strong security defaults.

For SMIS, the optimal path is:
1. **Adopt the modern stack** (Laravel 12 + React/TS + Filament/Inertia)
2. **Port OSRS's domain logic** (HTIN workflows, continuous assessment)
3. **Add health-specific features** from iHRIS/EMIS patterns
4. **Enforce modern security** (HTTPS, JWT, MFA, RLS, audit logs)
5. **Design for multi-tenancy and national integration** from day one

The OSRS audit provides invaluable domain knowledge; the modern open-source systems provide the architectural blueprint.
