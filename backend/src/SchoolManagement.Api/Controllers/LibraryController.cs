using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Library;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;
using SchoolManagement.Domain.Workflows;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(
    LibraryWorkflowService library,
    IConfiguration configuration,
    SchoolManagementDbContext db,
    CampusAccessService campusAccess,
    InstitutionSettingsService institutionSettings) : ControllerBase
{
    [HttpGet("books")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryBookDto>> Books(CancellationToken ct) => library.GetBooksAsync(ct);

    [HttpGet("members")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Members([FromQuery] string? search = null, [FromQuery] string? memberType = null, CancellationToken ct = default)
    {
        var term = search?.Trim();
        var includeStudents = string.IsNullOrWhiteSpace(memberType) || memberType.Equals("Student", StringComparison.OrdinalIgnoreCase);
        var includeStaff = string.IsNullOrWhiteSpace(memberType) || memberType.Equals("Staff", StringComparison.OrdinalIgnoreCase);
        if (!includeStudents && !includeStaff) return BadRequest(new { message = "Member type must be Student or Staff." });
        var members = new List<object>();
        if (includeStudents)
        {
            var students = db.Students.AsNoTracking().IgnoreQueryFilters().Where(x => !x.IsArchived);
            if (!string.IsNullOrWhiteSpace(term)) students = students.Where(x => x.StudentNumber.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || (x.OtherNames != null && x.OtherNames.Contains(term)));
            members.AddRange(await students.OrderBy(x => x.StudentNumber).Select(x => new { id = x.Id, memberType = "Student", memberNumber = x.StudentNumber, studentNumber = x.StudentNumber, name = (x.LastName + " " + x.FirstName + " " + (x.OtherNames ?? "")).Trim().ToUpper() }).ToListAsync(ct));
        }
        if (includeStaff)
        {
            var staff = db.StaffMembers.AsNoTracking().Where(x => x.IsActive && x.EmploymentStatus == "Active");
            if (!string.IsNullOrWhiteSpace(term)) staff = staff.Where(x => x.StaffNumber.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || (x.OtherNames != null && x.OtherNames.Contains(term)));
            members.AddRange(await staff.OrderBy(x => x.StaffNumber).Select(x => new { id = x.Id, memberType = "Staff", memberNumber = x.StaffNumber, studentNumber = x.StaffNumber, name = (x.LastName + " " + x.FirstName + " " + (x.OtherNames ?? "")).Trim().ToUpper() }).ToListAsync(ct));
        }
        return Ok(members);
    }

    // Library owns its course-book requirement configuration and student payment ledger.
    [HttpGet("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ProgrammeRequirements(CancellationToken ct)
    {
        var requirements = await db.LibraryProgrammeRequirements.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new { id = x.Id, programmeId = x.ProgrammeId, name = x.Name, totalAmount = x.Amount, currency = x.Currency, isActive = x.IsActive })
            .ToListAsync(ct);
        return Ok(requirements);
    }

    [HttpPost("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirement(SetLibraryProgrammeRequirementRequest request, CancellationToken ct)
    {
        if (request.ProgrammeId == Guid.Empty) return BadRequest(new { message = "Select a course/programme." });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Requirement name is required." });
        if (request.Amount <= 0 || decimal.Round(request.Amount, 2) != request.Amount)
            return BadRequest(new { message = "Enter a valid book fee with no more than two decimal places." });
        if (!await db.Programmes.AnyAsync(x => x.Id == request.ProgrammeId && x.IsActive, ct))
            return BadRequest(new { message = "The selected programme is not active." });

        var defaultCurrency = (await institutionSettings.GetSystemCurrencyAsync(ct)).Code;
        var currency = (string.IsNullOrWhiteSpace(request.Currency) ? defaultCurrency : request.Currency.Trim()).ToUpperInvariant();
        if (currency.Length != 3 || currency.Any(ch => !char.IsLetter(ch)))
            return BadRequest(new { message = "Select a valid three-letter currency code." });

        var activeRequirements = await db.LibraryProgrammeRequirements
            .Where(x => x.ProgrammeId == request.ProgrammeId && x.IsActive)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .ToListAsync(ct);
        var requirement = activeRequirements.FirstOrDefault();
        foreach (var duplicate in activeRequirements.Skip(1)) duplicate.IsActive = false;
        if (requirement is null)
        {
            requirement = new SchoolManagement.Domain.Library.LibraryProgrammeRequirement
            {
                ProgrammeId = request.ProgrammeId,
                Name = request.Name.Trim(),
                Amount = request.Amount,
                Currency = currency
            };
            db.LibraryProgrammeRequirements.Add(requirement);
        }
        else
        {
            requirement.Name = request.Name.Trim();
            requirement.Amount = request.Amount;
            requirement.Currency = currency;
            requirement.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new { id = requirement.Id, programmeId = requirement.ProgrammeId, name = requirement.Name, totalAmount = requirement.Amount, currency = requirement.Currency, isActive = requirement.IsActive });
    }

    [HttpPatch("programme-requirements/{id:guid}/active")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirementActive(Guid id, [FromQuery] bool active, CancellationToken ct)
    {
        var requirement = await db.LibraryProgrammeRequirements.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (requirement is null) return NotFound();
        if (active)
        {
            var competingRequirements = await db.LibraryProgrammeRequirements
                .Where(x => x.ProgrammeId == requirement.ProgrammeId && x.Id != id && x.IsActive)
                .ToListAsync(ct);
            foreach (var competing in competingRequirements) competing.IsActive = false;
        }
        requirement.IsActive = active;
        requirement.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { requirement.Id, requirement.IsActive });
    }

    [HttpPost("students/{studentId:guid}/payments")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> RecordStudentLibraryPayment(Guid studentId, RecordLibraryPaymentRequest request, CancellationToken ct)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, ct)) return Forbid();
        if (request.Amount <= 0 || decimal.Round(request.Amount, 2) != request.Amount)
            return BadRequest(new { message = "Enter a payment amount greater than zero with no more than two decimal places." });
        var enrollmentProgramme = await (
            from enrollment in db.StudentEnrollments.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on enrollment.ProgrammeId equals programme.Id
            where enrollment.StudentId == studentId && enrollment.Status == "Active"
            orderby enrollment.AdmissionDate descending
            select new { ProgrammeId = (Guid?)programme.Id, ProgrammeCode = programme.Code }
        ).FirstOrDefaultAsync(ct);
        var enrollmentProgrammeId = enrollmentProgramme?.ProgrammeId;
        var admissionId = await db.Students.AsNoTracking().Where(x => x.Id == studentId)
            .Select(x => x.AdmissionId).FirstOrDefaultAsync(ct);
        var admissionProgrammeId = admissionId.HasValue
            ? await db.Admissions.AsNoTracking().Where(x => x.Id == admissionId.Value)
                .Select(x => (Guid?)x.ProgrammeId).FirstOrDefaultAsync(ct)
            : null;
        var enrollmentProgrammeCode = enrollmentProgramme?.ProgrammeCode?.Trim().ToUpperInvariant();
        var programmeIds = new[] { enrollmentProgrammeId, admissionProgrammeId }
            .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToArray();
        if (programmeIds.Length == 0)
            return Conflict(new { message = "The student is not linked to a programme with a library requirement." });

        // Prefer exact programme IDs. If an older admission/enrolment points to a
        // duplicate programme record, fall back to the stable programme code (e.g. CPH).
        var requirement = await db.LibraryProgrammeRequirements.AsNoTracking()
            .Where(x => programmeIds.Contains(x.ProgrammeId) && x.IsActive)
            .OrderBy(x => x.ProgrammeId == enrollmentProgrammeId ? 0 : 1)
            .ThenByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefaultAsync(ct);
        if (requirement is null)
        {
            var programmeCodes = await db.Programmes.AsNoTracking()
                .Where(x => programmeIds.Contains(x.Id) || (enrollmentProgrammeCode != null && x.Code.Trim().ToUpper() == enrollmentProgrammeCode))
                .Select(x => x.Code.Trim().ToUpper())
                .Distinct()
                .ToListAsync(ct);
            if (programmeCodes.Count > 0)
            {
                requirement = await (
                    from item in db.LibraryProgrammeRequirements.AsNoTracking()
                    join programme in db.Programmes.AsNoTracking() on item.ProgrammeId equals programme.Id
                    where item.IsActive && programmeCodes.Contains(programme.Code.Trim().ToUpper())
                    orderby item.UpdatedAtUtc descending
                    select item
                ).FirstOrDefaultAsync(ct);
            }
        }
        if (requirement is null) return Conflict(new { message = "No active course-book requirement is configured for this student's programme." });

        var paid = await db.LibraryStudentPayments.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.RequirementId == requirement.Id)
            .SumAsync(x => (decimal?)x.Amount, ct) ?? 0m;
        var balance = Math.Max(0m, requirement.Amount - paid);
        if (request.Amount > balance)
            return Conflict(new { message = $"Payment exceeds the outstanding library requirement of {requirement.Currency} {balance:N2}." });

        var payment = new SchoolManagement.Domain.Library.LibraryStudentPayment
        {
            StudentId = studentId,
            RequirementId = requirement.Id,
            Amount = request.Amount,
            Currency = requirement.Currency,
            RecordedBy = User.Identity?.Name
        };
        db.LibraryStudentPayments.Add(payment);
        await db.SaveChangesAsync(ct);
        return Ok(new { payment.Id, payment.StudentId, payment.Amount, payment.Currency, payment.RecordedAtUtc });
    }

    [HttpGet("books/{id:guid}/barcode")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBookBarcode(Guid id, CancellationToken ct)
    {
        var book = await db.LibraryBooks.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
        if (book is null) return NotFound(new { message = "Active catalogue book was not found." });

        var barcodeValue = book.BarcodeValue;
        if (string.IsNullOrWhiteSpace(barcodeValue))
        {
            try
            {
                barcodeValue = LibraryService.ToBooklandEan13(book.Isbn);
            }
            catch (ArgumentException)
            {
                return Conflict(new { message = "This book does not have a valid ISBN barcode value." });
            }
        }

        return Content(BarcodeHelper.GenerateSvg(barcodeValue), "image/svg+xml");
    }

    [HttpGet("loans")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Loans([FromQuery] bool activeOnly = true, CancellationToken ct = default)
    {
        var loanQuery = db.LibraryLoans.AsNoTracking();
        if (activeOnly) loanQuery = loanQuery.Where(x => x.ReturnedAtUtc == null);
        var rows = await loanQuery.OrderByDescending(x => x.IssuedAtUtc).ToListAsync(ct);
        var bookIds = rows.Select(x => x.BookId).Distinct().ToArray();
        var studentIds = rows.Where(x => x.StudentId.HasValue).Select(x => x.StudentId!.Value).Distinct().ToArray();
        var staffIds = rows.Where(x => x.StaffMemberId.HasValue).Select(x => x.StaffMemberId!.Value).Distinct().ToArray();
        var books = await db.LibraryBooks.AsNoTracking().Where(x => bookIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var students = await db.Students.IgnoreQueryFilters().AsNoTracking().Where(x => studentIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var staff = await db.StaffMembers.AsNoTracking().Where(x => staffIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);
        var result = rows.Select(loan =>
        {
            books.TryGetValue(loan.BookId, out var book);
            string? memberNumber = null; string? memberName = null;
            if (loan.StudentId.HasValue && students.TryGetValue(loan.StudentId.Value, out var student)) { memberNumber = student.StudentNumber; memberName = (student.LastName + " " + student.FirstName + " " + (student.OtherNames ?? "")).Trim().ToUpper(); }
            else if (loan.StaffMemberId.HasValue && staff.TryGetValue(loan.StaffMemberId.Value, out var staffMember)) { memberNumber = staffMember.StaffNumber; memberName = (staffMember.LastName + " " + staffMember.FirstName + " " + (staffMember.OtherNames ?? "")).Trim().ToUpper(); }
            return new { id = loan.Id, bookId = loan.BookId, bookTitle = book?.Title ?? "Unavailable book", bookIsbn = book?.Isbn ?? "", memberId = loan.StudentId ?? loan.StaffMemberId, memberType = loan.MemberType, memberNumber, memberName, studentId = loan.StudentId, studentNumber = memberNumber, studentName = memberName, issuedAtUtc = loan.IssuedAtUtc, dueAtUtc = loan.DueAtUtc, returnedAtUtc = loan.ReturnedAtUtc, fineAmount = loan.FineAmount };
        }).ToList();
        return Ok(result);
    }

    [HttpGet("loans/{studentId:guid}")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryLoanDto>> StudentLoans(Guid studentId, [FromQuery] bool activeOnly = false, CancellationToken ct = default) =>
        library.GetStudentLoansAsync(studentId, activeOnly, ct);

    [HttpGet("clearance/paid-students")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> PaidLibraryClearanceStudents(CancellationToken ct)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, ct);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        // Use the central Students register, matching Issue & Return Books.
        // Admission, programme and academic-year records enrich the row when
        // available, but missing admission metadata must not hide a student.
        var studentQuery =
            from student in db.Students.AsNoTracking()
            join admissionRow in db.Admissions.AsNoTracking()
                on student.AdmissionId equals admissionRow.Id into admissionRows
            from admission in admissionRows.DefaultIfEmpty()
            join programmeRow in db.Programmes.AsNoTracking()
                on (Guid?)admission!.ProgrammeId equals (Guid?)programmeRow.Id into programmeRows
            from programme in programmeRows.DefaultIfEmpty()
            join academicYearRow in db.AcademicYears.AsNoTracking()
                on (Guid?)admission!.AcademicYearId equals (Guid?)academicYearRow.Id into academicYearRows
            from academicYear in academicYearRows.DefaultIfEmpty()
            where !student.IsArchived
            select new
            {
                student.Id,
                student.StudentNumber,
                Name = (student.LastName + " " + student.FirstName + " " + (student.OtherNames ?? "")).Trim().ToUpper(),
                ProgrammeId = admission == null ? (Guid?)null : admission.ProgrammeId,
                ProgrammeName = programme == null ? null : programme.Name,
                ProgrammeCode = programme == null ? null : programme.Code,
                AcademicYearName = academicYear == null ? null : academicYear.Name,
                student.CampusId
            };

        if (accessibleCampuses is not null)
            studentQuery = studentQuery.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));

        var libraryStudents = await studentQuery.OrderBy(x => x.Name).ToListAsync(ct);
        if (libraryStudents.Count == 0) return Ok(Array.Empty<object>());

        var studentIds = libraryStudents.Select(x => x.Id).ToArray();
        var enrollments = await (
            from enrollment in db.StudentEnrollments.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on enrollment.ProgrammeId equals programme.Id
            where studentIds.Contains(enrollment.StudentId) && enrollment.Status == "Active"
            orderby enrollment.AdmissionDate descending
            select new
            {
                enrollment.StudentId,
                enrollment.CurrentYear,
                enrollment.ProgrammeId,
                ProgrammeCode = programme.Code,
                ProgrammeName = programme.Name
            }
        ).ToListAsync(ct);

        var academicStatuses = await (
            from status in db.StudentAcademicStatuses.AsNoTracking()
            join semester in db.Semesters.AsNoTracking() on status.SemesterId equals semester.Id
            where studentIds.Contains(status.StudentId)
            orderby semester.IsCurrent descending, semester.EndDate descending,
                status.YearOfStudy descending, semester.Sequence descending
            select new { status.StudentId, status.YearOfStudy, SemesterName = semester.Name, SemesterNumber = semester.Sequence }
        ).ToListAsync(ct);

        var currentSemester = await db.Semesters.AsNoTracking()
            .Where(x => x.IsCurrent)
            .OrderByDescending(x => x.Sequence)
            .Select(x => new { x.Name, x.Sequence })
            .FirstOrDefaultAsync(ct);

        var curriculumCourses = await (
            from curriculum in db.Curricula.AsNoTracking()
            join mapping in db.CurriculumCourses.AsNoTracking() on curriculum.Id equals mapping.CurriculumId
            join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
            join programme in db.Programmes.AsNoTracking() on curriculum.ProgrammeId equals programme.Id
            where curriculum.IsActive && course.IsActive && programme.IsActive
            select new { programme.Id, CourseName = course.Name }
        ).ToListAsync(ct);
        var coursesByProgramme = curriculumCourses.GroupBy(x => x.Id)
            .ToDictionary(x => x.Key, x => x.Select(item => item.CourseName).Distinct().OrderBy(name => name).ToArray());

        var requirementRows = await (
            from requirement in db.LibraryProgrammeRequirements.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on requirement.ProgrammeId equals programme.Id
            where requirement.IsActive
            select new { Requirement = requirement, ProgrammeCode = programme.Code }
        ).ToListAsync(ct);
        var activeRequirements = requirementRows.Select(x => x.Requirement).ToList();
        var requirementsByProgramme = activeRequirements
            .GroupBy(x => x.ProgrammeId)
            .ToDictionary(x => x.Key, x => x.OrderByDescending(item => item.UpdatedAtUtc).First());
        var requirementsByProgrammeCode = requirementRows
            .Where(x => !string.IsNullOrWhiteSpace(x.ProgrammeCode))
            .GroupBy(x => x.ProgrammeCode.Trim().ToUpperInvariant())
            .ToDictionary(
                x => x.Key,
                x => x.OrderByDescending(item => item.Requirement.UpdatedAtUtc).First().Requirement);
        var requirementIds = activeRequirements.Select(x => x.Id).ToArray();
        var paymentRows = await db.LibraryStudentPayments.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId) && requirementIds.Contains(x.RequirementId))
            .Select(x => new { x.StudentId, x.RequirementId, x.Amount })
            .ToListAsync(ct);
        var paidByStudentAndRequirement = paymentRows
            .GroupBy(x => (x.StudentId, x.RequirementId))
            .ToDictionary(x => x.Key, x => x.Sum(row => row.Amount));

        var enrollmentByStudent = enrollments.GroupBy(x => x.StudentId)
            .ToDictionary(x => x.Key, x => x.First());
        var statusByStudent = academicStatuses.GroupBy(x => x.StudentId)
            .ToDictionary(x => x.Key, x => x.First());
        var result = libraryStudents.Select(student =>
        {
            enrollmentByStudent.TryGetValue(student.Id, out var enrollment);
            statusByStudent.TryGetValue(student.Id, out var academicStatus);
            // Resolve requirements against both enrolment and admission programme links.
            SchoolManagement.Domain.Library.LibraryProgrammeRequirement? requirement = null;
            if (enrollment?.ProgrammeId is Guid enrolledProgrammeId)
                requirementsByProgramme.TryGetValue(enrolledProgrammeId, out requirement);
            if (requirement is null && student.ProgrammeId is Guid admittedProgrammeId)
                requirementsByProgramme.TryGetValue(admittedProgrammeId, out requirement);
            if (requirement is null && !string.IsNullOrWhiteSpace(enrollment?.ProgrammeCode))
                requirementsByProgrammeCode.TryGetValue(enrollment.ProgrammeCode.Trim().ToUpperInvariant(), out requirement);
            if (requirement is null && !string.IsNullOrWhiteSpace(student.ProgrammeCode))
                requirementsByProgrammeCode.TryGetValue(student.ProgrammeCode.Trim().ToUpperInvariant(), out requirement);
            var programmeId = requirement?.ProgrammeId ?? enrollment?.ProgrammeId ?? student.ProgrammeId;
            string[]? studentCourses = null;
            if (programmeId.HasValue)
                coursesByProgramme.TryGetValue(programmeId.Value, out studentCourses);
            var paidAmount = requirement is null ? 0m :
                paidByStudentAndRequirement.GetValueOrDefault((student.Id, requirement.Id), 0m);
            var requiredAmount = requirement?.Amount ?? 0m;
            var balance = Math.Max(0m, requiredAmount - paidAmount);
            var paymentStatus = requirement is null ? "Not Configured" :
                balance <= 0m ? "Paid" : paidAmount > 0m ? "Partially Paid" : "Not Paid";

            return new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = student.Name,
                programmeId,
                programmeName = enrollment?.ProgrammeName ?? student.ProgrammeName,
                courseNames = studentCourses ?? Array.Empty<string>(),
                classYear = academicStatus?.YearOfStudy ?? enrollment?.CurrentYear,
                semesterName = academicStatus?.SemesterName ?? currentSemester?.Name,
                semesterNumber = academicStatus?.SemesterNumber ?? currentSemester?.Sequence,
                academicYearName = student.AcademicYearName,
                paymentStatus,
                requirementId = requirement?.Id,
                amount = requiredAmount,
                requiredAmount,
                paidAmount,
                outstandingAmount = balance,
                currency = requirement?.Currency ?? "UGX",
                issuedAt = (DateTimeOffset?)null
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("clearance/academic-options")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> ClearanceAcademicOptions(CancellationToken ct)
    {
        var rows = await (
            from curriculum in db.Curricula.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on curriculum.ProgrammeId equals programme.Id
            join mapping in db.CurriculumCourses.AsNoTracking() on curriculum.Id equals mapping.CurriculumId
            join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
            where curriculum.IsActive && programme.IsActive && !programme.IsReferenceOnly && course.IsActive
            orderby programme.Name, mapping.YearOfStudy, mapping.SemesterNumber, course.Name
            select new
            {
                programmeId = programme.Id,
                programmeName = programme.Name,
                courseId = course.Id,
                courseName = course.Name,
                yearOfStudy = mapping.YearOfStudy,
                semesterNumber = mapping.SemesterNumber
            }).Distinct().ToListAsync(ct);

        // Read semester and academic-year options from the central Academic Structure
        // register. Curriculum mappings remain the source for course/year-of-study links.
        var semesters = await db.Semesters.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.AcademicYearId).ThenBy(x => x.Sequence)
            .Select(x => new { semesterId = x.Id, x.Name, x.Sequence, x.AcademicYearId, x.IsCurrent })
            .ToListAsync(ct);
        var academicYears = await db.AcademicYears.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.StartDate)
            .Select(x => new { academicYearId = x.Id, x.Name, x.IsCurrent })
            .ToListAsync(ct);

        return Ok(new
        {
            courses = rows.Select(x => new { x.courseId, x.courseName }).Distinct().OrderBy(x => x.courseName),
            programmes = await db.Programmes.AsNoTracking()
                .Where(x => x.IsActive && !x.IsReferenceOnly)
                .OrderBy(x => x.Name)
                .Select(x => new { programmeId = x.Id, programmeName = x.Name })
                .ToListAsync(ct),
            years = rows.Select(x => x.yearOfStudy).Distinct().OrderBy(x => x),
            semesters,
            academicYears,
            mappings = rows
        });
    }

    [HttpPost("students/{studentId:guid}/clearance")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ClearStudentLibraryRequirement(Guid studentId, LibraryClearanceRequest request, CancellationToken ct)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, ct)) return Forbid();
        var studentExists = await db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, ct);
        if (!studentExists) return NotFound(new { message = "Student was not found." });

        var method = request.Method?.Trim();
        if (!string.Equals(method, "BookIssued", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(method, "FeePaid", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Clearance method must be BookIssued or FeePaid." });

        if (string.Equals(method, "FeePaid", StringComparison.OrdinalIgnoreCase))
        {
            var enrollmentProgrammeId = await db.StudentEnrollments.AsNoTracking()
                .Where(x => x.StudentId == studentId && x.Status == "Active")
                .OrderByDescending(x => x.AdmissionDate)
                .Select(x => (Guid?)x.ProgrammeId)
                .FirstOrDefaultAsync(ct);
            var admissionId = await db.Students.AsNoTracking().Where(x => x.Id == studentId)
                .Select(x => x.AdmissionId).FirstOrDefaultAsync(ct);
            var admissionProgrammeId = admissionId.HasValue
                ? await db.Admissions.AsNoTracking().Where(x => x.Id == admissionId.Value)
                    .Select(x => (Guid?)x.ProgrammeId).FirstOrDefaultAsync(ct)
                : null;
            var programmeIds = new[] { enrollmentProgrammeId, admissionProgrammeId }
                .Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToArray();
            var requirement = programmeIds.Length > 0
                ? await db.LibraryProgrammeRequirements.AsNoTracking()
                    .Where(x => programmeIds.Contains(x.ProgrammeId) && x.IsActive)
                    .OrderBy(x => x.ProgrammeId == enrollmentProgrammeId ? 0 : 1)
                    .ThenByDescending(x => x.UpdatedAtUtc)
                    .FirstOrDefaultAsync(ct)
                : null;
            if (requirement is null)
                return Conflict(new { message = "No active Library course-book requirement is configured for this student." });
            var paid = await db.LibraryStudentPayments.AsNoTracking()
                .Where(x => x.StudentId == studentId && x.RequirementId == requirement.Id)
                .SumAsync(x => (decimal?)x.Amount, ct) ?? 0m;
            var outstanding = Math.Max(0m, requirement.Amount - paid);
            if (outstanding > 0m)
                return Conflict(new { message = $"Library book fee is not fully paid. Outstanding: {requirement.Currency} {outstanding:N2}." });
        }
        else if (string.IsNullOrWhiteSpace(request.Reference))
        {
            return BadRequest(new { message = "Record the book title or ISBN issued to the student." });
        }

        var clearance = await db.WorkflowInstances.SingleOrDefaultAsync(x =>
            x.EntityType == "StudentClearance" && x.EntityId == studentId &&
            x.WorkflowType == "Library", ct);
        if (clearance is null)
        {
            clearance = new WorkflowInstance
            {
                WorkflowType = "Library",
                EntityType = "StudentClearance",
                EntityId = studentId,
                CurrentState = "Cleared"
            };
            db.WorkflowInstances.Add(clearance);
        }
        clearance.CurrentState = "Cleared";
        clearance.IsCompleted = true;
        clearance.Comments = $"{method}: {request.Reference?.Trim()}";
        clearance.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { clearance.Id, office = clearance.WorkflowType, status = clearance.CurrentState, clearance.Comments, clearance.UpdatedAt });
    }

    [HttpGet("integrations")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public IActionResult Integrations()
    {
        var kohaUrl = configuration["LibraryIntegrations:Koha:BaseUrl"]?.Trim() ?? string.Empty;
        var dspaceUrl = configuration["LibraryIntegrations:DSpace:BaseUrl"]?.Trim() ?? string.Empty;
        return Ok(new
        {
            koha = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:Koha:Enabled") && Uri.TryCreate(kohaUrl, UriKind.Absolute, out _), baseUrl = kohaUrl },
            dspace = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:DSpace:Enabled") && Uri.TryCreate(dspaceUrl, UriKind.Absolute, out _), baseUrl = dspaceUrl }
        });
    }

    [HttpPost("books")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> AddBook(CreateLibraryBookRequest request, CancellationToken ct)
    {
        try { return Ok(await library.AddBookAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPut("books/{id:guid}")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> UpdateBook(Guid id, CreateLibraryBookRequest request, CancellationToken ct)
    {
        try { return Ok(await library.UpdateBookAsync(id, request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpDelete("books/{id:guid}")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ArchiveBook(Guid id, CancellationToken ct)
    {
        var exists = await db.LibraryBooks.AsNoTracking().AnyAsync(x => x.Id == id && x.IsActive, ct);
        if (!exists) return NotFound(new { message = "The catalogue book was not found." });
        var hasActiveLoans = await db.LibraryLoans.AsNoTracking()
            .AnyAsync(x => x.BookId == id && x.ReturnedAtUtc == null, ct);
        if (hasActiveLoans)
            return Conflict(new { message = "This book cannot be archived while copies are on loan. Process the active returns first." });
        try
        {
            await library.ArchiveBookAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPost("loans")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Issue(IssueLibraryBookRequest request, CancellationToken ct)
    {
        try { return Ok(await library.IssueBookAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("loans/{id:guid}/return")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Return(Guid id, [FromQuery] decimal finePerOverdueDay = 1000m, CancellationToken ct = default)
    {
        try { return Ok(await library.ReturnBookAsync(id, new ReturnLibraryBookRequest(finePerOverdueDay), ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}

public sealed record SetLibraryProgrammeRequirementRequest(Guid ProgrammeId, string Name, decimal Amount, string? Currency = null);

public sealed record LibraryClearanceRequest(string Method, string? Reference = null);
public sealed record RecordLibraryPaymentRequest(decimal Amount);
