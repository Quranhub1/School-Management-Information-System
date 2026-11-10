using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public sealed partial class AddPaymentSourceToPayments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PaymentSource",
            table: "Payments",
            type: "character varying(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Manual");

        migrationBuilder.Sql("""
            UPDATE "Payments"
            SET "PaymentSource" = 'SchoolPay'
            WHERE LOWER("PaymentMethod") = 'schoolpay';
            """);

        migrationBuilder.AddColumn<string>(
            name: "Channel",
            table: "SchoolPaymentNotifications",
            type: "character varying(40)",
            maxLength: 40,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Channel",
            table: "SchoolPaymentNotifications");

        migrationBuilder.DropColumn(
            name: "PaymentSource",
            table: "Payments");
    }
}
