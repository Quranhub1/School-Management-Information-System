using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure;
using SchoolManagement.Infrastructure.Finance;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Infrastructure.Persistence;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");
builder.Services.AddHttpClient("Superset");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth-login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 10;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
});
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
if (builder.Environment.IsProduction() && allowedOrigins.Length == 0)
    throw new InvalidOperationException("AllowedOrigins must contain at least one trusted frontend origin in Production.");
builder.Services.AddCors(options => { options.AddDefaultPolicy(policy => { if (allowedOrigins.Length > 0) policy.WithOrigins(allowedOrigins); else policy.AllowAnyOrigin(); policy.AllowAnyHeader(); policy.AllowAnyMethod(); }); });
builder.Services.AddApplication();
var connectionString = builder.Configuration.GetConnectionString("SchoolManagement") ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");
if (builder.Environment.IsProduction() && (connectionString.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase) || connectionString.Contains("replace-me", StringComparison.OrdinalIgnoreCase) || connectionString.Contains("server=localhost", StringComparison.OrdinalIgnoreCase)))
    throw new InvalidOperationException("Production database connection string contains an unresolved placeholder.");
builder.Services.AddInfrastructure(builder.Configuration);
var jwtKey = builder.Configuration["Authentication:JwtKey"] ?? throw new InvalidOperationException("Authentication:JwtKey is not configured.");
if (builder.Environment.IsProduction() && (jwtKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase) || jwtKey.Contains("replace-with", StringComparison.OrdinalIgnoreCase) || jwtKey.Length < 32))
    throw new InvalidOperationException("Production Authentication:JwtKey must be a strong random key of at least 32 characters.");
var jwtIssuer = builder.Configuration["Authentication:JwtIssuer"] ?? throw new InvalidOperationException("Authentication:JwtIssuer is not configured.");
var jwtAudience = builder.Configuration["Authentication:JwtAudience"] ?? throw new InvalidOperationException("Authentication:JwtAudience is not configured.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), ValidateIssuer = true, ValidIssuer = jwtIssuer, ValidateAudience = true, ValidAudience = jwtAudience, ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1) });
builder.Services.AddAuthorization(options => { options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build(); options.AddPolicy(AuthorizationPolicies.Administration, policy => policy.RequireRole("SystemAdministrator")); options.AddPolicy(AuthorizationPolicies.FinanceRead, policy => policy.RequireClaim("permission", "finance.read")); });
var app = builder.Build();
app.UseApiExceptionHandling();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SchoolManagementDbContext>();
    await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<AdminSeeder>().SeedAsync();
    await scope.ServiceProvider.GetRequiredService<FinanceAccountSeeder>().SeedAsync();
}
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();
app.Run();
public partial class Program { }

