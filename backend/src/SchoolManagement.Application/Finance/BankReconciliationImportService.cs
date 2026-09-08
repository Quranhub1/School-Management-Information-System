using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record ImportBankStatementLine(DateTimeOffset TransactionDate, decimal Amount, string TransactionType, string? Description = null, string? Reference = null);

public sealed class BankReconciliationImportService(IBankReconciliationRepository repository)
{
    public async Task<IReadOnlyList<BankStatementLine>> ImportAsync(
        Guid reconciliationId,
        IEnumerable<ImportBankStatementLine> rows,
        CancellationToken cancellationToken = default)
    {
        if (reconciliationId == Guid.Empty)
            throw new ArgumentException("Bank reconciliation is required.", nameof(reconciliationId));

        var reconciliation = await repository.GetAsync(reconciliationId, cancellationToken)
            ?? throw new KeyNotFoundException("Bank reconciliation was not found.");

        if (string.Equals(reconciliation.Status, "Reconciled", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("A completed reconciliation cannot receive imported statement lines.");

        var source = rows?.ToList() ?? throw new ArgumentNullException(nameof(rows));
        if (source.Count == 0)
            throw new ArgumentException("At least one statement line is required.", nameof(rows));

        var existing = await repository.GetLinesAsync(reconciliationId, cancellationToken);
        var existingKeys = existing
            .Select(LineKey)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var imported = new List<BankStatementLine>(source.Count);

        foreach (var row in source)
        {
            if (row.Amount <= 0)
                throw new ArgumentException("Imported statement line amounts must be greater than zero.");

            var type = row.TransactionType?.Trim() ?? string.Empty;
            if (!type.Equals("Credit", StringComparison.OrdinalIgnoreCase) &&
                !type.Equals("Debit", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Imported transaction type must be Credit or Debit.");

            var line = new BankStatementLine
            {
                BankReconciliationId = reconciliationId,
                TransactionDate = row.TransactionDate,
                Amount = row.Amount,
                TransactionType = type,
                Description = row.Description?.Trim(),
                Reference = row.Reference?.Trim(),
                Status = "Unmatched"
            };

            var key = LineKey(line);
            if (!existingKeys.Add(key))
                continue;

            await repository.AddLineAsync(line, cancellationToken);
            imported.Add(line);
        }

        if (imported.Count == 0)
            throw new InvalidOperationException("The import contains no new statement lines.");

        await repository.SaveChangesAsync(cancellationToken);
        return imported;
    }

    private static string LineKey(BankStatementLine line) =>
        $"{line.TransactionDate.UtcDateTime.Ticks}|{line.Amount:0.00}|{line.TransactionType.Trim().ToUpperInvariant()}|{line.Reference?.Trim().ToUpperInvariant()}|{line.Description?.Trim().ToUpperInvariant()}";
}
