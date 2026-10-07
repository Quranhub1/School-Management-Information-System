using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceService(SchoolManagement.Application.Abstractions.IFinanceRepository finance, FiscalPeriodService fiscalPeriods)
{
    public Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) => finance.GetStudentInvoicesAsync(studentId, cancellationToken);
    public Task<IReadOnlyList<PaymentLedgerEntry>> GetStudentLedgerAsync(Guid studentId, CancellationToken cancellationToken) => finance.GetStudentLedgerAsync(studentId, cancellationToken);

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
        var invoice = new StudentInvoice { StudentId = studentId, FeeStructureId = fee.Id, InvoiceNumber = normalizedInvoiceNumber, FeeType = fee.FeeType, Amount = fee.TotalAmount, PaidAmount = 0, Currency = fee.Currency, Status = "Unpaid" };
        foreach (var item in fee.Items.Where(x => !x.IsOptional).OrderBy(x => x.SortOrder)) invoice.Lines.Add(new StudentInvoiceLine { StudentInvoiceId = invoice.Id, Code = item.Code, Description = item.Name, Amount = item.Amount, Currency = item.Currency, IncomeAccountId = item.IncomeAccountId, SortOrder = item.SortOrder });
        var journalEntry = await CreateItemizedInvoiceJournalAsync(invoice, receivableAccount.Id, revenueAccount.Id, cancellationToken);
        await AddPostedJournalEntryAsync(journalEntry, cancellationToken);
        await finance.AddInvoiceAsync(invoice, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry { StudentId = studentId, StudentInvoiceId = invoice.Id, EntryType = "Invoice", Description = $"Invoice {invoice.InvoiceNumber}", Amount = invoice.Amount, Currency = invoice.Currency, Reference = invoice.InvoiceNumber }, cancellationToken);
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
        var payment = new Payment { StudentId = invoice.StudentId, StudentInvoiceId = invoice.Id, ReceiptNumber = normalizedReceipt, Amount = amount, Currency = invoice.Currency, PaymentMethod = paymentMethod.Trim(), Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim() };
        var journalEntry = CreateJournalEntry($"PAY-{normalizedReceipt}", $"Payment receipt {normalizedReceipt} for invoice {invoice.InvoiceNumber}", payment.Amount, paymentAccount.Id, receivableAccount.Id, "Payment", payment.Id);
        await AddPostedJournalEntryAsync(journalEntry, cancellationToken);
        invoice.PaidAmount += amount;
        invoice.Status = invoice.PaidAmount >= invoice.NetAmount ? "Paid" : "PartiallyPaid";
        ApplyPaymentToInstallments(invoice, amount);
        var allocation = new PaymentAllocation { PaymentId = payment.Id, StudentInvoiceId = invoice.Id, AllocatedAmount = amount, Currency = invoice.Currency, Notes = "Automatic allocation on receipt" };
        payment.Allocations.Add(allocation);
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
        var unappliedAccount = await GetAccountAsync(FinanceAccountCodes.StudentUnappliedPayments, cancellationToken);
        var payment = new Payment { StudentId = studentId, StudentInvoiceId = null, ReceiptNumber = normalizedReceipt, Amount = amount, Currency = normalizedCurrency, PaymentMethod = paymentMethod.Trim(), Reference = string.IsNullOrWhiteSpace(reference) ? null : reference.Trim() };
        var journalEntry = CreateJournalEntry($"PAY-{normalizedReceipt}", $"Unallocated student payment {normalizedReceipt}", payment.Amount, paymentAccount.Id, unappliedAccount.Id, "Payment", payment.Id);
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
        var unappliedAccount = await GetAccountAsync(FinanceAccountCodes.StudentUnappliedPayments, cancellationToken);
        var receivableAccount = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
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
            var allocationJournal = CreateJournalEntry($"ALLOC-{allocation.Id:N}", $"Allocate payment {payment.ReceiptNumber} to invoice {invoice.InvoiceNumber}", request.Amount, unappliedAccount.Id, receivableAccount.Id, "PaymentAllocation", allocation.Id);
            await AddPostedJournalEntryAsync(allocationJournal, cancellationToken);
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
            if (amount > 0) { requests.Add(new PaymentAllocationRequest(invoice.Id, amount, "FIFO allocation")); remaining -= amount; }
        }
        if (requests.Count == 0) return payment;
        return await AllocatePaymentAsync(paymentId, requests, cancellationToken);
    }

    public Task<IReadOnlyList<Payment>> GetPaymentsAsync(string? receiptNumber = null, string? paymentMethod = null, DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default) => finance.GetPaymentsAsync(receiptNumber, paymentMethod, from, to, cancellationToken);

      private static void ApplyPaymentToInstallments(StudentInvoice invoice, decimal amount)
      {
          if (invoice.Installments.Count == 0) return;
          var remaining = amount;
          foreach (var installment in invoice.Installments.OrderBy(x => x.Sequence))
          {
              if (remaining <= 0) break;
              var allocation = Math.Min(remaining, installment.OutstandingAmount);
              installment.PaidAmount += allocation;
              installment.Status = installment.PaidAmount >= installment.Amount ? "Paid" : installment.PaidAmount > 0 ? "PartiallyPaid" : "Pending";
              remaining -= allocation;
          }
      }

      private async Task AddPostedJournalEntryAsync(JournalEntry entry, CancellationToken cancellationToken)
      {
          if (await finance.JournalEntryNumberExistsAsync(entry.EntryNumber, cancellationToken)) throw new InvalidOperationException($"Journal entry number '{entry.EntryNumber}' already exists.");
          await fiscalPeriods.RequireOpenPeriodAsync(DateOnly.FromDateTime(entry.EntryDate.UtcDateTime), cancellationToken);
          entry.Post("FinanceService");
          await finance.AddJournalEntryAsync(entry, cancellationToken);
      }

    private async Task<Account> GetAccountAsync(string code, CancellationToken cancellationToken) => await finance.GetActiveAccountByCodeAsync(code, cancellationToken) ?? throw new InvalidOperationException($"Required finance account '{code}' is not configured.");

    private async Task<JournalEntry> CreateItemizedInvoiceJournalAsync(StudentInvoice invoice, Guid receivableAccountId, Guid defaultRevenueAccountId, CancellationToken cancellationToken)
    {
        var entry = new JournalEntry { EntryNumber = $"INV-{invoice.InvoiceNumber}", Description = $"Student invoice {invoice.InvoiceNumber}", SourceType = "StudentInvoice", SourceId = invoice.Id };
        entry.Lines.Add(new JournalEntryLine { AccountId = receivableAccountId, Description = $"Receivable - {invoice.InvoiceNumber}", Debit = invoice.Amount });
        if (invoice.Lines.Count == 0) { entry.Lines.Add(new JournalEntryLine { AccountId = defaultRevenueAccountId, Description = "Student fees", Credit = invoice.Amount }); return entry; }
        foreach (var group in invoice.Lines.GroupBy(x => x.IncomeAccountId))
        {
            var accountId = group.Key.HasValue ? (await finance.GetActiveAccountByIdAsync(group.Key.Value, cancellationToken))?.Id ?? throw new InvalidOperationException($"Income account {group.Key.Value} is not configured or inactive.") : defaultRevenueAccountId;
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
    public async Task<MobileMoneyTransaction> CreateMobileMoneyTransactionAsync(CreateMobileMoneyTransactionRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0) throw new ArgumentException("Transaction amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.Provider)) throw new ArgumentException("Provider is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) throw new ArgumentException("Phone number is required.");
        if (request.StudentInvoiceId.HasValue && !await finance.StudentInvoiceExistsAsync(request.StudentInvoiceId.Value, cancellationToken))
            throw new ArgumentException("Student invoice was not found.");
        if (!await finance.StudentExistsAsync(request.StudentId, cancellationToken)) throw new ArgumentException("Student was not found.");

        // Generate a unique transaction reference
        string transactionRef = "$TX{DateTime.UtcNow:yyyyMMdd}${Guid.NewGuid():N.Substring(0, 8)}";

        var transaction = new MobileMoneyTransaction
        {
            StudentId = request.StudentId,
            StudentInvoiceId = request.StudentInvoiceId,
            Amount = request.Amount,
            Currency = request.Currency,
            Provider = request.Provider,
            PhoneNumber = request.PhoneNumber,
            Reference = request.Reference,
            TransactionRef = transactionRef,
            Status = "Pending"
        };

        // For now, we'll just save the transaction. In a real implementation, 
        // this would integrate with the actual mobile money provider's API
        await finance.AddMobileMoneyTransactionAsync(transaction, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return transaction;
    }
    private JournalEntry CreateJournalEntry(string entryNumber, string description, decimal amount, Guid debitAccountId, Guid creditAccountId, string sourceType, Guid sourceId)
    {
        var entry = new JournalEntry { EntryNumber = entryNumber, Description = description, SourceType = sourceType, SourceId = sourceId };
        entry.Lines.Add(new JournalEntryLine { AccountId = debitAccountId, Description = description, Debit = amount });
        entry.Lines.Add(new JournalEntryLine { AccountId = creditAccountId, Description = description, Credit = amount });
        return entry;
    }
    public async Task<MobileMoneyTransaction> ConfirmMobileMoneyTransactionAsync(Guid transactionId, string? externalRef, CancellationToken cancellationToken)
    {
        var transaction = await finance.GetMobileMoneyTransactionAsync(transactionId, cancellationToken) 
                          ?? throw new ArgumentException("Mobile money transaction was not found.");

        if (transaction.Status != "Pending") 
            throw new InvalidOperationException("Only pending transactions can be confirmed.");

        // In a real implementation, we would verify the externalRef with the mobile money provider
        // For now, we'll just mark it as completed if an external reference is provided
        if (string.IsNullOrWhiteSpace(externalRef))
            throw new ArgumentException("External reference is required to confirm the transaction.");

        transaction.ExternalRef = externalRef;
        transaction.Status = "Completed";
        transaction.CompletedAt = DateTimeOffset.UtcNow;

        // If this transaction is associated with an invoice, record a payment
        if (transaction.StudentInvoiceId.HasValue)
        {
            var invoice = await finance.GetInvoiceAsync(transaction.StudentInvoiceId.Value, cancellationToken) 
                          ?? throw new ArgumentException("Associated invoice was not found.");

            var outstanding = invoice.OutstandingAmount;
            if (outstanding <= 0) 
                throw new InvalidOperationException("Invoice is already fully paid.");
            if (transaction.Amount > outstanding) 
                throw new ArgumentException($"Transaction amount exceeds the outstanding balance of {outstanding:0.00} {invoice.Currency}.");

            // Record the payment using the standard payment flow
            var payment = await this.RecordPaymentAsync(
                invoice.Id, 
                transaction.TransactionRef, 
                transaction.Amount, 
                $"Mobile Money ({transaction.Provider})", 
                transaction.ExternalRef, 
                cancellationToken
            );

            // Update transaction with payment reference
            transaction.Reference = payment.ReceiptNumber;
        }

        await finance.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task<IReadOnlyList<MobileMoneyTransaction>> GetMobileMoneyTransactionsAsync(string? status, CancellationToken cancellationToken)
    {
        return await finance.GetMobileMoneyTransactionsAsync(status, cancellationToken);
    }

    public async Task<SchoolPayTransaction> CreateSchoolPayTransactionAsync(CreateSchoolPayTransactionRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0) throw new ArgumentException("Transaction amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.Provider)) throw new ArgumentException("Provider is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) throw new ArgumentException("Phone number is required.");
        if (request.StudentInvoiceId.HasValue && !await finance.StudentInvoiceExistsAsync(request.StudentInvoiceId.Value, cancellationToken))
            throw new ArgumentException("Student invoice was not found.");
        if (!await finance.StudentExistsAsync(request.StudentId, cancellationToken)) throw new ArgumentException("Student was not found.");

        // Generate a unique transaction reference
        string transactionRef = $"TX{DateTime.UtcNow:yyyyMMdd}${Guid.NewGuid():N.Substring(0, 8)}";

        var transaction = new SchoolPayTransaction
        {
            StudentId = request.StudentId,
            StudentInvoiceId = request.StudentInvoiceId,
            Amount = request.Amount,
            Currency = request.Currency,
            Provider = request.Provider,
            PhoneNumber = request.PhoneNumber,
            Reference = request.Reference,
            TransactionRef = transactionRef,
            Status = "Pending"
        };

        // For now, we'll just save the transaction. In a real implementation, 
        // this would integrate with the actual SchoolPay provider's API
        await finance.AddSchoolPayTransactionAsync(transaction, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task<SchoolPayTransaction> ConfirmSchoolPayTransactionAsync(Guid transactionId, string? externalRef, CancellationToken cancellationToken)
    {
        var transaction = await finance.GetSchoolPayTransactionAsync(transactionId, cancellationToken) 
                          ?? throw new ArgumentException("SchoolPay transaction was not found.");

        if (transaction.Status != "Pending") 
            throw new InvalidOperationException("Only pending transactions can be confirmed.");

        // In a real implementation, we would verify the externalRef with the SchoolPay provider
        // For now, we'll just mark it as completed if an external reference is provided
        if (string.IsNullOrWhiteSpace(externalRef))
            throw new ArgumentException("External reference is required to confirm the transaction.");

        transaction.ExternalRef = externalRef;
        transaction.Status = "Completed";
        transaction.CompletedAt = DateTimeOffset.UtcNow;

        // If this transaction is associated with an invoice, record a payment
        if (transaction.StudentInvoiceId.HasValue)
        {
            var invoice = await finance.GetInvoiceAsync(transaction.StudentInvoiceId.Value, cancellationToken) 
                          ?? throw new ArgumentException("Associated invoice was not found.");

            var outstanding = invoice.OutstandingAmount;
            if (outstanding <= 0) 
                throw new InvalidOperationException("Invoice is already fully paid.");
            if (transaction.Amount > outstanding) 
                throw new ArgumentException($"Transaction amount exceeds the outstanding balance of {outstanding:0.00} {invoice.Currency}.");

            // Record the payment using the standard payment flow
            var payment = await this.RecordPaymentAsync(
                invoice.Id, 
                transaction.TransactionRef, 
                transaction.Amount, 
                $"SchoolPay ({transaction.Provider})", 
                transaction.ExternalRef, 
                cancellationToken
            );

            // Update transaction with payment reference
            transaction.Reference = payment.ReceiptNumber;
        }

        await finance.SaveChangesAsync(cancellationToken);
        return transaction;
    }

    public async Task<IReadOnlyList<SchoolPayTransaction>> GetSchoolPayTransactionsAsync(string? status, CancellationToken cancellationToken)
    {
        return await finance.GetSchoolPayTransactionsAsync(status, cancellationToken);
    }

}