namespace SchoolManagement.Domain.Documents;

public sealed class StudentDocument
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public required string DocumentType { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public long FileSizeBytes { get; init; }
    public required string StoredPath { get; init; }
    public string? Description { get; init; }
    public Guid UploadedByUserId { get; init; }
    public DateTimeOffset UploadedAt { get; init; } = DateTimeOffset.UtcNow;
    public int Version { get; set; } = 1;
    public Guid? ReplacedByDocumentId { get; init; }
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedAt { get; set; }
    public Guid? ArchivedByUserId { get; set; }
}
