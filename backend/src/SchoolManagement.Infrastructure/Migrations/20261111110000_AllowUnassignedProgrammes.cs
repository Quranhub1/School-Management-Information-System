using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261111110000_AllowUnassignedProgrammes")]
public partial class AllowUnassignedProgrammes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) =>
        migrationBuilder.AlterColumn<Guid>(
            name: "DepartmentId",
            table: "Programmes",
            type: "uuid",
            nullable: true,
            oldClrType: typeof(Guid),
            oldType: "uuid");

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Never assign unowned programmes to an arbitrary department during rollback.
        // Stop if any records depend on the nullable state and require an explicit data decision.
        migrationBuilder.Sql(@" 
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM ""Programmes"" WHERE ""DepartmentId"" IS NULL) THEN
                    RAISE EXCEPTION 'Cannot restore Programmes.DepartmentId to NOT NULL while unassigned programmes exist. Assign them to verified departments or retain this migration.';
                END IF;
            END $$;");

        migrationBuilder.AlterColumn<Guid>(
            name: "DepartmentId",
            table: "Programmes",
            type: "uuid",
            nullable: false,
            oldClrType: typeof(Guid),
            oldType: "uuid",
            oldNullable: true);
    }
}
