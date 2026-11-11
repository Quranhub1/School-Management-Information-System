using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record SaveAcademicAuthorityRequest(string Code, string Name, string? Description, string? SourceReference, int SortOrder = 0);

public sealed class AcademicAuthorityService(IAcademicAuthorityRepository authorities)
{
    public Task<IReadOnlyList<AcademicAuthority>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default) =>
        authorities.GetAllAsync(includeInactive, cancellationToken);

    public async Task<(bool Success, string? Error, AcademicAuthority? Authority)> CreateAsync(SaveAcademicAuthorityRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Authority code is required.", null);
        if (string.IsNullOrWhiteSpace(name)) return (false, "Authority name is required.", null);
        if (await authorities.CodeExistsAsync(code, cancellationToken)) return (false, $"Authority code '{code}' already exists.", null);
        var authority = new AcademicAuthority { Code = code, Name = name, Description = request.Description?.Trim(), SourceReference = request.SourceReference?.Trim(), SortOrder = request.SortOrder };
        await authorities.AddAsync(authority, cancellationToken);
        await authorities.SaveChangesAsync(cancellationToken);
        return (true, null, authority);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(string code, SaveAcademicAuthorityRequest request, CancellationToken cancellationToken = default)
    {
        var authority = await authorities.GetByCodeAsync(code, cancellationToken);
        if (authority is null) return (false, "Academic authority was not found.");
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (!string.Equals(normalizedCode, authority.Code, StringComparison.OrdinalIgnoreCase))
            return (false, "Authority codes cannot be changed after creation because programmes refer to them. Create a new authority and reassign programmes instead.");
        if (string.IsNullOrWhiteSpace(request.Name)) return (false, "Authority name is required.");
        authority.Name = request.Name.Trim();
        authority.Description = request.Description?.Trim();
        authority.SourceReference = request.SourceReference?.Trim();
        authority.SortOrder = request.SortOrder;
        await authorities.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    public async Task<bool> SetActiveAsync(string code, bool active, CancellationToken cancellationToken = default)
    {
        var authority = await authorities.GetByCodeAsync(code, cancellationToken);
        if (authority is null) return false;
        authority.IsActive = active;
        await authorities.SaveChangesAsync(cancellationToken);
        return true;
    }
}
