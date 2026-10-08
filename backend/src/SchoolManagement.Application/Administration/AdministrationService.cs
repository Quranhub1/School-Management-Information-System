using SchoolManagement.Application.Authentication;
using SchoolManagement.Domain.Identity;

namespace SchoolManagement.Application.Administration;

public sealed record UserSummary(Guid Id, string Username, string FirstName, string LastName, string? Email, bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset? LastLoginAt, IReadOnlyList<string> Roles);
public sealed record CreateUserRequest(string Username, string Password, string FirstName, string LastName, string? Email, IReadOnlyList<string> Roles);
public sealed record UpdateUserRequest(string FirstName, string LastName, string? Email, IReadOnlyList<string> Roles);
public sealed record ResetUserPasswordRequest(string NewPassword);

public sealed class AdministrationService(IUserRepository users)
{
    public Task<IReadOnlyList<UserSummary>> GetUsersAsync(CancellationToken cancellationToken = default) => users.GetUsersAsync(cancellationToken);

    public async Task<UserSummary> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Username, password, first name, and last name are required.");
        if (request.Password.Length < 8) throw new ArgumentException("Password must contain at least 8 characters.");
        var username = request.Username.Trim();
        if (await users.FindByUsernameAsync(username, cancellationToken) is not null) throw new InvalidOperationException("Username is already in use.");
        var distinctRoles = request.Roles.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (distinctRoles.Length == 0) throw new ArgumentException("At least one role is required.");
        var user = new User { Username = username, PasswordHash = AuthService.HashPassword(request.Password), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), Email = request.Email?.Trim(), IsActive = true };
        await users.AddUserAsync(user, distinctRoles, cancellationToken);
        await users.SaveChangesAsync(cancellationToken);
        return (await users.GetUserAsync(user.Id, cancellationToken))!;
    }

    public async Task<UserSummary?> UpdateUserAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("First name and last name are required.");
        var roles = request.Roles?.Where(role => !string.IsNullOrWhiteSpace(role)).Select(role => role.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
            ?? Array.Empty<string>();
        if (roles.Length == 0) throw new ArgumentException("At least one role is required.");
        if (roles.Any(role => role.Length > 100)) throw new ArgumentException("A role name is invalid.");
        return await users.UpdateUserAsync(id, request.FirstName.Trim(), request.LastName.Trim(), request.Email, roles, cancellationToken);
    }

    public async Task<bool> ResetPasswordAsync(Guid id, string newPassword, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
            throw new ArgumentException("Password must contain at least 8 characters.");
        var user = await users.SetPasswordHashAsync(id, AuthService.HashPassword(newPassword), cancellationToken);
        if (user is null) return false;
        await users.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<UserSummary?> SetActiveAsync(Guid id, bool active, CancellationToken cancellationToken = default)
    {
        var user = await users.SetActiveAsync(id, active, cancellationToken);
        if (user is null) return null;
        await users.SaveChangesAsync(cancellationToken);
        return await users.GetUserAsync(id, cancellationToken);
    }
}
