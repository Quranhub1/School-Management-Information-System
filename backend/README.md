# Backend

ASP.NET Core backend for the School Management Information System.

## Architecture

The backend will follow a layered architecture:

- `Api` — HTTP endpoints, middleware, authentication and API composition.
- `Application` — use cases, DTOs, validation and application services.
- `Domain` — entities, value objects, domain rules and abstractions.
- `Infrastructure` — persistence, external services and infrastructure implementations.

The solution is intentionally being established incrementally. Business modules will be introduced only after the backend foundation and automated tests are in place.
