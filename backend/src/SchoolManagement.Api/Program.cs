using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SchoolManagement.Application;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure;
using SchoolManagement.Infrastructure.Identity;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks();
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var jwtKey = builder.Configuration["Authentication:JwtKey"] ?? "development-only-change-this-key-before-deployment-32-chars";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.Administration, policy => policy.RequireRole(AuthorizationPolicies.RoleSets.Administration));
    options.AddPolicy(AuthorizationPolicies.AcademicManagement, policy => policy.RequireRole(AuthorizationPolicies.RoleSets.AcademicManagement));
    options.AddPolicy(AuthorizationPolicies.FinanceManagement, policy => policy.RequireRole(AuthorizationPolicies.RoleSets.FinanceManagement));
    options.AddPolicy(AuthorizationPolicies.ExaminationManagement, policy => policy.RequireRole(AuthorizationPolicies.RoleSets.ExaminationManagement));
    options.AddPolicy(AuthorizationPolicies.StudentManagement, policy => policy.RequireRole(AuthorizationPolicies.RoleSets.StudentManagement));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope()) await scope.ServiceProvider.GetRequiredService<AdminSeeder>().SeedAsync();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();

public partial class Program { }
