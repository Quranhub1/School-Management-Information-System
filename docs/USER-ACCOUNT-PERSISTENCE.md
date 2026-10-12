# User account persistence troubleshooting

## Expected persistence path

The User Management form calls `POST /api/administration/users`. The backend hashes the password, adds the `User` and `UserRole` rows through Entity Framework Core, and calls `SaveChangesAsync`. The list calls `GET /api/administration/users`, which queries PostgreSQL. React component state is not the storage layer.

## What this patch improves

- Re-fetches users when the browser window regains focus or becomes visible.
- After creating an account, re-queries the API instead of assuming the optimistic response proves persistence.
- Shows a specific diagnostic if the create endpoint returns the account but the list endpoint does not: check whether frontend API routing and the backend connection string point to the same API/database instance.

## If accounts still disappear after signing out and back in

The current repository code contains no normal user-list clearing path. If a newly created account disappears after a fresh login, capture the following in the same running environment:

1. Browser DevTools → Network: inspect the `POST /api/administration/users` response and then `GET /api/administration/users` after reload/sign-in. Compare the request host and response account IDs.
2. Check that the API uses the same `ConnectionStrings__SchoolManagement` on each run. A different environment, PostgreSQL database, container, or API instance can make the account appear to vanish.
3. For Docker Compose, retain the named `pgdata` volume. Do not remove volumes when restarting or redeploying.
4. Check API logs for database connection failures and verify the account row exists in the actual `school_management` database.

Never solve this by storing accounts in browser localStorage: authentication credentials and role assignments must remain server-side and shared across devices.
