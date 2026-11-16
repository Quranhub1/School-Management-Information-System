namespace SchoolManagement.Domain.Library;

public sealed class LibraryProgrammeRequirement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProgrammeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "UGX";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
