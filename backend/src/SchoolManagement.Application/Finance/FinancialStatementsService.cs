using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record FinancialStatementRow(string AccountCode, string AccountName, string AccountType, decimal Amount);
public sealed record IncomeStatement(decimal Revenue, decimal Expenses, decimal NetResult, IReadOnlyList<FinancialStatementRow> Lines);
public sealed record BalanceSheet(decimal Assets, decimal Liabilities, decimal Equity, decimal Difference, IReadOnlyList<FinancialStatementRow> Lines);
public sealed record CashBankSummary(decimal Cash, decimal Bank, decimal Total);

public sealed class FinancialStatementsService(IFinanceRepository finance)
{
    public async Task<IncomeStatement> GetIncomeStatementAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var lines = Flatten(entries).Where(x => IsType(x.Account.AccountType, "Revenue", "Income", "Expense", "Expenses"));
        var rows = lines.GroupBy(x => x.Account.Id).Select(g => ToRow(g.Select(x => x.Account).First(), g.Sum(x => x.Debit - x.Credit))).OrderBy(x => x.AccountCode).ToList();
        var revenue = rows.Where(x => IsType(x.AccountType, "Revenue", "Income")).Sum(x => -x.Amount);
        var expenses = rows.Where(x => IsType(x.AccountType, "Expense", "Expenses")).Sum(x => x.Amount);
        return new IncomeStatement(revenue, expenses, revenue - expenses, rows);
    }

    public async Task<BalanceSheet> GetBalanceSheetAsync(DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(null, to, null, cancellationToken);
        var rows = Flatten(entries).Where(x => IsType(x.Account.AccountType, "Asset", "Assets", "Liability", "Liabilities", "Equity")).GroupBy(x => x.Account.Id)
            .Select(g => ToRow(g.Select(x => x.Account).First(), g.Sum(x => x.Debit - x.Credit))).OrderBy(x => x.AccountCode).ToList();
        var assets = rows.Where(x => IsType(x.AccountType, "Asset", "Assets")).Sum(x => x.Amount);
        var liabilities = rows.Where(x => IsType(x.AccountType, "Liability", "Liabilities")).Sum(x => -x.Amount);
        var equity = rows.Where(x => string.Equals(x.AccountType, "Equity", StringComparison.OrdinalIgnoreCase)).Sum(x => -x.Amount);
        return new BalanceSheet(assets, liabilities, equity, assets - (liabilities + equity), rows);
    }

    public async Task<CashBankSummary> GetCashAndBankSummaryAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var rows = Flatten(entries).Where(x => IsType(x.Account.AccountType, "Asset", "Assets") &&
            (x.Account.Name.Contains("cash", StringComparison.OrdinalIgnoreCase) || x.Account.Name.Contains("bank", StringComparison.OrdinalIgnoreCase)));
        var cash = rows.Where(x => x.Account.Name.Contains("cash", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Debit - x.Credit);
        var bank = rows.Where(x => x.Account.Name.Contains("bank", StringComparison.OrdinalIgnoreCase)).Sum(x => x.Debit - x.Credit);
        return new CashBankSummary(cash, bank, cash + bank);
    }

    private static IEnumerable<(Account Account, JournalEntryLine Line)> Flatten(IEnumerable<JournalEntry> entries) => entries.SelectMany(e => e.Lines.Where(l => l.Account != null).Select(l => (l.Account!, l)));
    private static FinancialStatementRow ToRow(Account account, decimal signedBalance) => new(account.Code, account.Name, account.AccountType, signedBalance);
    private static bool IsType(string type, params string[] values) => values.Any(v => string.Equals(type, v, StringComparison.OrdinalIgnoreCase));
}
