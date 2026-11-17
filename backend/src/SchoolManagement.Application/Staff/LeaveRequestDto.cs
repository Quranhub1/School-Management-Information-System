using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Staff;

public sealed record LeaveRequestDto(
    Guid Id,
    Guid StaffMemberId,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason,
    LeaveRequestStatus Status,
    Guid? ApprovedBy,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset CreatedAt);

public sealed record CreateLeaveRequestDto(
    Guid StaffMemberId,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason);
