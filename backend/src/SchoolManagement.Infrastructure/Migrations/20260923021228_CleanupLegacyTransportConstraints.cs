using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

public partial class CleanupLegacyTransportConstraints : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            ALTER TABLE "TransportAssignments"
            DROP CONSTRAINT IF EXISTS
                "FK_TransportAssignment_Students_StudentId";

            ALTER TABLE "TransportAssignments"
            DROP CONSTRAINT IF EXISTS
                "FK_TransportAssignment_TransportRoute_RouteId";

            ALTER TABLE "TransportAssignments"
            DROP CONSTRAINT IF EXISTS
                "FK_TransportAssignment_TransportVehicle_VehicleId";
            """);

        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS
                "IX_TransportVehicle_RegistrationNumber";

            DROP INDEX IF EXISTS
                "IX_TransportAssignment_RouteId";

            DROP INDEX IF EXISTS
                "IX_TransportAssignment_VehicleId";

            DROP INDEX IF EXISTS
                "UX_TransportAssignment_ActiveStudent";
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally non-destructive.
        // These are redundant legacy objects. The current
        // EF Core constraints and indexes remain in place.
    }
}
