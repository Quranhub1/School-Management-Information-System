using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Inventory;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/registers")]
[Authorize(Policy = AuthorizationPolicies.InventoryManagement)]
public sealed class InventoryRegistersController(SchoolManagementDbContext db) : ControllerBase
{
    private static readonly InventoryRegisterColumn[] DefaultColumns =
    [
        new("name", "Name of Item"),
        new("description", "Description"),
        new("quantity", "Quantity"),
        new("condition", "Condition"),
        new("location", "Location")
    ];

    [HttpGet("{sectionId}")]
    public async Task<ActionResult<InventoryRegisterDto>> Get(string sectionId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sectionId) || sectionId.Length > 100)
            return BadRequest(new { message = "A valid inventory section is required." });

        var saved = await db.InventoryRegisters.AsNoTracking()
            .SingleOrDefaultAsync(x => x.SectionId == sectionId, ct);
        if (saved is null)
            return Ok(new InventoryRegisterDto(sectionId, DefaultColumns, Array.Empty<InventoryRegisterRow>(), DateTimeOffset.UtcNow));

        return Ok(ToDto(saved));
    }

    [HttpPut("{sectionId}")]
    public async Task<ActionResult<InventoryRegisterDto>> Save(string sectionId, SaveInventoryRegisterRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(sectionId) || sectionId.Length > 100)
            return BadRequest(new { message = "A valid inventory section is required." });
        if (request.Columns is null || request.Rows is null)
            return BadRequest(new { message = "Columns and rows are required." });
        if (request.Columns.Count is < 1 or > 200)
            return BadRequest(new { message = "An inventory register must have between 1 and 200 columns." });
        if (request.Rows.Count > 20000)
            return BadRequest(new { message = "A register cannot exceed 20,000 rows." });
        if (request.Columns.Any(x => string.IsNullOrWhiteSpace(x.Id) || string.IsNullOrWhiteSpace(x.Label) || x.Id.Length > 100 || x.Label.Length > 200))
            return BadRequest(new { message = "Every column requires an ID and a label of at most 200 characters." });
        if (request.Columns.Select(x => x.Id).Distinct(StringComparer.Ordinal).Count() != request.Columns.Count)
            return BadRequest(new { message = "Column IDs must be unique." });
        if (request.Rows.Any(x => string.IsNullOrWhiteSpace(x.Id) || x.Values is null))
            return BadRequest(new { message = "Every row requires an ID and cell values." });

        var existing = await db.InventoryRegisters.SingleOrDefaultAsync(x => x.SectionId == sectionId, ct);
        var username = User.Identity?.Name ?? "system";
        if (existing is null)
        {
            existing = new InventoryRegister
            {
                SectionId = sectionId,
                ColumnsJson = JsonSerializer.Serialize(request.Columns),
                RowsJson = JsonSerializer.Serialize(request.Rows),
                UpdatedAtUtc = DateTimeOffset.UtcNow,
                UpdatedBy = username
            };
            db.InventoryRegisters.Add(existing);
        }
        else
        {
            existing.ColumnsJson = JsonSerializer.Serialize(request.Columns);
            existing.RowsJson = JsonSerializer.Serialize(request.Rows);
            existing.UpdatedAtUtc = DateTimeOffset.UtcNow;
            existing.UpdatedBy = username;
        }

        await db.SaveChangesAsync(ct);
        return Ok(ToDto(existing));
    }

    private static InventoryRegisterDto ToDto(InventoryRegister saved) =>
        new(saved.SectionId,
            JsonSerializer.Deserialize<List<InventoryRegisterColumn>>(saved.ColumnsJson) ?? [],
            JsonSerializer.Deserialize<List<InventoryRegisterRow>>(saved.RowsJson) ?? [],
            saved.UpdatedAtUtc);
}

public sealed record InventoryRegisterColumn(string Id, string Label);
public sealed record InventoryRegisterRow(string Id, Dictionary<string, string> Values);
public sealed record InventoryRegisterDto(string SectionId, IReadOnlyList<InventoryRegisterColumn> Columns, IReadOnlyList<InventoryRegisterRow> Rows, DateTimeOffset UpdatedAtUtc);
public sealed record SaveInventoryRegisterRequest(List<InventoryRegisterColumn> Columns, List<InventoryRegisterRow> Rows);
