namespace SchoolManagement.Infrastructure.Documents;

public sealed record StudentDocumentDto(
    Guid Id,
    Guid StudentId,
    string DocumentType,
    string FileName,
    string ContentType,
    long FileSizeBytes,
    string StoredPath,
    string? Description,
    Guid UploadedByUserId,
    DateTimeOffset UploadedAt,
    int Version,
    Guid? ReplacedByDocumentId,
    bool IsArchived,
    DateTimeOffset? ArchivedAt,
    Guid? ArchivedByUserId);

public sealed record UploadDocumentRequest(
    Guid StudentId,
    string DocumentType,
    string FileName,
    string ContentType,
    long FileSize,
    Stream FileContent,
    string? Description);

public sealed record ArchiveDocumentRequest(
    Guid Id);
