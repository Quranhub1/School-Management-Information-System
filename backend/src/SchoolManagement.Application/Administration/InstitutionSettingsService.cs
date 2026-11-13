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
    string? AccentColor,
    byte[]? LogoData = null,
    string? LogoContentType = null
);

public sealed record SystemCurrencySettingsDto(string Code, string Locale, int FractionDigits);

public sealed class InstitutionSettingsService(IInstitutionSettingsRepository repository)
{
    private static readonly IReadOnlyDictionary<string, (string Locale, int FractionDigits)> SupportedSystemCurrencies =
        new Dictionary<string, (string, int)>(StringComparer.OrdinalIgnoreCase)
        {
            ["UGX"] = ("en-UG", 0), ["USD"] = ("en-US", 2), ["KES"] = ("en-KE", 2),
            ["EUR"] = ("en-IE", 2), ["GBP"] = ("en-GB", 2), ["TZS"] = ("sw-TZ", 0),
            ["RWF"] = ("rw-RW", 0), ["ZAR"] = ("en-ZA", 2), ["AED"] = ("en-AE", 2)
        };

    public async Task<SystemCurrencySettingsDto> GetSystemCurrencyAsync(CancellationToken ct = default)
    {
        var settings = await repository.GetActiveAsync(ct);
        return settings is null
            ? new SystemCurrencySettingsDto("UGX", "en-UG", 0)
            : new SystemCurrencySettingsDto(settings.SystemCurrencyCode, settings.SystemCurrencyLocale, settings.SystemCurrencyFractionDigits);
    }

    public async Task<SystemCurrencySettingsDto> UpdateSystemCurrencyAsync(string code, CancellationToken ct = default)
    {
        var normalized = code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (!SupportedSystemCurrencies.TryGetValue(normalized, out var metadata))
            throw new ArgumentException("Select a supported system currency.", nameof(code));

        var settings = await repository.GetActiveAsync(ct)
            ?? throw new InvalidOperationException("Save institution settings before configuring the system currency.");
        settings.SystemCurrencyCode = normalized;
        settings.SystemCurrencyLocale = metadata.Locale;
        settings.SystemCurrencyFractionDigits = metadata.FractionDigits;
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(ct);
        return new SystemCurrencySettingsDto(settings.SystemCurrencyCode, settings.SystemCurrencyLocale, settings.SystemCurrencyFractionDigits);
    }
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

    public async Task<(byte[] Data, string ContentType)?> GetActiveLogoAsync(CancellationToken ct = default)
    {
        var item = await repository.GetActiveAsync(ct);
        if (item?.LogoData is null || item.LogoData.Length == 0) return null;
        var contentType = string.IsNullOrWhiteSpace(item.LogoContentType) ? "image/png" : item.LogoContentType.Trim();
        return (item.LogoData, contentType);
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

            existing.LogoPath = string.IsNullOrWhiteSpace(request.LogoPath)
                ? existing.LogoPath
                : request.LogoPath.Trim();

            if (request.LogoData is not null && request.LogoData.Length > 0)
            {
                existing.LogoData = request.LogoData;
                existing.LogoContentType = request.LogoContentType?.Trim();
            }

            existing.PrimaryColor = string.IsNullOrWhiteSpace(request.PrimaryColor) ? "#1e40af" : request.PrimaryColor.Trim();
            existing.AccentColor = string.IsNullOrWhiteSpace(request.AccentColor) ? "#f97316" : request.AccentColor.Trim();
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
            LogoData = request.LogoData,
            LogoContentType = request.LogoContentType?.Trim(),
            PrimaryColor = string.IsNullOrWhiteSpace(request.PrimaryColor) ? "#1e40af" : request.PrimaryColor.Trim(),
            AccentColor = string.IsNullOrWhiteSpace(request.AccentColor) ? "#f97316" : request.AccentColor.Trim(),
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
