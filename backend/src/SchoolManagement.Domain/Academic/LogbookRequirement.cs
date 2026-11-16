namespace SchoolManagement.Domain.Academic;

public sealed class LogbookRequirement
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int YearOfStudy { get; set; }
    public int SemesterNumber { get; set; }
    public int RequiredQuantity { get; set; } = 1;
    public bool IsMandatory { get; set; } = true;
    public bool IsActive { get; set; } = true;
}
