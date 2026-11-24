using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Hostel;
using HostelEntity = SchoolManagement.Domain.Hostel.Hostel;
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

    [Fact]
    public async Task UpdateHostel_updates_name_and_description()
    {
        var hostel = new HostelEntity { Name = "Old name", Description = "Old description" };
        var service = new HostelService(new FakeHostelRepository { Hostel = hostel });

        var updated = await service.UpdateHostelAsync(hostel.Id, " New name ", " New description ");

        Assert.Equal("New name", updated.Name);
        Assert.Equal("New description", updated.Description);
    }

    [Fact]
    public async Task DeleteHostel_deactivates_hostel_rooms_and_beds_without_removing_history()
    {
        var bed = new HostelBed { BedNumber = "B1", RoomId = Guid.NewGuid() };
        var room = new HostelRoom { RoomNumber = "R1", Capacity = 1 };
        room.Beds.Add(bed);
        var hostel = new HostelEntity { Name = "Residence" };
        hostel.Rooms.Add(room);
        var service = new HostelService(new FakeHostelRepository { Hostel = hostel });

        await service.DeleteHostelAsync(hostel.Id);

        Assert.False(hostel.IsActive);
        Assert.False(room.IsActive);
        Assert.False(bed.IsActive);
        Assert.Contains(room, hostel.Rooms);
        Assert.Contains(bed, room.Beds);
    }

    [Fact]
    public async Task DeleteHostel_rejects_active_student_allocations()
    {
        var bed = new HostelBed { BedNumber = "B1", RoomId = Guid.NewGuid() };
        bed.Allocations.Add(new HostelAllocation { BedId = bed.Id, StudentId = Guid.NewGuid(), StartDate = new DateOnly(2026, 1, 1), Status = "Active" });
        var room = new HostelRoom { RoomNumber = "R1", Capacity = 1 };
        room.Beds.Add(bed);
        var hostel = new HostelEntity { Name = "Residence" };
        hostel.Rooms.Add(room);
        var service = new HostelService(new FakeHostelRepository { Hostel = hostel });

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.DeleteHostelAsync(hostel.Id));
        Assert.True(hostel.IsActive);
        Assert.True(room.IsActive);
        Assert.True(bed.IsActive);
    }

    private sealed class FakeHostelRepository : IHostelRepository
    {
        public HostelEntity? Hostel { get; init; }
        public HostelRoom? Room { get; init; }
        public HostelBed? Bed { get; init; }
        public HostelAllocation? ActiveStudentAllocation { get; init; }
        public Task<IReadOnlyList<HostelEntity>> GetHostelsAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<HostelEntity>>(Array.Empty<HostelEntity>());
        public Task<HostelEntity?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Hostel);
        public Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Room);
        public Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(Bed);
        public Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<HostelAllocation?>(null);
        public Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, CancellationToken cancellationToken = default) => Task.FromResult<HostelAllocation?>(null);
        public Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(ActiveStudentAllocation);
        public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
