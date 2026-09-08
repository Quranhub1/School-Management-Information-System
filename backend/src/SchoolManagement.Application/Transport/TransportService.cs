using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Transport;
namespace SchoolManagement.Application.Transport;
public sealed class TransportService(ITransportRepository repository)
{
    public Task<IReadOnlyList<TransportVehicle>> VehiclesAsync(CancellationToken ct = default) => repository.GetVehiclesAsync(ct);
    public Task<IReadOnlyList<TransportRoute>> RoutesAsync(CancellationToken ct = default) => repository.GetRoutesAsync(ct);
    public Task<IReadOnlyList<TransportAssignment>> AssignmentsAsync(CancellationToken ct = default) => repository.GetAssignmentsAsync(ct);
    public async Task<TransportVehicle> AddVehicleAsync(string registrationNumber, string vehicleType, int capacity, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(registrationNumber) || string.IsNullOrWhiteSpace(vehicleType) || capacity <= 0) throw new ArgumentException("Registration, vehicle type and positive capacity are required.");
        var item = new TransportVehicle { RegistrationNumber = registrationNumber.Trim(), VehicleType = vehicleType.Trim(), Capacity = capacity }; await repository.AddAsync(item, ct); await repository.SaveChangesAsync(ct); return item;
    }
    public async Task<TransportRoute> AddRouteAsync(string name, string? pickupPoint, string? destination, decimal fee, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(name) || fee < 0) throw new ArgumentException("Route name is required and fee cannot be negative.");
        var item = new TransportRoute { Name = name.Trim(), PickupPoint = pickupPoint?.Trim(), Destination = destination?.Trim(), Fee = fee }; await repository.AddAsync(item, ct); await repository.SaveChangesAsync(ct); return item;
    }
    public async Task<TransportAssignment> AssignAsync(Guid studentId, Guid routeId, Guid vehicleId, DateOnly startDate, CancellationToken ct = default)
    {
        if (await repository.GetRouteAsync(routeId, ct) is null) throw new KeyNotFoundException("Route not found.");
        if (await repository.GetVehicleAsync(vehicleId, ct) is null) throw new KeyNotFoundException("Vehicle not found.");
        if (await repository.GetActiveAssignmentAsync(studentId, ct) is not null) throw new InvalidOperationException("Student already has an active transport assignment.");
        var item = new TransportAssignment { StudentId = studentId, RouteId = routeId, VehicleId = vehicleId, StartDate = startDate }; await repository.AddAsync(item, ct); await repository.SaveChangesAsync(ct); return item;
    }
}
