using SchoolManagement.Api.Controllers;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Staff;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class AdministrativeResponseDtoTests
{
    [Fact]
    public void Academic_structure_DTOs_preserve_dropdown_contract_fields()
    {
        var year = new AcademicYear
        {
            Name = "2026-2027",
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 12, 31),
            IsCurrent = true,
            IsActive = true
        };
        var intake = new Intake
        {
            Name = "August Intake",
            Code = "AUG-2026",
            StartDate = new DateOnly(2026, 8, 1),
            IsOpen = true
        };
        var semester = new Semester
        {
            AcademicYearId = year.Id,
            Name = "Semester 1",
            Sequence = 1,
            StartDate = new DateOnly(2026, 1, 1),
            EndDate = new DateOnly(2026, 6, 30),
            IsCurrent = true,
            IsActive = true
        };
        var stream = new SchoolManagement.Domain.Academic.Stream
        {
            Name = "Morning",
            Code = "MOR",
            AcademicClassId = Guid.NewGuid(),
            ClassFormId = "FORM-1",
            IsActive = true
        };

        Assert.Equal(year.Name, AcademicYearResponseDto.FromDomain(year).Name);
        Assert.Equal(intake.Code, IntakeResponseDto.FromDomain(intake).Code);
        Assert.Equal(semester.AcademicYearId, SemesterResponseDto.FromDomain(semester).AcademicYearId);
        Assert.Equal(stream.AcademicClassId, AcademicStreamResponseDto.FromDomain(stream).AcademicClassId);
        Assert.Equal(stream.ClassFormId, AcademicStreamResponseDto.FromDomain(stream).ClassFormId);
    }

    [Fact]
    public void Payroll_response_DTO_preserves_payment_and_amount_fields()
    {
        var payroll = new PayrollRecord
        {
            StaffMemberId = Guid.NewGuid(),
            Month = 11,
            Year = 2026,
            BasicSalary = 900000m,
            Allowances = 100000m,
            Deductions = 50000m,
            NetPay = 950000m,
            Currency = "UGX",
            Status = "Paid",
            PaymentMethod = "Bank",
            Reference = "BANK-001",
            PaymentDate = DateTimeOffset.UtcNow
        };

        var response = PayrollRecordResponseDto.FromDomain(payroll);

        Assert.Equal(payroll.StaffMemberId, response.StaffMemberId);
        Assert.Equal(payroll.NetPay, response.NetPay);
        Assert.Equal(payroll.Currency, response.Currency);
        Assert.Equal(payroll.PaymentMethod, response.PaymentMethod);
        Assert.Equal(payroll.Reference, response.Reference);
    }
}
