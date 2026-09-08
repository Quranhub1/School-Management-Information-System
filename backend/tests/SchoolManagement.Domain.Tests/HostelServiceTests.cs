using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Hostel;
using SchoolManagement.Domain.Hostel;
using Xunit;

namespace SchoolManagement.Domain.Tests;

public sealed class HostelServiceTests
{
    [Fact]
    public async Task CreateBed_rejects_capacity_overflow()
    {
        var room = new HostelRoom { RoomNumber = "R1", Capacity = 1 };
        room.Beds.Add(new HostelBed { RoomId = room.Id, BedNumber = "B1" });
        var service = new HostelService(new FakeHostelRepository { Room = room });
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateBedAsync(room.Id, "B2"));
    }

    [Fact]
    public async Task Allocate_rejects_student_with_active_allocation()
    {
        var bed = new HostelBed { BedNumber = "B1", RoomId = Guid.NewGuid() };
        var active = new HostelAllocation { BedId = Guid.NewGuid(), StudentId = Guid.NewGuid(), StartDate = new DateOnly(2026, 1, 1) };
        var service = new HostelService(new FakeHostelRepository { Bed = bed, ActiveStudentAllocation = active });
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.AllocateAsync(bed.Id, active.StudentId, new DateOnly(2026, 9, 8)));
    }

    private sealed class FakeHostelRepository : IHostelRepository
    {
        public HostelRoom? Room { get; init; }
        public HostelBed? Bed { get; init; }
        public HostelAllocation? ActiveStudentAllocation { get; init; }
        public Task<IReadOnlyList<Hostel>> GetHostelsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Hostel>>(Array.Empty<Hostel>());
        public Task<Hostel?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Hostel?>(new Hostel { Name = "H" });
        public Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Room);
        public Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Bed);
        public Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<HostelAllocation?>(null);
        public Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, CancellationToken cancellationToken = default) => Task.FromResult<HostelAllocation?>(null);
        public Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(ActiveStudentAllocation);
        public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
