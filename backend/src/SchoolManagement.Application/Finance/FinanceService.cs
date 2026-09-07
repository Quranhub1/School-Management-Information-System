using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceService(SchoolManagement.Application.Abstractions.IFinanceRepository finance)
{
    public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentInvoicesAsync(studentId, cancellationToken);

    public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) =>
        finance.GetStudentLedgerAsync(studentId, cancellationToken);

    public async Task<StudentInvoice> CreateInvoiceAsync(Guid studentId, Guid feeStructureId, string invoiceNumber, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken)) throw new ArgumentException("Student was not found.");
        if (string.IsNullOrWhiteSpace(invoiceNumber)) throw new ArgumentException("Invoice number is required.");
        var normalizedInvoiceNumber = invoiceNumber.Trim();
        if (await finance.InvoiceNumberExistsAsync(normalizedInvoiceNumber, cancellationToken)) throw new InvalidOperationException("Invoice number already exists.");
        var fee = await finance.GetActiveFeeStructureAsync(feeStructureId, cancellationToken) ?? throw new ArgumentException("Active fee structure was not found.");
        if (fee.Items.Count > 0) fee.RecalculateTotal();
        if (fee.TotalAmount <= 0) throw new ArgumentException("Fee structure amount must be greater than zero.");

        var receivableAccount = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var revenueAccount = await GetAccountAsync(FinanceAccountCodes.TuitionRevenue, cancellationToken);
        var invoice = new StudentInvoice { StudentId = studentId, FeeStructureId = fee.Id, InvoiceNumber = normalizedInvoiceNumber, Amount = fee.TotalAmount, PaidAmount = 0, Currency = fee.Currency, Status = "Unpaid" };
        foreach (var item in fee.Items.Where(x => !x.IsOptional).OrderBy(x => x.SortOrder))
        {
            invoice.Lines.Add(new StudentInvoiceLine { StudentInvoiceId = invoice.Id, Code = item.Code, Description = item.Name, Amount = item.Amount, Currency = item.Currency, IncomeAccountId = item.IncomeAccountId, SortOrder = item.SortOrder });
        }

        var journalEntry = await CreateItemizedInvoiceJournalAsync(invoice, receivableAccount.Id, revenueAccount.Id, cancellationToken);
        await AddPostedJournalEntryAsync(journalEntry, cancellationToken);
        await finance.AddInvoiceAsync(invoice, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = studentId,
            StudentInvoiceId = invoice.Id,
            EntryType = "Invoice",
            Description = $"Invoice {invoice.InvoiceNumber}",
            Amount = invoice.Amount,
            Currency = invoice.Currency,
            Reference = invoice.InvoiceNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return invoice;
    }

    public async Task<Payment> RecordPaymentAsync(Guid invoiceId, string receiptNumber, decimal amount, string paymentMethod, string? reference, CancellationToken cancellationToken)
    {
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(receiptNumber)) throw new ArgumentException("Receipt number is required.");
        if (string.IsNullOrWhiteSpace(paymentMethod)) throw new ArgumentException("Payment method is required.");
        var normalizedReceipt = receiptNumber.Trim();
        if (await finance.ReceiptExistsAsync(normalizedReceipt, cancellationToken)) throw new InvalidOperationException("Receipt number already exists.");
        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken) ?? throw new ArgumentException("Invoice was not found.");
        var outstanding = invoice.OutstandingAmount;
        if (outstanding <= 0) throw new InvalidOperationException("Invoice is already fully paid.");
        if (amount > outstanding) throw new ArgumentException($"Payment exceeds the outstanding balance of {outstanding:0.00} {invoice.Currency}.");

        var paymentAccount = await GetAccountAsync(ResolvePaymentAccountCode(paymentMethod), cancellationToken);
        var receivableAccount = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        invoice.PaidAmount += amount;
        invoice.Status = invoice.PaidAmount >= invoice.NetAmount ? "Paid" : "PartiallyPaid";
        ApplyPaymentToInstallments(invoice, amount);
        var payment = new Payment { StudentId = invoice.StudentId, StudentInvoiceId = invoice.Id, ReceiptNumber = normalizedReceipt, Amount = amount, Currency = invoice.Currency, PaymentMethod = paymentMethod.Trim(), Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim() };
        var allocation = new PaymentAllocation { PaymentId = payment.Id, StudentInvoiceId = invoice.Id, AllocatedAmount = amount, Currency = invoice.Currency, Notes = "Automatic allocation on receipt" };
        payment.Allocations.Add(allocation);
        var journalEntry = CreateJournalEntry($"PAY-{normalizedReceipt}", $"Payment receipt {normalizedReceipt} for invoice {invoice.InvoiceNumber}", payment.Amount, paymentAccount.Id, receivableAccount.Id, "Payment", payment.Id);
        await AddPostedJournalEntryAsync(journalEntry, cancellationToken);
        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.AddPaymentAllocationAsync(allocation, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry { StudentId = invoice.StudentId, StudentInvoiceId = invoice.Id, PaymentId = payment.Id, PaymentAllocationId = allocation.Id, EntryType = "Payment", Description = $"Payment {payment.ReceiptNumber}", Amount = -amount, Currency = payment.Currency, Reference = payment.Reference ?? payment.ReceiptNumber }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment> RecordUnallocatedPaymentAsync(Guid studentId, string receiptNumber, decimal amount, string paymentMethod, string currency, string? reference, CancellationToken cancellationToken)
    {
        if (!await finance.StudentExistsAsync(studentId, cancellationToken)) throw new ArgumentException("Student was not found.");
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(receiptNumber)) throw new ArgumentException("Receipt number is required.");
        if (string.IsNullOrWhiteSpace(paymentMethod)) throw new ArgumentException("Payment method is required.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.");
        var normalizedReceipt = receiptNumber.Trim();
        if (await finance.ReceiptExistsAsync(normalizedReceipt, cancellationToken)) throw new InvalidOperationException("Receipt number already exists.");
        var normalizedCurrency = currency.Trim().ToUpperInvariant();
        var paymentAccount = await GetAccountAsync(ResolvePaymentAccountCode(paymentMethod), cancellationToken);
        var receivableAccount = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var payment = new Payment { StudentId = studentId, StudentInvoiceId = null, ReceiptNumber = normalizedReceipt, Amount = amount, Currency = normalizedCurrency, PaymentMethod = paymentMethod.Trim(), Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim() };
        var journalEntry = CreateJournalEntry($"PAY-{normalizedReceipt}", $"Unallocated student payment {normalizedReceipt}", payment.Amount, paymentAccount.Id, receivableAccount.Id, "Payment", payment.Id);
        await AddPostedJournalEntryAsync(journalEntry, cancellationToken);
        await finance.AddPaymentAsync(payment, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry { StudentId = studentId, PaymentId = payment.Id, EntryType = "Payment", Description = $"Payment {payment.ReceiptNumber}", Amount = -amount, Currency = payment.Currency, Reference = payment.Reference ?? payment.ReceiptNumber }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment> AllocatePaymentAsync(Guid paymentId, IReadOnlyCollection<PaymentAllocationRequest> allocations, CancellationToken cancellationToken)
    {
        if (allocations.Count == 0) throw new ArgumentException("At least one allocation is required.");
        if (allocations.Any(x => x.Amount <= 0)) throw new ArgumentException("Allocation amounts must be greater than zero.");
        if (allocations.Select(x => x.StudentInvoiceId).Distinct().Count() != allocations.Count) throw new ArgumentException("An invoice may only appear once in an allocation request.");

        var payment = await finance.GetPaymentAsync(paymentId, cancellationToken) ?? throw new ArgumentException("Payment was not found.");
        var requested = allocations.Sum(x => x.Amount);
        if (requested > payment.UnallocatedAmount) throw new ArgumentException($"Allocation exceeds the payment's unallocated balance of {payment.UnallocatedAmount:0.00} {payment.Currency}.");

        var invoices = new List<StudentInvoice>();
        foreach (var request in allocations)
        {
            var invoice = await finance.GetInvoiceAsync(request.StudentInvoiceId, cancellationToken) ?? throw new ArgumentException($"Invoice {request.StudentInvoiceId} was not found.");
            if (invoice.StudentId != payment.StudentId) throw new InvalidOperationException("Payment and invoice must belong to the same student.");
            if (!string.Equals(invoice.Currency, payment.Currency, StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Payment and invoice currencies must match.");
            var outstanding = invoice.OutstandingAmount;
            if (request.Amount > outstanding) throw new ArgumentException($"Allocation exceeds invoice {invoice.InvoiceNumber}'s outstanding balance of {outstanding:0.00} {invoice.Currency}.");
            invoices.Add(invoice);
        }

        var index = 0;
        foreach (var request in allocations)
        {
            var invoice = invoices[index++];
            invoice.PaidAmount += request.Amount;
            invoice.Status = invoice.PaidAmount >= invoice.NetAmount ? "Paid" : "PartiallyPaid";
            ApplyPaymentToInstallments(invoice, request.Amount);
            var allocation = new PaymentAllocation { PaymentId = payment.Id, StudentInvoiceId = invoice.Id, AllocatedAmount = request.Amount, Currency = payment.Currency, Notes = string.IsNullOrWhiteSpace(request.Notes) ? "Manual allocation" : request.Notes.Trim() };
            payment.Allocations.Add(allocation);
            await finance.AddPaymentAllocationAsync(allocation, cancellationToken);
        }
        await finance.SaveChangesAsync(cancellationToken);
        return payment;
    }

    public async Task<Payment> AllocatePaymentFifoAsync(Guid paymentId, CancellationToken cancellationToken)
    {
        var payment = await finance.GetPaymentAsync(paymentId, cancellationToken) ?? throw new ArgumentException("Payment was not found.");
        if (payment.UnallocatedAmount <= 0) return payment;
        var invoices = await finance.GetOutstandingInvoicesAsync(payment.StudentId, payment.Currency, cancellationToken);
        var remaining = payment.UnallocatedAmount;
        var requests = new List<PaymentAllocationRequest>();
        foreach (var invoice in invoices)
        {
            if (remaining <= 0) break;
            var amount = Math.Min(remaining, invoice.OutstandingAmount);
            if (amount > 0)
            {
                requests.Add(new PaymentAllocationRequest(invoice.Id, amount, "FIFO allocation"));
                remaining -= amount;
            }
        }
        if (requests.Count == 0) return payment;
        return await AllocatePaymentAsync(paymentId, requests, cancellationToken);
    }

    public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) =>
        finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken);

    private static void ApplyPaymentToInstallments(StudentInvoice invoice, decimal amount)
    {
        if (invoice.Installments.Count == 0) return;
        var remaining = amount;
        foreach (var installment in invoice.Installments.OrderBy(x => x.Sequence))
        {
            if (remaining <= 0) break;
            var allocation = Math.Min(remaining, installment.OutstandingAmount);
            if (allocation <= 0) continue;
            installment.PaidAmount += allocation;
            installment.Status = installment.PaidAmount >= installment.Amount
                ? "Paid"
                : installment.PaidAmount > 0
                    ? "PartiallyPaid"
                    : "Pending";
            remaining -= allocation;
        }
    }

    private async Task AddPostedJournalEntryAsync(JournalEntry entry, CancellationToken cancellationToken)
    {
        if (await finance.JournalEntryNumberExistsAsync(entry.EntryNumber, cancellationToken)) throw new InvalidOperationException($"Journal entry number '{entry.EntryNumber}' already exists.");
        JournalEntryValidator.Validate(entry);
        await finance.AddJournalEntryAsync(entry, cancellationToken);
    }

    private async Task<Account> GetAccountAsync(string code, CancellationToken cancellationToken) => await finance.GetActiveAccountByCodeAsync(code, cancellationToken) ?? throw new InvalidOperationException($"Required finance account '{code}' is not configured.");

    private async Task<JournalEntry> CreateItemizedInvoiceJournalAsync(StudentInvoice invoice, Guid receivableAccountId, Guid defaultRevenueAccountId, CancellationToken cancellationToken)
    {
        var entry = new JournalEntry { EntryNumber = $"INV-{invoice.InvoiceNumber}", Description = $"Student invoice {invoice.InvoiceNumber}", Status = "Posted", PostedAt = DateTimeOffset.UtcNow, PostedBy = "FinanceService", SourceType = "StudentInvoice", SourceId = invoice.Id };
        entry.Lines.Add(new JournalEntryLine { AccountId = receivableAccountId, Description = $"Receivable - {invoice.InvoiceNumber}", Debit = invoice.Amount });
        if (invoice.Lines.Count == 0)
        {
            entry.Lines.Add(new JournalEntryLine { AccountId = defaultRevenueAccountId, Description = "Student fees", Credit = invoice.Amount });
            return entry;
        }
        foreach (var group in invoice.Lines.GroupBy(x => x.IncomeAccountId))
        {
            var accountId = group.Key.HasValue
                ? (await finance.GetActiveAccountByIdAsync(group.Key.Value, cancellationToken))?.Id ?? throw new InvalidOperationException($"Income account '{group.Key.Value}' is not configured or inactive.")
                : defaultRevenueAccountId;
            entry.Lines.Add(new JournalEntryLine { AccountId = accountId, Description = $"Income - {invoice.InvoiceNumber}", Credit = group.Sum(x => x.Amount) });
        }
        return entry;
    }

    private static string ResolvePaymentAccountCode(string paymentMethod)
    {
        var method = paymentMethod.Trim().ToLowerInvariant();
        if (method is "cash" or "cash payment") return FinanceAccountCodes.Cash;
        if (method.Contains("mobile") || method.Contains("momo") || method.Contains("mtn") || method.Contains("airtel")) return FinanceAccountCodes.MobileMoney;
        if (method.Contains("bank") || method.Contains("transfer") || method.Contains("card") || method.Contains("cheque") || method.Contains("check")) return FinanceAccountCodes.Bank;
        throw new ArgumentException("Unsupported payment method. Use Cash, Bank/Transfer/Card/Cheque, or Mobile Money.");
    }

    private static JournalEntry CreateJournalEntry(string entryNumber, string description, decimal amount, Guid debitAccountId, Guid creditAccountId, string sourceType, Guid sourceId)
    {
        var entry = new JournalEntry { EntryNumber = entryNumber, Description = description, Status = "Posted", PostedAt = DateTimeOffset.UtcNow, PostedBy = "FinanceService", SourceType = sourceType, SourceId = sourceId, Lines = [new JournalEntryLine { AccountId = debitAccountId, Description = description, Debit = amount, Credit = 0 }, new JournalEntryLine { AccountId = creditAccountId, Description = description, Debit = 0, Credit = amount }] };
        JournalEntryValidator.Validate(entry);
        return entry;
    }
}
