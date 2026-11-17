using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Repositories;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests.Admissions;

public sealed class AdmissionRepositoryTests
{
    [Fact]
    public async Task AddAdmissionAsync_persists_admission()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new SchoolManagementDbContext(options);
        var repository = new AdmissionRepository(db);
        var applicant = new Applicant { ApplicationNumber = "APP-001", FirstName = "Test", LastName = "Applicant", Status = "Submitted" };
        db.Applicants.Add(applicant);
        await db.SaveChangesAsync();

        var admission = new Admission
        {
            ApplicantId = applicant.Id,
            ProgrammeId = Guid.NewGuid(),
            AcademicYearId = Guid.NewGuid(),
            IntakeId = Guid.NewGuid()
        };

        await repository.AddAdmissionAsync(admission);
        await repository.SaveChangesAsync();

        var stored = await db.Admissions.FindAsync(admission.Id);
        Assert.NotNull(stored);
        Assert.Equal(applicant.Id, stored!.ApplicantId);
    }
}
