using Microsoft.EntityFrameworkCore.Migrations;

namespace SchoolManagement.Infrastructure.Migrations;

public partial class AddPaymentReceiptEmailStatus : Migration
{
    protected override void Up(MigrationBuilder m)
    {
        m.AddColumn<DateTimeOffset>("ReceiptEmailRequestedAt", "Payments", type: "timestamp with time zone", nullable: true);
        m.AddColumn<DateTimeOffset>("ReceiptEmailLastAttemptAt", "Payments", type: "timestamp with time zone", nullable: true);
        m.AddColumn<DateTimeOffset>("ReceiptEmailSentAt", "Payments", type: "timestamp with time zone", nullable: true);
    }

    protected override void Down(MigrationBuilder m)
    {
        m.DropColumn("ReceiptEmailSentAt", "Payments");
        m.DropColumn("ReceiptEmailLastAttemptAt", "Payments");
        m.DropColumn("ReceiptEmailRequestedAt", "Payments");
    }
}
