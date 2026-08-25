namespace SchoolManagement.Application.Access;

public sealed record GateLogDto(
    Guid Id,
    string PersonName,
    string PersonType,
    string Purpose,
    DateTimeOffset EntryTime,
    DateTimeOffset? ExitTime,
    Guid? IssuedBy,
    string? Notes);

public sealed record CreateGateLogDto(
    string PersonName,
    string PersonType,
    string Purpose,
    Guid? IssuedBy,
    string? Notes);
