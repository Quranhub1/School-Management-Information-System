using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Attendance;

/// <summary>
/// Attendance repository contract exposed from the Attendance application module.
/// The infrastructure implementation also satisfies the shared application abstraction.
/// </summary>
public interface IAttendanceRepository : SchoolManagement.Application.Abstractions.IAttendanceRepository
{
}
