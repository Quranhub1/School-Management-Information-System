using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using SchoolManagement.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapHealthChecks("/health");
app.MapHealthChecks("/health/database", new HealthCheckOptions
{
    Predicate = check => check.Name == "database"
});
app.MapControllers();

app.Run();

public partial class Program { }
