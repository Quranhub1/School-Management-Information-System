using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Staff;

public sealed record LeaveRequestDto(
    Guid Id,
    Guid StaffMemberId,
    string LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason,
    string Status,
    Guid? ApprovedBy,
    DateTimeOffset? ApprovedAt);

public sealed record CreateLeaveRequestDto(
    Guid StaffMemberId,
    string LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason);
