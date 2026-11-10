namespace SchoolManagement.Domain.Administration;

public sealed class InstitutionSettings
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string InstitutionName { get; set; }
    public string? Abbreviation { get; set; }
    public string? Motto { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? PostalAddress { get; set; }
    public string? Country { get; set; }
    public string? InstitutionType { get; set; }
    public string? LogoPath { get; set; }
    public byte[]? LogoData { get; set; }
    public string? LogoContentType { get; set; }
    public string? PrimaryColor { get; set; }
    public string? AccentColor { get; set; }
    public bool EmailEnabled { get; set; }
    public string? EmailSmtpHost { get; set; }
    public int? EmailSmtpPort { get; set; }
    public string? EmailSmtpSecureMode { get; set; }
    public string? EmailSmtpUsername { get; set; }
    public string? EmailSmtpPasswordProtected { get; set; }
    public string? EmailFromAddress { get; set; }
    public string? EmailFromName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
