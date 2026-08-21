namespace SchoolManagement.Domain.Assessment;

public static class TranscriptRecordBuilder
{
    public static TranscriptRecord Build(
        Guid studentId,
        string studentNumber,
        string programmeCode,
        string programmeName,
        string academicYear,
        IEnumerable<TranscriptCourseRecord> courses,
        decimal semesterGpa,
        decimal cgpa,
        AcademicStandingStatus academicStanding)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student ID is required.", nameof(studentId));
        if (string.IsNullOrWhiteSpace(studentNumber)) throw new ArgumentException("Student number is required.", nameof(studentNumber));
        if (string.IsNullOrWhiteSpace(programmeCode)) throw new ArgumentException("Programme code is required.", nameof(programmeCode));
        if (string.IsNullOrWhiteSpace(academicYear)) throw new ArgumentException("Academic year is required.", nameof(academicYear));

        var courseRecords = courses?.ToArray() ?? throw new ArgumentNullException(nameof(courses));
        if (courseRecords.Any(c => c.CreditUnits <= 0))
            throw new ArgumentException("Every transcript course must have positive credit units.", nameof(courses));

        return new TranscriptRecord
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            StudentNumber = studentNumber.Trim(),
            ProgrammeCode = programmeCode.Trim(),
            ProgrammeName = programmeName?.Trim() ?? string.Empty,
            AcademicYear = academicYear.Trim(),
            Courses = courseRecords,
            SemesterGpa = decimal.Round(semesterGpa, 2),
            Cgpa = decimal.Round(cgpa, 2),
            AcademicStanding = academicStanding,
            IsFinalized = false
        };
    }

    public static void Finalize(TranscriptRecord record, DateTime? finalizedAt = null)
    {
        ArgumentNullException.ThrowIfNull(record);
        record.IsFinalized = true;
        record.FinalizedAt = finalizedAt ?? DateTime.UtcNow;
    }
}
