namespace SchoolManagement.Domain.Attendance;

/// <summary>
/// Stores only an encrypted biometric template supplied by the trusted enrolment agent.
/// Encryption and key management are owned by the workstation/biometric integration service.
/// </summary>
public sealed class StaffFingerprintCredential
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StaffMemberId { get; set; }
    public required string DeviceFamily { get; set; }
    public required string TemplateFormat { get; set; }
    public required byte[] EncryptedTemplate { get; set; }
    public DateTimeOffset EnrolledAtUtc { get; set; }
    public Guid EnrolledByUserId { get; set; }
    public bool IsActive { get; set; } = true;
}
