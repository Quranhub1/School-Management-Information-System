using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Hostel;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/hostel")]
[Authorize(Policy = AuthorizationPolicies.HostelManagement)]
public sealed class HostelController(HostelService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => Ok(await service.GetAsync(cancellationToken));

    [HttpPost("hostels")]
    public async Task<IActionResult> CreateHostel(CreateHostelRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateHostelAsync(request.Name, request.Description, cancellationToken); return Created($"/api/hostel/hostels/{item.Id}", item); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom(CreateRoomRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateRoomAsync(request.HostelId, request.RoomNumber, request.Capacity, cancellationToken); return Created($"/api/hostel/rooms/{item.Id}", item); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("beds")]
    public async Task<IActionResult> CreateBed(CreateBedRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateBedAsync(request.RoomId, request.BedNumber, cancellationToken); return Created($"/api/hostel/beds/{item.Id}", item); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("allocations")]
    public async Task<IActionResult> Allocate(AllocateRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.AllocateAsync(request.BedId, request.StudentId, request.StartDate, cancellationToken); return Created($"/api/hostel/allocations/{item.Id}", item); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("allocations/{allocationId:guid}/vacate")]
    public async Task<IActionResult> Vacate(Guid allocationId, VacateRequest request, CancellationToken cancellationToken)
    {
        try { await service.VacateAsync(allocationId, request.EndDate, cancellationToken); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}

public sealed record CreateHostelRequest(string Name, string? Description);
public sealed record CreateRoomRequest(Guid HostelId, string RoomNumber, int Capacity);
public sealed record CreateBedRequest(Guid RoomId, string BedNumber);
public sealed record AllocateRequest(Guid BedId, Guid StudentId, DateOnly StartDate);
public sealed record VacateRequest(DateOnly EndDate);
