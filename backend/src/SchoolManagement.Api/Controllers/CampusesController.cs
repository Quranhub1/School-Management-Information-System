using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Infrastructure.Persistence;
namespace SchoolManagement.Api.Controllers;
[ApiController, Route("api/campuses"), Authorize(Roles = "SystemAdministrator")]
public sealed class CampusesController(SchoolManagementDbContext db) : ControllerBase
{
 [HttpGet] public async Task<ActionResult<IReadOnlyList<CampusResponse>>> Get(CancellationToken ct) {
  var settings=await ActiveSettings(ct); if(settings is null)return Conflict(new{message="Configure an active institution before adding campuses."});
  var institution=await FindInstitution(settings,ct); if(institution is null)return Ok(Array.Empty<CampusResponse>());
  return Ok(await db.Campuses.AsNoTracking().Where(x=>x.InstitutionId==institution.Id).OrderByDescending(x=>x.IsActive).ThenBy(x=>x.Name).Select(x=>new CampusResponse(x.Id,x.Code,x.Name,x.Address,x.District,x.IsActive)).ToListAsync(ct));
 }
 [HttpPost] public async Task<ActionResult<CampusResponse>> Create(SaveCampusRequest request,CancellationToken ct) {
  var name=request.Name?.Trim(); var code=request.Code?.Trim().ToUpperInvariant();
  if(string.IsNullOrWhiteSpace(name)||string.IsNullOrWhiteSpace(code))return BadRequest(new{message="Campus name and code are required."});
  if(name.Length>200||code.Length>50)return BadRequest(new{message="Campus name must be at most 200 characters and code at most 50."});
  var settings=await ActiveSettings(ct);if(settings is null)return Conflict(new{message="Configure an active institution before adding campuses."});
  var institution=await FindInstitution(settings,ct);
  if(institution is null){institution=new Institution{Code=InstitutionCode(settings),Name=settings.InstitutionName.Trim(),InstitutionType=string.IsNullOrWhiteSpace(settings.InstitutionType)?"School":settings.InstitutionType.Trim(),Address=settings.Address,Phone=settings.Phone,Email=settings.Email,Website=settings.Website,IsActive=true};db.Institutions.Add(institution);await db.SaveChangesAsync(ct);}
  if(await db.Campuses.AnyAsync(x=>x.InstitutionId==institution.Id&&(x.Code==code||x.Name.ToLower()==name.ToLower()),ct))return Conflict(new{message="A campus with this name or code already exists."});
  var isFirstCampus=!await db.Campuses.AnyAsync(x=>x.InstitutionId==institution.Id,ct);
  var campus=new Campus{InstitutionId=institution.Id,Code=code,Name=name,Address=request.Address?.Trim(),District=request.District?.Trim(),IsActive=true};db.Campuses.Add(campus);
  if(isFirstCampus){
   var unassignedStudents=await db.Students.Where(x=>x.CampusId==null).ToListAsync(ct);
   foreach(var student in unassignedStudents)student.CampusId=campus.Id;
   var unassignedRegistrations=await db.CourseRegistrations.Where(x=>x.CampusId==null).ToListAsync(ct);
   foreach(var registration in unassignedRegistrations)registration.CampusId=campus.Id;
   var unassignedStaff=await db.StaffMembers.Where(x=>x.CampusId==null).ToListAsync(ct);
   foreach(var staff in unassignedStaff)staff.CampusId=campus.Id;
   var users=await db.Users.Where(x=>x.IsActive).ToListAsync(ct);
   var userIds=users.Select(x=>x.Id).ToArray();
   var assignedUserIds=await db.UserCampusAssignments.Where(x=>userIds.Contains(x.UserId)).Select(x=>x.UserId).Distinct().ToListAsync(ct);
   foreach(var user in users.Where(x=>!assignedUserIds.Contains(x.Id)))
    db.UserCampusAssignments.Add(new UserCampusAssignment{UserId=user.Id,CampusId=campus.Id,IsPrimary=true});
  }
  await db.SaveChangesAsync(ct);
  return Created($"/api/campuses/{campus.Id}",new CampusResponse(campus.Id,campus.Code,campus.Name,campus.Address,campus.District,campus.IsActive));
 }
 [HttpPatch("{id:guid}")] public async Task<ActionResult<CampusResponse>> Update(Guid id,SaveCampusRequest request,CancellationToken ct) {
  var settings=await ActiveSettings(ct);if(settings is null)return Conflict(new{message="No active institution is configured."});var institution=await FindInstitution(settings,ct);if(institution is null)return NotFound();
  var campus=await db.Campuses.SingleOrDefaultAsync(x=>x.Id==id&&x.InstitutionId==institution.Id,ct);if(campus is null)return NotFound();
  var name=request.Name?.Trim();var code=request.Code?.Trim().ToUpperInvariant();if(string.IsNullOrWhiteSpace(name)||string.IsNullOrWhiteSpace(code))return BadRequest(new{message="Campus name and code are required."});
  if(name.Length>200||code.Length>50)return BadRequest(new{message="Campus name must be at most 200 characters and code at most 50."});
  if(await db.Campuses.AnyAsync(x=>x.InstitutionId==institution.Id&&x.Id!=id&&(x.Code==code||x.Name.ToLower()==name.ToLower()),ct))return Conflict(new{message="Another campus already uses this name or code."});
  campus.Name=name;campus.Code=code;campus.Address=request.Address?.Trim();campus.District=request.District?.Trim();await db.SaveChangesAsync(ct);
  return Ok(new CampusResponse(campus.Id,campus.Code,campus.Name,campus.Address,campus.District,campus.IsActive));
 }
 [HttpPatch("{id:guid}/active")] public async Task<IActionResult> SetActive(Guid id,SetCampusActiveRequest request,CancellationToken ct) {
  var settings=await ActiveSettings(ct);if(settings is null)return Conflict(new{message="No active institution is configured."});var institution=await FindInstitution(settings,ct);if(institution is null)return NotFound();
  var campus=await db.Campuses.SingleOrDefaultAsync(x=>x.Id==id&&x.InstitutionId==institution.Id,ct);if(campus is null)return NotFound();campus.IsActive=request.IsActive;await db.SaveChangesAsync(ct);return NoContent();
 }
 private Task<InstitutionSettings?> ActiveSettings(CancellationToken ct)=>db.InstitutionSettings.AsNoTracking().Where(x=>x.IsActive).OrderBy(x=>x.Id).FirstOrDefaultAsync(ct);
 private async Task<Institution?> FindInstitution(InstitutionSettings s,CancellationToken ct){var code=InstitutionCode(s);return await db.Institutions.FirstOrDefaultAsync(x=>x.Code==code||x.Name==s.InstitutionName,ct);}
 private static string InstitutionCode(InstitutionSettings s){var source=string.IsNullOrWhiteSpace(s.Abbreviation)?s.InstitutionName:s.Abbreviation;var code=new string(source.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).Take(50).ToArray());return string.IsNullOrWhiteSpace(code)?"SCHOOL":code;}
}
public sealed record SaveCampusRequest(string? Code,string? Name,string? Address,string? District);
public sealed record SetCampusActiveRequest(bool IsActive);
public sealed record CampusResponse(Guid Id,string Code,string Name,string? Address,string? District,bool IsActive);
