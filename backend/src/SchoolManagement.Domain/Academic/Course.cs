namespace SchoolManagement.Domain.Academic;

public sealed class Course
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string? AuthorityCode { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public int CreditUnits { get; set; }
    public string? Description { get; set; }
    public string? CourseType { get; set; }
    public bool IsActive { get; set; } = true;
}
