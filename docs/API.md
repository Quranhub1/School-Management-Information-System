# API Architecture

## API style

The backend exposes a versioned REST API consumed by the React frontend and other explicitly authorized clients.

## Base path

The initial API convention is:

`/api/v1`

## API principles

- Resource-oriented endpoints.
- Consistent HTTP status codes.
- Request and response validation.
- Authentication and authorization on protected endpoints.
- Pagination for potentially large collections.
- Structured error responses.
- Correlation/request identifiers for troubleshooting.
- OpenAPI documentation in development and controlled environments.

## Initial endpoint domains

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/students`
- `/api/v1/staff`
- `/api/v1/admissions`
- `/api/v1/academics`
- `/api/v1/attendance`
- `/api/v1/examinations`
- `/api/v1/finance`
- `/api/v1/library`
- `/api/v1/transport`
- `/api/v1/notifications`
- `/api/v1/reports`

Endpoint contracts will be expanded as each domain is implemented and tested.
