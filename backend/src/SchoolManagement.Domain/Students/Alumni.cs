namespace SchoolManagement.Domain.Students;

public sealed class Alumni
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public DateOnly GraduationDate { get; init; }
    public string Programme { get; init; } = string.Empty;
    public string? CurrentOccupation { get; set; }
    public string? Employer { get; set; }
    public string? ContactInfo { get; set; }
    public bool IsActive { get; set; } = true;
}
