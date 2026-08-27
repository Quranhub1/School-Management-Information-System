using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceRepository
{
    Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken);
    Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken);
    Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken);
    Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken);
    Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken);
    Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken);
    Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken);
    Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FeeStructure>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default);
    Task AddFeeStructureAsync(FeeStructure feeStructure, CancellationToken cancellationToken);
    Task UpdateFeeStructureAsync(FeeStructure feeStructure, CancellationToken cancellationToken);

    Task<Sponsorship?> GetSponsorshipAsync(Guid sponsorshipId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Sponsorship>> GetSponsorshipsAsync(Guid? studentId = null, CancellationToken cancellationToken = default);
    Task AddSponsorshipAsync(Sponsorship sponsorship, CancellationToken cancellationToken);
    Task UpdateSponsorshipAsync(Sponsorship sponsorship, CancellationToken cancellationToken);

    Task<InstalmentPlan?> GetInstalmentPlanAsync(Guid instalmentPlanId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InstalmentPlan>> GetInstalmentPlansAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddInstalmentPlanAsync(InstalmentPlan plan, CancellationToken cancellationToken);
    Task AddInstalmentPaymentAsync(InstalmentPayment payment, CancellationToken cancellationToken);
    Task<IReadOnlyList<InstalmentPayment>> GetInstalmentPaymentsAsync(Guid instalmentPlanId, CancellationToken cancellationToken = default);
    Task UpdateInstalmentPaymentAsync(InstalmentPayment payment, CancellationToken cancellationToken);

    Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid? programmeId = null, Guid? academicYearId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MobileMoneyTransaction>> GetMobileMoneyTransactionsAsync(string? status = null, CancellationToken cancellationToken = default);
    Task AddMobileMoneyTransactionAsync(MobileMoneyTransaction transaction, CancellationToken cancellationToken);
    Task UpdateMobileMoneyTransactionAsync(MobileMoneyTransaction transaction, CancellationToken cancellationToken);

    Task<DailyCollection?> GetDailyCollectionAsync(Guid collectionId, CancellationToken cancellationToken);
    Task<IReadOnlyList<DailyCollection>> GetDailyCollectionsAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default);
    Task AddDailyCollectionAsync(DailyCollection collection, CancellationToken cancellationToken);
    Task UpdateDailyCollectionAsync(DailyCollection collection, CancellationToken cancellationToken);
    Task AddDailyCollectionPaymentAsync(DailyCollectionPayment payment, CancellationToken cancellationToken);
    Task<IReadOnlyList<DailyCollectionPayment>> GetDailyCollectionPaymentsAsync(Guid dailyCollectionId, CancellationToken cancellationToken = default);

    Task<CreditNote?> GetCreditNoteAsync(Guid creditNoteId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid? studentInvoiceId = null, CancellationToken cancellationToken = default);
    Task AddCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken);
    Task UpdateCreditNoteAsync(CreditNote creditNote, CancellationToken cancellationToken);

    Task<IReadOnlyList<InvoiceNote>> GetInvoiceNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken = default);
    Task AddInvoiceNoteAsync(InvoiceNote note, CancellationToken cancellationToken);

    Task<IReadOnlyList<StaffAdvance>> GetStaffAdvancesAsync(Guid? staffMemberId = null, CancellationToken cancellationToken = default);
    Task<StaffAdvance?> GetStaffAdvanceAsync(Guid advanceId, CancellationToken cancellationToken);
    Task AddStaffAdvanceAsync(StaffAdvance advance, CancellationToken cancellationToken);
    Task UpdateStaffAdvanceAsync(StaffAdvance advance, CancellationToken cancellationToken);
}
