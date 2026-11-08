namespace SchoolManagement.Application.Finance;

public sealed class SchoolPayOptions
{
    public const string SectionName = "SchoolPay";

    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string MerchantId { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string SuccessRedirectUrl { get; set; } = string.Empty;
    public string FailureRedirectUrl { get; set; } = string.Empty;
    public int RequestTimeoutSeconds { get; set; } = 30;
}
