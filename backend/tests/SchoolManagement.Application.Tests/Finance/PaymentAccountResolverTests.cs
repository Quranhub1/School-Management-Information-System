using SchoolManagement.Application.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class PaymentAccountResolverTests
{
    [Theory]
    [InlineData("Cash", FinanceAccountCodes.Cash)]
    [InlineData("Cash Payment", FinanceAccountCodes.Cash)]
    [InlineData("Bank Transfer", FinanceAccountCodes.Bank)]
    [InlineData("Cheque", FinanceAccountCodes.Bank)]
    [InlineData("Card", FinanceAccountCodes.Bank)]
    [InlineData("Mobile Money", FinanceAccountCodes.MobileMoney)]
    [InlineData("MTN MoMo", FinanceAccountCodes.MobileMoney)]
    [InlineData("Airtel Money", FinanceAccountCodes.MobileMoney)]
    [InlineData("SchoolPay", FinanceAccountCodes.SchoolPayClearing)]
    [InlineData("SchoolPay Bank Transfer", FinanceAccountCodes.SchoolPayClearing)]
    [InlineData("SchoolPay Mobile Money", FinanceAccountCodes.SchoolPayClearing)]
    public void Resolve_MapsPaymentChannelToExpectedLedgerAccount(string paymentMethod, string expectedAccountCode)
    {
        Assert.Equal(expectedAccountCode, PaymentAccountResolver.Resolve(paymentMethod));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("Crypto")]
    public void Resolve_RejectsBlankOrUnsupportedPaymentChannel(string paymentMethod)
    {
        Assert.Throws<ArgumentException>(() => PaymentAccountResolver.Resolve(paymentMethod));
    }
}
