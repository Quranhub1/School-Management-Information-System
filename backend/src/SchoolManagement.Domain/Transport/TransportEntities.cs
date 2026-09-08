namespace SchoolManagement.Domain.Transport;

public sealed class TransportVehicle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string RegistrationNumber { get; set; }
    public required string VehicleType { get; set; }
    public int Capacity { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<TransportAssignment> Assignments { get; set; } = new List<TransportAssignment>();
}

public sealed class TransportRoute
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public string? PickupPoint { get; set; }
    public string? Destination { get; set; }
    public decimal Fee { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<TransportAssignment> Assignments { get; set; } = new List<TransportAssignment>();
}

public sealed class TransportAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid RouteId { get; set; }
    public Guid VehicleId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string Status { get; set; } = "Active";
    public TransportRoute Route { get; set; } = null!;
    public TransportVehicle Vehicle { get; set; } = null!;
}
