namespace SchoolManagement.Application.Finance;

public sealed record FeeDto(
    Guid Id,
    Guid StudentId,
    decimal Amount,
    string Status
);
