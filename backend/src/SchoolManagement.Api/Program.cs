using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SchoolManagement.Application;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Api.BackgroundServices;
using SchoolManagement.Infrastructure;
using SchoolManagement.Infrastructure.Finance;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.RateLimiting;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
var dataProtectionPath = builder.Configuration["Security:DataProtectionKeysPath"];
if (string.IsNullOrWhiteSpace(dataProtectionPath))
{
    var localData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    dataProtectionPath = Path.Combine(string.IsNullOrWhiteSpace(localData) ? AppContext.BaseDirectory : localData, "SMIS", "DataProtectionKeys");
}
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath)).SetApplicationName("KSHS.SMIS");
var logDirectory = Environment.GetEnvironmentVariable("SMIS_LOG_DIRECTORY");
if (string.IsNullOrWhiteSpace(logDirectory))
{
    var localDataDirectory = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
    logDirectory = string.IsNullOrWhiteSpace(localDataDirectory)
        ? Path.Combine(AppContext.BaseDirectory, "logs")
        : Path.Combine(localDataDirectory, "SMIS", "logs");
}
Directory.CreateDirectory(logDirectory);
builder.Host.UseSerilog((context, _, loggerConfiguration) =>
{
    loggerConfiguration
        .MinimumLevel.Is(context.HostingEnvironment.IsDevelopment()
            ? Serilog.Events.LogEventLevel.Debug
            : Serilog.Events.LogEventLevel.Information)
        .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "SMIS.Api")
        .Enrich.WithProperty("Environment", context.HostingEnvironment.EnvironmentName)
        .WriteTo.Console()
        .WriteTo.File(
            Path.Combine(logDirectory, "smis-.log"),
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: context.Configuration.GetValue<int?>("Logging:FileRetentionDays") ?? 14,
            fileSizeLimitBytes: context.Configuration.GetValue<long?>("Logging:FileSizeLimitBytes") ?? 10L * 1024 * 1024,
            rollOnFileSizeLimit: true,
            shared: true,
            flushToDiskInterval: TimeSpan.FromSeconds(2));
});
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    // The frontend submits enum values such as "Teaching" and "NonTeaching".
    // Accept those strings consistently instead of requiring numeric enum values.
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    o.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");
builder.Services.AddHttpClient("Superset");
builder.Services.AddHttpClient("InstitutionalEmailService", client =>
{
    var emailServiceBaseUrl = builder.Configuration["EmailService:BaseUrl"] ?? "http://127.0.0.1:5100";
    client.BaseAddress = new Uri(emailServiceBaseUrl, UriKind.Absolute);
    client.Timeout = TimeSpan.FromSeconds(45);
});
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
    options.AddPolicy("client-diagnostics", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddFixedWindowLimiter("finance-write", limiterOptions =>
    {
        limiterOptions.PermitLimit = 30;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
    options.AddFixedWindowLimiter("student-write", limiterOptions =>
    {
        limiterOptions.PermitLimit = 20;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
        limiterOptions.AutoReplenishment = true;
    });
    options.AddPolicy("general-api", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});
builder.Services.AddAntiforgery(options => { options.HeaderName = "X-CSRF-TOKEN"; });
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
if (builder.Environment.IsProduction() && allowedOrigins.Length == 0)
    throw new InvalidOperationException("AllowedOrigins must contain at least one trusted frontend origin in Production.");
builder.Services.AddCors(options => { options.AddDefaultPolicy(policy => { if (allowedOrigins.Length > 0) policy.WithOrigins(allowedOrigins); else policy.AllowAnyOrigin(); policy.AllowAnyHeader().AllowAnyMethod().WithExposedHeaders(SchoolManagement.Api.Middleware.CorrelationIdMiddleware.HeaderName); }); });
builder.Services.AddApplication();
builder.Services.AddScoped<PaymentReceiptEmailService>();
builder.Services.AddHostedService<PaymentReceiptEmailWorker>();
builder.Services.Configure<SchoolPayOptions>(builder.Configuration.GetSection(SchoolPayOptions.SectionName));
builder.Services.AddHttpClient(nameof(SchoolPayReconciliationWorker));
builder.Services.AddHostedService<SchoolPayReconciliationWorker>();
builder.Services.AddScoped<CampusAccessService>();
builder.Services.AddSingleton<LocalDatabaseBackupService>();
builder.Services.AddHostedService<ScheduledLocalBackupWorker>();
var connectionString = builder.Configuration.GetConnectionString("SchoolManagement") ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured.");
if (builder.Environment.IsProduction() && (connectionString.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase) || connectionString.Contains("replace-me", StringComparison.OrdinalIgnoreCase)))
    throw new InvalidOperationException("Production database connection string contains an unresolved placeholder.");
builder.Services.AddInfrastructure(builder.Configuration);
var jwtKey = builder.Configuration["Authentication:JwtKey"] ?? throw new InvalidOperationException("Authentication:JwtKey is not configured.");
if (builder.Environment.IsProduction() && (jwtKey.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase) || jwtKey.Contains("replace-with", StringComparison.OrdinalIgnoreCase) || jwtKey.Length < 32))
    throw new InvalidOperationException("Production Authentication:JwtKey must be a strong random key of at least 32 characters.");
var jwtIssuer = builder.Configuration["Authentication:JwtIssuer"] ?? throw new InvalidOperationException("Authentication:JwtIssuer is not configured.");
var jwtAudience = builder.Configuration["Authentication:JwtAudience"] ?? throw new InvalidOperationException("Authentication:JwtAudience is not configured.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters { ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), ValidateIssuer = true, ValidIssuer = jwtIssuer, ValidateAudience = true, ValidAudience = jwtAudience, ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(1) });
builder.Services.AddAuthorization(options => { options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build(); options.AddPolicy(AuthorizationPolicies.AcademicManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.AcademicManagement)); options.AddPolicy(AuthorizationPolicies.AcademicRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.AcademicRead)); options.AddPolicy(AuthorizationPolicies.StudentManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.StudentManagement)); options.AddPolicy(AuthorizationPolicies.StudentRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.StudentRead)); options.AddPolicy(AuthorizationPolicies.FinanceManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.FinanceManagement)); options.AddPolicy(AuthorizationPolicies.FinanceOperations, p => p.RequireRole(AuthorizationPolicies.RoleSets.FinanceOperations)); options.AddPolicy(AuthorizationPolicies.FinanceRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.FinanceRead)); options.AddPolicy(AuthorizationPolicies.PayrollRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.PayrollRead)); options.AddPolicy(AuthorizationPolicies.ExaminationManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.ExaminationManagement)); options.AddPolicy(AuthorizationPolicies.AttendanceManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.AttendanceManagement)); options.AddPolicy(AuthorizationPolicies.AttendanceRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.AttendanceRead)); options.AddPolicy(AuthorizationPolicies.HostelManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.HostelManagement)); options.AddPolicy(AuthorizationPolicies.InventoryManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.InventoryManagement)); options.AddPolicy(AdmissionsPolicies.Management, p => p.RequireRole(AuthorizationPolicies.RoleSets.AdmissionsManagement)); options.AddPolicy(AdmissionsPolicies.Read, p => p.RequireRole(AuthorizationPolicies.RoleSets.AdmissionsRead)); options.AddPolicy(AuthorizationPolicies.AdmissionsRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.AdmissionsRead)); options.AddPolicy(TimetablePolicies.Management, p => p.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.HrManager)); options.AddPolicy(TimetablePolicies.Read, p => p.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.HrManager)); options.AddPolicy(StaffPolicies.Read, p => p.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Lecturer, InstitutionalRoles.Accountant, InstitutionalRoles.AssistantAccountant, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer, InstitutionalRoles.AdminSecretary, InstitutionalRoles.AssistantRegistrar)); options.AddPolicy(StaffPolicies.Management, p => p.RequireRole(AuthorizationPolicies.RoleSets.StaffManagement)); options.AddPolicy(LibraryPolicies.Read, p => p.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Librarian, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.AdminSecretary, InstitutionalRoles.Lecturer)); options.AddPolicy(LibraryPolicies.Management, p => p.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Librarian, InstitutionalRoles.HrManager)); options.AddPolicy(AuthorizationPolicies.Administration, p => p.RequireRole(AuthorizationPolicies.RoleSets.AdministrationManagement)); options.AddPolicy(AuthorizationPolicies.ReportingManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.ReportingManagement)); options.AddPolicy(AuthorizationPolicies.CommunicationManagement, p => p.RequireRole(AuthorizationPolicies.RoleSets.CommunicationManagement)); options.AddPolicy(AuthorizationPolicies.CommunicationRead, p => p.RequireRole(AuthorizationPolicies.RoleSets.CommunicationRead)); options.AddPolicy(AuthorizationPolicies.StudentPortal, p => p.RequireRole(AuthorizationPolicies.RoleSets.StudentPortal)); options.AddPolicy(AuthorizationPolicies.Student360, p => p.RequireRole(AuthorizationPolicies.RoleSets.Student360)); });
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SchoolManagementDbContext>();
    await db.Database.MigrateAsync();
    await scope.ServiceProvider.GetRequiredService<AdminSeeder>().SeedAsync();
    await scope.ServiceProvider.GetRequiredService<FinanceAccountSeeder>().SeedAsync();
}
app.UseMiddleware<SchoolManagement.Api.Middleware.CorrelationIdMiddleware>();
app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("CorrelationId",
            httpContext.Items[SchoolManagement.Api.Middleware.CorrelationIdMiddleware.ItemKey] as string
            ?? httpContext.TraceIdentifier);
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseHttpsRedirection();
app.UseCors();
app.UseMiddleware<SchoolManagement.Api.Middleware.InputSanitizationMiddleware>();
app.UseRateLimiter();
app.UseAntiforgeryTokens();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health").AllowAnonymous();
app.MapPost("/api/diagnostics/client-errors", (
    ClientErrorReport report,
    HttpContext httpContext,
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(report.Message) || report.Message.Length > 500
        || (report.Stack?.Length ?? 0) > 3000
        || (report.Source?.Length ?? 0) > 120
        || (report.Path?.Length ?? 0) > 256
        || (report.CorrelationId?.Length ?? 0) > 64)
        return Results.BadRequest();

    static string Sanitize(string value)
    {
        var redacted = Regex.Replace(
            Regex.Replace(value, @"(?i)(bearer\s+)[a-z0-9._~+/=-]+", "$1[REDACTED]"),
            @"(?i)(password|token|authorization|secret)(\s*[:=]\s*)[^&\s,;]+",
            "$1$2[REDACTED]");
        return Regex.Replace(redacted, @"[\u0000-\u001F\u007F]", " ");
    }

    var correlationId = httpContext.Items[SchoolManagement.Api.Middleware.CorrelationIdMiddleware.ItemKey] as string
        ?? httpContext.TraceIdentifier;
    logger.LogWarning(
        "Frontend client error reported. Source={ClientSource}; Message={ClientMessage}; ClientCorrelationId={ClientCorrelationId}; RequestCorrelationId={CorrelationId}; Path={ClientPath}; Stack={ClientStack}",
        Sanitize(report.Source ?? "unknown"),
        Sanitize(report.Message),
        Sanitize(report.CorrelationId ?? string.Empty),
        correlationId,
        Sanitize(report.Path ?? string.Empty),
        Sanitize(report.Stack ?? string.Empty));
    return Results.Accepted();
}).RequireAuthorization().RequireRateLimiting("client-diagnostics");
app.MapControllers();
app.Run();
public partial class Program { }


public sealed record ClientErrorReport(
    string Message,
    string? Stack,
    string? Source,
    string? Path,
    string? CorrelationId);
