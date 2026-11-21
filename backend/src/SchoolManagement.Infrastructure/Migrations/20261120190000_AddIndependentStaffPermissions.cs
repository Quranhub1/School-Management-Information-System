using Microsoft.EntityFrameworkCore.Migrations;

namespace SchoolManagement.Infrastructure.Migrations;

public sealed partial class AddIndependentStaffPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // 20261120180000 already created the permission tables and StaffUserLinks.
        // Evolve that schema to the independent staff-permission model instead of
        // attempting to create the same tables a second time.
        migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Permissions_GroupCode_Code\";");

        migrationBuilder.RenameColumn(
            name: "GroupCode",
            table: "Permissions",
            newName: "GroupKey");

        migrationBuilder.DropColumn(
            name: "GroupName",
            table: "Permissions");

        migrationBuilder.AlterColumn<string>(
            name: "Code",
            table: "Permissions",
            type: "character varying(120)",
            maxLength: 120,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(160)",
            oldMaxLength: 160);

        migrationBuilder.AlterColumn<string>(
            name: "Name",
            table: "Permissions",
            type: "character varying(160)",
            maxLength: 160,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(240)",
            oldMaxLength: 240);

        migrationBuilder.AlterColumn<string>(
            name: "Description",
            table: "Permissions",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(1000)",
            oldMaxLength: 1000,
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Permissions_GroupKey",
            table: "Permissions",
            column: "GroupKey");

        migrationBuilder.AddColumn<bool>(
            name: "IsGranted",
            table: "UserPermissions",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.DropPrimaryKey(
            name: "PK_StaffUserLinks",
            table: "StaffUserLinks");

        migrationBuilder.AddPrimaryKey(
            name: "PK_StaffUserLinks",
            table: "StaffUserLinks",
            columns: new[] { "StaffId", "UserId" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropPrimaryKey(
            name: "PK_StaffUserLinks",
            table: "StaffUserLinks");

        migrationBuilder.AddPrimaryKey(
            name: "PK_StaffUserLinks",
            table: "StaffUserLinks",
            column: "StaffId");

        migrationBuilder.DropColumn(
            name: "IsGranted",
            table: "UserPermissions");

        migrationBuilder.DropIndex(
            name: "IX_Permissions_GroupKey",
            table: "Permissions");

        migrationBuilder.AlterColumn<string>(
            name: "Code",
            table: "Permissions",
            type: "character varying(160)",
            maxLength: 160,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(120)",
            oldMaxLength: 120);

        migrationBuilder.AlterColumn<string>(
            name: "Name",
            table: "Permissions",
            type: "character varying(240)",
            maxLength: 240,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(160)",
            oldMaxLength: 160);

        migrationBuilder.AlterColumn<string>(
            name: "Description",
            table: "Permissions",
            type: "character varying(1000)",
            maxLength: 1000,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "character varying(500)",
            oldMaxLength: 500,
            oldNullable: true);

        migrationBuilder.AddColumn<string>(
            name: "GroupName",
            table: "Permissions",
            type: "character varying(160)",
            maxLength: 160,
            nullable: false,
            defaultValue: "");

        migrationBuilder.RenameColumn(
            name: "GroupKey",
            table: "Permissions",
            newName: "GroupCode");

        migrationBuilder.CreateIndex(
            name: "IX_Permissions_GroupCode_Code",
            table: "Permissions",
            columns: new[] { "GroupCode", "Code" });
    }
}
