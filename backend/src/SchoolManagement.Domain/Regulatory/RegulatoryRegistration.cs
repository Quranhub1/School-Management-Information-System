namespace SchoolManagement.Domain.Regulatory;

public sealed class RegulatoryRegistration
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public required string RegistrationNumber { get; init; }
    public required string RegulatoryBody { get; init; }
    public required string ProgrammeCode { get; init; }
    public required string ProgrammeName { get; init; }
    public required string Level { get; init; }
    public DateOnly? RegistrationDate { get; init; }
    public DateOnly? AssessmentDate { get; init; }
    public string Status { get; init; } = "Pending";
    public string? VerificationCode { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
