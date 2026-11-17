using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

/// <summary>
/// Attendance repository contract exposed from the Attendance application module.
/// The infrastructure implementation also satisfies the shared application abstraction.
/// </summary>
public interface IAttendanceRepository : SchoolManagement.Application.Abstractions.IAttendanceRepository
{
    Task<IReadOnlyList<EligibleStudentDto>> GetEligibleStudentsAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default);
    Task<SessionSummaryDto> GetSessionSummaryAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default);
}

public sealed record EligibleStudentDto(
    Guid StudentId,
    string StudentNumber,
    string FirstName,
    string LastName,
    string? OtherNames,
    string DisplayName,
    string? CampusId,
    bool AlreadyMarked);

public sealed record SessionSummaryDto(
    Guid SessionId,
    Guid TimetableEntryId,
    DateOnly SessionDate,
    AttendanceSessionStatus Status,
    int TotalEnrolled,
    int MarkedPresent,
    int MarkedAbsent,
    int MarkedLate,
    int MarkedExcused,
    int Unmarked,
    double AttendancePercentage);
