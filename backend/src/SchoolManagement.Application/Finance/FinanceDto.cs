using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FinanceInvoiceDto(
    Guid Id,
    Guid StudentId,
    Guid? FeeStructureId,
    string InvoiceNumber,
    string FeeType,
    decimal Amount,
    decimal PaidAmount,
    decimal Balance,
    string Currency,
    string Status,
    DateTimeOffset IssuedAt)
{
    public static FinanceInvoiceDto FromDomain(StudentInvoice invoice) => new(invoice.Id, invoice.StudentId, invoice.FeeStructureId, invoice.InvoiceNumber, invoice.FeeType, invoice.Amount, invoice.PaidAmount, Math.Max(0, invoice.Amount - invoice.PaidAmount), invoice.Currency, invoice.Status, invoice.IssuedAt);
}

public sealed record FinancePaymentDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    string ReceiptNumber,
    decimal Amount,
    decimal AllocatedAmount,
    decimal UnallocatedAmount,
    string Currency,
    string PaymentMethod,
    string PaymentSource,
    string? SourceChannel,
    string? ProviderTransactionId,
    string? Reference,
    DateTimeOffset PaidAt)
{
    public static FinancePaymentDto FromDomain(Payment payment) => new(payment.Id, payment.StudentId, payment.StudentInvoiceId, payment.ReceiptNumber, payment.Amount, payment.AllocatedAmount, payment.UnallocatedAmount, payment.Currency, payment.PaymentMethod, payment.PaymentSource, payment.SourceChannel, payment.ProviderTransactionId, payment.Reference, payment.PaidAt);
}

public sealed record FinanceLedgerEntryDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    Guid? PaymentId,
    string EntryType,
    string Description,
    decimal Amount,
    string Currency,
    string? Reference,
    DateTimeOffset EntryDate)
{
    public static FinanceLedgerEntryDto FromDomain(PaymentLedgerEntry entry) => new(entry.Id, entry.StudentId, entry.StudentInvoiceId, entry.PaymentId, entry.EntryType, entry.Description, entry.Amount, entry.Currency, entry.Reference, entry.EntryDate);
}

public sealed record FinanceDashboardDto(
    decimal TotalBilled,
    decimal TotalPaid,
    decimal TotalOutstanding,
    decimal TodayCollection,
    int InvoiceCount,
    int PaymentCount,
    int OutstandingCount);

public sealed record OutstandingBalanceDto(
    Guid StudentId,
    string StudentNumber,
    string StudentName,
    string ProgrammeName,
    decimal Balance,
    string Currency,
    string Status);

public sealed record FeeStructureDto(
    Guid Id,
    Guid ProgrammeId,
    Guid AcademicYearId,
    string Name,
    string FeeType,
    decimal TotalAmount,
    string Currency,
    bool IsActive,
    DateTimeOffset CreatedAt)
{
    public static FeeStructureDto FromDomain(FeeStructure fee) => new(
        fee.Id,
        fee.ProgrammeId,
        fee.AcademicYearId,
        fee.Name,
        fee.FeeType,
        fee.TotalAmount,
        fee.Currency,
        fee.IsActive,
        fee.CreatedAt);
}

public sealed record MobileMoneyTransactionDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    string TransactionRef,
    string Provider,
    string PhoneNumber,
    decimal Amount,
    string Currency,
    string Status,
    string? ExternalRef,
    string? ErrorMessage,
    DateTimeOffset RequestedAt,
    DateTimeOffset? CompletedAt)
{
    public static MobileMoneyTransactionDto FromDomain(MobileMoneyTransaction txn) => new(
        txn.Id,
        txn.StudentId,
        txn.StudentInvoiceId,
        txn.TransactionRef,
        txn.Provider,
        txn.PhoneNumber,
        txn.Amount,
        txn.Currency,
        txn.Status,
        txn.ExternalRef,
        txn.ErrorMessage,
        txn.RequestedAt,
        txn.CompletedAt);
}

public sealed record DailyCollectionDto(
    Guid Id,
    DateOnly CollectionDate,
    string CashierName,
    Guid? CashierUserId,
    decimal CashExpected,
    decimal CashActual,
    decimal MobileMoneyTotal,
    decimal BankTotal,
    decimal CardTotal,
    int TransactionCount,
    string Currency,
    string Status,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ClosedAt)
{
    public static DailyCollectionDto FromDomain(DailyCollection c) => new(
        c.Id,
        c.CollectionDate,
        c.CashierName,
        c.CashierUserId,
        c.CashExpected,
        c.CashActual,
        c.MobileMoneyTotal,
        c.BankTotal,
        c.CardTotal,
        c.TransactionCount,
        c.Currency,
        c.Status,
        c.Notes,
        c.CreatedAt,
        c.ClosedAt);
}

public sealed record SponsorshipDto(
    Guid Id,
    Guid StudentId,
    Guid? SponsorId,
    string SponsorName,
    string? SponsorContact,
    string? SponsorEmail,
    string? SponsorPhone,
    decimal Amount,
    string Currency,
    string Type,
    string Status,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? Notes,
    DateTimeOffset CreatedAt)
{
    public static SponsorshipDto FromDomain(Sponsorship s) => new(
        s.Id,
        s.StudentId,
        s.SponsorId,
        s.SponsorName,
        s.SponsorContact,
        s.SponsorEmail,
        s.SponsorPhone,
        s.Amount,
        s.Currency,
        s.Type,
        s.Status,
        s.StartDate,
        s.EndDate,
        s.Notes,
        s.CreatedAt);
}

public sealed record InstalmentPlanDto(
    Guid Id,
    Guid StudentInvoiceId,
    Guid StudentId,
    decimal TotalAmount,
    string Currency,
    int NumberOfInstalments,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static InstalmentPlanDto FromDomain(InstalmentPlan p) => new(
        p.Id,
        p.StudentInvoiceId,
        p.StudentId,
        p.TotalAmount,
        p.Currency,
        p.NumberOfInstalments,
        p.Status,
        p.CreatedAt);
}

public sealed record InstalmentPaymentDto(
    Guid Id,
    Guid InstalmentPlanId,
    Guid StudentInvoiceId,
    Guid StudentId,
    int InstalmentNumber,
    decimal Amount,
    string Currency,
    DateOnly DueDate,
    DateTimeOffset? PaidAt,
    string Status,
    string? ReceiptNumber,
    string? PaymentMethod,
    string? Reference)
{
    public static InstalmentPaymentDto FromDomain(InstalmentPayment p) => new(
        p.Id,
        p.InstalmentPlanId,
        p.StudentInvoiceId,
        p.StudentId,
        p.InstalmentNumber,
        p.Amount,
        p.Currency,
        p.DueDate,
        p.PaidAt,
        p.Status,
        p.ReceiptNumber,
        p.PaymentMethod,
        p.Reference);
}

public sealed record CreditNoteDto(
    Guid Id,
    Guid StudentInvoiceId,
    string CreditNoteNumber,
    decimal Amount,
    string Reason,
    string Status,
    DateTimeOffset IssuedAt,
    string? IssuedBy,
    DateTimeOffset? AppliedAt)
{
    public static CreditNoteDto FromDomain(CreditNote c) => new(
        c.Id,
        c.StudentInvoiceId,
        c.CreditNoteNumber,
        c.Amount,
        c.Reason,
        c.Status,
        c.IssuedAt,
        c.IssuedBy,
        c.AppliedAt);
}

public sealed record InvoiceNoteDto(
    Guid Id,
    Guid StudentInvoiceId,
    string Note,
    string? CreatedBy,
    DateTimeOffset CreatedAt)
{
    public static InvoiceNoteDto FromDomain(InvoiceNote n) => new(
        n.Id,
        n.StudentInvoiceId,
        n.Note,
        n.CreatedBy,
        n.CreatedAt);
}

public sealed record StaffAdvanceDto(
    Guid Id,
    Guid StaffMemberId,
    decimal Amount,
    string Currency,
    string Reason,
    string Status,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ApprovedAt,
    string? ApprovedBy,
    DateTimeOffset? RecoveredAt,
    Guid? RecoveredFromPayrollId,
    string? Notes)
{
    public static StaffAdvanceDto FromDomain(StaffAdvance a) => new(
        a.Id,
        a.StaffMemberId,
        a.Amount,
        a.Currency,
        a.Reason,
        a.Status,
        a.RequestedAt,
        a.ApprovedAt,
        a.ApprovedBy,
        a.RecoveredAt,
        a.RecoveredFromPayrollId,
        a.Notes);
}


public sealed record FeeStructureItemResponseDto(
    Guid Id,
    Guid FeeStructureId,
    string Code,
    string Name,
    decimal Amount,
    string Currency,
    Guid? IncomeAccountId,
    int SortOrder,
    bool IsOptional)
{
    public static FeeStructureItemResponseDto FromDomain(FeeStructureItem item) => new(
        item.Id, item.FeeStructureId, item.Code, item.Name, item.Amount, item.Currency,
        item.IncomeAccountId, item.SortOrder, item.IsOptional);
}

public sealed record FeeStructureResponseDto(
    Guid Id,
    Guid ProgrammeId,
    Guid AcademicYearId,
    string Name,
    string FeeType,
    decimal TotalAmount,
    string Currency,
    bool IsActive,
    DateTimeOffset CreatedAt,
    IReadOnlyCollection<FeeStructureItemResponseDto> Items)
{
    public static FeeStructureResponseDto FromDomain(FeeStructure fee) => new(
        fee.Id, fee.ProgrammeId, fee.AcademicYearId, fee.Name, fee.FeeType,
        fee.TotalAmount, fee.Currency, fee.IsActive, fee.CreatedAt,
        fee.Items.OrderBy(item => item.SortOrder).Select(FeeStructureItemResponseDto.FromDomain).ToArray());
}

public sealed record InvoiceDiscountResponseDto(
    Guid Id,
    Guid StudentInvoiceId,
    string DiscountType,
    decimal? Percentage,
    decimal Amount,
    string Reason,
    string Status,
    string? RequestedBy,
    string? ApprovedBy,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ApprovedAt,
    Guid? ApprovalJournalEntryId)
{
    public static InvoiceDiscountResponseDto FromDomain(InvoiceDiscount item) => new(
        item.Id, item.StudentInvoiceId, item.DiscountType, item.Percentage, item.Amount,
        item.Reason, item.Status, item.RequestedBy, item.ApprovedBy, item.RequestedAt,
        item.ApprovedAt, item.ApprovalJournalEntryId);
}

public sealed record InvoiceInstallmentResponseDto(
    Guid Id,
    Guid StudentInvoiceId,
    int Sequence,
    DateOnly DueDate,
    decimal Percentage,
    decimal Amount,
    decimal PaidAmount,
    decimal OutstandingAmount,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static InvoiceInstallmentResponseDto FromDomain(InvoiceInstallment item) => new(
        item.Id, item.StudentInvoiceId, item.Sequence, item.DueDate, item.Percentage,
        item.Amount, item.PaidAmount, item.OutstandingAmount, item.Status, item.CreatedAt);
}

public sealed record StudentChargeResponseDto(
    Guid Id,
    Guid StudentId,
    Guid? StudentInvoiceId,
    string ChargeType,
    string Description,
    decimal Amount,
    string Currency,
    string Status,
    string? CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset? VoidedAt,
    string? VoidedBy,
    string? VoidReason)
{
    public static StudentChargeResponseDto FromDomain(StudentCharge item) => new(
        item.Id, item.StudentId, item.StudentInvoiceId, item.ChargeType, item.Description,
        item.Amount, item.Currency, item.Status, item.CreatedBy, item.CreatedAt,
        item.VoidedAt, item.VoidedBy, item.VoidReason);
}

public sealed record JournalEntryLineResponseDto(
    Guid Id,
    Guid AccountId,
    string? Description,
    decimal Debit,
    decimal Credit,
    Guid? CampusId,
    Guid? FacultyId,
    Guid? DepartmentId,
    Guid? ProgrammeId)
{
    public static JournalEntryLineResponseDto FromDomain(JournalEntryLine line) => new(
        line.Id, line.AccountId, line.Description, line.Debit, line.Credit,
        line.CampusId, line.FacultyId, line.DepartmentId, line.ProgrammeId);
}

public sealed record JournalEntryResponseDto(
    Guid Id,
    string EntryNumber,
    string Currency,
    DateTimeOffset EntryDate,
    string? Description,
    string Status,
    DateTimeOffset? PostedAt,
    string? PostedBy,
    DateTimeOffset CreatedAt,
    string? SourceType,
    Guid? SourceId,
    Guid? ReversalOfJournalEntryId,
    IReadOnlyCollection<JournalEntryLineResponseDto> Lines)
{
    public static JournalEntryResponseDto FromDomain(JournalEntry entry) => new(
        entry.Id, entry.EntryNumber, entry.Currency, entry.EntryDate, entry.Description,
        entry.Status, entry.PostedAt, entry.PostedBy, entry.CreatedAt, entry.SourceType,
        entry.SourceId, entry.ReversalOfJournalEntryId,
        entry.Lines.Select(JournalEntryLineResponseDto.FromDomain).ToArray());
}
