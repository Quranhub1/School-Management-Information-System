namespace SchoolManagement.Application.HR;

public sealed record HrStaffDto(
    Guid Id,
    string StaffNumber,
    string FirstName,
    string LastName,
    string? NationalId,
    string? PhoneNumber,
    string? Email,
    string EmploymentType,
    string StaffType,
    bool IsActive);

public sealed record CreateHrStaffRequest(
    string StaffNumber,
    string FirstName,
    string LastName,
    string? NationalId,
    string? PhoneNumber,
    string? Email,
    string EmploymentType,
    string StaffType);