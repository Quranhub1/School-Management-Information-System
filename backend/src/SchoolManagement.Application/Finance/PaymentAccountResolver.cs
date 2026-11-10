namespace SchoolManagement.Application.Finance;

public static class PaymentAccountResolver
{
    public static string Resolve(string paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
            throw new ArgumentException("Payment method is required.", nameof(paymentMethod));

        var method = paymentMethod.Trim().ToLowerInvariant();

        // SchoolPay is a collection platform spanning bank, mobile-money and
        // other supported channels. Keep its receipts in a clearing asset
        // until Finance reconciles the actual settlement destination.
        if (method.Contains("schoolpay"))
            return FinanceAccountCodes.SchoolPayClearing;

        if (method is "cash" or "cash payment")
            return FinanceAccountCodes.Cash;

        if (method.Contains("mobile") || method.Contains("momo") || method.Contains("mtn") || method.Contains("airtel"))
            return FinanceAccountCodes.MobileMoney;

        if (method.Contains("bank") || method.Contains("transfer") || method.Contains("card") || method.Contains("cheque") || method.Contains("check"))
            return FinanceAccountCodes.Bank;

        throw new ArgumentException("Unsupported payment method. Use Cash, Bank/Transfer/Card/Cheque, Mobile Money, or SchoolPay.", nameof(paymentMethod));
    }
}
