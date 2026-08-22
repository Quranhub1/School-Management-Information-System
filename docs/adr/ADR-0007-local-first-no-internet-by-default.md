# ADR-0007: Local-first and no Internet dependency by default

## Status

Accepted

## Context

The SMIS is intended to run on the school's own server and local network. Core institutional operations must remain usable when Internet connectivity is unavailable. Student/guardian Internet portals are not part of the current scope.

The project may later require explicitly approved external integrations, such as connections to separately hosted library systems. Those integrations must not become dependencies of the core SMIS.

## Decision

1. The core SMIS is local-first and on-premises.
2. Normal internal workflows must not require Internet access or third-party cloud services.
3. Student and guardian Internet self-service portals are excluded from the current scope.
4. Academic results, transcripts, reports, attendance, admissions, finance, library administration and other core operations must work against the local application/database stack.
5. External integrations are opt-in and must be explicitly requested and isolated from core workflows.
6. Optional external integrations must fail gracefully without taking down or blocking unrelated local functionality.

## Consequences

- Deployment and backup designs must support an on-premises server.
- Features must avoid hidden cloud/API dependencies.
- External URLs/endpoints must be configuration data only where an integration has been explicitly approved.
- CI should test the core application without requiring Internet-connected runtime services.
- Future requirements that introduce an Internet dependency must be recorded as a separate architecture decision.
