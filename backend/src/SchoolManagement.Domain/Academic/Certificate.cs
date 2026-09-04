namespace SchoolManagement.Domain.Academic;

public sealed class Certificate
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public required string Name { get; init; }
    public required string Programme { get; init; }
    public required string AwardType { get; init; }
    public DateOnly GraduationDate { get; init; }
    public required string SerialNumber { get; init; }
    public required string VerificationHash { get; init; }
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
    public required string IssuedBy { get; init; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? RevokedBy { get; set; }
    public string? RevocationReason { get; set; }
}
