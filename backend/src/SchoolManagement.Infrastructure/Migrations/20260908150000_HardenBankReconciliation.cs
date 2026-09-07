using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[Migration("20260908150000_HardenBankReconciliation")]
public partial class HardenBankReconciliation : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTimeOffset>(name: "CreatedAt", table: "BankStatementLines", type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP");
        migrationBuilder.AddColumn<DateTimeOffset>(name: "UpdatedAt", table: "BankStatementLines", type: "timestamp with time zone", nullable: true);
        migrationBuilder.AddColumn<string>(name: "Status", table: "BankStatementLines", type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Unmatched");
        migrationBuilder.CreateIndex(name: "IX_BankStatementLines_BankReconciliationId_TransactionDate", table: "BankStatementLines", columns: new[] { "BankReconciliationId", "TransactionDate" });
        migrationBuilder.CreateIndex(name: "IX_BankReconciliations_BankAccountId_StatementDate", table: "BankReconciliations", columns: new[] { "BankAccountId", "StatementDate" });
        migrationBuilder.Sql("ALTER TABLE \"BankStatementLines\" ADD CONSTRAINT \"CK_BankStatementLines_Amount\" CHECK (\"Amount\" >= 0);");
        migrationBuilder.Sql("ALTER TABLE \"BankReconciliations\" ADD CONSTRAINT \"CK_BankReconciliations_Balances\" CHECK (\"StatementBalance\" >= 0 AND \"BookBalance\" >= 0 AND \"ReconciledAmount\" >= 0);");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("ALTER TABLE \"BankReconciliations\" DROP CONSTRAINT IF EXISTS \"CK_BankReconciliations_Balances\";");
        migrationBuilder.Sql("ALTER TABLE \"BankStatementLines\" DROP CONSTRAINT IF EXISTS \"CK_BankStatementLines_Amount\";");
        migrationBuilder.DropIndex(name: "IX_BankReconciliations_BankAccountId_StatementDate", table: "BankReconciliations");
        migrationBuilder.DropIndex(name: "IX_BankStatementLines_BankReconciliationId_TransactionDate", table: "BankStatementLines");
        migrationBuilder.DropColumn(name: "CreatedAt", table: "BankStatementLines");
        migrationBuilder.DropColumn(name: "UpdatedAt", table: "BankStatementLines");
        migrationBuilder.DropColumn(name: "Status", table: "BankStatementLines");
    }
}
