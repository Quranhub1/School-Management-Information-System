using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Hostel;
using HostelEntity = SchoolManagement.Domain.Hostel.Hostel;

namespace SchoolManagement.Application.Hostel;

public sealed class HostelService(IHostelRepository repository)
{
    public async Task<IReadOnlyList<HostelEntity>> GetAsync(CancellationToken cancellationToken = default)
    {
        await ExpireEndedAllocationsAsync(cancellationToken);
        return await repository.GetHostelsAsync(cancellationToken);
    }

    private Task ExpireEndedAllocationsAsync(CancellationToken cancellationToken) =>
        repository.ExpireEndedSemesterAllocationsAsync(DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(3)).DateTime), cancellationToken);

    public async Task<HostelEntity> CreateHostelAsync(string name, string? description, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Hostel name is required.", nameof(name));
        var hostel = new HostelEntity { Name = name.Trim(), Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim() };
        await repository.AddAsync(hostel, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return hostel;
    }

    public async Task<HostelEntity> UpdateHostelAsync(Guid hostelId, string name, string? description, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Hostel name is required.", nameof(name));
        var hostel = await repository.GetHostelAsync(hostelId, cancellationToken) ?? throw new KeyNotFoundException("Hostel not found.");
        if (!hostel.IsActive) throw new InvalidOperationException("An inactive hostel cannot be edited.");
        hostel.Name = name.Trim();
        hostel.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        await repository.SaveChangesAsync(cancellationToken);
        return hostel;
    }

    public async Task DeleteHostelAsync(Guid hostelId, CancellationToken cancellationToken = default)
    {
        var hostel = await repository.GetHostelAsync(hostelId, cancellationToken) ?? throw new KeyNotFoundException("Hostel not found.");
        if (!hostel.IsActive) throw new InvalidOperationException("Hostel has already been deleted.");
        if (hostel.Rooms.SelectMany(room => room.Beds).SelectMany(bed => bed.Allocations).Any(allocation => allocation.Status == "Active"))
            throw new InvalidOperationException("This hostel cannot be deleted while students have active bed allocations. Vacate those allocations first.");

        hostel.IsActive = false;
        foreach (var room in hostel.Rooms)
        {
            room.IsActive = false;
            foreach (var bed in room.Beds) bed.IsActive = false;
        }
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<HostelRoom> CreateRoomAsync(Guid hostelId, string roomNumber, int capacity, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(roomNumber)) throw new ArgumentException("Room number is required.", nameof(roomNumber));
        if (capacity <= 0) throw new ArgumentException("Room capacity must be greater than zero.", nameof(capacity));
        var hostel = await repository.GetHostelAsync(hostelId, cancellationToken) ?? throw new KeyNotFoundException("Hostel not found.");
        if (!hostel.IsActive) throw new InvalidOperationException("Cannot add rooms to an inactive hostel.");
        var room = new HostelRoom { HostelId = hostelId, RoomNumber = roomNumber.Trim(), Capacity = capacity };
        await repository.AddAsync(room, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return room;
    }

    public async Task<HostelBed> CreateBedAsync(Guid roomId, string bedNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(bedNumber)) throw new ArgumentException("Bed number is required.", nameof(bedNumber));
        var room = await repository.GetRoomAsync(roomId, cancellationToken) ?? throw new KeyNotFoundException("Room not found.");
        if (!room.IsActive) throw new InvalidOperationException("Cannot add beds to an inactive room.");
        if (room.Beds.Count >= room.Capacity) throw new InvalidOperationException("Room capacity has been reached.");
        var bed = new HostelBed { RoomId = roomId, BedNumber = bedNumber.Trim() };
        await repository.AddAsync(bed, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return bed;
    }

    public async Task<HostelAllocation> AllocateAsync(Guid bedId, Guid studentId, DateOnly startDate, CancellationToken cancellationToken = default)
    {
        await ExpireEndedAllocationsAsync(cancellationToken);
        var bed = await repository.GetBedAsync(bedId, cancellationToken) ?? throw new KeyNotFoundException("Bed not found.");
        if (!bed.IsActive) throw new InvalidOperationException("Cannot allocate an inactive bed.");
        var semester = await repository.GetSemesterForDateAsync(startDate, cancellationToken)
            ?? throw new InvalidOperationException("No active academic semester covers the allocation start date. Configure the academic calendar first.");
        if (await repository.GetActiveAllocationByBedAsync(bedId, semester.Id, cancellationToken) is not null) throw new InvalidOperationException("Bed is already allocated for this semester.");
        if (await repository.GetActiveAllocationByStudentAsync(studentId, semester.Id, cancellationToken) is not null) throw new InvalidOperationException("Student already has a bed allocation for this semester.");
        var allocation = new HostelAllocation { BedId = bedId, StudentId = studentId, SemesterId = semester.Id, StartDate = startDate };
        await repository.AddAsync(allocation, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return allocation;
    }

    public async Task VacateAsync(Guid allocationId, DateOnly endDate, CancellationToken cancellationToken = default)
    {
        var allocation = await repository.GetAllocationAsync(allocationId, cancellationToken) ?? throw new KeyNotFoundException("Allocation not found.");
        if (allocation.Status != "Active") throw new InvalidOperationException("Allocation is already closed.");
        if (endDate < allocation.StartDate) throw new ArgumentException("End date cannot be before the start date.", nameof(endDate));
        allocation.EndDate = endDate;
        allocation.Status = "Vacated";
        await repository.SaveChangesAsync(cancellationToken);
    }
}
