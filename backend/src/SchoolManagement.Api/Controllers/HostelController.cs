using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Hostel;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/hostel")]
[Authorize(Policy = AuthorizationPolicies.HostelManagement)]
public sealed class HostelController(HostelService service, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken) => Ok((await service.GetAsync(cancellationToken)).Select(HostelResponseDto.FromDomain).ToArray());

    [HttpGet("allocation-context")]
    public async Task<IActionResult> GetAllocationContext(CancellationToken cancellationToken)
    {
        await service.RefreshSemesterAllocationsAsync(cancellationToken);
        var today = DateOnly.FromDateTime(DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(3)).DateTime);
        var semester = await (from period in db.Semesters.AsNoTracking()
            join year in db.AcademicYears.AsNoTracking() on period.AcademicYearId equals year.Id
            where period.IsActive && year.IsActive && period.StartDate <= today && period.EndDate >= today
            orderby period.StartDate descending
            select new { period.Id, period.Name, period.StartDate, period.EndDate, AcademicYearName = year.Name })
            .FirstOrDefaultAsync(cancellationToken);

        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var studentsQuery = db.Students.AsNoTracking().Where(student => !student.IsArchived);
        if (accessibleCampuses is not null)
            studentsQuery = studentsQuery.Where(student => student.CampusId.HasValue && accessibleCampuses.Contains(student.CampusId.Value));

        var students = await studentsQuery.OrderBy(student => student.StudentNumber)
            .Select(student => new HostelAllocationStudentDto(
                student.Id,
                student.StudentNumber,
                (student.LastName + " " + student.FirstName + (student.OtherNames == null || student.OtherNames == "" ? "" : " " + student.OtherNames)).Trim(),
                db.StudentEnrollments.AsNoTracking()
                    .Where(enrollment => enrollment.StudentId == student.Id && enrollment.Status == "Active")
                    .OrderByDescending(enrollment => enrollment.AdmissionDate)
                    .Select(enrollment => (Guid?)enrollment.ProgrammeId).FirstOrDefault(),
                db.StudentEnrollments.AsNoTracking()
                    .Where(enrollment => enrollment.StudentId == student.Id && enrollment.Status == "Active")
                    .OrderByDescending(enrollment => enrollment.AdmissionDate)
                    .Select(enrollment => db.Programmes.Where(programme => programme.Id == enrollment.ProgrammeId)
                        .Select(programme => programme.Name).FirstOrDefault()).FirstOrDefault(),
                semester != null && db.HostelAllocations.Any(allocation =>
                    allocation.StudentId == student.Id && allocation.SemesterId == semester.Id && allocation.Status == "Active")))
            .ToListAsync(cancellationToken);

        return Ok(new HostelAllocationContextDto(
            semester is null ? null : new HostelSemesterDto(semester.Id, semester.Name, semester.AcademicYearName, semester.StartDate, semester.EndDate),
            students));
    }

    [HttpPost("hostels")]
    public async Task<IActionResult> CreateHostel(CreateHostelRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateHostelAsync(request.Name, request.Description, cancellationToken); return Created($"/api/hostel/hostels/{item.Id}", HostelResponseDto.FromDomain(item)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("hostels/{hostelId:guid}")]
    public async Task<IActionResult> UpdateHostel(Guid hostelId, UpdateHostelRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.UpdateHostelAsync(hostelId, request.Name, request.Description, cancellationToken); return Ok(HostelResponseDto.FromDomain(item)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpDelete("hostels/{hostelId:guid}")]
    public async Task<IActionResult> DeleteHostel(Guid hostelId, CancellationToken cancellationToken)
    {
        try { await service.DeleteHostelAsync(hostelId, cancellationToken); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("rooms")]
    public async Task<IActionResult> CreateRoom(CreateRoomRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateRoomAsync(request.HostelId, request.RoomNumber, request.Capacity, cancellationToken); return Created($"/api/hostel/rooms/{item.Id}", HostelRoomResponseDto.FromDomain(item)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("beds")]
    public async Task<IActionResult> CreateBed(CreateBedRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.CreateBedAsync(request.RoomId, request.BedNumber, cancellationToken); return Created($"/api/hostel/beds/{item.Id}", HostelBedResponseDto.FromDomain(item)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("allocations")]
    public async Task<IActionResult> Allocate(AllocateRequest request, CancellationToken cancellationToken)
    {
        try { var item = await service.AllocateAsync(request.BedId, request.StudentId, request.StartDate, cancellationToken); return Created($"/api/hostel/allocations/{item.Id}", HostelAllocationResponseDto.FromDomain(item)); }
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

public sealed record HostelResponseDto(Guid Id, string Name, string? Description, bool IsActive, IReadOnlyCollection<HostelRoomResponseDto> Rooms)
{
    public static HostelResponseDto FromDomain(SchoolManagement.Domain.Hostel.Hostel hostel) =>
        new(hostel.Id, hostel.Name, hostel.Description, hostel.IsActive, hostel.Rooms.Select(HostelRoomResponseDto.FromDomain).ToArray());
}

public sealed record HostelRoomResponseDto(Guid Id, Guid HostelId, string RoomNumber, int Capacity, bool IsActive, IReadOnlyCollection<HostelBedResponseDto> Beds)
{
    public static HostelRoomResponseDto FromDomain(SchoolManagement.Domain.Hostel.HostelRoom room) =>
        new(room.Id, room.HostelId, room.RoomNumber, room.Capacity, room.IsActive, room.Beds.Select(HostelBedResponseDto.FromDomain).ToArray());
}

public sealed record HostelBedResponseDto(Guid Id, Guid RoomId, string BedNumber, bool IsActive, IReadOnlyCollection<HostelAllocationResponseDto> Allocations)
{
    public static HostelBedResponseDto FromDomain(SchoolManagement.Domain.Hostel.HostelBed bed) =>
        new(bed.Id, bed.RoomId, bed.BedNumber, bed.IsActive, bed.Allocations.Select(HostelAllocationResponseDto.FromDomain).ToArray());

    public static HostelBedResponseDto FromDomainWithoutAllocations(SchoolManagement.Domain.Hostel.HostelBed bed) =>
        new(bed.Id, bed.RoomId, bed.BedNumber, bed.IsActive, Array.Empty<HostelAllocationResponseDto>());
}

public sealed record HostelAllocationResponseDto(Guid Id, Guid BedId, Guid StudentId, Guid? SemesterId, string? SemesterName, DateOnly StartDate, DateOnly? EndDate, string Status, string? Notes, DateTimeOffset CreatedAt)
{
    public static HostelAllocationResponseDto FromDomain(SchoolManagement.Domain.Hostel.HostelAllocation allocation) =>
        new(allocation.Id, allocation.BedId, allocation.StudentId, allocation.SemesterId, allocation.Semester?.Name, allocation.StartDate, allocation.EndDate, allocation.Status, allocation.Notes, allocation.CreatedAt);
}

public sealed record HostelSemesterDto(Guid Id, string Name, string AcademicYearName, DateOnly StartDate, DateOnly EndDate);
public sealed record HostelAllocationStudentDto(Guid Id, string StudentNumber, string FullName, Guid? ProgrammeId, string? ProgrammeName, bool IsAllocatedForCurrentSemester);
public sealed record HostelAllocationContextDto(HostelSemesterDto? CurrentSemester, IReadOnlyCollection<HostelAllocationStudentDto> RegistryStudents);

public sealed record CreateHostelRequest(string Name, string? Description);
public sealed record UpdateHostelRequest(string Name, string? Description);
public sealed record CreateRoomRequest(Guid HostelId, string RoomNumber, int Capacity);
public sealed record CreateBedRequest(Guid RoomId, string BedNumber);
public sealed record AllocateRequest(Guid BedId, Guid StudentId, DateOnly StartDate);
public sealed record VacateRequest(DateOnly EndDate);
