using Microsoft.Extensions.Configuration;
using SchoolManagement.Domain.Documents;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Documents;

public sealed class StudentDocumentService(
    IStudentDocumentRepository documents,
    IConfiguration configuration)
{
    private static readonly string[] AllowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
    private static readonly Dictionary<string, string[]> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = ["application/pdf"],
        [".doc"] = ["application/msword"],
        [".docx"] = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        [".jpg"] = ["image/jpeg"],
        [".jpeg"] = ["image/jpeg"],
        [".png"] = ["image/png"]
    };
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;
    private readonly string _rootPath = configuration.GetValue<string>("DocumentStorage:RootPath") ?? string.Empty;

    public async Task<StudentDocumentDto> UploadAsync(UploadDocumentRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.FileContent.Length == 0)
            throw new ArgumentException("File is empty.", nameof(request.FileContent));

        if (request.FileSize > MaxFileSizeBytes)
            throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)}MB.", nameof(request.FileContent));

        var extension = Path.GetExtension(request.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new ArgumentException("File extension is not allowed.", nameof(request.FileName));

        if (!AllowedMimeTypes.TryGetValue(extension, out var validMimes) || !validMimes.Contains(request.ContentType))
            throw new ArgumentException("MIME type is not allowed for the file extension.", nameof(request.ContentType));

        var relativePath = $"documents/{request.StudentId}/{Guid.NewGuid():N}-{Path.GetFileNameWithoutExtension(request.FileName)}{extension}";
        var absolutePath = Path.Combine(_rootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        await using (var stream = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 8192, useAsync: false))
        {
            await request.FileContent.CopyToAsync(stream, cancellationToken);
        }

        var document = new StudentDocument
        {
            StudentId = request.StudentId,
            DocumentType = request.DocumentType.Trim(),
            FileName = request.FileName,
            ContentType = request.ContentType,
            FileSizeBytes = request.FileSize,
            StoredPath = relativePath,
            Description = request.Description?.Trim(),
            UploadedByUserId = userId
        };

        await documents.AddAsync(document, cancellationToken);
        await documents.SaveChangesAsync(cancellationToken);

        return ToDto(document);
    }

    public Task<StudentDocument?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        documents.GetByIdAsync(id, cancellationToken);

    public Task<IReadOnlyList<StudentDocument>> GetByStudentIdAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        documents.GetByStudentIdAsync(studentId, cancellationToken);

    public async Task ArchiveAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var document = await documents.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("Document not found.");

        if (document.IsArchived)
            throw new InvalidOperationException("Document is already archived.");

        document.IsArchived = true;
        document.ArchivedAt = DateTimeOffset.UtcNow;
        document.ArchivedByUserId = userId;

        await documents.SaveChangesAsync(cancellationToken);
    }

    private static StudentDocumentDto ToDto(StudentDocument document) => new(
        document.Id,
        document.StudentId,
        document.DocumentType,
        document.FileName,
        document.ContentType,
        document.FileSizeBytes,
        document.StoredPath,
        document.Description,
        document.UploadedByUserId,
        document.UploadedAt,
        document.Version,
        document.ReplacedByDocumentId,
        document.IsArchived,
        document.ArchivedAt,
        document.ArchivedByUserId);
}
