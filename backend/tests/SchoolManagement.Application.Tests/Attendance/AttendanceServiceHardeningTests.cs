using SchoolManagement.Application.Attendance;
using SchoolManagement.Domain.Attendance;
using Xunit;

namespace SchoolManagement.Application.Tests.Attendance;

public sealed class AttendanceServiceHardeningTests
{
    [Fact]
    public async Task MarkAsync_RejectsStudentNotRegisteredForCourse()
    {
        var session = NewSession();
        var repository = new FakeAttendanceRepository { Session = session, StudentEligible = false };
        var service = new AttendanceService(repository);

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.MarkAsync(
            session.Id, Guid.NewGuid(), "Present"));

        Assert.Contains("not registered", error.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(repository.AddedRecords);
    }

    [Fact]
    public async Task MarkAsync_RecordsAttendanceForEligibleStudent()
    {
        var session = NewSession();
        var studentId = Guid.NewGuid();
        var repository = new FakeAttendanceRepository { Session = session, StudentEligible = true };
        var service = new AttendanceService(repository);

        var result = await service.MarkAsync(session.Id, studentId, " late ", "  arrived late  ");

        Assert.Equal(studentId, result.StudentId);
        Assert.Equal("late", result.Status, ignoreCase: true);
        Assert.Equal("arrived late", result.Remarks);
        Assert.Single(repository.AddedRecords);
    }

    [Fact]
    public async Task MarkAsync_RejectsClosedSessionBeforeEligibilityCheck()
    {
        var session = NewSession();
        session.Status = "Closed";
        var repository = new FakeAttendanceRepository { Session = session, StudentEligible = true };
        var service = new AttendanceService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.MarkAsync(
            session.Id, Guid.NewGuid(), "Present"));

        Assert.False(repository.EligibilityChecked);
    }

    [Fact]
    public async Task CloseSessionAsync_ClosesOpenSession()
    {
        var session = NewSession();
        var repository = new FakeAttendanceRepository { Session = session };
        var service = new AttendanceService(repository);

        var result = await service.CloseSessionAsync(session.Id);

        Assert.Equal("Closed", result.Status);
        Assert.Equal("Closed", session.Status);
        Assert.Equal(1, repository.SaveCount);
    }

    [Fact]
    public async Task MarkAsync_RejectsDuplicateAttendance()
    {
        var session = NewSession();
        var studentId = Guid.NewGuid();
        var repository = new FakeAttendanceRepository
        {
            Session = session,
            StudentEligible = true,
            ExistingRecord = new StudentAttendance
            {
                AttendanceSessionId = session.Id,
                StudentId = studentId,
                Status = "Present"
            }
        };
        var service = new AttendanceService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.MarkAsync(
            session.Id, studentId, "Present"));

        Assert.Empty(repository.AddedRecords);
    }

    private static AttendanceSession NewSession() => new()
    {
        TimetableEntryId = Guid.NewGuid(),
        SessionDate = new DateOnly(2026, 9, 8),
        Status = "Open"
    };

    private sealed class FakeAttendanceRepository : SchoolManagement.Application.Abstractions.IAttendanceRepository
    {
        public AttendanceSession? Session { get; set; }
        public bool StudentEligible { get; set; }
        public bool EligibilityChecked { get; private set; }
        public StudentAttendance? ExistingRecord { get; set; }
        public List<StudentAttendance> AddedRecords { get; } = [];
        public int SaveCount { get; private set; }

        public Task<AttendanceSession?> GetSessionAsync(Guid timetableEntryId, DateOnly sessionDate, CancellationToken cancellationToken = default) =>
            Task.FromResult(Session is not null && Session.TimetableEntryId == timetableEntryId && Session.SessionDate == sessionDate ? Session : null);

        public Task<AttendanceSession?> GetSessionByIdAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default) =>
            Task.FromResult(Session?.Id == attendanceSessionId ? Session : null);

        public Task<bool> IsStudentEligibleForSessionAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default)
        {
            EligibilityChecked = true;
            return Task.FromResult(StudentEligible);
        }

        public Task<StudentAttendance?> GetStudentAttendanceAsync(Guid attendanceSessionId, Guid studentId, CancellationToken cancellationToken = default) =>
            Task.FromResult(ExistingRecord?.AttendanceSessionId == attendanceSessionId && ExistingRecord.StudentId == studentId ? ExistingRecord : null);

        public Task AddSessionAsync(AttendanceSession session, CancellationToken cancellationToken = default)
        {
            Session = session;
            return Task.CompletedTask;
        }

        public Task AddStudentAttendanceAsync(StudentAttendance attendance, CancellationToken cancellationToken = default)
        {
            AddedRecords.Add(attendance);
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<StudentAttendance>> GetStudentAttendanceAsync(Guid studentId, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StudentAttendance>>([]);

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveCount++;
            return Task.CompletedTask;
        }
    }
}
