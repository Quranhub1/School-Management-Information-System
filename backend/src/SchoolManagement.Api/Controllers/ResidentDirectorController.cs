using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/resident-director")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class ResidentDirectorController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var totalStudents = await db.Students.AsNoTracking().LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.AsNoTracking().CountAsync(x => x.Status == "Active", cancellationToken);
        var totalStaff = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken);
        var totalProgrammes = await db.Programmes.AsNoTracking().LongCountAsync(cancellationToken);
        var totalInvoices = await db.StudentInvoices.AsNoTracking().LongCountAsync(cancellationToken);
        var outstandingInvoices = await db.StudentInvoices.AsNoTracking().CountAsync(x => x.PaidAmount < x.Amount, cancellationToken);

        var recentAdmissions = await db.Admissions.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(10)
            .Select(x => new
            {
                x.Id,
                x.ApplicantId,
                x.ProgrammeId,
                x.AcademicYearId,
                x.Status,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        var outstandingBalances = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .OrderByDescending(x => x.Amount - x.PaidAmount)
            .Take(20)
            .Select(x => new
            {
                studentId = x.StudentId,
                studentNumber = x.Student.StudentNumber,
                studentName = x.Student.FirstName + " " + x.Student.OtherNames + " " + x.Student.LastName,
                balance = x.Amount - x.PaidAmount,
                currency = x.Currency,
                programmeName = x.FeeStructure.Name
            })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            totalStudents,
            activeStudents,
            totalStaff,
            totalProgrammes,
            totalInvoices,
            outstandingInvoices,
            recentAdmissions,
            outstandingBalances
        });
    }

    [HttpGet("students")]
    public async Task<IActionResult> GetStudents(CancellationToken cancellationToken)
    {
        var students = await db.Students.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.StudentNumber,
                x.FirstName,
                x.LastName,
                x.OtherNames,
                x.Gender,
                x.Status,
                x.AdmissionId,
                createdAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(students);
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff(CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.StaffNumber,
                x.FirstName,
                x.LastName,
                x.OtherNames,
                x.Email,
                x.PhoneNumber,
                x.Department,
                x.Position,
                x.EmploymentType,
                x.Status,
                createdAt = x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(staff);
    }

    [HttpGet("hostel-status")]
    public async Task<IActionResult> GetHostelStatus(CancellationToken cancellationToken)
    {
        try
        {
            var totalHouses = await db.HostelHouses.AsNoTracking().LongCountAsync(cancellationToken);
            var totalRooms = await db.HostelRooms.AsNoTracking().LongCountAsync(cancellationToken);
            var totalBeds = await db.HostelBeds.AsNoTracking().LongCountAsync(cancellationToken);
            var occupiedBeds = await db.HostelBeds.AsNoTracking().CountAsync(x => x.Status == "Occupied", cancellationToken);
            var availableBeds = await db.HostelBeds.AsNoTracking().CountAsync(x => x.Status == "Available", cancellationToken);

            return Ok(new
            {
                totalHouses,
                totalRooms,
                totalBeds,
                occupiedBeds,
                availableBeds,
                occupancyRate = totalBeds > 0 ? Math.Round((double)occupiedBeds / totalBeds * 100, 1) : 0
            });
        }
        catch
        {
            return Ok(new
            {
                totalHouses = 0,
                totalRooms = 0,
                totalBeds = 0,
                occupiedBeds = 0,
                availableBeds = 0,
                occupancyRate = 0
            });
        }
    }

    [HttpGet("attendance-summary")]
    public async Task<IActionResult> GetAttendanceSummary(CancellationToken cancellationToken)
    {
        var sessions = await db.AttendanceSessions.AsNoTracking().LongCountAsync(cancellationToken);
        var studentRecords = await db.StudentAttendances.AsNoTracking().LongCountAsync(cancellationToken);
        var attendanceRecords = await db.AttendanceRecords.AsNoTracking().LongCountAsync(cancellationToken);

        var absentToday = await db.AttendanceRecords.AsNoTracking()
            .Where(x => x.Status == "Absent")
            .CountAsync(cancellationToken);

        return Ok(new
        {
            sessions,
            studentRecords,
            attendanceRecords,
            absentToday
        });
    }

    [HttpGet("welfare-alerts")]
    public async Task<IActionResult> GetWelfareAlerts(CancellationToken cancellationToken)
    {
        var studentsWithLargeBalances = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount && (x.Amount - x.PaidAmount) > 1000000)
            .Select(x => new
            {
                x.StudentId,
                studentNumber = x.Student.StudentNumber,
                studentName = x.Student.FirstName + " " + x.Student.OtherNames + " " + x.Student.LastName,
                balance = x.Amount - x.PaidAmount,
                x.Currency,
                alertType = "Large Fee Balance"
            })
            .ToListAsync(cancellationToken);

        var absentStudents = await db.AttendanceRecords.AsNoTracking()
            .Where(x => x.Status == "Absent")
            .Select(x => new
            {
                x.StudentId,
                studentName = x.Student.FirstName + " " + x.Student.OtherNames + " " + x.Student.LastName,
                date = x.Session.Date,
                alertType = "Absent"
            })
            .OrderByDescending(x => x.date)
            .Take(20)
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            studentsWithLargeBalances,
            absentStudents,
            totalAlerts = studentsWithLargeBalances.Count + absentStudents.Count
        });
    }
}