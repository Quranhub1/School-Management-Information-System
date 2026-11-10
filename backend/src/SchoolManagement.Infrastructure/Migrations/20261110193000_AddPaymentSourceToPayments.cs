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
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PaymentSource",
            table: "Payments");
    }
}
