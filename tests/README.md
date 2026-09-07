# Tests

This directory contains test projects for the SMIS solution.

## Structure

- `backend/tests/SchoolManagement.Domain.Tests/` — Unit tests for domain logic (grading, GPA, transcripts)
- `backend/tests/SchoolManagement.Application.Tests/` — Tests for application services and workflows
- `backend/tests/SchoolManagement.Infrastructure.Tests/` — Repository and persistence tests
- `backend/tests/SchoolManagement.Api.Tests/` — API controller and integration tests
- `frontend/src/**/*.test.ts` — Frontend unit and component tests (Vitest)

## Running Tests

### Backend
```bash
cd backend
dotnet test SchoolManagement.sln
```

### Frontend
```bash
cd frontend
npm test
```
