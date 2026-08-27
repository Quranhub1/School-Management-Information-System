using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceWorkflowService(FinanceService finance, SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<FeeDto>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetStudentInvoicesAsync(studentId, cancellationToken);
        return invoices.Select(FeeDto.FromDomain).ToArray();
    }

    public async Task<FeeDto> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken = default)
    {
        var invoice = await finance.CreateInvoiceAsync(studentId, feeStructureId, invoiceNumber, cancellationToken);
        return FeeDto.FromDomain(invoice);
    }

    public async Task<FinancePaymentDto> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference = null, CancellationToken cancellationToken = default)
    {
        var payment = await finance.RecordPaymentAsync(invoiceId, receiptNumber, amount, paymentMethod, reference, cancellationToken);
        return FinancePaymentDto.FromDomain(payment);
    }

    public async Task<FinanceDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var totalBilled = await db.StudentInvoices.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0m;
        var totalPaid = await db.StudentInvoices.SumAsync(x => (decimal?)x.PaidAmount, cancellationToken) ?? 0m;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayPayments = await db.Payments
            .Where(p => DateOnly.FromDateTime(p.PaidAt) == today)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;

        return new FinanceDashboardDto(
            totalBilled,
            totalPaid,
            totalBilled - totalPaid,
            todayPayments,
            await db.StudentInvoices.LongCountAsync(cancellationToken),
            await db.Payments.LongCountAsync(cancellationToken),
            await db.StudentInvoices.CountAsync(x => x.PaidAmount < x.Amount, cancellationToken));
    }

    public async Task<IReadOnlyList<OutstandingBalanceDto>> GetOutstandingBalancesAsync(Guid? programmeId = null, Guid? academicYearId = null, CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetOutstandingInvoicesAsync(programmeId, academicYearId, cancellationToken);
        var result = new List<OutstandingBalanceDto>();
        foreach (var invoice in invoices)
        {
            var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == invoice.StudentId, cancellationToken);
            if (student == null) continue;
            var programmeName = invoice.FeeStructureId.HasValue
                ? (await db.FeeStructures.AsNoTracking().FirstOrDefaultAsync(f => f.Id == invoice.FeeStructureId.Value, cancellationToken))?.Name ?? "Unknown"
                : "Unknown";
            result.Add(new OutstandingBalanceDto(
                student.Id,
                student.StudentNumber,
                $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
                programmeName,
                invoice.Amount - invoice.PaidAmount,
                invoice.Currency,
                invoice.Status));
        }
        return result;
    }

    public async Task<IReadOnlyList<FeeStructureDto>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default)
    {
        var structures = await finance.GetFeeStructuresAsync(academicYearId, cancellationToken);
        return structures.Select(FeeStructureDto.FromDomain).ToArray();
    }

    public async Task<FeeStructureDto> CreateFeeStructureAsync(Guid programmeId, Guid academicYearId, string name, decimal totalAmount, string currency, string? feeType = null, CancellationToken cancellationToken = default)
    {
        var feeStructure = new FeeStructure
        {
            ProgrammeId = programmeId,
            AcademicYearId = academicYearId,
            Name = name.Trim(),
            TotalAmount = totalAmount,
            Currency = string.IsNullOrWhiteSpace(currency) ? "UGX" : currency.Trim(),
            FeeType = string.IsNullOrWhiteSpace(feeType) ? name.Trim() : feeType.Trim(),
            IsActive = true
        };
        await finance.AddFeeStructureAsync(feeStructure, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return FeeStructureDto.FromDomain(feeStructure);
    }

    public async Task<SponsorshipDto> CreateSponsorshipAsync(Guid studentId, string sponsorName, decimal amount, string type, DateOnly? startDate, DateOnly? endDate, string? notes, CancellationToken cancellationToken = default)
    {
        var sponsorship = await finance.CreateSponsorshipAsync(studentId, sponsorName, amount, type, startDate, endDate, notes, cancellationToken);
        return SponsorshipDto.FromDomain(sponsorship);
    }

    public async Task<IReadOnlyList<SponsorshipDto>> GetSponsorshipsAsync(Guid? studentId = null, CancellationToken cancellationToken = default)
    {
        var sponsorships = await finance.GetSponsorshipsAsync(studentId, cancellationToken);
        return sponsorships.Select(SponsorshipDto.FromDomain).ToArray();
    }

    public async Task<MobileMoneyTransactionDto> CreateMobileMoneyTransactionAsync(Guid studentId, Guid? studentInvoiceId, string provider, string phoneNumber, decimal amount, CancellationToken cancellationToken = default)
    {
        var transaction = await finance.CreateMobileMoneyTransactionAsync(studentId, studentInvoiceId, provider, phoneNumber, amount, cancellationToken);
        return MobileMoneyTransactionDto.FromDomain(transaction);
    }

    public async Task ConfirmMobileMoneyTransactionAsync(Guid transactionId, string externalRef, CancellationToken cancellationToken = default)
    {
        await finance.ConfirmMobileMoneyTransactionAsync(transactionId, externalRef, cancellationToken);
    }

    public async Task<IReadOnlyList<MobileMoneyTransactionDto>> GetMobileMoneyTransactionsAsync(string? status = null, CancellationToken cancellationToken = default)
    {
        var transactions = await finance.GetMobileMoneyTransactionsAsync(status, cancellationToken);
        return transactions.Select(MobileMoneyTransactionDto.FromDomain).ToArray();
    }

    public async Task<DailyCollectionDto> CreateDailyCollectionAsync(string cashierName, Guid? cashierUserId, DateOnly collectionDate, CancellationToken cancellationToken = default)
    {
        var collection = await finance.CreateDailyCollectionAsync(cashierName, cashierUserId, collectionDate, cancellationToken);
        return DailyCollectionDto.FromDomain(collection);
    }

    public async Task AddPaymentToDailyCollectionAsync(Guid dailyCollectionId, Guid studentInvoiceId, Guid studentId, decimal amount, string paymentMethod, string? receiptNumber, string? reference, CancellationToken cancellationToken = default)
    {
        await finance.AddPaymentToDailyCollectionAsync(dailyCollectionId, studentInvoiceId, studentId, amount, paymentMethod, receiptNumber, reference, cancellationToken);
    }

    public async Task<DailyCollectionDto> CloseDailyCollectionAsync(Guid dailyCollectionId, CancellationToken cancellationToken = default)
    {
        var collection = await finance.CloseDailyCollectionAsync(dailyCollectionId, cancellationToken);
        return DailyCollectionDto.FromDomain(collection);
    }

    public async Task<IReadOnlyList<DailyCollectionDto>> GetDailyCollectionsAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var collections = await finance.GetDailyCollectionsAsync(from, to, cancellationToken);
        return collections.Select(DailyCollectionDto.FromDomain).ToArray();
    }

    public async Task<IReadOnlyList<InstalmentPlanDto>> GetInstalmentPlansAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var plans = await finance.GetInstalmentPlansAsync(studentId, cancellationToken);
        return plans.Select(InstalmentPlanDto.FromDomain).ToArray();
    }

    public async Task<CreditNoteDto> IssueCreditNoteAsync(Guid studentInvoiceId, string creditNoteNumber, decimal amount, string reason, string? issuedBy, CancellationToken cancellationToken = default)
    {
        var creditNote = await finance.IssueCreditNoteAsync(studentInvoiceId, creditNoteNumber, amount, reason, issuedBy, cancellationToken);
        return CreditNoteDto.FromDomain(creditNote);
    }

    public async Task<IReadOnlyList<CreditNoteDto>> GetCreditNotesAsync(Guid? studentInvoiceId = null, CancellationToken cancellationToken = default)
    {
        var notes = await finance.GetCreditNotesAsync(studentInvoiceId, cancellationToken);
        return notes.Select(CreditNoteDto.FromDomain).ToArray();
    }

    public async Task<InvoiceNoteDto> AddInvoiceNoteAsync(Guid studentInvoiceId, string note, string? createdBy, CancellationToken cancellationToken = default)
    {
        var invoiceNote = await finance.AddInvoiceNoteAsync(studentInvoiceId, note, createdBy, cancellationToken);
        return InvoiceNoteDto.FromDomain(invoiceNote);
    }

    public async Task<IReadOnlyList<InvoiceNoteDto>> GetInvoiceNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken = default)
    {
        var notes = await finance.GetInvoiceNotesAsync(studentInvoiceId, cancellationToken);
        return notes.Select(InvoiceNoteDto.FromDomain).ToArray();
    }

    public async Task<StaffAdvanceDto> RequestStaffAdvanceAsync(Guid staffMemberId, decimal amount, string reason, string currency, CancellationToken cancellationToken = default)
    {
        var advance = await finance.RequestStaffAdvanceAsync(staffMemberId, amount, reason, currency, cancellationToken);
        return StaffAdvanceDto.FromDomain(advance);
    }

    public async Task<StaffAdvanceDto> ApproveStaffAdvanceAsync(Guid advanceId, string approvedBy, CancellationToken cancellationToken = default)
    {
        var advance = await finance.ApproveStaffAdvanceAsync(advanceId, approvedBy, cancellationToken);
        return StaffAdvanceDto.FromDomain(advance);
    }

    public async Task<StaffAdvanceDto> RecoverStaffAdvanceAsync(Guid advanceId, Guid recoveredFromPayrollId, CancellationToken cancellationToken = default)
    {
        var advance = await finance.RecoverStaffAdvanceAsync(advanceId, recoveredFromPayrollId, cancellationToken);
        return StaffAdvanceDto.FromDomain(advance);
    }

    public async Task<IReadOnlyList<StaffAdvanceDto>> GetStaffAdvancesAsync(Guid? staffMemberId = null, CancellationToken cancellationToken = default)
    {
        var advances = await finance.GetStaffAdvancesAsync(staffMemberId, cancellationToken);
        return advances.Select(StaffAdvanceDto.FromDomain).ToArray();
    }
}
