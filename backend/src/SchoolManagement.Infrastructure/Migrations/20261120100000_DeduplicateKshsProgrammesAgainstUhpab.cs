using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261120100000_DeduplicateKshsProgrammesAgainstUhpab")]
public partial class DeduplicateKshsProgrammesAgainstUhpab : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- UHPAB is the canonical catalogue record where the same award and
-- qualification are already represented by an imported UHPAB programme.
-- Keep the KSHS source record for provenance, but deactivate it so it cannot
-- appear as a second selectable programme in admissions/curriculum lists.
-- Exact normalized name + award matching deliberately avoids merging
-- different qualifications such as Nursing and Enrolled Nursing.
UPDATE ""Programmes"" AS k
SET ""IsActive"" = FALSE,
    ""IsReferenceOnly"" = TRUE,
    ""ApprovalStatus"" = 'DuplicateOfUHPAB',
    ""SourceReference"" = COALESCE(NULLIF(k.""SourceReference"", ''), '') ||
        CASE
            WHEN COALESCE(k.""SourceReference"", '') = '' THEN ''
            ELSE ' | '
        END ||
        'Duplicate catalogue listing suppressed; canonical programme: ' || u.""Code"" ||
        ' (UHPAB). Original KSHS source: https://www.kshs.ac.ug/programs/'
FROM ""Programmes"" AS u
WHERE k.""Regulator"" = 'SCHOOL_BASED'
  AND k.""Code"" LIKE 'KSHS-%'
  AND u.""Regulator"" = 'UHPAB'
  AND lower(regexp_replace(trim(k.""Name""), '[^a-z0-9]+', '', 'g')) =
      lower(regexp_replace(trim(u.""Name""), '[^a-z0-9]+', '', 'g'))
  AND lower(regexp_replace(trim(k.""Award""), '[^a-z0-9]+', '', 'g')) =
      lower(regexp_replace(trim(u.""Award""), '[^a-z0-9]+', '', 'g'));
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally do not reactivate suppressed KSHS duplicates on rollback:
        // a rollback must not reintroduce duplicate selectable qualifications.
    }
}
