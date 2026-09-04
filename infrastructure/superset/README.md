# Apache Superset analytics

This directory adds a self-hosted Apache Superset 6.1.0 analytics layer for SMIS.

Superset is open-source software under the Apache License 2.0. There is no Superset license fee; hosting, storage, compute, domain and TLS infrastructure are separate operational costs.

## Architecture

```text
SMIS browser
   |
   +--> ASP.NET Core API --> school_management PostgreSQL
   |                         |
   |                         +--> analytics.* read-only views
   |
   +--> embedded Superset dashboard
                              |
                              +--> Superset --> analytics.*
```

The Superset database is deliberately separate from the SMIS transactional database. Superset metadata (dashboards, charts, users and connections) lives in its own PostgreSQL container, while the analytics connection uses a dedicated read-only PostgreSQL role against the `analytics` schema.

## 1. Prepare the analytics views

Run `analytics_views.sql` against the existing `school_management` database as the application database owner/admin:

```bash
psql -d school_management -f infrastructure/superset/analytics_views.sql
```

Then create the least-privilege analytics login. Set the password outside the repository:

```bash
export SMIS_ANALYTICS_DB_PASSWORD='choose-a-strong-password'
psql -d school_management \
  --set=analytics_password="$SMIS_ANALYTICS_DB_PASSWORD" \
  -f infrastructure/superset/analytics_permissions.sql
```

The resulting `smis_analytics` role can read only the reporting views in `analytics`; it is not granted access to the transactional tables.

## 2. Start Superset

Copy the environment template:

```bash
cd infrastructure/superset
cp .env.example .env
```

Replace every `replace-with-*` value in `.env` with strong unique secrets/passwords. Then start the stack:

```bash
docker compose up -d --build
```

Check:

```bash
docker compose ps
docker compose logs -f superset
```

Superset listens on `127.0.0.1:8088` by default, so it is not directly exposed to the Internet.

## 3. Connect Superset to SMIS PostgreSQL

Log in to Superset with the administrator account configured in `.env`.

Create a PostgreSQL database connection in Superset using the **read-only** account. On the existing single-host Docker deployment, the database host from inside the container is normally `host.docker.internal`:

```text
postgresql+psycopg2://smis_analytics:<password>@host.docker.internal:5432/school_management
```

Use schema `analytics` and add the views as datasets. Do not give Superset the application's normal `school_management` login.

## 4. Build the first dashboard

Create a dashboard from the analytics datasets. Recommended first dashboard sections:

- Total students and active students
- Students by programme and department
- Enrollment trends
- Attendance status and attendance rate
- Admissions by status
- Payments and outstanding invoices
- Library active/overdue loans

The view names are:

- `analytics.student_overview`
- `analytics.enrollment_fact`
- `analytics.attendance_fact`
- `analytics.payment_fact`
- `analytics.invoice_fact`
- `analytics.admission_fact`
- `analytics.library_loan_fact`

After saving the dashboard, configure it for embedding in Superset and copy its embedded dashboard UUID. The SMIS frontend does not need a direct Superset login; it receives a short-lived guest token from the authenticated SMIS API.

## 5. Configure the SMIS API

Set these environment variables on the API service (systemd/environment configuration, not committed source):

```text
Superset__Enabled=true
Superset__InternalUrl=http://127.0.0.1:8088
Superset__PublicUrl=https://analytics.example.com
Superset__DashboardId=<embedded-dashboard-uuid>
Superset__Username=<superset-service-user>
Superset__Password=<superset-service-user-password>
```

The API endpoint is:

```text
POST /api/analytics/guest-token
```

It requires the existing `ReportingManagement` authorization policy. The browser never receives the Superset service-user password.

## 6. Publish Superset through HTTPS

Use an HTTPS reverse proxy. A sample Nginx server block is provided in `nginx-analytics.conf.example`.

Set `Superset__PublicUrl` to the exact HTTPS URL users will load, for example `https://analytics.example.com`.

In Superset's embedded dashboard configuration, explicitly allow the SMIS frontend origin/domain. Do not make the dashboard publicly accessible just to avoid configuring embedding permissions.

## Security notes

- Keep `SUPERSET_SECRET_KEY` and `GUEST_TOKEN_JWT_SECRET` private and persistent across restarts.
- Keep the Superset service-user password private.
- Keep the analytics PostgreSQL password private.
- Use HTTPS in production.
- Back up the Superset metadata PostgreSQL volume; it contains dashboard definitions and Superset configuration.
- Do not connect Superset to the transactional database using the application's write-capable account.
- The initial guest-token implementation grants access only to the configured dashboard. More granular row-level security can be added later where a dashboard must be restricted by department, programme or user scope.
