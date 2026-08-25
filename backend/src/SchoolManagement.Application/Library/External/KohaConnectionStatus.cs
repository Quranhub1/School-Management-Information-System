namespace SchoolManagement.Application.Library.External;

public sealed record KohaConnectionStatus(bool IsConfigured, string? BaseUrl, string Message);
