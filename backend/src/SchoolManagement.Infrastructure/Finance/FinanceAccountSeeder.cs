using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Infrastructure.Finance;

public sealed class FinanceAccountSeeder(SchoolManagementDbContext db)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var chart = await db.ChartOfAccounts.FirstOrDefaultAsync(x => x.Code == "SCHOOL", cancellationToken);
        if (chart is null)
        {
            chart = new ChartOfAccounts
            {
                Code = "SCHOOL",
                Name = "School Standard Chart of Accounts",
                Description = "Default operational chart used by the school finance module."
            };
            db.ChartOfAccounts.Add(chart);
            await db.SaveChangesAsync(cancellationToken);
        }

        var accounts = new (string Code, string Name, string Type)[]
        {
            (FinanceAccountCodes.Cash, "Cash on Hand", "Asset"),
            (FinanceAccountCodes.Bank, "Bank Account", "Asset"),
            (FinanceAccountCodes.MobileMoney, "Mobile Money", "Asset"),
            (FinanceAccountCodes.StudentReceivables, "Student Receivables", "Asset"),
            (FinanceAccountCodes.TuitionRevenue, "Tuition and Fee Revenue", "Revenue"),
            (FinanceAccountCodes.DiscountAllowed, "Discounts and Waivers Allowed", "Expense")
        };

        foreach (var item in accounts)
        {
            var exists = await db.Accounts.AnyAsync(x => x.ChartOfAccountsId == chart.Id && x.Code == item.Code, cancellationToken);
            if (!exists)
            {
                db.Accounts.Add(new Account
                {
                    ChartOfAccountsId = chart.Id,
                    Code = item.Code,
                    Name = item.Name,
                    AccountType = item.Type,
                    IsActive = true
                });
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
