using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Administration;

namespace SchoolManagement.Application.Administration;

public sealed record InstitutionSettingsDto(
    Guid Id,
    string InstitutionName,
    string? Abbreviation,
    string? Motto,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? PostalAddress,
    string? Country,
    string? InstitutionType,
    string? LogoPath,
    string? PrimaryColor,
    string? AccentColor,
    bool IsActive,
    DateTimeOffset UpdatedAt
);

public sealed record CreateInstitutionSettingsRequest(
    string InstitutionName,
    string? Abbreviation,
    string? Motto,
    string? Address,
    string? Phone,
    string? Email,
    string? Website,
    string? PostalAddress,
    string? Country,
    string? InstitutionType,
    string? LogoPath,
    string? PrimaryColor,
    string? AccentColor
);

public sealed class InstitutionSettingsService(IInstitutionSettingsRepository repository)
{
    public async Task<IReadOnlyList<InstitutionSettingsDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await repository.GetAllAsync(ct);
        return items.Select(x => ToDto(x)).ToList();
    }

    public async Task<InstitutionSettingsDto?> GetActiveAsync(CancellationToken ct = default)
    {
        var item = await repository.GetActiveAsync(ct);
        return item is null ? null : ToDto(item);
    }

    public async Task<InstitutionSettingsDto> CreateAsync(CreateInstitutionSettingsRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.InstitutionName))
            throw new ArgumentException("Institution name is required.", nameof(request.InstitutionName));

        var existing = await repository.GetActiveAsync(ct);
        if (existing is not null)
        {
            existing.InstitutionName = request.InstitutionName.Trim();
            existing.Abbreviation = request.Abbreviation?.Trim();
            existing.Motto = request.Motto?.Trim();
            existing.Address = request.Address?.Trim();
            existing.Phone = request.Phone?.Trim();
            existing.Email = request.Email?.Trim();
            existing.Website = request.Website?.Trim();
            existing.PostalAddress = request.PostalAddress?.Trim();
            existing.Country = request.Country?.Trim();
            existing.InstitutionType = request.InstitutionType?.Trim();
            existing.LogoPath = request.LogoPath?.Trim();
            existing.PrimaryColor = request.PrimaryColor?.Trim();
            existing.AccentColor = request.AccentColor?.Trim();
            existing.IsActive = true;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
            await repository.SaveChangesAsync(ct);
            return ToDto(existing);
        }

        var settings = new InstitutionSettings
        {
            InstitutionName = request.InstitutionName.Trim(),
            Abbreviation = request.Abbreviation?.Trim(),
            Motto = request.Motto?.Trim(),
            Address = request.Address?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Website = request.Website?.Trim(),
            PostalAddress = request.PostalAddress?.Trim(),
            Country = request.Country?.Trim(),
            InstitutionType = request.InstitutionType?.Trim(),
            LogoPath = request.LogoPath?.Trim(),
            PrimaryColor = request.PrimaryColor?.Trim(),
            AccentColor = request.AccentColor?.Trim(),
            IsActive = true,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await repository.AddAsync(settings, ct);
        await repository.SaveChangesAsync(ct);
        return ToDto(settings);
    }

    private static InstitutionSettingsDto ToDto(InstitutionSettings x) => new(
        x.Id,
        x.InstitutionName,
        x.Abbreviation,
        x.Motto,
        x.Address,
        x.Phone,
        x.Email,
        x.Website,
        x.PostalAddress,
        x.Country,
        x.InstitutionType,
        x.LogoPath,
        x.PrimaryColor,
        x.AccentColor,
        x.IsActive,
        x.UpdatedAt
    );
}
