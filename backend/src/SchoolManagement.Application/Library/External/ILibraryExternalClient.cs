namespace SchoolManagement.Application.Library.External;

public interface ILibraryExternalClient
{
    string SystemName { get; }
    Uri? BaseUri { get; }
    bool IsConfigured { get; }
    Task<ExternalConnectionResult> CheckConnectionAsync(CancellationToken cancellationToken = default);
}

public sealed record ExternalConnectionResult(
    string SystemName,
    bool IsConfigured,
    bool IsReachable,
    string Message);
