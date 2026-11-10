using System.Security.Cryptography;
using System.Text;

namespace SchoolManagement.Application.Finance;

public static class SchoolPaySyncHash
{
    public static string Compute(string schoolCode, string fromDate, string apiPassword)
    {
        if (string.IsNullOrWhiteSpace(schoolCode)) throw new ArgumentException("SchoolPay school code is required.", nameof(schoolCode));
        if (string.IsNullOrWhiteSpace(fromDate)) throw new ArgumentException("SchoolPay from-date is required.", nameof(fromDate));
        if (string.IsNullOrWhiteSpace(apiPassword)) throw new ArgumentException("SchoolPay API password is required.", nameof(apiPassword));

        var input = Encoding.ASCII.GetBytes(schoolCode + fromDate + apiPassword);
        return Convert.ToHexString(MD5.HashData(input)).ToUpperInvariant();
    }
}
