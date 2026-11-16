namespace SchoolManagement.Domain.Clinical;

public sealed class StudentLogbook
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid LogbookRequirementId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public DateOnly IssuedOn { get; set; }
    public DateOnly? SubmittedOn { get; set; }
    public string Status { get; set; } = "Issued";
    public string? IssuedBy { get; set; }
    public string? Remarks { get; set; }
}
