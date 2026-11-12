# PostgreSQL backup permissions

The local SMIS backup service invokes `pg_dump` using the database credentials configured in `ConnectionStrings:SchoolManagement`. The account must be able to read every table and sequence in the `public` schema. A missing table-level grant causes `pg_dump` to fail while acquiring its read locks; for example, the error may identify `public."PaymentAllocations"`.

## Apply the permissions

1. Confirm the actual database username in the SMIS connection string. The supplied script defaults to `school_management`; edit its `backup_role` variable if your configured username differs.
2. Open pgAdmin Query Tool connected to the `school_management` database as a PostgreSQL administrator, or run the script with `psql` using an administrator account:

   ```powershell
   psql -h localhost -p 5432 -U postgres -d school_management -f docs/database/grant-backup-read-permissions.sql
   ```

3. The script grants only `CONNECT`, schema `USAGE`, and `SELECT` on existing tables and sequences. It also configures default SELECT privileges for the current owners of public-schema tables/sequences so objects created later by those owners are readable by the backup account.
4. Confirm the final query reports `can_read_payment_allocations = t`.
5. Restart SMIS and create a manual backup. Confirm that a non-empty `.dump` file is produced.

## Important notes

- Do not change table ownership or grant superuser privileges to the application/backup account to resolve this issue.
- The script does not modify or delete application data.
- PostgreSQL default privileges are per object-creating role. Re-run this script if a new migration role starts creating tables or sequences.
- If the database uses a different schema, include that schema in the backup permission review; the current SMIS schema is `public`.
- This is a server-side database permission repair. Committing the script to GitHub does not execute it against your PostgreSQL server.
