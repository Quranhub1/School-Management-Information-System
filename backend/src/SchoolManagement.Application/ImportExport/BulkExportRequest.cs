namespace SchoolManagement.Application.ImportExport;

public sealed record BulkExportRequest(
    string EntityType,
    IReadOnlyDictionary<string, string?>? Filters);
