namespace SchoolManagement.Application.ImportExport;

public sealed record BulkImportResult(
    int SuccessCount,
    int ErrorCount,
    IReadOnlyList<string> Errors,
    IReadOnlyList<string> Warnings);
