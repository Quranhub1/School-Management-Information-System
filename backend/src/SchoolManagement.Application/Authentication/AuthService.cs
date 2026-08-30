using System.Security.Cryptography;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Application.Administration;

namespace SchoolManagement.Application.Authentication;

public sealed record LoginRequest(string Username, string Password);
public sealed record AuthenticatedUser(Guid UserId, string Username, IReadOnlyList<string> Roles);

public interface IUserRepository
{
    Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<string>> GetRolesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserSummary>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<UserSummary?> GetUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddUserAsync(User user, IReadOnlyList<string> roles, CancellationToken cancellationToken = default);
    Task<User?> SetActiveAsync(Guid userId, bool active, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed class AuthService(IUserRepository users)
{
    public async Task<AuthenticatedUser?> AuthenticateAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await users.FindByUsernameAsync(request.Username.Trim(), cancellationToken);
        if (user is null || !user.IsActive || !VerifyPassword(request.Password, user.PasswordHash)) return null;
        var roles = await users.GetRolesAsync(user.Id, cancellationToken);
        user.LastLoginAt = DateTimeOffset.UtcNow;
        await users.SaveChangesAsync(cancellationToken);
        return new AuthenticatedUser(user.Id, user.Username, roles);
    }

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 120_000, HashAlgorithmName.SHA256, 32);
        return $"PBKDF2-SHA256$120000${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string encoded)
    {
        var parts = encoded.Split('$');
        if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations)) return false;
        var algorithm = parts[0].ToUpperInvariant();
        if (algorithm != "PBKDF2-SHA256") return false;
        try
        {
            var salt = Convert.FromBase64String(parts[2]); var expected = Convert.FromBase64String(parts[3]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException) { return false; }
    }
}
