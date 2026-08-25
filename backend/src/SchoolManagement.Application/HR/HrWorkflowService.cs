using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.HR;

public sealed class HrWorkflowService(IHrRepository repository)
{
    public async Task<IReadOnlyList<HrStaffDto>> GetAllAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        return (await repository.GetAllAsync(activeOnly, cancellationToken))
            .Select(Map)
            .ToList();
    }

    public async Task<HrStaffDto?> GetAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Staff id is required.", nameof(id));

        var staff = await repository.GetAsync(id, cancellationToken);
        return staff is null ? null : Map(staff);
    }

    public async Task<HrStaffDto> CreateAsync(
        CreateHrStaffRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request is null)
            throw new ArgumentNullException(nameof(request));

        var staffNumber = Required(request.StaffNumber, nameof(request.StaffNumber), "Staff number is required.");
        var firstName = Required(request.FirstName, nameof(request.FirstName), "First name is required.");
        var lastName = Required(request.LastName, nameof(request.LastName), "Last name is required.");
        var employmentType = Required(request.EmploymentType, nameof(request.EmploymentType), "Employment type is required.");

        if (await repository.ExistsByStaffNumberAsync(staffNumber, cancellationToken))
            throw new InvalidOperationException("A staff member with this staff number already exists.");

        var staff = new StaffMember
        {
            StaffNumber = staffNumber,
            FirstName = firstName,
            LastName = lastName,
            NationalId = Normalize(request.NationalId),
            PhoneNumber = Normalize(request.PhoneNumber),
            Email = Normalize(request.Email),
            EmploymentType = employmentType
        };

        await repository.AddAsync(staff, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(staff);
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("Staff id is required.", nameof(id));

        var staff = await repository.GetAsync(id, cancellationToken);
        if (staff is null)
            throw new KeyNotFoundException("Staff member was not found.");

        if (!staff.IsActive)
            return;

        staff.IsActive = false;
        await repository.SaveChangesAsync(cancellationToken);
    }

    private static HrStaffDto Map(StaffMember staff) =>
        new(staff.Id, staff.StaffNumber, staff.FirstName, staff.LastName,
            staff.NationalId, staff.PhoneNumber, staff.Email,
            staff.EmploymentType, staff.IsActive);

    private static string Required(string? value, string parameterName, string message)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException(message, parameterName);
        return value.Trim();
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}