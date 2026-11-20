using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace SchoolManagement.Api.Authorization;

public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    : IAuthorizationPolicyProvider
{
    private const string Prefix = "Permission:";
    private readonly DefaultAuthorizationPolicyProvider fallback = new(options);

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync() => fallback.GetDefaultPolicyAsync();
    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync() => fallback.GetFallbackPolicyAsync();

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase))
            return fallback.GetPolicyAsync(policyName);

        var code = policyName[Prefix.Length..].Trim();
        if (string.IsNullOrWhiteSpace(code))
            return Task.FromResult<AuthorizationPolicy?>(null);

        var policy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(code))
            .Build();
        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
