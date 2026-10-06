using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261006160000_AddStaffAllowances")]
public partial class AddStaffAllowances : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "StaffAllowances",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                StaffMemberId = table.Column<Guid>(type: "uuid", nullable: false),
                AllowanceType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                Frequency = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                AuthorizedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                AuthorizedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                RecordedBy = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                RecordedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StaffAllowances", x => x.Id);
                table.ForeignKey(
                    name: "FK_StaffAllowances_StaffMembers_StaffMemberId",
                    column: x => x.StaffMemberId,
                    principalTable: "StaffMembers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_StaffAllowances_StaffMemberId_EffectiveFrom_Status",
            table: "StaffAllowances",
            columns: new[] { "StaffMemberId", "EffectiveFrom", "Status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "StaffAllowances");
    }
}
