using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FinanceInvoiceDto(
    Guid Id,
    Guid StudentId,
    Guid? FeeStructureId,
    string InvoiceNumber,
    decimal Amount,
    decimal PaidAmount,
    decimal Balance,
    string Currency,
    string Status,
    DateTimeOffset IssuedAt)
{
    public static FinanceInvoiceDto FromDomain(StudentInvoice invoice) => new(
        invoice.Id,
        invoice.StudentId,
        invoice.FeeStructureId,
        invoice.InvoiceNumber,
        invoice.Amount,
        invoice.PaidAmount,
        Math.Max(0, invoice.Amount - invoice.PaidAmount),
        invoice.Currency,
        invoice.Status,
        invoice.IssuedAt);
}

public sealed record FinancePaymentDto(
    Guid Id,
    Guid StudentInvoiceId,
    string ReceiptNumber,
    decimal Amount,
    string Currency,
    string PaymentMethod,
    string? Reference,
    DateTimeOffset PaidAt)
{
    public static FinancePaymentDto FromDomain(Payment payment) => new(
        payment.Id,
        payment.StudentInvoiceId,
        payment.ReceiptNumber,
        payment.Amount,
        payment.Currency,
        payment.PaymentMethod,
        payment.Reference,
        payment.PaidAt);
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
