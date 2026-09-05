using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record AccountLedgerRow(
    Guid AccountId,
    string AccountCode,
    string AccountName,
    string AccountType,
    DateTimeOffset Date,
    string EntryNumber,
    string Description,
    decimal Debit,
    decimal Credit,
    decimal Balance);

public sealed record TrialBalanceRow(
    Guid AccountId,
    string AccountCode,
    string AccountName,
    string AccountType,
    decimal Debit,
    decimal Credit,
    decimal Balance);

public sealed record StudentReceivableRow(
    Guid StudentId,
    decimal Invoiced,
    decimal Paid,
    decimal Outstanding);

public sealed class FinanceReportService(IFinanceRepository finance)
{
    public async Task<IReadOnlyList<AccountLedgerRow>> GetGeneralLedgerAsync(
        DateOnly? from = null,
        DateOnly? to = null,
        Guid? accountId = null,
        CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, accountId, cancellationToken);
        var rows = new List<AccountLedgerRow>();
        var running = new Dictionary<Guid, decimal>();

        foreach (var entry in entries.OrderBy(x => x.EntryDate).ThenBy(x => x.EntryNumber))
        {
            foreach (var line in entry.Lines)
            {
                if (accountId.HasValue && line.AccountId != accountId.Value) continue;
                var account = line.Account!;
                running.TryGetValue(account.Id, out var balance);
                balance += line.Debit - line.Credit;
                running[account.Id] = balance;
                rows.Add(new AccountLedgerRow(account.Id, account.Code, account.Name, account.AccountType,
                    entry.EntryDate, entry.EntryNumber, line.Description ?? entry.Description ?? string.Empty,
                    line.Debit, line.Credit, balance));
            }
        }
        return rows;
    }

    public async Task<IReadOnlyList<TrialBalanceRow>> GetTrialBalanceAsync(
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var totals = new Dictionary<Guid, (Account Account, decimal Debit, decimal Credit)>();

        foreach (var entry in entries)
        foreach (var line in entry.Lines)
        {
            var account = line.Account!;
            totals.TryGetValue(account.Id, out var current);
            totals[account.Id] = (account, current.Debit + line.Debit, current.Credit + line.Credit);
        }

        return totals.Values
            .OrderBy(x => x.Account.Code)
            .Select(x => new TrialBalanceRow(x.Account.Id, x.Account.Code, x.Account.Name, x.Account.AccountType,
                x.Debit, x.Credit, x.Debit - x.Credit))
            .ToList();
    }

    public async Task<IReadOnlyList<StudentReceivableRow>> GetStudentReceivablesAsync(
        CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetAllStudentInvoicesAsync(cancellationToken);
        return invoices.GroupBy(x => x.StudentId)
            .Select(g => new StudentReceivableRow(g.Key,
                g.Sum(x => x.Amount), g.Sum(x => x.PaidAmount), g.Sum(x => x.Amount - x.PaidAmount)))
            .OrderByDescending(x => x.Outstanding)
            .ToList();
    }
}
