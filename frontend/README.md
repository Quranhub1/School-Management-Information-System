# SMIS Frontend

React + TypeScript + Vite frontend for the School Management Information System.

## Development

```bash
npm install
npm run dev
```

The frontend reads `VITE_API_BASE_URL` when the ASP.NET Core API is hosted separately. Leave it empty when both applications are served from the same origin.

## Current slice

The first functional slice exposes the academic-record read API through a student academic-record screen:

- transcript entries
- semester GPA/CGPA summaries
- API error handling
- responsive LAN-first layout
