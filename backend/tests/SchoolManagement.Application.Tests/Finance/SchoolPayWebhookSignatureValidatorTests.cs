using System.Security.Cryptography;
using System.Text;
using SchoolManagement.Application.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class SchoolPayWebhookSignatureValidatorTests
{
    [Fact]
    public void IsValid_AcceptsDocumentedSha256Digest()
    {
        const string password = "test-schoolpay-password";
        const string receipt = "SP-RECEIPT-123";
        var signature = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(password + receipt)));

        Assert.True(SchoolPayWebhookSignatureValidator.IsValid(signature, password, receipt));
        Assert.True(SchoolPayWebhookSignatureValidator.IsValid(signature.ToLowerInvariant(), password, receipt));
    }

    [Fact]
    public void IsValid_RejectsWrongPassword()
    {
        var signature = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("correctSP-123")));

        Assert.False(SchoolPayWebhookSignatureValidator.IsValid(signature, "incorrect", "SP-123"));
    }

    [Fact]
    public void IsValid_RejectsMissingInputs()
    {
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid(null, "password", "receipt"));
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid("ABCD", null, "receipt"));
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid("ABCD", "password", " "));
    }

    [Fact]
    public void IsValid_RejectsMalformedOrIncorrectDigest()
    {
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid("not-hex", "password", "receipt"));
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid(new string('0', 64), "password", "receipt"));
        Assert.False(SchoolPayWebhookSignatureValidator.IsValid(new string('0', 64), "REPLACE_ME", "receipt"));
    }
}
