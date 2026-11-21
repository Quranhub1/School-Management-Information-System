using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class FinanceResponseDtoTests
{
    [Fact]
    public void FeeStructureResponse_includes_ordered_item_contract_without_domain_objects()
    {
        var fee = new FeeStructure
        {
            ProgrammeId = Guid.NewGuid(),
            AcademicYearId = Guid.NewGuid(),
            Name = "Diploma tuition",
            FeeType = "Tuition",
            Currency = "UGX",
            Items =
            [
                new FeeStructureItem { Code = "B", Name = "Practicum", Amount = 200m, SortOrder = 2, Currency = "UGX" },
                new FeeStructureItem { Code = "A", Name = "Tuition", Amount = 800m, SortOrder = 1, Currency = "UGX" }
            ]
        };
        fee.RecalculateTotal();

        var response = FeeStructureResponseDto.FromDomain(fee);

        Assert.Equal(1000m, response.TotalAmount);
        Assert.Equal(new[] { "A", "B" }, response.Items.Select(item => item.Code));
        Assert.All(response.Items, item => Assert.IsNotType<FeeStructureItem>(item));
    }

    [Fact]
    public void InvoiceDiscountResponse_maps_audit_fields_explicitly()
    {
        var discount = new InvoiceDiscount
        {
            StudentInvoiceId = Guid.NewGuid(),
            DiscountType = "Scholarship",
            Percentage = 25m,
            Amount = 250m,
            Reason = "Approved scholarship",
            Status = "Approved",
            RequestedBy = "finance.user",
            ApprovedBy = "director",
            ApprovedAt = DateTimeOffset.UtcNow
        };

        var response = InvoiceDiscountResponseDto.FromDomain(discount);

        Assert.Equal(discount.Id, response.Id);
        Assert.Equal(discount.RequestedBy, response.RequestedBy);
        Assert.Equal(discount.ApprovedBy, response.ApprovedBy);
        Assert.Equal(discount.ApprovalJournalEntryId, response.ApprovalJournalEntryId);
    }

    [Fact]
    public void InstallmentAndStudentChargeResponses_expose_only_declared_fields()
    {
        var installment = new InvoiceInstallment
        {
            StudentInvoiceId = Guid.NewGuid(),
            Sequence = 1,
            DueDate = new DateOnly(2026, 12, 31),
            Percentage = 50m,
            Amount = 500m,
            PaidAmount = 200m
        };
        var charge = new StudentCharge
        {
            StudentId = Guid.NewGuid(),
            ChargeType = "Library",
            Description = "Library replacement",
            Amount = 50m,
            Currency = "UGX",
            Status = "Active",
            CreatedBy = "accountant"
        };

        var installmentResponse = InvoiceInstallmentResponseDto.FromDomain(installment);
        var chargeResponse = StudentChargeResponseDto.FromDomain(charge);

        Assert.Equal(300m, installmentResponse.OutstandingAmount);
        Assert.Equal(charge.StudentId, chargeResponse.StudentId);
        Assert.Equal(charge.CreatedBy, chargeResponse.CreatedBy);
        Assert.Null(chargeResponse.VoidReason);
    }

    [Fact]
    public void JournalEntryResponse_maps_lines_without_serializing_navigation_properties()
    {
        var entry = new JournalEntry
        {
            EntryNumber = "REV-001",
            Currency = "UGX",
            Description = "Test reversal",
            Status = "Posted",
            Lines =
            [
                new JournalEntryLine { AccountId = Guid.NewGuid(), Description = "Debit", Debit = 100m },
                new JournalEntryLine { AccountId = Guid.NewGuid(), Description = "Credit", Credit = 100m }
            ]
        };

        var response = JournalEntryResponseDto.FromDomain(entry);

        Assert.Equal(entry.Id, response.Id);
        Assert.Equal(2, response.Lines.Count);
        Assert.Equal(100m, response.Lines.Sum(line => line.Debit));
        Assert.Equal(100m, response.Lines.Sum(line => line.Credit));
        Assert.All(response.Lines, line => Assert.IsNotType<JournalEntryLine>(line));
    }
}
