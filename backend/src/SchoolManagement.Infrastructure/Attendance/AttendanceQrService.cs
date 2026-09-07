using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Application.Attendance;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Infrastructure.Attendance;

public sealed class AttendanceQrService(IAttendanceQrRepository qrRepository, IConfiguration configuration)
{
    private readonly string _signingSecret = configuration["AttendanceQr:SigningSecret"]
        ?? throw new InvalidOperationException("AttendanceQr:SigningSecret is not configured.");

    public async Task<(string QrToken, DateTimeOffset ExpiresAt)> GenerateQrAsync(Guid attendanceSessionId, int rotationIntervalMinutes, CancellationToken cancellationToken = default)
    {
        var generatedAt = DateTimeOffset.UtcNow;
        var expiresAt = generatedAt.AddMinutes(rotationIntervalMinutes);

        var payload = $"{attendanceSessionId}:{Guid.NewGuid()}:{generatedAt.Ticks}";
        var secretBytes = Encoding.UTF8.GetBytes(_signingSecret);

        using var hmac = new HMACSHA256(secretBytes);
        var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var qrToken = $"{Convert.ToBase64String(Encoding.UTF8.GetBytes(payload))}.{Convert.ToBase64String(signatureBytes)}";

        var qrSession = new AttendanceQrSession
        {
            AttendanceSessionId = attendanceSessionId,
            QrToken = qrToken,
            QrSecret = _signingSecret,
            GeneratedAt = generatedAt,
            ExpiresAt = expiresAt,
            RotationIntervalMinutes = rotationIntervalMinutes,
            IsUsed = false
        };

        await qrRepository.AddAsync(qrSession, cancellationToken);
        await qrRepository.SaveChangesAsync(cancellationToken);

        return (qrSession.QrToken, qrSession.ExpiresAt);
    }

    public async Task<(bool Success, string Message)> ValidateQrAsync(string qrToken, Guid userId, CancellationToken cancellationToken = default)
    {
        var parts = qrToken.Split('.');
        if (parts.Length != 2)
        {
            return (false, "Invalid QR token format.");
        }

        var payloadBytes = Convert.FromBase64String(parts[0]);
        var signatureBytes = Convert.FromBase64String(parts[1]);
        var payload = Encoding.UTF8.GetString(payloadBytes);
        var secretBytes = Encoding.UTF8.GetBytes(_signingSecret);

        using var hmac = new HMACSHA256(secretBytes);
        var expectedSignature = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));

        if (!CryptographicOperations.FixedTimeEquals(signatureBytes, expectedSignature))
        {
            return (false, "Invalid QR token signature.");
        }

        var qrSession = await qrRepository.GetByTokenAsync(qrToken, cancellationToken);
        if (qrSession is null)
        {
            return (false, "QR session not found.");
        }

        if (qrSession.IsUsed)
        {
            return (false, "QR token has already been used.");
        }

        if (qrSession.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return (false, "QR token has expired.");
        }

        qrSession.IsUsed = true;
        qrSession.UsedAt = DateTimeOffset.UtcNow;
        qrSession.UsedByUserId = userId;

        await qrRepository.SaveChangesAsync(cancellationToken);

        return (true, "QR token validated successfully.");
    }

    public async Task<AttendanceQrSession?> GetQrSessionAsync(Guid attendanceSessionId, CancellationToken cancellationToken = default) =>
        await qrRepository.GetActiveBySessionAsync(attendanceSessionId, cancellationToken);
}
