using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Library;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;
using SchoolManagement.Domain.Workflows;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(
    LibraryWorkflowService library,
    FinanceWorkflowService finance,
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
            if (!string.IsNullOrWhiteSpace(term))
                students = students.Where(x => x.StudentNumber.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || (x.OtherNames != null && x.OtherNames.Contains(term)));
            members.AddRange(await students.OrderBy(x => x.StudentNumber).Select(x => new
            {
                id = x.Id, memberType = "Student", memberNumber = x.StudentNumber,
                name = (x.FirstName + " " + (x.OtherNames ?? "") + " " + x.LastName).Trim()
            }).ToListAsync(ct));
        }
        if (includeStaff)
        {
            var staff = db.StaffMembers.AsNoTracking().Where(x => x.IsActive && x.EmploymentStatus == "Active");
            if (!string.IsNullOrWhiteSpace(term))
                staff = staff.Where(x => x.StaffNumber.Contains(term) || x.FirstName.Contains(term) || x.LastName.Contains(term) || (x.OtherNames != null && x.OtherNames.Contains(term)));
            members.AddRange(await staff.OrderBy(x => x.StaffNumber).Select(x => new
            {
                id = x.Id, memberType = "Staff", memberNumber = x.StaffNumber,
                name = (x.FirstName + " " + (x.OtherNames ?? "") + " " + x.LastName).Trim()
            }).ToListAsync(ct));
        }
        return Ok(members.OrderBy(x => ((dynamic)x).name));
    }

    // Librarians own course-specific book purchase/fee requirements. These are stored
    // as ordinary programme fee structures so Finance can invoice and receipt them.
    [HttpGet("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ProgrammeRequirements(CancellationToken ct)
    {
        var requirements = await db.FeeStructures.AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.FeeType == "LibraryBook")
            .OrderBy(x => x.Name)
            .ToListAsync(ct);
        return Ok(requirements);
    }

    [HttpPost("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirement(SetLibraryProgrammeRequirementRequest request, CancellationToken ct)
    {
        if (request.ProgrammeId == Guid.Empty) return BadRequest(new { message = "Select a course/programme." });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Requirement name is required." });
        if (request.Amount <= 0) return BadRequest(new { message = "The book fee must be greater than zero." });
        if (!await db.Programmes.AnyAsync(x => x.Id == request.ProgrammeId && x.IsActive, ct))
            return BadRequest(new { message = "The selected programme is not active." });

        string currency;
        try
        {
            var defaultCurrency = (await institutionSettings.GetSystemCurrencyAsync(ct)).Code;
            currency = SchoolManagement.Domain.Finance.MoneyMath.NormalizeCurrency(string.IsNullOrWhiteSpace(request.Currency) ? defaultCurrency : request.Currency);
            SchoolManagement.Domain.Finance.MoneyMath.EnsurePrecision(request.Amount, currency);
        }
        catch (Exception ex) when (ex is ArgumentException or NotSupportedException)
        {
            return BadRequest(new { message = ex.Message });
        }
        // Keep one active Library requirement per programme so a student is never
        // billed twice for competing versions of the same course book policy.
        var previousRequirements = await db.FeeStructures
            .Where(x => x.ProgrammeId == request.ProgrammeId && x.FeeType == "LibraryBook" && x.IsActive)
            .ToListAsync(ct);
        foreach (var previous in previousRequirements) previous.IsActive = false;

        // Reuse an existing same-name policy rather than violating the unique
        // programme/year/name index when the librarian revises its amount.
        var structure = await db.FeeStructures.Include(x => x.Items)
            .SingleOrDefaultAsync(x => x.ProgrammeId == request.ProgrammeId &&
                x.AcademicYearId == Guid.Empty && x.Name == request.Name.Trim(), ct);
        if (structure is null)
        {
            structure = new SchoolManagement.Domain.Finance.FeeStructure
            {
                ProgrammeId = request.ProgrammeId,
                AcademicYearId = Guid.Empty,
                Name = request.Name.Trim(),
                FeeType = "LibraryBook",
                Currency = currency
            };
            db.FeeStructures.Add(structure);
        }
        else
        {
            db.FeeStructureItems.RemoveRange(structure.Items);
            structure.Items.Clear();
            structure.Currency = currency;
            structure.FeeType = "LibraryBook";
            structure.IsActive = true;
        }
        structure.Items.Add(new SchoolManagement.Domain.Finance.FeeStructureItem
        {
            FeeStructureId = structure.Id,
            Code = "LIB-BOOK",
            Name = request.Name.Trim(),
            Amount = request.Amount,
            Currency = currency,
            SortOrder = 1,
            IsOptional = false
        });
        structure.RecalculateTotal();
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.SaveChangesAsync(ct);

        // Also catch currently enrolled students who were admitted before this
        // programme's Library requirement was configured.
        var enrolledStudentIds = await db.StudentEnrollments.AsNoTracking()
            .Where(x => x.ProgrammeId == request.ProgrammeId && x.Status == "Active")
            .Select(x => x.StudentId)
            .Distinct()
            .ToListAsync(ct);
        foreach (var studentId in enrolledStudentIds)
        {
            var alreadyInvoiced = await db.StudentInvoices.AnyAsync(
                x => x.StudentId == studentId && x.FeeStructureId == structure.Id, ct);
            if (alreadyInvoiced) continue;
            await finance.CreateInvoiceAsync(studentId, structure.Id, $"LIB-{Guid.NewGuid():N}", ct);
        }
        await transaction.CommitAsync(ct);
        return Created($"/api/library/programme-requirements/{structure.Id}", structure);
    }

    [HttpPatch("programme-requirements/{id:guid}/active")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirementActive(Guid id, [FromQuery] bool active, CancellationToken ct)
    {
        var requirement = await db.FeeStructures.SingleOrDefaultAsync(x => x.Id == id && x.FeeType == "LibraryBook", ct);
        if (requirement is null) return NotFound();
        requirement.IsActive = active;
        await db.SaveChangesAsync(ct);
        return Ok(new { requirement.Id, requirement.IsActive });
    }

    [HttpGet("books/{id:guid}/barcode")]
    [AllowAnonymous]
    public IActionResult GetBookBarcode(Guid id)
    {
        var barcode = BarcodeHelper.GenerateSvg(id.ToString());
        return Content(barcode, "image/svg+xml");
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
            string? memberNumber = null;
            string? memberName = null;
            if (loan.StudentId.HasValue && students.TryGetValue(loan.StudentId.Value, out var student))
            {
                memberNumber = student.StudentNumber;
                memberName = (student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName).Trim();
            }
            else if (loan.StaffMemberId.HasValue && staff.TryGetValue(loan.StaffMemberId.Value, out var staffMember))
            {
                memberNumber = staffMember.StaffNumber;
                memberName = (staffMember.FirstName + " " + (staffMember.OtherNames ?? "") + " " + staffMember.LastName).Trim();
            }
            return new
            {
                id = loan.Id, bookId = loan.BookId, bookTitle = book?.Title ?? "Unavailable book",
                bookIsbn = book?.Isbn ?? "", memberId = loan.StudentId ?? loan.StaffMemberId,
                memberType = loan.MemberType, memberNumber, memberName,
                issuedAtUtc = loan.IssuedAtUtc, dueAtUtc = loan.DueAtUtc,
                returnedAtUtc = loan.ReturnedAtUtc, fineAmount = loan.FineAmount
            };
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
                Name = (student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName).Trim(),
                ProgrammeId = admission == null ? (Guid?)null : admission.ProgrammeId,
                ProgrammeName = programme == null ? null : programme.Name,
                AcademicYearName = academicYear == null ? null : academicYear.Name,
                student.CampusId
            };

        if (accessibleCampuses is not null)
            studentQuery = studentQuery.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));

        var libraryStudents = await studentQuery.OrderBy(x => x.Name).ToListAsync(ct);
        if (libraryStudents.Count == 0) return Ok(Array.Empty<object>());

        var studentIds = libraryStudents.Select(x => x.Id).ToArray();
        var enrollments = await db.StudentEnrollments.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId) && x.Status == "Active")
            .OrderByDescending(x => x.AdmissionDate)
            .Select(x => new { x.StudentId, x.CurrentYear })
            .ToListAsync(ct);

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

        var libraryInvoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => studentIds.Contains(x.StudentId) && x.FeeType == "LibraryBook")
            .OrderByDescending(x => x.IssuedAt)
            .Select(x => new
            {
                x.StudentId, x.InvoiceNumber, x.Amount, x.DiscountAmount,
                x.PaidAmount, x.Currency, x.IssuedAt
            })
            .ToListAsync(ct);

        var enrollmentByStudent = enrollments.GroupBy(x => x.StudentId)
            .ToDictionary(x => x.Key, x => x.First());
        var statusByStudent = academicStatuses.GroupBy(x => x.StudentId)
            .ToDictionary(x => x.Key, x => x.First());
        var invoiceByStudent = libraryInvoices.GroupBy(x => x.StudentId)
            .ToDictionary(x => x.Key, x => x.First());

        var result = libraryStudents.Select(student =>
        {
            enrollmentByStudent.TryGetValue(student.Id, out var enrollment);
            statusByStudent.TryGetValue(student.Id, out var academicStatus);
            invoiceByStudent.TryGetValue(student.Id, out var invoice);
            string[]? studentCourses = null;
            if (student.ProgrammeId.HasValue)
                coursesByProgramme.TryGetValue(student.ProgrammeId.Value, out studentCourses);
            var balance = invoice is null ? (decimal?)null : invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount;
            var paymentStatus = invoice is null ? "Not Invoiced" :
                balance <= 0m ? "Paid" :
                invoice.PaidAmount > 0m ? "Partially Paid" : "Not Paid";

            return new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = student.Name,
                programmeName = student.ProgrammeName,
                courseNames = studentCourses ?? Array.Empty<string>(),
                classYear = academicStatus?.YearOfStudy ?? enrollment?.CurrentYear,
                semesterName = academicStatus?.SemesterName ?? currentSemester?.Name,
                semesterNumber = academicStatus?.SemesterNumber ?? currentSemester?.Sequence,
                academicYearName = student.AcademicYearName,
                paymentStatus,
                invoiceNumber = invoice?.InvoiceNumber,
                amount = invoice?.Amount ?? 0m,
                paidAmount = invoice?.PaidAmount ?? 0m,
                outstandingAmount = balance ?? 0m,
                currency = invoice?.Currency ?? "UGX",
                issuedAt = invoice?.IssuedAt
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
            var libraryInvoices = db.StudentInvoices.AsNoTracking()
                .Where(x => x.StudentId == studentId && x.FeeType == "LibraryBook");
            if (!await libraryInvoices.AnyAsync(ct))
                return Conflict(new { message = "No Library book-fee invoice exists for this student. The Librarian must configure the course requirement first." });
            var invoiceBalances = await libraryInvoices
                .Select(x => new { x.Currency, Outstanding = x.Amount - x.DiscountAmount - x.PaidAmount })
                .ToListAsync(ct);
            var outstandingByCurrency = invoiceBalances
                .GroupBy(x => string.IsNullOrWhiteSpace(x.Currency) ? "UGX" : x.Currency.Trim().ToUpperInvariant())
                .Select(group => new { Currency = group.Key, Amount = group.Sum(x => x.Outstanding) })
                .Where(x => x.Amount > 0m)
                .ToList();
            if (outstandingByCurrency.Count > 0)
            {
                var amounts = string.Join(", ", outstandingByCurrency.Select(x => $"{x.Currency} {x.Amount:N0}"));
                return Conflict(new { message = $"Library book fee is not fully paid. Outstanding: {amounts}." });
            }
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
