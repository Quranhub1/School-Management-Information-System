using FluentAssertions;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Hostel;
using SchoolManagement.Domain.Hostel;

namespace SchoolManagement.Domain.Tests;

public sealed class HostelServiceTests
{
    [Fact]
    public async Task CreateBed_rejects_room_at_capacity()
    {
        var room = new HostelRoom { HostelId = Guid.NewGuid(), RoomNumber = "R1", Capacity = 1 };
        room.Beds.Add(new HostelBed { RoomId = room.Id, BedNumber = "B1" });
        var repo = new FakeHostelRepository { Room = room };
        var service = new HostelService(repo);

        var act = () => service.CreateBedAsync(room.Id, "B2");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Room capacity has been reached.");
    }

    [Fact]
    public async Task Allocate_rejects_student_with_existing_active_allocation()
    {
        var bed = new HostelBed { RoomId = Guid.NewGuid(), BedNumber = "B1" };
        var repo = new FakeHostelRepository { Bed = bed, ActiveStudentAllocation = new HostelAllocation { BedId = Guid.NewGuid(), StudentId = Guid.NewGuid() } };
        var service = new HostelService(repo);

        var act = () => service.AllocateAsync(bed.Id, Guid.NewGuid(), new DateOnly(2026, 9, 8));

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Student already has an active hostel allocation.");
    }

    private sealed class FakeHostelRepository : IHostelRepository
    {
        public Hostel? Hostel { get; set; }
        public HostelRoom? Room { get; set; }
        public HostelBed? Bed { get; set; }
        public HostelAllocation? Allocation { get; set; }
        public HostelAllocation? ActiveBedAllocation { get; set; }
        public HostelAllocation? ActiveStudentAllocation { get; set; }
        public List<Hostel> Hostels { get; } = [];

        public Task<IReadOnlyList<Hostel>> GetHostelsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Hostel>>(Hostels);
        public Task<Hostel?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Hostel?.Id == id ? Hostel : new Hostel { Id = id, Name = "Test" });
        public Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Room?.Id == id ? Room : null);
        public Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Bed?.Id == id ? Bed : null);
        public Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Allocation?.Id == id ? Allocation : null);
        public Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, CancellationToken cancellationToken = default) => Task.FromResult(ActiveBedAllocation);
        public Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(ActiveStudentAllocation);
        public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
