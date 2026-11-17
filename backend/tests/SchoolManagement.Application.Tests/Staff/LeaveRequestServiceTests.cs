using Xunit;
using SchoolManagement.Application.Staff;
using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Tests.Staff;

public sealed class LeaveRequestServiceTests
{
    [Fact]
    public async Task RequestAsync_creates_pending_leave_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "Annual leave request");

        Assert.Equal(LeaveType.Annual, request.LeaveType);
        Assert.Equal(LeaveRequestStatus.Pending, request.Status);
        Assert.Single(repository.Requests);
    }

    [Fact]
    public async Task RequestAsync_rejects_past_start_date()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.RequestAsync(Guid.NewGuid(), LeaveType.Annual,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                "Past start date"));

        Assert.Empty(repository.Requests);
    }

    [Fact]
    public async Task RequestAsync_rejects_end_before_start()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.RequestAsync(Guid.NewGuid(), LeaveType.Annual,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                "End before start"));

        Assert.Empty(repository.Requests);
    }

    [Fact]
    public async Task RequestAsync_rejects_overlapping_leave()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var staffId = Guid.NewGuid();

        await service.RequestAsync(staffId, LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "First request");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RequestAsync(staffId, LeaveType.Sick,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                "Overlapping request"));

        Assert.Single(repository.Requests);
    }

    [Fact]
    public async Task RequestAsync_allows_non_overlapping_leave()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var staffId = Guid.NewGuid();

        await service.RequestAsync(staffId, LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "First request");

        var second = await service.RequestAsync(staffId, LeaveType.Sick,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
            "Second request");

        Assert.Equal(2, repository.Requests.Count);
        Assert.Equal(LeaveType.Sick, second.LeaveType);
    }

    [Fact]
    public async Task RequestAsync_rejects_duration_over_90_days()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.RequestAsync(Guid.NewGuid(), LeaveType.Annual,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(91)),
                "Too long"));

        Assert.Empty(repository.Requests);
    }

    [Fact]
    public async Task RequestAsync_rejects_empty_reason()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.RequestAsync(Guid.NewGuid(), LeaveType.Annual,
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                "   "));

        Assert.Empty(repository.Requests);
    }

    [Fact]
    public async Task ApproveAsync_approves_pending_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Sick,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            "Sick leave");

        var approved = await service.ApproveAsync(request.Id, Guid.NewGuid(), true);

        Assert.NotNull(approved);
        Assert.Equal(LeaveRequestStatus.Approved, approved.Status);
        Assert.NotNull(approved.ApprovedBy);
        Assert.NotNull(approved.ApprovedAt);
    }

    [Fact]
    public async Task ApproveAsync_rejects_pending_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "Annual leave");

        var rejected = await service.ApproveAsync(request.Id, Guid.NewGuid(), false);

        Assert.NotNull(rejected);
        Assert.Equal(LeaveRequestStatus.Rejected, rejected.Status);
    }

    [Fact]
    public async Task ApproveAsync_rejects_non_pending_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "Annual leave");

        await service.ApproveAsync(request.Id, Guid.NewGuid(), true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ApproveAsync(request.Id, Guid.NewGuid(), false));
    }

    [Fact]
    public async Task ApproveAsync_returns_null_for_unknown_id()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        var result = await service.ApproveAsync(Guid.NewGuid(), Guid.NewGuid(), true);

        Assert.Null(result);
    }

    [Fact]
    public async Task CancelAsync_cancels_pending_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Study,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(12)),
            "Study leave");

        var cancelled = await service.CancelAsync(request.Id);

        Assert.NotNull(cancelled);
        Assert.Equal(LeaveRequestStatus.Cancelled, cancelled.Status);
    }

    [Fact]
    public async Task CancelAsync_rejects_non_pending_request()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);
        var request = await service.RequestAsync(
            Guid.NewGuid(), LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "Annual leave");

        await service.ApproveAsync(request.Id, Guid.NewGuid(), true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CancelAsync(request.Id));
    }

    [Fact]
    public async Task CancelAsync_returns_null_for_unknown_id()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        var result = await service.CancelAsync(Guid.NewGuid());

        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllAsync_returns_all_requests()
    {
        var repository = new FakeLeaveRequestRepository();
        var service = new LeaveRequestService(repository);

        await service.RequestAsync(Guid.NewGuid(), LeaveType.Annual,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
            "Request 1");
        await service.RequestAsync(Guid.NewGuid(), LeaveType.Sick,
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            DateOnly.FromDateTime(DateTime.UtcNow.AddDays(12)),
            "Request 2");

        var all = await service.GetAllAsync();

        Assert.Equal(2, all.Count());
    }

    private sealed class FakeLeaveRequestRepository : ILeaveRequestRepository
    {
        public List<LeaveRequest> Requests { get; } = [];
        public int SaveChangesCount { get; private set; }

        public Task<IReadOnlyList<LeaveRequest>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LeaveRequest>>(Requests.Where(x => x.StaffMemberId == staffMemberId).ToList());

        public Task<IReadOnlyList<LeaveRequest>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LeaveRequest>>(Requests);

        public Task<LeaveRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Requests.FirstOrDefault(x => x.Id == id));

        public Task AddAsync(LeaveRequest request, CancellationToken cancellationToken = default)
        {
            Requests.Add(request);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveChangesCount++;
            return Task.CompletedTask;
        }
    }
}
