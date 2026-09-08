# SMIS Final Completion Checklist

This document is the final release gate for the School Management Information System.

## Repository
- [x] Backend solution is committed.
- [x] Frontend is committed.
- [x] Desktop client is committed.
- [x] Database and infrastructure directories are present.
- [x] CI workflows are committed.
- [x] Project documentation and progress tracking are committed.

## Release gates
- [ ] Current `main` backend CI is green.
- [ ] Current `main` frontend CI is green.
- [ ] Current `main` desktop CI is green.
- [ ] Current `main` full-system CI is green.
- [ ] EF Core migrations apply cleanly to a fresh database.
- [ ] Authentication and authorization are verified end-to-end.
- [ ] Administrative access is verified end-to-end.
- [ ] CRUD workflows are verified for each production module.
- [ ] Production API and database connectivity are verified.
- [ ] Desktop client is verified against the intended API.
- [ ] Application icon is present at every required client/resource location as `icon.png`.
- [ ] Final deployment smoke test passes.

## Definition of done
The system should only be declared **complete** after every release gate above is verified on the current `main` commit. Repository presence alone is not treated as proof that a runtime workflow works.
