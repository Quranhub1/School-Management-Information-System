using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Inventory;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/inventory/stock-alerts")]
[Authorize(Roles = "SystemAdministrator,Records Officer,RecordsOfficer,School Warden,SchoolWarden,HostelWarden")]
public sealed class InventoryStockAlertsController(SchoolManagementDbContext db) : ControllerBase
{
    private static readonly IReadOnlyDictionary<string, string> SectionNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["ict-skills-lab"] = "ICT Skills Lab",
        ["dcm-lab"] = "DCM Lab",
        ["pharmacy-lab"] = "Pharmacy Lab",
        ["clt-lab"] = "CLT Lab",
        ["food-science-lab"] = "Food Science Lab",
        ["biomedical-engineering-lab"] = "Biomedical Engineering Lab",
        ["admin-block"] = "Admin Block",
        ["furniture"] = "Furniture",
        ["sports-department"] = "Sports Department",
        ["guild-department"] = "Guild Department",
        ["kitchen"] = "Kitchen",
        ["sickbay"] = "Sickbay",
        ["infrastructure-details"] = "Infrastructure Details"
    };

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<InventoryStockAlertDto>>> Get(CancellationToken ct)
    {
        var registers = await db.InventoryRegisters.AsNoTracking().ToListAsync(ct);
        var alerts = new List<InventoryStockAlertDto>();

        foreach (var register in registers)
        {
            var columns = JsonSerializer.Deserialize<List<InventoryRegisterColumn>>(register.ColumnsJson) ?? [];
            var rows = JsonSerializer.Deserialize<List<InventoryRegisterRow>>(register.RowsJson) ?? [];
            var nameColumn = columns.FirstOrDefault(c => c.Id.Equals("name", StringComparison.OrdinalIgnoreCase))
                ?? columns.FirstOrDefault(c => c.Label.Contains("item", StringComparison.OrdinalIgnoreCase) || c.Label.Contains("name", StringComparison.OrdinalIgnoreCase));
            var quantityColumn = columns.FirstOrDefault(c => c.Id.Equals("quantity", StringComparison.OrdinalIgnoreCase))
                ?? columns.FirstOrDefault(c => c.Label.Contains("quantity", StringComparison.OrdinalIgnoreCase) || c.Label.Contains("current stock", StringComparison.OrdinalIgnoreCase) || c.Label.Equals("stock", StringComparison.OrdinalIgnoreCase));

            if (nameColumn is null || quantityColumn is null) continue;

            foreach (var row in rows)
            {
                if (!row.Values.TryGetValue(quantityColumn.Id, out var quantityText) ||
                    !decimal.TryParse(quantityText, NumberStyles.Number, CultureInfo.InvariantCulture, out var quantity))
                    continue;

                row.Values.TryGetValue(nameColumn.Id, out var itemName);
                if (string.IsNullOrWhiteSpace(itemName)) continue;

                row.Values.TryGetValue("_reorderLevel", out var thresholdText);
                decimal? threshold = decimal.TryParse(thresholdText, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsedThreshold) && parsedThreshold >= 0
                    ? parsedThreshold : null;

                var outOfStock = quantity <= 0;
                if (!outOfStock && (!threshold.HasValue || quantity > threshold.Value)) continue;

                alerts.Add(new InventoryStockAlertDto(
                    register.SectionId,
                    SectionNames.TryGetValue(register.SectionId, out var sectionName) ? sectionName : register.SectionId,
                    row.Id,
                    itemName.Trim(),
                    quantity,
                    threshold ?? 0,
                    outOfStock ? "Out of stock" : "Low stock"));
            }
        }

        return Ok(alerts.OrderByDescending(x => x.Status == "Out of stock").ThenBy(x => x.SectionName).ThenBy(x => x.ItemName).ToArray());
    }
}

public sealed record InventoryStockAlertDto(string SectionId, string SectionName, string RowId, string ItemName, decimal Quantity, decimal ReorderLevel, string Status);
