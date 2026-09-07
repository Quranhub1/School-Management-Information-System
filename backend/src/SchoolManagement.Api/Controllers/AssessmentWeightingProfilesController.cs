using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/assessment-weighting-profiles")]
[Authorize(Policy = AuthorizationPolicies.ExaminationManagement)]
public sealed class AssessmentWeightingProfilesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AssessmentWeightingProfileDto>>> List(CancellationToken cancellationToken)
    {
        var profiles = await db.AssessmentWeightingProfiles
            .AsNoTracking()
            .OrderByDescending(x => x.IsDefault)
            .ThenBy(x => x.Name)
            .Select(x => new AssessmentWeightingProfileDto(
                x.Id,
                x.Name,
                x.RegulatoryBody,
                x.AssessmentModel,
                x.IsDefault,
                x.IsActive,
                x.EffectiveFromUtc,
                x.EffectiveToUtc,
                db.AssessmentWeightingComponents.Where(c => c.AssessmentWeightingProfileId == x.Id)
                    .OrderBy(c => c.Name)
                    .Select(c => new AssessmentWeightingComponentDto(c.Id, c.Name, c.AssessmentType, c.WeightPercentage, c.MaximumMark, c.IsRequired, c.IsActive))
                    .ToList()))
            .ToListAsync(cancellationToken);

        return Ok(profiles);
    }

    [HttpPost]
    public async Task<ActionResult<AssessmentWeightingProfileDto>> Create(CreateAssessmentWeightingProfileRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Components.Count == 0)
            return BadRequest("A profile name and at least one weighting component are required.");

        if (request.Components.Any(x => x.WeightPercentage < 0 || x.WeightPercentage > 100))
            return BadRequest("Each weighting must be between 0 and 100 percent.");

        if (request.Components.Sum(x => x.WeightPercentage) != 100m)
            return BadRequest("Applicable weighting components must total exactly 100 percent.");

        if (request.IsDefault)
            await db.AssessmentWeightingProfiles.Where(x => x.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsDefault, false), cancellationToken);

        var profile = new AssessmentWeightingProfile
        {
            Name = request.Name.Trim(),
            RegulatoryBody = string.IsNullOrWhiteSpace(request.RegulatoryBody) ? null : request.RegulatoryBody.Trim(),
            AssessmentModel = string.IsNullOrWhiteSpace(request.AssessmentModel) ? null : request.AssessmentModel.Trim(),
            IsDefault = request.IsDefault,
            EffectiveFromUtc = request.EffectiveFromUtc ?? DateTime.UtcNow
        };

        db.AssessmentWeightingProfiles.Add(profile);
        foreach (var component in request.Components)
        {
            db.AssessmentWeightingComponents.Add(new AssessmentWeightingComponent
            {
                AssessmentWeightingProfileId = profile.Id,
                Name = component.Name.Trim(),
                AssessmentType = component.AssessmentType.Trim(),
                WeightPercentage = component.WeightPercentage,
                MaximumMark = component.MaximumMark,
                IsRequired = component.IsRequired,
                IsActive = true
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/assessment-weighting-profiles/{profile.Id}", new { profile.Id });
    }
}

public sealed record CreateAssessmentWeightingProfileRequest(
    string Name,
    string? RegulatoryBody,
    string? AssessmentModel,
    bool IsDefault,
    DateTime? EffectiveFromUtc,
    IReadOnlyList<CreateAssessmentWeightingComponentRequest> Components);

public sealed record CreateAssessmentWeightingComponentRequest(
    string Name,
    string AssessmentType,
    decimal WeightPercentage,
    decimal MaximumMark,
    bool IsRequired = true);

public sealed record AssessmentWeightingProfileDto(
    Guid Id,
    string Name,
    string? RegulatoryBody,
    string? AssessmentModel,
    bool IsDefault,
    bool IsActive,
    DateTime EffectiveFromUtc,
    DateTime? EffectiveToUtc,
    IReadOnlyList<AssessmentWeightingComponentDto> Components);

public sealed record AssessmentWeightingComponentDto(
    Guid Id,
    string Name,
    string AssessmentType,
    decimal WeightPercentage,
    decimal MaximumMark,
    bool IsRequired,
    bool IsActive);
