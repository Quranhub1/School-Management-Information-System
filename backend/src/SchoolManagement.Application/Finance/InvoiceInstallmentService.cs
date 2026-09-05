using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class InvoiceInstallmentService(IFinanceRepository finance)
{
    public Task<IReadOnlyList<InvoiceInstallment>> GetAsync(Guid invoiceId, CancellationToken cancellationToken) =>
        finance.GetInvoiceInstallmentsAsync(invoiceId, cancellationToken);

    public async Task<IReadOnlyList<InvoiceInstallment>> CreateScheduleAsync(Guid invoiceId, IReadOnlyCollection<InstallmentRequest> requests, CancellationToken cancellationToken)
    {
        if (requests.Count == 0) throw new ArgumentException("At least one installment is required.");
        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken) ?? throw new ArgumentException("Invoice was not found.");
        if (invoice.OutstandingAmount <= 0) throw new InvalidOperationException("Only invoices with an outstanding balance can receive an installment schedule.");

        var existing = await finance.GetInvoiceInstallmentsAsync(invoiceId, cancellationToken);
        if (existing.Count > 0) throw new InvalidOperationException("An installment schedule already exists for this invoice.");

        var ordered = requests.OrderBy(x => x.Sequence).ToArray();
        if (ordered.Select(x => x.Sequence).Distinct().Count() != ordered.Length || ordered.Any(x => x.Sequence <= 0))
            throw new ArgumentException("Installment sequence numbers must be positive and unique.");
        if (ordered.Any(x => x.DueDate < DateOnly.FromDateTime(invoice.IssuedAt.UtcDateTime)))
            throw new ArgumentException("Installment due dates cannot be before the invoice issue date.");
        if (ordered.Zip(ordered.Skip(1), (a, b) => a.DueDate <= b.DueDate).Any(x => !x))
            throw new ArgumentException("Installment due dates must be in chronological order.");

        var hasAmounts = ordered.Any(x => x.Amount.HasValue);
        var hasPercentages = ordered.Any(x => x.Percentage.HasValue);
        if (hasAmounts && hasPercentages || !hasAmounts && !hasPercentages)
            throw new ArgumentException("Use either installment amounts or installment percentages, not both.");

        var total = invoice.OutstandingAmount;
        var installments = new List<InvoiceInstallment>(ordered.Length);
        if (hasPercentages)
        {
            if (ordered.Any(x => !x.Percentage.HasValue || x.Percentage.Value <= 0 || x.Percentage.Value > 100))
                throw new ArgumentException("Each installment percentage must be greater than zero and no more than 100.");
            if (ordered.Sum(x => x.Percentage!.Value) != 100m)
                throw new ArgumentException("Installment percentages must total exactly 100%.");

            foreach (var request in ordered)
            {
                var amount = Math.Round(total * request.Percentage!.Value / 100m, 2, MidpointRounding.AwayFromZero);
                installments.Add(new InvoiceInstallment
                {
                    StudentInvoiceId = invoice.Id,
                    Sequence = request.Sequence,
                    DueDate = request.DueDate,
                    Percentage = request.Percentage.Value,
                    Amount = amount,
                    Status = "Pending"
                });
            }
            var roundingDifference = total - installments.Sum(x => x.Amount);
            if (roundingDifference != 0)
            {
                var last = installments[^1];
                installments[^1] = new InvoiceInstallment
                {
                    StudentInvoiceId = last.StudentInvoiceId,
                    Sequence = last.Sequence,
                    DueDate = last.DueDate,
                    Percentage = last.Percentage,
                    Amount = last.Amount + roundingDifference,
                    Status = last.Status,
                    CreatedAt = last.CreatedAt
                };
            }
        }
        else
        {
            if (ordered.Any(x => !x.Amount.HasValue || x.Amount.Value <= 0))
                throw new ArgumentException("Each installment amount must be greater than zero.");
            if (ordered.Sum(x => x.Amount!.Value) != total)
                throw new ArgumentException($"Installment amounts must total exactly {total:0.00} {invoice.Currency}.");

            foreach (var request in ordered)
            {
                var percentage = Math.Round(request.Amount!.Value / total * 100m, 2, MidpointRounding.AwayFromZero);
                installments.Add(new InvoiceInstallment
                {
                    StudentInvoiceId = invoice.Id,
                    Sequence = request.Sequence,
                    DueDate = request.DueDate,
                    Percentage = percentage,
                    Amount = request.Amount.Value,
                    Status = "Pending"
                });
            }
        }

        foreach (var installment in installments)
        {
            await finance.AddInvoiceInstallmentAsync(installment, cancellationToken);
        }
        await finance.SaveChangesAsync(cancellationToken);
        return installments;
    }

    public async Task<IReadOnlyList<InvoiceInstallment>> GetOverdueAsync(Guid invoiceId, DateOnly asOf, CancellationToken cancellationToken)
    {
        var installments = await finance.GetInvoiceInstallmentsAsync(invoiceId, cancellationToken);
        return installments.Where(x => x.IsOverdue(asOf)).ToArray();
    }

    public sealed record InstallmentRequest(int Sequence, DateOnly DueDate, decimal? Percentage, decimal? Amount);
}
