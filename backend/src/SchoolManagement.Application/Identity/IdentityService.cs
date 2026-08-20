using SchoolManagement.Domain.Identity;

namespace SchoolManagement.Application.Identity;

public sealed class IdentityService
{
    public bool VerifyPassword(User user, string password) =>
        user.IsActive && PasswordHasher.Verify(password, user.PasswordHash);
}
