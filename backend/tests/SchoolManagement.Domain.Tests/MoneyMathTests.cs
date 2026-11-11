using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Domain.Tests;

public sealed class MoneyMathTests
{
    [Theory]
    [InlineData("UGX", 0)]
    [InlineData("JPY", 0)]
    [InlineData("USD", 2)]
    [InlineData("KES", 2)]
    [InlineData("KWD", 3)]
    public void Resolves_iso_currency_fraction_digits(string currency, int expected) =>
        Assert.Equal(expected, MoneyMath.GetFractionDigits(currency));

    [Fact]
    public void Rounds_using_currency_precision_and_midpoint_away_from_zero()
    {
        Assert.Equal(125m, MoneyMath.Round(124.5m, "UGX"));
        Assert.Equal(1.24m, MoneyMath.Round(1.235m, "USD"));
        Assert.Equal(-1.24m, MoneyMath.Round(-1.235m, "USD"));
        Assert.Equal(1.235m, MoneyMath.Round(1.2346m, "KWD"));
    }

    [Fact]
    public void Adds_and_subtracts_decimal_amounts_without_binary_float_error()
    {
        Assert.Equal(0.30m, MoneyMath.Add(0.10m, 0.20m, "USD"));
        Assert.Equal(0.10m, MoneyMath.Subtract(0.30m, 0.20m, "USD"));
    }

    [Fact]
    public void Converts_only_with_a_positive_explicit_rate_and_target_precision()
    {
        Assert.Equal(3750m, MoneyMath.Convert(1.5m, "USD", "UGX", 2500m));
        Assert.Equal(1.235m, MoneyMath.Convert(1m, "USD", "KWD", 1.2346m));
        Assert.Throws<ArgumentOutOfRangeException>(() => MoneyMath.Convert(1m, "USD", "UGX", 0m));
    }

    [Fact]
    public void Rejects_three_decimal_currencies_until_database_precision_is_upgraded()
    {
        Assert.Throws<NotSupportedException>(() => MoneyMath.EnsurePrecision(1.234m, "KWD"));
        Assert.Equal(1.23m, MoneyMath.Round(1.234m, "KWD"));
    }

    [Fact]
    public void Refuses_to_combine_different_currencies()
    {
        Assert.Throws<InvalidOperationException>(() => MoneyMath.EnsureSameCurrency("UGX", "USD"));
        MoneyMath.EnsureSameCurrency("ugx", "UGX");
    }

    [Theory]
    [InlineData("")]
    [InlineData("US")]
    [InlineData("US1")]
    public void Rejects_invalid_currency_codes(string currency) =>
        Assert.Throws<ArgumentException>(() => MoneyMath.NormalizeCurrency(currency));
}
