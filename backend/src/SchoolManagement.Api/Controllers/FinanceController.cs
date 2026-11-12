using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/finance")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class FinanceController(FinanceWorkflowService finance, InvoiceDiscountService discounts, InvoiceInstallmentService installments, StudentChargeService charges, CreditNoteRefundService adjustments, FinanceReportService reports, CashBankPositionReportService cashBankPosition, ReceivablesReportService receivables, JournalReversalService reversals, SchoolManagementDbContext db, CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices([FromQuery] string? studentId, CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        if (string.IsNullOrWhiteSpace(studentId))
        {
            var invoiceQuery = db.StudentInvoices.AsNoTracking();
            if (accessibleCampuses is not null)
                invoiceQuery = invoiceQuery.Where(x => db.Students.Any(s => s.Id == x.StudentId && s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value)));
            var invoices = await invoiceQuery
                .OrderByDescending(x => x.IssuedAt)
                .Select(x => new
                {
                    x.Id,
                    x.StudentId,
                    x.InvoiceNumber,
                    x.FeeType,
                    x.Amount,
                    x.PaidAmount,
                    balance = Math.Max(0m, x.Amount - x.DiscountAmount - x.PaidAmount),
                    x.Currency,
                    x.Status,
                    x.IssuedAt
                })
                .ToListAsync(cancellationToken);
            return Ok(invoices);
        }

        var value = studentId.Trim();
        var student = Guid.TryParse(value, out var parsedId)
            ? await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == parsedId, cancellationToken)
            : await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.StudentNumber == value, cancellationToken);

        if (student is null) return NotFound(new { message = "Student was not found." });
        if (!await campusAccess.CanAccessStudentAsync(User, student.Id, cancellationToken)) return Forbid();

        return Ok(await finance.GetStudentInvoicesAsync(student.Id, cancellationToken));
    }

    // Compatibility endpoints for older frontend builds. The canonical accounts-overview
    // endpoints remain available, while these aliases prevent stale clients from receiving 404s.
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardCompatibility(CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var invoices = db.StudentInvoices.AsNoTracking().AsQueryable();
        var payments = db.Payments.AsNoTracking().AsQueryable();
        if (accessibleCampuses is not null)
        {
            invoices = invoices.Where(x => db.Students.Any(s => s.Id == x.StudentId && s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value)));
            payments = payments.Where(x => db.Students.Any(s => s.Id == x.StudentId && s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value)));
        }
        var invoiceTotals = await invoices.GroupBy(x => x.Currency)
            .Select(group => new
            {
                currency = group.Key,
                billed = group.Sum(x => x.Amount > x.DiscountAmount ? x.Amount - x.DiscountAmount : 0m),
                paid = group.Sum(x => x.PaidAmount)
            }).ToListAsync(cancellationToken);
        var todayUtc = DateTimeOffset.UtcNow.Date;
        var tomorrowUtc = todayUtc.AddDays(1);
        var collectionTotals = await payments.Where(p => p.PaidAt >= todayUtc && p.PaidAt < tomorrowUtc)
            .GroupBy(p => p.Currency)
            .Select(group => new { currency = group.Key, amount = group.Sum(x => x.Amount) })
            .ToListAsync(cancellationToken);
        var defaultCurrencyTotals = invoiceTotals.FirstOrDefault(x => x.currency == "UGX");
        var totalBilled = defaultCurrencyTotals?.billed ?? 0m;
        var totalPaid = defaultCurrencyTotals?.paid ?? 0m;
        var todayCollection = collectionTotals.FirstOrDefault(x => x.currency == "UGX")?.amount ?? 0m;

        return Ok(new
        {
            totalBilled,
            totalPaid,
            totalOutstanding = Math.Max(0m, totalBilled - totalPaid),
            todayCollection,
            currency = "UGX",
            totalsByCurrency = invoiceTotals.Select(x => new { x.currency, x.billed, x.paid, balance = Math.Max(0m, x.billed - x.paid) }),
            collectionsByCurrency = collectionTotals,
            invoiceCount = await invoices.LongCountAsync(cancellationToken),
            paymentCount = await payments.LongCountAsync(cancellationToken),
            outstandingCount = await invoices.LongCountAsync(x => x.Amount - x.DiscountAmount - x.PaidAmount > 0, cancellationToken)
        });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPaymentsCompatibility([FromQuery] Guid? studentId, CancellationToken cancellationToken)
    {
        var query =
            from payment in db.Payments.AsNoTracking()
            join student in db.Students.IgnoreQueryFilters().AsNoTracking() on payment.StudentId equals student.Id
            join invoice in db.StudentInvoices.AsNoTracking() on payment.StudentInvoiceId equals invoice.Id into invoices
            from invoice in invoices.DefaultIfEmpty()
            select new { payment, student, invoice };

        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        if (accessibleCampuses is not null)
            query = query.Where(x => x.student.CampusId.HasValue && accessibleCampuses.Contains(x.student.CampusId.Value));
        if (studentId.HasValue) query = query.Where(x => x.payment.StudentId == studentId.Value);

        return Ok(await query
            .OrderByDescending(x => x.payment.PaidAt)
            .Select(x => new
            {
                x.payment.Id,
                x.payment.ReceiptNumber,
                x.payment.Amount,
                x.payment.Currency,
                x.payment.PaymentMethod,
                x.payment.PaymentSource,
                x.payment.Reference,
                x.payment.PaidAt,
                studentName = (x.student.LastName + " " + x.student.FirstName + (x.student.OtherNames == null || x.student.OtherNames == "" ? "" : " " + x.student.OtherNames)).ToUpper(),
                invoiceNumber = x.invoice == null ? null : x.invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken));
    }

    [HttpGet("reports/outstanding-balances")]
    public async Task<IActionResult> GetOutstandingBalancesCompatibility(CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var dataQuery = (
            from invoice in db.StudentInvoices.AsNoTracking()
            join student in db.Students.AsNoTracking() on invoice.StudentId equals student.Id
            join fee in db.FeeStructures.AsNoTracking() on invoice.FeeStructureId equals fee.Id into fees
            from fee in fees.DefaultIfEmpty()
            where invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount > 0
            select new
            {
                studentId = student.Id,
                studentNumber = student.StudentNumber,
                studentName = (student.LastName + " " + student.FirstName + (student.OtherNames == null || student.OtherNames == "" ? "" : " " + student.OtherNames)).ToUpper(),
                programmeName = fee == null ? invoice.FeeType : fee.Name,
                amount = invoice.Amount,
                paidAmount = invoice.PaidAmount,
                balance = Math.Max(0m, invoice.Amount - invoice.DiscountAmount - invoice.PaidAmount),
                invoice.Currency,
                invoice.Status
            });
        if (accessibleCampuses is not null)
            dataQuery = dataQuery.Where(x => db.Students.Any(s => s.Id == x.studentId && s.CampusId.HasValue && accessibleCampuses.Contains(s.CampusId.Value)));
        var data = await dataQuery.ToListAsync(cancellationToken);
        return Ok(data);
    }
    [HttpGet("students")]
    public async Task<IActionResult> GetFinanceStudents([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var query = db.Students.AsNoTracking().Where(x => !x.IsArchived);
        if (accessibleCampuses is not null)
            query = query.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.StudentNumber.ToLower().Contains(term) ||
                x.FirstName.ToLower().Contains(term) ||
                x.LastName.ToLower().Contains(term) ||
                (x.OtherNames != null && x.OtherNames.ToLower().Contains(term)));
        }

        var studentRows = await query.OrderBy(x => x.StudentNumber)
            .Select(x => new
            {
                x.Id,
                x.StudentNumber,
                name = (x.LastName + " " + x.FirstName + (x.OtherNames == null || x.OtherNames == "" ? "" : " " + x.OtherNames)).ToUpper(),
                x.Status,
                invoiceCount = db.StudentInvoices.Count(invoice => invoice.StudentId == x.Id),
                billed = db.StudentInvoices.Where(invoice => invoice.StudentId == x.Id)
                    .Sum(invoice => (decimal?)(invoice.Amount - invoice.DiscountAmount)) ?? 0m,
                paid = db.StudentInvoices.Where(invoice => invoice.StudentId == x.Id)
                    .Sum(invoice => (decimal?)invoice.PaidAmount) ?? 0m
            })
            .ToListAsync(cancellationToken);

        if (studentRows.Count == 0) return Ok(Array.Empty<object>());

        var studentIds = studentRows.Select(x => x.Id).ToArray();
        var enrollments = await (
            from enrollment in db.StudentEnrollments.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on enrollment.ProgrammeId equals programme.Id
            join intake in db.Intakes.AsNoTracking() on enrollment.IntakeId equals intake.Id
            where studentIds.Contains(enrollment.StudentId)
            orderby enrollment.Status == "Active" descending, enrollment.AdmissionDate descending
            select new
            {
                enrollment.StudentId,
                ProgrammeCode = programme.Code,
                ProgrammeName = programme.Name,
                IntakeCode = intake.Code,
                IntakeName = intake.Name,
                enrollment.CurrentYear,
                EnrollmentStatus = enrollment.Status
            })
            .ToListAsync(cancellationToken);

        var currentAcademicPeriod = await (
            from semester in db.Semesters.AsNoTracking()
            join academicYear in db.AcademicYears.AsNoTracking() on semester.AcademicYearId equals academicYear.Id
            where semester.IsCurrent && academicYear.IsCurrent
            orderby semester.Sequence descending
            select new
            {
                SemesterName = semester.Name,
                AcademicYearName = academicYear.Name
            })
            .FirstOrDefaultAsync(cancellationToken);

        var academicStatuses = await (
            from status in db.StudentAcademicStatuses.AsNoTracking()
            join semester in db.Semesters.AsNoTracking() on status.SemesterId equals semester.Id
            join academicYear in db.AcademicYears.AsNoTracking() on semester.AcademicYearId equals academicYear.Id
            where studentIds.Contains(status.StudentId)
            orderby academicYear.IsCurrent descending, semester.IsCurrent descending,
                semester.EndDate descending, status.YearOfStudy descending, semester.Sequence descending
            select new
            {
                status.StudentId,
                status.YearOfStudy,
                status.Status,
                SemesterName = semester.Name,
                AcademicYearName = academicYear.Name
            })
            .ToListAsync(cancellationToken);

        var enrollmentByStudent = enrollments
            .GroupBy(x => x.StudentId)
            .ToDictionary(group => group.Key, group => group.First());
        var academicStatusByStudent = academicStatuses
            .GroupBy(x => x.StudentId)
            .ToDictionary(group => group.Key, group => group.First());

        var students = studentRows.Select(student =>
        {
            enrollmentByStudent.TryGetValue(student.Id, out var enrollment);
            academicStatusByStudent.TryGetValue(student.Id, out var academicStatus);
            return new
            {
                student.Id,
                student.StudentNumber,
                student.name,
                student.Status,
                student.invoiceCount,
                student.billed,
                student.paid,
                programmeCode = enrollment?.ProgrammeCode,
                programmeName = enrollment?.ProgrammeName,
                intakeCode = enrollment?.IntakeCode,
                intakeName = enrollment?.IntakeName,
                classYear = academicStatus?.YearOfStudy ?? enrollment?.CurrentYear,
                semesterName = academicStatus?.SemesterName ?? currentAcademicPeriod?.SemesterName,
                academicYearName = academicStatus?.AcademicYearName ?? currentAcademicPeriod?.AcademicYearName,
                academicStatus = academicStatus?.Status,
                enrollmentStatus = enrollment?.EnrollmentStatus
            };
        }).ToList();

        return Ok(students);
    }

    [HttpGet("students/profile")]
    public async Task<IActionResult> GetStudentProfile([FromQuery] string studentIdOrNumber, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(studentIdOrNumber)) return BadRequest(new { message = "Student ID or number is required." });
        var value = studentIdOrNumber.Trim();
        var student = Guid.TryParse(value, out var id)
            ? await db.Students.IgnoreQueryFilters().AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken)
            : await db.Students.IgnoreQueryFilters().AsNoTracking().SingleOrDefaultAsync(x => x.StudentNumber == value, cancellationToken);
        if (student is null) return NotFound(new { message = "Student was not found." });
        if (!await campusAccess.CanAccessStudentAsync(User, student.Id, cancellationToken)) return Forbid();
        return Ok(new { student.Id, student.StudentNumber, name = string.Join(" ", new[] { student.LastName, student.FirstName, student.OtherNames }.Where(x => !string.IsNullOrWhiteSpace(x))), student.PhoneNumber, student.Email, student.Status });
    }

    [HttpGet("students/{studentId:guid}/statement")]
    public async Task<IActionResult> GetStudentFinancialStatement(Guid studentId, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();

        var invoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IssuedAt)
            .Select(x => new
            {
                x.Id,
                x.InvoiceNumber,
                x.FeeType,
                x.Amount,
                x.DiscountAmount,
                NetAmount = x.Amount - x.DiscountAmount,
                x.PaidAmount,
                balance = Math.Max(0m, x.Amount - x.DiscountAmount - x.PaidAmount),
                x.Currency,
                x.Status,
                x.IssuedAt,
                lines = x.Lines.OrderBy(line => line.SortOrder).Select(line => new
                {
                    line.Id,
                    line.Code,
                    line.Description,
                    line.Amount,
                    line.Currency,
                    line.IncomeAccountId,
                    line.SortOrder
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        var payments = await (
            from payment in db.Payments.AsNoTracking()
            join invoice in db.StudentInvoices.AsNoTracking()
                on payment.StudentInvoiceId equals invoice.Id into invoiceGroup
            from invoice in invoiceGroup.DefaultIfEmpty()
            where payment.StudentId == studentId
            orderby payment.PaidAt descending
            select new
            {
                payment.Id,
                payment.ReceiptNumber,
                payment.Amount,
                payment.Currency,
                payment.PaymentMethod,
                payment.PaymentSource,
                payment.SourceChannel,
                payment.ProviderTransactionId,
                payment.Reference,
                payment.PaidAt,
                studentInvoiceId = payment.StudentInvoiceId,
                invoiceNumber = invoice == null ? null : invoice.InvoiceNumber
            })
            .ToListAsync(cancellationToken);

        var totalsByCurrency = invoices
            .GroupBy(x => x.Currency)
            .Select(group => new
            {
                currency = group.Key,
                billed = group.Sum(x => x.NetAmount),
                paid = group.Sum(x => x.PaidAmount),
                balance = group.Sum(x => x.balance)
            })
            .ToList();

        return Ok(new
        {
            studentId,
            currency = totalsByCurrency.Count == 1 ? totalsByCurrency[0].currency : totalsByCurrency.Count == 0 ? "UGX" : "MULTI",
            totalsByCurrency,
            invoices,
            payments,
            paymentAllocationGranularity = "INVOICE",
            itemAllocationNote = "Payments are recorded against invoices, not individual invoice lines. Item-level paid amounts are therefore not calculated or apportioned."
        });
    }

    [HttpGet("mobile-money")]
    public async Task<IActionResult> GetMobileMoneyTransactions([FromQuery] string? status, CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();

        var query = db.MobileMoneyTransactions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim();
            if (normalizedStatus is not ("Pending" or "Completed" or "Cancelled"))
                return BadRequest(new { message = "Unsupported mobile-money status filter." });
            query = query.Where(x => x.Status == normalizedStatus);
        }

        if (accessibleCampuses is not null)
            query = query.Where(x => db.Students.Any(student => student.Id == x.StudentId &&
                student.CampusId.HasValue && accessibleCampuses.Contains(student.CampusId.Value)));

        var transactions = await query.OrderByDescending(x => x.RequestedAt)
            .Take(100)
            .Select(x => new
            {
                x.Id, studentId = x.StudentId, x.StudentInvoiceId, x.TransactionRef,
                x.Provider, x.PhoneNumber, x.Amount, x.Currency, x.Status,
                x.ExternalRef, x.ErrorMessage, x.RequestedAt, x.CompletedAt
            })
            .ToListAsync(cancellationToken);
        return Ok(transactions);
    }

    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("mobile-money")]
    [ValidateAntiForgeryToken]
    public IActionResult CreateMobileMoneyTransaction(CreateMobileMoneyTransactionRequest request)
        => StatusCode(StatusCodes.Status410Gone, new
        {
            message = "Direct MTN/Airtel initiation is disabled. Use SchoolPay for provider payments or record a Manual payment."
        });

    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("mobile-money/{transactionId:guid}/confirm")]
    [ValidateAntiForgeryToken]
    public IActionResult ConfirmMobileMoneyTransaction(Guid transactionId, ConfirmMobileMoneyTransactionRequest request)
        => StatusCode(StatusCodes.Status410Gone, new
        {
            message = "Staff-entered mobile-money references are not proof of payment. Verify the transaction through SchoolPay or record an authorised Manual payment."
        });

    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpDelete("mobile-money/{transactionId:guid}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CancelMobileMoneyTransaction(Guid transactionId, CancellationToken cancellationToken)
    {
        var transaction = await db.MobileMoneyTransactions.SingleOrDefaultAsync(x => x.Id == transactionId, cancellationToken);
        if (transaction is null) return NotFound(new { message = "Mobile-money transaction was not found." });
        if (!await campusAccess.CanAccessStudentAsync(User, transaction.StudentId, cancellationToken)) return Forbid();
        if (transaction.Status != "Pending") return Conflict(new { message = "Only pending mobile-money transactions can be cancelled." });
        transaction.Status = "Cancelled";
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("administration/accounts")]
    public async Task<IActionResult> GetFinanceAccounts(CancellationToken cancellationToken)
    {
        var accounts = await db.Accounts.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.AccountType).ThenBy(x => x.Code)
            .Select(x => new { x.Id, x.Code, x.Name, x.AccountType })
            .ToListAsync(cancellationToken);
        return Ok(accounts);
    }

    [HttpGet("administration/fee-structures")]
    public async Task<IActionResult> GetFeeStructures([FromQuery] Guid? academicYearId, CancellationToken cancellationToken)
    {
        var query = db.FeeStructures.AsNoTracking().Include(x => x.Items).AsQueryable();
        if (academicYearId.HasValue) query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        return Ok(await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken));
    }

    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    [HttpPost("administration/fee-structures")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateFeeStructure(CreateFeeStructureRequest request, CancellationToken cancellationToken)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Fee name is required." });
            if (string.IsNullOrWhiteSpace(request.FeeType)) return BadRequest(new { message = "Fee type is required." });
            if (request.Items is null || request.Items.Count == 0) return BadRequest(new { message = "At least one fee item is required." });
            if (request.Items.Any(x => x.Amount <= 0)) return BadRequest(new { message = "Every fee item must have a positive amount." });
            if (request.Items.GroupBy(x => x.Code.Trim(), StringComparer.OrdinalIgnoreCase).Any(g => g.Count() > 1)) return BadRequest(new { message = "Fee item codes must be unique." });

            var structure = new SchoolManagement.Domain.Finance.FeeStructure
            {
                ProgrammeId = request.ProgrammeId ?? Guid.Empty,
                AcademicYearId = request.AcademicYearId ?? Guid.Empty,
                Name = request.Name.Trim(),
                FeeType = request.FeeType.Trim(),
                Currency = (request.Currency ?? "UGX").Trim().ToUpperInvariant()
            };

            foreach (var item in request.Items.OrderBy(x => x.SortOrder))
            {
                structure.Items.Add(new SchoolManagement.Domain.Finance.FeeStructureItem
                {
                    FeeStructureId = structure.Id,
                    Code = item.Code.Trim(),
                    Name = item.Name.Trim(),
                    Amount = decimal.Round(item.Amount, 2, MidpointRounding.AwayFromZero),
                    Currency = structure.Currency,
                    IncomeAccountId = item.IncomeAccountId,
                    SortOrder = item.SortOrder,
                    IsOptional = item.IsOptional
                });
            }
            structure.RecalculateTotal();
            if (structure.TotalAmount <= 0) return BadRequest(new { message = "Fee structure total must be greater than zero." });

            db.FeeStructures.Add(structure);
            await db.SaveChangesAsync(cancellationToken);
            return Created($"/api/finance/administration/fee-structures/{structure.Id}", structure);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    [HttpPost("administration/fee-structures/{feeStructureId:guid}/apply")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ApplyFeeStructure(Guid feeStructureId, ApplyFeeStructureRequest request, CancellationToken cancellationToken)
    {
        var fee = await db.FeeStructures.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);
        if (fee is null) return NotFound(new { message = "Active fee structure was not found." });

        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var studentIds = request.StudentIds?.Where(x => x != Guid.Empty).Distinct().ToArray();
        if (request.AllActiveStudents)
        {
            var activeStudents = db.Students.AsNoTracking().Where(x => x.Status == "Active");
            if (accessibleCampuses is not null)
                activeStudents = activeStudents.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));
            studentIds = await activeStudents.Select(x => x.Id).ToArrayAsync(cancellationToken);
        }
        else if (studentIds is not null && accessibleCampuses is not null)
        {
            var allowedCount = await db.Students.AsNoTracking()
                .CountAsync(x => studentIds.Contains(x.Id) && x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value), cancellationToken);
            if (allowedCount != studentIds.Length) return Forbid();
        }
        if (studentIds is null || studentIds.Length == 0) return BadRequest(new { message = "Select at least one student from your assigned campus or apply to all active students at your campus." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var applied = 0;
        var skipped = 0;
        try
        {
            foreach (var studentId in studentIds)
            {
                var alreadyApplied = await db.StudentInvoices.AnyAsync(x => x.StudentId == studentId && x.FeeStructureId == fee.Id, cancellationToken);
                if (alreadyApplied) { skipped++; continue; }

                var studentNumber = await db.Students.AsNoTracking().Where(x => x.Id == studentId).Select(x => x.StudentNumber).SingleOrDefaultAsync(cancellationToken);
                if (studentNumber is null) { skipped++; continue; }

                var guid = Guid.NewGuid();
                var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{studentNumber}-{guid:N}"[..Math.Min(50, $"INV-{DateTime.UtcNow:yyyyMMdd}-{studentNumber}-{guid:N}".Length)];
                await finance.CreateInvoiceAsync(studentId, fee.Id, invoiceNumber, cancellationToken);
                applied++;
            }
            await transaction.CommitAsync(cancellationToken);
            return Ok(new { feeStructureId, applied, skipped, totalRequested = studentIds.Length });
        }
        catch (ArgumentException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return BadRequest(new { message = ex.Message, applied, skipped });
        }
        catch (InvalidOperationException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Conflict(new { message = ex.Message, applied, skipped });
        }
    }

    [HttpGet("students/{studentId:guid}/ledger")]
    public async Task<IActionResult> GetStudentLedger(Guid studentId, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        return Ok(await finance.GetStudentLedgerAsync(studentId, cancellationToken));
    }
    [HttpGet("reports/receivables-ageing")]
    public async Task<IActionResult> ReceivablesAgeing([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default)
    {
        if (!await CanViewUnscopedFinancialReportAsync(cancellationToken)) return Forbid();
        try { return Ok(await receivables.GetAgeingAsync(asOf, currency, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpGet("reports/receivables-reconciliation")]
    public async Task<IActionResult> ReceivablesReconciliation([FromQuery] DateOnly? asOf, [FromQuery] string currency = "UGX", CancellationToken cancellationToken = default)
    {
        if (!await CanViewUnscopedFinancialReportAsync(cancellationToken)) return Forbid();
        try { return Ok(await receivables.GetReconciliationAsync(asOf, currency, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpGet("reports/cash-bank-position")]
    public async Task<IActionResult> CashBankPosition([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] string currency = "UGX", [FromQuery] Guid? campusId = null, [FromQuery] Guid? facultyId = null, [FromQuery] Guid? departmentId = null, [FromQuery] Guid? programmeId = null, CancellationToken cancellationToken = default)
    {
        var scope = await ResolveReportCampusAsync(campusId, cancellationToken);
        if (scope.Error is not null) return scope.Error;
        try
        {
            return Ok(await cashBankPosition.GetAsync(from, to, currency, cancellationToken, scope.CampusId, facultyId, departmentId, programmeId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
    [HttpGet("students/{studentId:guid}/charges")]
    public async Task<IActionResult> GetStudentCharges(Guid studentId, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        try { return Ok(await charges.GetStudentChargesAsync(studentId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("students/{studentId:guid}/charges")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateStudentCharge(Guid studentId, CreateStudentChargeRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        try { var charge = await charges.CreateAsync(studentId, request.ChargeType, request.Description, request.Amount, request.Currency, User.Identity?.Name, cancellationToken); return Created($"/api/finance/students/{studentId}/charges/{charge.Id}", charge); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("charges/{chargeId:guid}/void")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> VoidStudentCharge(Guid chargeId, VoidStudentChargeRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessChargeAsync(chargeId, cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a charge void." }); return Ok(await charges.VoidAsync(chargeId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [HttpGet("invoices/{invoiceId:guid}/credit-notes")]
    public async Task<IActionResult> GetCreditNotes(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        return Ok(await adjustments.GetCreditNotesAsync(invoiceId, cancellationToken));
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("invoices/{invoiceId:guid}/credit-notes")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateCreditNote(Guid invoiceId, CreateCreditNoteRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        try { return Created($"/api/finance/invoices/{invoiceId}/credit-notes", await adjustments.CreateCreditNoteAsync(invoiceId, request.Amount, request.Reason, User.Identity?.Name, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("credit-notes/{creditNoteId:guid}/cancel")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CancelCreditNote(Guid creditNoteId, CancelCreditNoteRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessCreditNoteAsync(creditNoteId, cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a credit note cancellation." }); return Ok(await adjustments.CancelCreditNoteAsync(creditNoteId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("payments/{paymentId:guid}/refund")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RefundPayment(Guid paymentId, CreateRefundRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessPaymentAsync(paymentId, cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a refund." }); return Ok(await adjustments.CreateRefundAsync(paymentId, request.Amount, request.RefundMethod, request.Reason, request.Reference, user, request.CreditNoteId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("invoices")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateInvoice(CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, request.StudentId, cancellationToken)) return Forbid();
        try { var invoice = await finance.CreateInvoiceAsync(request.StudentId, request.FeeStructureId, request.InvoiceNumber, cancellationToken); return Created($"/api/finance/invoices/{invoice.Id}", invoice); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [HttpGet("invoices/{invoiceId:guid}/discounts")]
    public async Task<IActionResult> GetDiscounts(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        return Ok(await discounts.GetAsync(invoiceId, cancellationToken));
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("invoices/{invoiceId:guid}/discounts")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RequestDiscount(Guid invoiceId, RequestDiscountRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        try { return Ok(await discounts.RequestAsync(invoiceId, request.DiscountType, request.Percentage, request.Amount, request.Reason, User.Identity?.Name, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    [HttpPost("discounts/{discountId:guid}/approve")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ApproveDiscount(Guid discountId, CancellationToken cancellationToken)
    {
        if (!await CanAccessDiscountAsync(discountId, cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for approval." }); return Ok(await discounts.ApproveAsync(discountId, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    [HttpPost("discounts/{discountId:guid}/reject")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RejectDiscount(Guid discountId, CancellationToken cancellationToken)
    {
        if (!await CanAccessDiscountAsync(discountId, cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for rejection." }); return Ok(await discounts.RejectAsync(discountId, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [HttpGet("invoices/{invoiceId:guid}/installments")]
    public async Task<IActionResult> GetInstallments(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        return Ok(await installments.GetAsync(invoiceId, cancellationToken));
    }
    [HttpGet("invoices/{invoiceId:guid}/installments/overdue")]
    public async Task<IActionResult> GetOverdueInstallments(Guid invoiceId, [FromQuery] DateOnly? asOf, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        return Ok(await installments.GetOverdueAsync(invoiceId, asOf ?? DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken));
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("invoices/{invoiceId:guid}/installments")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateInstallmentSchedule(Guid invoiceId, CreateInstallmentScheduleRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        try { return Ok(await installments.CreateScheduleAsync(invoiceId, request.Installments, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("invoices/{invoiceId:guid}/payments")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RecordPayment(Guid invoiceId, RecordPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessInvoiceAsync(invoiceId, cancellationToken)) return Forbid();
        if (string.Equals(request.PaymentMethod, "SchoolPay", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "SchoolPay payments must be received through the verified SchoolPay notification workflow." });
        try { return Ok(await finance.RecordPaymentAsync(invoiceId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Reference, cancellationToken, request.SourceChannel)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("students/{studentId:guid}/payments")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> RecordUnallocatedPayment(Guid studentId, RecordUnallocatedPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, cancellationToken)) return Forbid();
        if (string.Equals(request.PaymentMethod, "SchoolPay", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "SchoolPay payments must be received through the verified SchoolPay notification workflow." });
        try { return Ok(await finance.RecordUnallocatedPaymentAsync(studentId, request.ReceiptNumber, request.Amount, request.PaymentMethod, request.Currency, request.Reference, cancellationToken, request.SourceChannel)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("payments/{paymentId:guid}/allocate")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AllocatePayment(Guid paymentId, AllocatePaymentRequest request, CancellationToken cancellationToken)
    {
        if (!await CanAccessPaymentAsync(paymentId, cancellationToken)) return Forbid();
        try { return Ok(await finance.AllocatePaymentAsync(paymentId, request.Allocations, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
    [HttpPost("payments/{paymentId:guid}/allocate-fifo")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AllocatePaymentFifo(Guid paymentId, CancellationToken cancellationToken)
    {
        if (!await CanAccessPaymentAsync(paymentId, cancellationToken)) return Forbid();
        try { return Ok(await finance.AllocatePaymentFifoAsync(paymentId, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [Authorize(Policy = AuthorizationPolicies.FinanceManagement)]
    [HttpPost("journal-entries/{journalEntryId:guid}/reverse")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ReverseJournalEntry(Guid journalEntryId, ReverseJournalEntryRequest request, CancellationToken cancellationToken)
    {
        if (!await CanViewUnscopedFinancialReportAsync(cancellationToken)) return Forbid();
        try { var user = User.Identity?.Name; if (string.IsNullOrWhiteSpace(user)) return Unauthorized(new { message = "Authenticated user identity is required for a reversal." }); return Ok(await reversals.ReverseAsync(journalEntryId, request.Reason, user, cancellationToken)); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
    [HttpGet("reports/general-ledger")]
    public async Task<IActionResult> GeneralLedger([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? accountId, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        var scope = await ResolveReportCampusAsync(campusId, cancellationToken);
        if (scope.Error is not null) return scope.Error;
        return Ok(await reports.GetGeneralLedgerAsync(from, to, accountId, cancellationToken, scope.CampusId, facultyId, departmentId, programmeId));
    }

    [HttpGet("reports/trial-balance")]
    public async Task<IActionResult> TrialBalance([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        var scope = await ResolveReportCampusAsync(campusId, cancellationToken);
        if (scope.Error is not null) return scope.Error;
        return Ok(await reports.GetTrialBalanceAsync(from, to, cancellationToken, scope.CampusId, facultyId, departmentId, programmeId));
    }

    [HttpGet("reports/income-statement")]
    public async Task<IActionResult> IncomeStatement([FromQuery] DateOnly? from, [FromQuery] DateOnly? to, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        var scope = await ResolveReportCampusAsync(campusId, cancellationToken);
        if (scope.Error is not null) return scope.Error;
        try
        {
            return Ok(await reports.GetIncomeStatementAsync(from, to, cancellationToken, scope.CampusId, facultyId, departmentId, programmeId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("reports/balance-sheet")]
    public async Task<IActionResult> BalanceSheet([FromQuery] DateOnly? asOf, [FromQuery] Guid? campusId, [FromQuery] Guid? facultyId, [FromQuery] Guid? departmentId, [FromQuery] Guid? programmeId, CancellationToken cancellationToken)
    {
        var scope = await ResolveReportCampusAsync(campusId, cancellationToken);
        if (scope.Error is not null) return scope.Error;
        try
        {
            return Ok(await reports.GetBalanceSheetAsync(asOf, cancellationToken, scope.CampusId, facultyId, departmentId, programmeId));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("reports/student-receivables")]
    public async Task<IActionResult> StudentReceivables(CancellationToken cancellationToken)
    {
        if (!await CanViewUnscopedFinancialReportAsync(cancellationToken)) return Forbid();
        return Ok(await reports.GetStudentReceivablesAsync(cancellationToken));
    }


    private async Task<bool> CanAccessInvoiceAsync(Guid invoiceId, CancellationToken ct)
    {
        var studentId = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.Id == invoiceId).Select(x => (Guid?)x.StudentId).SingleOrDefaultAsync(ct);
        return studentId.HasValue && await campusAccess.CanAccessStudentAsync(User, studentId.Value, ct);
    }

    private async Task<bool> CanAccessChargeAsync(Guid chargeId, CancellationToken ct)
    {
        var studentId = await db.Set<SchoolManagement.Domain.Finance.StudentCharge>().AsNoTracking()
            .Where(x => x.Id == chargeId).Select(x => (Guid?)x.StudentId).SingleOrDefaultAsync(ct);
        return studentId.HasValue && await campusAccess.CanAccessStudentAsync(User, studentId.Value, ct);
    }

    private async Task<bool> CanAccessPaymentAsync(Guid paymentId, CancellationToken ct)
    {
        var studentId = await db.Payments.AsNoTracking()
            .Where(x => x.Id == paymentId).Select(x => (Guid?)x.StudentId).SingleOrDefaultAsync(ct);
        return studentId.HasValue && await campusAccess.CanAccessStudentAsync(User, studentId.Value, ct);
    }

    private async Task<bool> CanAccessCreditNoteAsync(Guid creditNoteId, CancellationToken ct)
    {
        var studentId = await (
            from note in db.CreditNotes.AsNoTracking()
            join invoice in db.StudentInvoices.AsNoTracking() on note.StudentInvoiceId equals invoice.Id
            where note.Id == creditNoteId
            select (Guid?)invoice.StudentId).SingleOrDefaultAsync(ct);
        return studentId.HasValue && await campusAccess.CanAccessStudentAsync(User, studentId.Value, ct);
    }

    private async Task<bool> CanAccessDiscountAsync(Guid discountId, CancellationToken ct)
    {
        var studentId = await (
            from discount in db.Set<SchoolManagement.Domain.Finance.InvoiceDiscount>().AsNoTracking()
            join invoice in db.StudentInvoices.AsNoTracking() on discount.StudentInvoiceId equals invoice.Id
            where discount.Id == discountId
            select (Guid?)invoice.StudentId).SingleOrDefaultAsync(ct);
        return studentId.HasValue && await campusAccess.CanAccessStudentAsync(User, studentId.Value, ct);
    }

    private async Task<(Guid? CampusId, IActionResult? Error)> ResolveReportCampusAsync(Guid? requestedCampusId, CancellationToken ct)
    {
        if (campusAccess.IsSystemAdministrator(User))
            return (requestedCampusId, null);

        var accessible = await campusAccess.GetAccessibleCampusIdsAsync(User, ct);
        if (accessible is null) return (requestedCampusId, null);
        if (accessible.Count == 0) return (null, Forbid());
        if (requestedCampusId.HasValue)
        {
            if (accessible.Contains(requestedCampusId.Value)) return (requestedCampusId, null);
            return (null, Forbid());
        }
        if (accessible.Count == 1) return (accessible[0], null);
        return (null, BadRequest(new { message = "Select one of your assigned campuses to run this financial report." }));
    }

    private async Task<bool> CanViewUnscopedFinancialReportAsync(CancellationToken ct)
    {
        if (campusAccess.IsSystemAdministrator(User)) return true;
        return await campusAccess.GetAccessibleCampusIdsAsync(User, ct) is null;
    }

    public sealed record CreateMobileMoneyTransactionRequest(Guid StudentId, Guid? StudentInvoiceId, string Provider, string PhoneNumber, decimal Amount, string Currency = "UGX");
    public sealed record ConfirmMobileMoneyTransactionRequest(string ExternalRef);
    public sealed record CreateInvoiceRequest(Guid StudentId, Guid FeeStructureId, string InvoiceNumber);
    public sealed record FeeStructureItemRequest(string Code, string Name, decimal Amount, Guid? IncomeAccountId = null, int SortOrder = 0, bool IsOptional = false);
    public sealed record CreateFeeStructureRequest(string Name, string FeeType, string? Currency, Guid? ProgrammeId, Guid? AcademicYearId, IReadOnlyCollection<FeeStructureItemRequest> Items);
    public sealed record ApplyFeeStructureRequest(IReadOnlyCollection<Guid>? StudentIds = null, bool AllActiveStudents = false);
    public sealed record CreateStudentChargeRequest(string ChargeType, string Description, decimal Amount, string Currency = "UGX");
    public sealed record VoidStudentChargeRequest(string Reason);
    public sealed record CreateCreditNoteRequest(decimal Amount, string Reason);
    public sealed record CancelCreditNoteRequest(string Reason);
    public sealed record CreateRefundRequest(decimal Amount, string RefundMethod, string Reason, string? Reference = null, Guid? CreditNoteId = null);
    public sealed record RequestDiscountRequest(string DiscountType, decimal? Percentage, decimal? Amount, string Reason);
    public sealed record CreateInstallmentScheduleRequest(IReadOnlyCollection<InvoiceInstallmentService.InstallmentRequest> Installments);
    public sealed record RecordPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string? Reference, string? SourceChannel = null);
    public sealed record RecordUnallocatedPaymentRequest(decimal Amount, string ReceiptNumber, string PaymentMethod, string Currency = "UGX", string? Reference = null, string? SourceChannel = null);
    public sealed record AllocatePaymentRequest(IReadOnlyCollection<PaymentAllocationRequest> Allocations);
    public sealed record ReverseJournalEntryRequest(string Reason);
}