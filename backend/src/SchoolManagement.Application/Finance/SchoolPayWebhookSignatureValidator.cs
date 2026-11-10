using System.Security.Cryptography;
using System.Text;

namespace SchoolManagement.Application.Finance;

/// <summary>
/// Validates the SchoolPay webhook digest documented as SHA256(schoolApiPassword + schoolpayReceiptNumber).
/// The configured secret must be the exact password issued by SchoolPay for this webhook contract.
/// </summary>
public static class SchoolPayWebhookSignatureValidator
{
    public static bool IsValid(string? suppliedSignature, string? schoolApiPassword, string? schoolPayReceiptNumber)
    {
        if (string.IsNullOrWhiteSpace(suppliedSignature)
            || string.IsNullOrWhiteSpace(schoolApiPassword)
            || string.IsNullOrWhiteSpace(schoolPayReceiptNumber)
            || schoolApiPassword.Contains("REPLACE_ME", StringComparison.OrdinalIgnoreCase)
            || schoolApiPassword.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
            return false;

        var expected = SHA256.HashData(Encoding.UTF8.GetBytes(schoolApiPassword + schoolPayReceiptNumber.Trim()));
        try
        {
            var supplied = Convert.FromHexString(suppliedSignature.Trim());
            return supplied.Length == expected.Length
                && CryptographicOperations.FixedTimeEquals(supplied, expected);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
