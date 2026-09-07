using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[Migration("20260908123001_FinanceAuditBoundary")]
public partial class FinanceAuditBoundary : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLogs') THEN
        CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
        RETURNS trigger LANGUAGE plpgsql AS $fn$
        BEGIN
            RAISE EXCEPTION 'Audit log records are immutable and cannot be updated or deleted.' USING ERRCODE = 'restrict_violation';
        END;
        $fn$;
        DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON ""AuditLogs"";
        CREATE TRIGGER trg_audit_logs_immutable BEFORE UPDATE OR DELETE ON ""AuditLogs"" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
    END IF;
END $$;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLogs') THEN
        DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON ""AuditLogs"";
    END IF;
END $$;
DROP FUNCTION IF EXISTS prevent_audit_log_mutation();
");
    }
}
