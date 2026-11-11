using System.Globalization;

namespace SchoolManagement.Domain.Finance;

/// <summary>
/// Currency-aware arithmetic for financial workflows. C# decimal is used
/// throughout; binary floating-point values must not be used for ledger math.
/// </summary>
public static class MoneyMath
{
    private static readonly IReadOnlyDictionary<string, int> FractionDigits =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["BIF"] = 0, ["CLP"] = 0, ["DJF"] = 0, ["GNF"] = 0, ["ISK"] = 0,
            ["JPY"] = 0, ["KMF"] = 0, ["KRW"] = 0, ["PYG"] = 0, ["RWF"] = 0,
            ["UGX"] = 0, ["VND"] = 0, ["VUV"] = 0, ["XAF"] = 0, ["XOF"] = 0,
            ["XPF"] = 0,
            ["BHD"] = 3, ["IQD"] = 3, ["JOD"] = 3, ["KWD"] = 3, ["LYD"] = 3,
            ["OMR"] = 3, ["TND"] = 3,
        };

    private static readonly HashSet<string> SupportedCurrencyCodes = BuildSupportedCurrencyCodes();

    private static HashSet<string> BuildSupportedCurrencyCodes()
    {
        var codes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            // ISO 4217 codes not tied to a single country's current region.
            "XAD", "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XDR",
            "XPD", "XPT", "XSU", "XTS", "XUA", "XXX"
        };

        foreach (var culture in CultureInfo.GetCultures(CultureTypes.SpecificCultures))
        {
            try
            {
                var code = new RegionInfo(culture.Name).ISOCurrencySymbol;
                if (!string.IsNullOrWhiteSpace(code))
                    codes.Add(code);
            }
            catch (ArgumentException)
            {
                // Ignore cultures without a valid region mapping.
            }
        }

        return codes;
    }

    public static string NormalizeCurrency(string currency)
    {
        var code = currency?.Trim().ToUpperInvariant();
        if (code is null || code.Length != 3 || code.Any(c => c is < 'A' or > 'Z') || !SupportedCurrencyCodes.Contains(code))
            throw new ArgumentException($"'{currency}' is not a recognised ISO 4217 currency code.", nameof(currency));
        return code;
    }

    public static int GetFractionDigits(string currency)
    {
        var code = NormalizeCurrency(currency);
        return FractionDigits.TryGetValue(code, out var digits) ? digits : 2;
    }

    public static decimal Round(decimal amount, string currency)
    {
        var digits = GetFractionDigits(currency);
        return decimal.Round(amount, digits, MidpointRounding.AwayFromZero);
    }

    public static void EnsureCurrencySupportedByCurrentStorage(string currency)
    {
        var code = NormalizeCurrency(currency);
        if (GetFractionDigits(code) > 2)
            throw new NotSupportedException($"{code} requires three fractional digits, but the current finance database stores amounts to two decimal places.");
    }

    public static void EnsurePrecision(decimal amount, string currency)
    {
        if (amount != Round(amount, currency))
            throw new ArgumentException($"Amount has more fractional digits than {NormalizeCurrency(currency)} supports.", nameof(amount));
        EnsureCurrencySupportedByCurrentStorage(currency);
    }

    public static decimal Add(decimal left, decimal right, string currency) =>
        Round(checked(left + right), currency);

    public static decimal Subtract(decimal left, decimal right, string currency) =>
        Round(checked(left - right), currency);

    /// <summary>
    /// Converts source major units to target major units using an explicitly
    /// supplied rate (target units per one source unit). The caller must persist
    /// the rate and source/target currencies with the resulting transaction.
    /// </summary>
    public static decimal Convert(decimal amount, string sourceCurrency, string targetCurrency, decimal targetUnitsPerSourceUnit)
    {
        NormalizeCurrency(sourceCurrency);
        NormalizeCurrency(targetCurrency);
        if (targetUnitsPerSourceUnit <= 0m)
            throw new ArgumentOutOfRangeException(nameof(targetUnitsPerSourceUnit), "Exchange rate must be greater than zero.");
        return Round(checked(amount * targetUnitsPerSourceUnit), targetCurrency);
    }

    public static void EnsureSameCurrency(string leftCurrency, string rightCurrency)
    {
        if (!string.Equals(NormalizeCurrency(leftCurrency), NormalizeCurrency(rightCurrency), StringComparison.Ordinal))
            throw new InvalidOperationException("Amounts in different currencies cannot be combined without an explicit exchange-rate conversion.");
    }
}
