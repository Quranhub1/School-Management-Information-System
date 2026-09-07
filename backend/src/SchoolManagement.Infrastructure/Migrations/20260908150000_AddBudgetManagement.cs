using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[Migration("20260908150000_AddBudgetManagement")]
public partial class AddBudgetManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS \"Budgets\" (
    \"Id\" uuid NOT NULL,
    \"DepartmentId\" uuid NOT NULL,
    \"AcademicYearId\" uuid NOT NULL,
    \"Name\" character varying(200) NOT NULL,
    \"TotalAmount\" numeric(18,2) NOT NULL,
    \"Currency\" character varying(10) NOT NULL,
    \"StartDate\" timestamp with time zone NOT NULL,
    \"EndDate\" timestamp with time zone NOT NULL,
    \"IsActive\" boolean NOT NULL,
    \"CreatedAt\" timestamp with time zone NOT NULL,
    CONSTRAINT \"PK_Budgets\" PRIMARY KEY (\"Id\"),
    CONSTRAINT \"CK_Budgets_DateRange\" CHECK (\"StartDate\" <= \"EndDate\")
);
CREATE TABLE IF NOT EXISTS \"BudgetLines\" (
    \"Id\" uuid NOT NULL,
    \"BudgetId\" uuid NOT NULL,
    \"AccountId\" uuid NOT NULL,
    \"Category\" character varying(100) NOT NULL,
    \"AllocatedAmount\" numeric(18,2) NOT NULL,
    \"SpentAmount\" numeric(18,2) NOT NULL,
    \"Notes\" character varying(500),
    \"CreatedAt\" timestamp with time zone NOT NULL,
    CONSTRAINT \"PK_BudgetLines\" PRIMARY KEY (\"Id\"),
    CONSTRAINT \"FK_BudgetLines_Budgets_BudgetId\" FOREIGN KEY (\"BudgetId\") REFERENCES \"Budgets\" (\"Id\") ON DELETE CASCADE,
    CONSTRAINT \"FK_BudgetLines_Accounts_AccountId\" FOREIGN KEY (\"AccountId\") REFERENCES \"Accounts\" (\"Id\") ON DELETE RESTRICT,
    CONSTRAINT \"CK_BudgetLines_AllocatedAmount\" CHECK (\"AllocatedAmount\" >= 0)
);
CREATE INDEX IF NOT EXISTS \"IX_Budgets_AcademicYearId\" ON \"Budgets\" (\"AcademicYearId\");
CREATE INDEX IF NOT EXISTS \"IX_Budgets_DepartmentId\" ON \"Budgets\" (\"DepartmentId\");
CREATE INDEX IF NOT EXISTS \"IX_BudgetLines_BudgetId\" ON \"BudgetLines\" (\"BudgetId\");
CREATE INDEX IF NOT EXISTS \"IX_BudgetLines_AccountId\" ON \"BudgetLines\" (\"AccountId\");");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TABLE IF EXISTS \"BudgetLines\"; DROP TABLE IF EXISTS \"Budgets\";");
    }
}
