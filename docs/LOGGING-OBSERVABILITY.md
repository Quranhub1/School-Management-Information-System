# SMIS logging and observability

## Architecture

SMIS uses a logging implementation that matches each runtime instead of forcing one Node.js library across the stack:

- **ASP.NET Core API:** Serilog with console output and daily rolling local files.
- **React browser application:** a small TypeScript logger for structured console entries and global JavaScript error capture.
- **Request tracing:** X-Correlation-ID is accepted only when it contains 1–64 safe ASCII characters. Otherwise the API generates an identifier. The API returns the identifier in the response header and enriches request logs with it.
- **Desktop shell:** Tauri/Rust logging remains a separate runtime concern; this change does not introduce a Node.js runtime into the desktop client.

Winston is intentionally not installed. Winston is designed for Node.js processes, while the deployed application runtime is .NET 8 plus a browser-based React client. Serilog is the appropriate backend logger; the frontend logger has no Node.js dependency.

## Backend logs

The API writes structured events to:

- Console (systemd, container and development terminal capture).
- Daily rolling files named smis-YYYYMMDD.log under the local application data directory:
  - Windows: %LOCALAPPDATA%\SMIS\logs
  - Linux: the account's local application data directory (normally under ~/.local/share/SMIS/logs).
- Set SMIS_LOG_DIRECTORY to override the file directory for a service deployment.

Defaults are 14 retained rolling files and a 10 MiB size limit per file. Both can be changed in appsettings.json using Logging:FileRetentionDays and Logging:FileSizeLimitBytes.

The API request log records method, path, status code, elapsed time, host, scheme and correlation ID. Microsoft ASP.NET Core and EF Core SQL command logs are raised to Warning by default to avoid noisy or sensitive SQL logging. Development application logs use Debug; non-development logs use Information.

## Browser diagnostics

frontend/src/lib/logging.ts provides structured debug, info, warn and error console logging. main.tsx installs handlers for uncaught browser errors and unhandled promise rejections.

When an authenticated session exists, the browser sends a bounded diagnostic to POST /api/diagnostics/client-errors. The endpoint:

- Requires normal SMIS authentication.
- Is rate-limited to 20 reports per source IP per five minutes.
- Rejects oversized messages, stacks and source labels.
- Redacts common bearer-token and secret assignments before logging.
- Does not accept form values, request bodies, access tokens or user profile data.
- Returns 202 Accepted; diagnostic delivery is best-effort and never blocks the UI.

The modern API helper also sends X-Correlation-ID on its requests. Other API modules should adopt the same shared correlation helper as they are consolidated; do not assume every legacy fetch path currently sends a client-generated ID. The backend still assigns an ID to every request.

## Operational use

1. Search the API log for the correlation ID returned in the X-Correlation-ID response header.
2. Match browser diagnostic entries by ClientCorrelationId and API request entries by CorrelationId.
3. Inspect status and elapsed time before escalating a request failure.
4. Keep log directories access-controlled and include them in the institution's operational retention/backup policy only where required.
5. Never add passwords, JWTs, full payment details, student medical information or raw request bodies to log statements.

## Verification

The API test suite includes middleware tests for accepting safe IDs, replacing unsafe IDs and generating IDs when none is supplied. CI must verify the API build, frontend TypeScript build and backend tests before this change is merged.

## Scope and limitations

This is application diagnostics, not a full SIEM or audit-ledger replacement. Existing domain audit records remain the source of truth for business actions. Serilog request logs are operational telemetry and must not be treated as financial or regulatory audit evidence.
