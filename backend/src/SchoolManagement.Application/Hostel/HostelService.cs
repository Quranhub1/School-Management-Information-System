using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Hostel;
using HostelEntity = SchoolManagement.Domain.Hostel.Hostel;

namespace SchoolManagement.Application.Hostel;

public sealed class HostelService(IHostelRepository repository)
{
    public Task<IReadOnlyList<HostelEntity>> GetAsync(CancellationToken cancellationToken = default) => repository.GetHostelsAsync(cancellationToken);

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

        // Keep hostel, room, bed and allocation records for audit/history; hide the deactivated hierarchy from active lists.
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
        if (await repository.GetBedAsync(bedId, cancellationToken) is null) throw new KeyNotFoundException("Bed not found.");
        if (await repository.GetActiveAllocationByBedAsync(bedId, cancellationToken) is not null) throw new InvalidOperationException("Bed is already allocated.");
        if (await repository.GetActiveAllocationByStudentAsync(studentId, cancellationToken) is not null) throw new InvalidOperationException("Student already has an active hostel allocation.");
        var allocation = new HostelAllocation { BedId = bedId, StudentId = studentId, StartDate = startDate };
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
