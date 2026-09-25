namespace SchoolManagement.Domain.Hostel;

public sealed class Hostel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<HostelRoom> Rooms { get; set; } = new List<HostelRoom>();
}

public sealed class HostelRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid HostelId { get; set; }
    public required string RoomNumber { get; set; }
    public int Capacity { get; set; }
    public bool IsActive { get; set; } = true;
    public Hostel Hostel { get; set; } = null!;
    public ICollection<HostelBed> Beds { get; set; } = new List<HostelBed>();
}

public sealed class HostelBed
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoomId { get; set; }
    public required string BedNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public HostelRoom Room { get; set; } = null!;
    public ICollection<HostelAllocation> Allocations { get; set; } = new List<HostelAllocation>();
}

public sealed class HostelAllocation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BedId { get; set; }
    public Guid StudentId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string Status { get; set; } = "Active";
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public HostelBed Bed { get; set; } = null!;
}
