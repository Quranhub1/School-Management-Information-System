using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Assessment;

/// <summary>
/// Handles transcript status semantics. Missed papers are recorded as X and
/// remain outstanding without contributing a numeric score or grade point.
/// </summary>
public sealed class TranscriptStatusService
{
    public static string GetDisplayCode(TranscriptEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return entry.Status switch
        {
            TranscriptStatus.Missed => "X",
            TranscriptStatus.Resit => "RESIT",
            _ => entry.Grade ?? string.Empty
        };
    }

    public static bool IsOutstanding(TranscriptEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);
        return entry.Status == TranscriptStatus.Missed;
    }
}
