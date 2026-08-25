namespace SchoolManagement.Application.Library.External;

public interface ILibraryExternalClient
{
    string SystemName { get; }
    Uri? BaseUri { get; }
    bool IsConfigured { get; }
}
