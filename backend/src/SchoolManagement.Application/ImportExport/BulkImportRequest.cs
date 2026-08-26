namespace SchoolManagement.Application.ImportExport;

public sealed record BulkImportRequest(
    string EntityType,
    string CsvData,
    string UserId);
