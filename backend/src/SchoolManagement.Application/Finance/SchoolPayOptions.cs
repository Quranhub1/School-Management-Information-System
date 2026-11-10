namespace SchoolManagement.Application.Finance;

public sealed class SchoolPayOptions
{
    public const string SectionName = "SchoolPay";

    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string MerchantId { get; set; } = string.Empty;
    // Must be the SchoolPay-issued password used for SHA256(password + receiptNumber) webhook verification.
    public string WebhookSecret { get; set; } = string.Empty;
    public string SchoolCode { get; set; } = string.Empty;
    public string ApiPassword { get; set; } = string.Empty;
    public bool ReconciliationEnabled { get; set; }
    public int ReconciliationIntervalMinutes { get; set; } = 360;
    public int ReconciliationLookbackDays { get; set; } = 7;
    public string SuccessRedirectUrl { get; set; } = string.Empty;
    public string FailureRedirectUrl { get; set; } = string.Empty;
    public int RequestTimeoutSeconds { get; set; } = 30;
}
