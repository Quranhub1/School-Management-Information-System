using Xunit;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Api.Tests;

public sealed class StaffLeaveResponseDtoTests
{
    [Fact]
    public void FromDomain_maps_enum_values_and_leave_audit_metadata()
    {
        var request = new LeaveRequest
        {
            StaffMemberId = Guid.NewGuid(),
            LeaveType = LeaveType.Annual,
            StartDate = new DateOnly(2026, 12, 1),
            EndDate = new DateOnly(2026, 12, 14),
            Reason = "Annual leave",
            Status = LeaveRequestStatus.Approved,
            ApprovedBy = Guid.NewGuid(),
            ApprovedAt = DateTimeOffset.UtcNow
        };

        var response = LeaveRequestResponseDto.FromDomain(request);

        Assert.Equal(request.Id, response.Id);
        Assert.Equal(request.StaffMemberId, response.StaffMemberId);
        Assert.Equal("Annual", response.LeaveType);
        Assert.Equal("Approved", response.Status);
        Assert.Equal(request.ApprovedBy, response.ApprovedBy);
        Assert.Equal(request.ApprovedAt, response.ApprovedAt);
    }
}
