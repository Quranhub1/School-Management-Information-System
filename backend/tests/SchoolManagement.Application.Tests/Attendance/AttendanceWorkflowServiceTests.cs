using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Application.Tests.Attendance;

public sealed class AttendanceWorkflowServiceTests
{
    [Fact]
    public async Task GetStudentHistoryAsync_RejectsReversedDateRange()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.GetStudentHistoryAsync(
            Guid.NewGuid(),
            new DateOnly(2026, 8, 25),
            new DateOnly(2026, 8, 24)));
    }

    [Fact]
    public async Task MarkAsync_RejectsBlankStatus()
    {
        var service = CreateService();

        await Assert.ThrowsAsync<ArgumentException>(() => service.MarkAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "   "));
    }

    private static AttendanceWorkflowService CreateService() =>
        new(new AttendanceService(new InMemoryAttendanceRepository()));

    private sealed class InMemoryAttendanceRepository : Abstractions.IAttendanceRepository
    {
        public Task<AttendanceSession?> GetSessionAsync(Guid timetableEntryId, DateOnly sessionDate, CancellationToken cancellationToken = default) =>
            Task.FromResult<AttendanceSession?>(null);

        public Task<StudentAttendance?> GetStudentAttendanceAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default) =>
            Task.FromResult<StudentAttendance?>(null);

        public Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(Guid studentId, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StudentAttendance>>([]);

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
