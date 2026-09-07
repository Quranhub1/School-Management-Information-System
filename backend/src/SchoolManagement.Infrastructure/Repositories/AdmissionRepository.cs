using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AdmissionRepository(SchoolManagementDbContext db) : IAdmissionRepository
{
    public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default) =>
        db.Applicants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == applicantId, cancellationToken);

    public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
        db.Admissions.FirstOrDefaultAsync(x => x.Id == admissionId, cancellationToken);

    public async Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Admissions.AsNoTracking().OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);

    public async Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default) =>
        await db.Admissions.AddAsync(admission, cancellationToken);

    public async Task UpdateAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
    {
        db.Admissions.Update(admission);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default)
    {
        var admission = await db.Admissions.SingleOrDefaultAsync(x => x.Id == admissionId, cancellationToken);
        if (admission is null) return;
        db.Admissions.Remove(admission);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default) =>
        await db.AdmissionDecisions.AddAsync(decision, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}