using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SchoolManagement.Application.Authentication;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService auth, IConfiguration configuration) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await auth.AuthenticateAsync(request, cancellationToken);
        if (user is null) return Unauthorized(new { message = "Invalid username or password." });

        var key = configuration["Authentication:JwtKey"]
            ?? throw new InvalidOperationException("Authentication:JwtKey is not configured.");
        var issuer = configuration["Authentication:JwtIssuer"]
            ?? throw new InvalidOperationException("Authentication:JwtIssuer is not configured.");
        var audience = configuration["Authentication:JwtAudience"]
            ?? throw new InvalidOperationException("Authentication:JwtAudience is not configured.");
        var expires = DateTime.UtcNow.AddHours(8);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(user.Roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return Ok(new
        {
            accessToken = new JwtSecurityTokenHandler().WriteToken(token),
            expiresAt = expires,
            username = user.Username,
            roles = user.Roles
        });
    }
}
