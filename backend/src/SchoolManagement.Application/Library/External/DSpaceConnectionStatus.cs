namespace SchoolManagement.Application.Library.External;

public sealed record DSpaceConnectionStatus(bool IsConfigured, string? BaseUrl, string Message);
