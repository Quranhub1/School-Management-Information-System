using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Transport;
namespace SchoolManagement.Api.Controllers;
[ApiController, Route("api/transport"), Authorize(Policy = AuthorizationPolicies.TransportManagement)]
public sealed class TransportController(TransportService service) : ControllerBase
{
 [HttpGet("vehicles")] public async Task<IActionResult> Vehicles(CancellationToken ct) => Ok(await service.VehiclesAsync(ct));
 [HttpGet("routes")] public async Task<IActionResult> Routes(CancellationToken ct) => Ok(await service.RoutesAsync(ct));
 [HttpGet("assignments")] public async Task<IActionResult> Assignments(CancellationToken ct) => Ok(await service.AssignmentsAsync(ct));
 [HttpPost("vehicles")] public async Task<IActionResult> Vehicle(VehicleRequest r, CancellationToken ct) { try { var x = await service.AddVehicleAsync(r.RegistrationNumber, r.VehicleType, r.Capacity, ct); return Created($"/api/transport/vehicles/{x.Id}", x); } catch (ArgumentException e) { return BadRequest(new { message = e.Message }); } }
 [HttpPost("routes")] public async Task<IActionResult> Route(RouteRequest r, CancellationToken ct) { try { var x = await service.AddRouteAsync(r.Name, r.PickupPoint, r.Destination, r.Fee, ct); return Created($"/api/transport/routes/{x.Id}", x); } catch (ArgumentException e) { return BadRequest(new { message = e.Message }); } }
 [HttpPost("assignments")] public async Task<IActionResult> Assign(AssignmentRequest r, CancellationToken ct) { try { var x = await service.AssignAsync(r.StudentId, r.RouteId, r.VehicleId, r.StartDate, ct); return Created($"/api/transport/assignments/{x.Id}", x); } catch (KeyNotFoundException e) { return NotFound(new { message = e.Message }); } catch (InvalidOperationException e) { return Conflict(new { message = e.Message }); } }
}
public sealed record VehicleRequest(string RegistrationNumber, string VehicleType, int Capacity);
public sealed record RouteRequest(string Name, string? PickupPoint, string? Destination, decimal Fee);
public sealed record AssignmentRequest(Guid StudentId, Guid RouteId, Guid VehicleId, DateOnly StartDate);
