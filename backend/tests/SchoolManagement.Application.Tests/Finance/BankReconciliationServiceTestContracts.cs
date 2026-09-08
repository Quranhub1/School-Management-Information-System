namespace SchoolManagement.Application.Tests.Finance;

// Keeps the test double unambiguous while preserving the production finance contract.
public interface IFinanceRepository : SchoolManagement.Application.Finance.IFinanceRepository
{
}
