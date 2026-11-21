using Microsoft.EntityFrameworkCore.Migrations;

namespace SchoolManagement.Infrastructure.Migrations;

public sealed partial class AddIndependentStaffPermissions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Permission tables are not part of the clean-install baseline migration.
        // Create them when absent; upgrade legacy installations when they exist.
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF to_regclass('"Permissions"') IS NULL THEN
                    CREATE TABLE "Permissions" (
                        "Id" uuid NOT NULL,
                        "Code" character varying(120) NOT NULL,
                        "Name" character varying(160) NOT NULL,
                        "GroupKey" character varying(80) NOT NULL,
                        "Description" character varying(500),
                        CONSTRAINT "PK_Permissions" PRIMARY KEY ("Id")
                    );
                ELSE
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'Permissions' AND column_name = 'GroupCode'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'Permissions' AND column_name = 'GroupKey'
                    ) THEN
                        ALTER TABLE "Permissions" RENAME COLUMN "GroupCode" TO "GroupKey";
                    END IF;

                    ALTER TABLE "Permissions" DROP COLUMN IF EXISTS "GroupName";
                    ALTER TABLE "Permissions" ALTER COLUMN "Code" TYPE character varying(120);
                    ALTER TABLE "Permissions" ALTER COLUMN "Name" TYPE character varying(160);
                    ALTER TABLE "Permissions" ALTER COLUMN "Description" TYPE character varying(500);
                END IF;
            END $$;

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Permissions_Code" ON "Permissions" ("Code");
            CREATE INDEX IF NOT EXISTS "IX_Permissions_GroupKey" ON "Permissions" ("GroupKey");

            CREATE TABLE IF NOT EXISTS "RolePermissions" (
                "RoleId" uuid NOT NULL,
                "PermissionId" uuid NOT NULL,
                CONSTRAINT "PK_RolePermissions" PRIMARY KEY ("RoleId", "PermissionId"),
                CONSTRAINT "FK_RolePermissions_Roles_RoleId"
                    FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_RolePermissions_Permissions_PermissionId"
                    FOREIGN KEY ("PermissionId") REFERENCES "Permissions" ("Id") ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS "UserPermissions" (
                "UserId" uuid NOT NULL,
                "PermissionId" uuid NOT NULL,
                "IsGranted" boolean NOT NULL DEFAULT FALSE,
                CONSTRAINT "PK_UserPermissions" PRIMARY KEY ("UserId", "PermissionId"),
                CONSTRAINT "FK_UserPermissions_Users_UserId"
                    FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_UserPermissions_Permissions_PermissionId"
                    FOREIGN KEY ("PermissionId") REFERENCES "Permissions" ("Id") ON DELETE CASCADE
            );

            ALTER TABLE "UserPermissions"
                ADD COLUMN IF NOT EXISTS "IsGranted" boolean NOT NULL DEFAULT FALSE;
            """);

        // StaffUserLinks is created with the composite key by the preceding migration.
        // Do not drop and recreate that same key here.
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep permission assignments intact on rollback; these tables may predate
        // this migration in upgraded installations and may contain live access data.
    }
}
