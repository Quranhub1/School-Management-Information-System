using FluentValidation;
using SchoolManagement.Api.Controllers;

namespace SchoolManagement.Api.Validation;

public sealed class CreateNoticeRequestValidator : AbstractValidator<CreateNoticeRequest>
{
    public CreateNoticeRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(8000);
        RuleFor(x => x.Priority).MaximumLength(30);
        RuleFor(x => x.Audience)
            .NotEmpty()
            .Must(IsSupportedAudience)
            .WithMessage("Choose All, a role, or a department as the notice audience.");
        RuleFor(x => x.ExpiresAt)
            .Must(value => value is null || value.Value > DateTimeOffset.UtcNow)
            .WithMessage("Notice expiry must be in the future.");
    }

    private static bool IsSupportedAudience(string? audience)
    {
        if (string.IsNullOrWhiteSpace(audience)) return false;
        var value = audience.Trim();
        if (value.Equals("All", StringComparison.OrdinalIgnoreCase)) return true;
        var separator = value.IndexOf(':');
        if (separator < 0 || separator == value.Length - 1) return false;
        var kind = value[..separator].Trim();
        var target = value[(separator + 1)..].Trim();
        if (kind.Equals("Role", StringComparison.OrdinalIgnoreCase))
            return !target.Equals("Student", StringComparison.OrdinalIgnoreCase);
        return kind.Equals("Department", StringComparison.OrdinalIgnoreCase);
    }
}
