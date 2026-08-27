using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceService(IFinanceRepository finance, SchoolManagementDbContext db)
{
    public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentInvoicesAsync(studentId, cancellationToken);

    public async Task<StudentInvoice> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken))
            throw new ArgumentException("Student was not found.");
        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Invoice number is required.");

        var normalizedInvoiceNumber = invoiceNumber.Trim();
        if (await finance.InvoiceNumberExistsAsync(normalizedInvoiceNumber, cancellationToken))
            throw new InvalidOperationException("Invoice number already exists.");

        var fee = await finance.GetActiveFeeStructureAsync(feeStructureId, cancellationToken)
            ?? throw new ArgumentException("Active fee structure was not found.");
        if (fee.TotalAmount <= 0)
            throw new ArgumentException("Fee structure amount must be greater than zero.");

        var invoice = new StudentInvoice
        {
            StudentId = studentId,
            FeeStructureId = fee.Id,
            InvoiceNumber = normalizedInvoiceNumber,
            Amount = fee.TotalAmount,
            PaidAmount = 0,
            Currency = fee.Currency,
            Status = "Unpaid"
        };

        await finance.AddInvoiceAsync(invoice, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return invoice;
    }

    public async Task<Payment> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference, CancellationToken cancellationToken)
    {
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(receiptNumber)) throw new ArgumentException("Receipt number is required.");
        if (string.IsNullOrWhiteSpace(paymentMethod)) throw new ArgumentException("Payment method is required.");

        var normalizedReceipt = receiptNumber.Trim();
        if (await finance.ReceiptExistsAsync(normalizedReceipt, cancellationToken))
            throw new InvalidOperationException("Receipt number already exists.");

        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken)
            ?? throw new ArgumentException("Invoice was not found.");
        var outstanding = invoice.Amount - invoice.PaidAmount;
        if (outstanding <= 0)
            throw new InvalidOperationException("Invoice is already fully paid.");
        if (amount > outstanding)
            throw new ArgumentException($"Payment exceeds the outstanding balance of {outstanding:0.00} {invoice.Currency}.");

        invoice.PaidAmount += amount;
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : "PartiallyPaid";

        var payment = new Payment
        {
            StudentInvoiceId = invoice.Id,
            ReceiptNumber = normalizedReceipt,
            Amount = amount,
            Currency = invoice.Currency,
            PaymentMethod = paymentMethod.Trim(),
            Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim()
        };

        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Sponsorship> CreateSponsorshipAsync(Guid studentId, string sponsorName, decimal amount, string type, DateOnly? startDate, DateOnly? endDate, string? notes, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken))
            throw new ArgumentException("Student was not found.");
        if (amount <= 0) throw new ArgumentException("Sponsorship amount must be greater than zero.");

        var sponsorship = new Sponsorship
        {
            StudentId = studentId,
            SponsorName = sponsorName.Trim(),
            Amount = amount,
            Type = type,
            StartDate = startDate,
            EndDate = endDate,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            Status = "Active"
        };

        await finance.AddSponsorshipAsync(sponsorship, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return sponsorship;
    }

    public async Task<InstalmentPlan> CreateInstalmentPlanAsync(Guid studentInvoiceId, Guid studentId, int numberOfInstalments, CancellationToken cancellationToken)
    {
        if (numberOfInstalments < 2 || numberOfInstalments > 12)
            throw new ArgumentException("Number of instalments must be between 2 and 12.");

        var invoice = await finance.GetInvoiceAsync(studentInvoiceId, cancellationToken)
            ?? throw new ArgumentException("Invoice was not found.");

        var plan = new InstalmentPlan
        {
            StudentInvoiceId = studentInvoiceId,
            StudentId = studentId,
            TotalAmount = invoice.Amount - invoice.PaidAmount,
            NumberOfInstalments = numberOfInstalments,
            Status = "Active"
        };

        await finance.AddInstalmentPlanAsync(plan, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return plan;
    }

    public async Task<MobileMoneyTransaction> CreateMobileMoneyTransactionAsync(Guid studentId, Guid? studentInvoiceId, string provider, string phoneNumber, decimal amount, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken))
            throw new ArgumentException("Student was not found.");
        if (amount <= 0) throw new ArgumentException("Amount must be greater than zero.");

        var transactionRef = $"{provider.ToUpperInvariant()}-{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}[..8]";

        var transaction = new MobileMoneyTransaction
        {
            StudentId = studentId,
            StudentInvoiceId = studentInvoiceId,
            TransactionRef = transactionRef,
            Provider = provider.Trim(),
            PhoneNumber = phoneNumber.Trim(),
            Amount = amount,
            Status = "Pending"
        };

        await finance.AddMobileMoneyTransactionAsync(transaction, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task ConfirmMobileMoneyTransactionAsync(Guid transactionId, string externalRef, CancellationToken cancellationToken)
    {
        var transaction = await db.MobileMoneyTransactions.FirstOrDefaultAsync(x => x.Id == transactionId, cancellationToken)
            ?? throw new ArgumentException("Transaction was not found.");

        if (transaction.Status != "Pending")
            throw new InvalidOperationException("Transaction is not in pending status.");

        transaction.Status = "Completed";
        transaction.ExternalRef = externalRef;
        transaction.CompletedAt = DateTimeOffset.UtcNow;

        finance.UpdateMobileMoneyTransactionAsync(transaction, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
    }

    public async Task<DailyCollection> CreateDailyCollectionAsync(string cashierName, Guid? cashierUserId, DateOnly collectionDate, CancellationToken cancellationToken)
    {
        var collection = new DailyCollection
        {
            CollectionDate = collectionDate,
            CashierName = cashierName.Trim(),
            CashierUserId = cashierUserId,
            CashExpected = 0,
            CashActual = 0,
            MobileMoneyTotal = 0,
            BankTotal = 0,
            CardTotal = 0,
            TransactionCount = 0,
            Status = "Draft"
        };

        await finance.AddDailyCollectionAsync(collection, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return collection;
    }

    public async Task AddPaymentToDailyCollectionAsync(Guid dailyCollectionId, Guid studentInvoiceId, Guid studentId, decimal amount, string paymentMethod, string? receiptNumber, string? reference, CancellationToken cancellationToken)
    {
        var collection = await finance.GetDailyCollectionAsync(dailyCollectionId, cancellationToken)
            ?? throw new ArgumentException("Daily collection was not found.");

        if (collection.Status != "Draft")
            throw new InvalidOperationException("Cannot add payments to a closed collection.");

        var payment = new DailyCollectionPayment
        {
            DailyCollectionId = dailyCollectionId,
            StudentInvoiceId = studentInvoiceId,
            StudentId = studentId,
            Amount = amount,
            PaymentMethod = paymentMethod.Trim(),
            ReceiptNumber = receiptNumber?.Trim(),
            Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim()
        };

        collection.TransactionCount++;
        switch (paymentMethod.Trim().ToLowerInvariant())
        {
            case "cash":
                collection.CashActual += amount;
                break;
            case "mobile money":
                collection.MobileMoneyTotal += amount;
                break;
            case "bank":
                collection.BankTotal += amount;
                break;
            case "card":
                collection.CardTotal += amount;
                break;
        }

        await finance.AddDailyCollectionPaymentAsync(payment, cancellationToken);
        finance.UpdateDailyCollectionAsync(collection, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
    }

    public async Task<DailyCollection> CloseDailyCollectionAsync(Guid dailyCollectionId, CancellationToken cancellationToken)
    {
        var collection = await finance.GetDailyCollectionAsync(dailyCollectionId, cancellationToken)
            ?? throw new ArgumentException("Daily collection was not found.");

        if (collection.Status != "Draft")
            throw new InvalidOperationException("Collection is already closed.");

        collection.Status = "Closed";
        collection.ClosedAt = DateTimeOffset.UtcNow;
        collection.CashExpected = collection.CashActual;

        finance.UpdateDailyCollectionAsync(collection, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return collection;
    }

    public async Task<IReadOnlyList<FeeStructure>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default) =>
        await finance.GetFeeStructuresAsync(academicYearId, cancellationToken);

    public async Task<IReadOnlyList<Sponsorship>> GetSponsorshipsAsync(Guid? studentId = null, CancellationToken cancellationToken = default) =>
        await finance.GetSponsorshipsAsync(studentId, cancellationToken);

    public async Task<IReadOnlyList<InstalmentPlan>> GetInstalmentPlansAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await finance.GetInstalmentPlansAsync(studentId, cancellationToken);

    public async Task<IReadOnlyList<MobileMoneyTransaction>> GetMobileMoneyTransactionsAsync(string? status = null, CancellationToken cancellationToken = default) =>
        await finance.GetMobileMoneyTransactionsAsync(status, cancellationToken);

    public async Task<IReadOnlyList<DailyCollection>> GetDailyCollectionsAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
        await finance.GetDailyCollectionsAsync(from, to, cancellationToken);

    public async Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid? programmeId = null, Guid? academicYearId = null, CancellationToken cancellationToken = default) =>
        await finance.GetOutstandingInvoicesAsync(programmeId, academicYearId, cancellationToken);

    public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
        finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken);

    public async Task<CreditNote> IssueCreditNoteAsync(Guid studentInvoiceId, string creditNoteNumber, decimal amount, string reason, string? issuedBy, CancellationToken cancellationToken)
    {
        if (amount <= 0) throw new ArgumentException("Credit note amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(creditNoteNumber)) throw new ArgumentException("Credit note number is required.");

        var normalizedNumber = creditNoteNumber.Trim();
        if (await db.CreditNotes.AnyAsync(x => x.CreditNoteNumber == normalizedNumber, cancellationToken))
            throw new InvalidOperationException("Credit note number already exists.");

        var invoice = await finance.GetInvoiceAsync(studentInvoiceId, cancellationToken)
            ?? throw new ArgumentException("Invoice was not found.");

        var creditNote = new CreditNote
        {
            StudentInvoiceId = studentInvoiceId,
            CreditNoteNumber = normalizedNumber,
            Amount = amount,
            Reason = reason.Trim(),
            Status = "Issued",
            IssuedBy = string.IsNullOrWhiteSpace(issuedBy) ? null : issuedBy.Trim()
        };

        await finance.AddCreditNoteAsync(creditNote, cancellationToken);

        invoice.PaidAmount = Math.Max(0, invoice.PaidAmount - amount);
        invoice.Status = invoice.PaidAmount >= invoice.Amount ? "Paid" : (invoice.PaidAmount > 0 ? "PartiallyPaid" : "Unpaid");

        await finance.SaveChangesAsync(cancellationToken);
        return creditNote;
    }

    public async Task<InvoiceNote> AddInvoiceNoteAsync(Guid studentInvoiceId, string note, string? createdBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(note)) throw new ArgumentException("Note is required.");

        var invoice = await finance.GetInvoiceAsync(studentInvoiceId, cancellationToken)
            ?? throw new ArgumentException("Invoice was not found.");

        var invoiceNote = new InvoiceNote
        {
            StudentInvoiceId = studentInvoiceId,
            Note = note.Trim(),
            CreatedBy = string.IsNullOrWhiteSpace(createdBy) ? null : createdBy.Trim()
        };

        await finance.AddInvoiceNoteAsync(invoiceNote, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return invoiceNote;
    }

    public async Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid? studentInvoiceId = null, CancellationToken cancellationToken = default) =>
        await finance.GetCreditNotesAsync(studentInvoiceId, cancellationToken);

    public async Task<IReadOnlyList<InvoiceNote>> GetInvoiceNotesAsync(Guid studentInvoiceId, CancellationToken cancellationToken = default) =>
        await finance.GetInvoiceNotesAsync(studentInvoiceId, cancellationToken);

    public async Task<StaffAdvance> RequestStaffAdvanceAsync(Guid staffMemberId, decimal amount, string reason, string currency, CancellationToken cancellationToken)
    {
        if (amount <= 0) throw new ArgumentException("Advance amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Reason is required.");

        var advance = new StaffAdvance
        {
            StaffMemberId = staffMemberId,
            Amount = amount,
            Currency = string.IsNullOrWhiteSpace(currency) ? "UGX" : currency.Trim(),
            Reason = reason.Trim(),
            Status = "Pending"
        };

        await finance.AddStaffAdvanceAsync(advance, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return advance;
    }

    public async Task<StaffAdvance> ApproveStaffAdvanceAsync(Guid advanceId, string approvedBy, CancellationToken cancellationToken)
    {
        var advance = await finance.GetStaffAdvanceAsync(advanceId, cancellationToken)
            ?? throw new ArgumentException("Advance was not found.");

        if (advance.Status != "Pending")
            throw new InvalidOperationException("Advance is not in pending status.");

        advance.Status = "Approved";
        advance.ApprovedAt = DateTimeOffset.UtcNow;
        advance.ApprovedBy = approvedBy.Trim();

        finance.UpdateStaffAdvanceAsync(advance, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return advance;
    }

    public async Task<StaffAdvance> RecoverStaffAdvanceAsync(Guid advanceId, Guid recoveredFromPayrollId, CancellationToken cancellationToken)
    {
        var advance = await finance.GetStaffAdvanceAsync(advanceId, cancellationToken)
            ?? throw new ArgumentException("Advance was not found.");

        if (advance.Status != "Approved")
            throw new InvalidOperationException("Advance must be approved before recovery.");

        advance.Status = "Recovered";
        advance.RecoveredAt = DateTimeOffset.UtcNow;
        advance.RecoveredFromPayrollId = recoveredFromPayrollId;

        finance.UpdateStaffAdvanceAsync(advance, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return advance;
    }

    public async Task<IReadOnlyList<StaffAdvance>> GetStaffAdvancesAsync(Guid? staffMemberId = null, CancellationToken cancellationToken = default) =>
        await finance.GetStaffAdvancesAsync(staffMemberId, cancellationToken);
}
