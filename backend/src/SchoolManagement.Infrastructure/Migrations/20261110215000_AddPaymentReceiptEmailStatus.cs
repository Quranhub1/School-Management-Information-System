using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261110215000_AddPaymentReceiptEmailStatus")]
public partial class AddPaymentReceiptEmailStatus : Migration
{
    protected override void Up(MigrationBuilder m) =>
        m.AddColumn<DateTimeOffset>("ReceiptEmailSentAt", "Payments", type: "timestamp with time zone", nullable: true);

    protected override void Down(MigrationBuilder m) =>
        m.DropColumn("ReceiptEmailSentAt", "Payments");
}
