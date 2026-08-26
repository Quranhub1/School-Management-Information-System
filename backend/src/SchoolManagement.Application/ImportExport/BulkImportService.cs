using System.Text;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.HR;
using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.ImportExport;

public sealed class BulkImportService(IStudentRepository students, IHrRepository staff)
{
    public async Task<BulkImportResult> ImportStudentsAsync(BulkImportRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var warnings = new List<string>();
        var successCount = 0;
        var lines = request.CsvData.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2)
            return new BulkImportResult(0, 1, new[] { "CSV data is empty or missing headers." }, Array.Empty<string>());
        var headers = lines[0].Split(',').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        var studentNumberIdx = Array.IndexOf(headers, "studentnumber");
        var firstNameIdx = Array.IndexOf(headers, "firstname");
        var lastNameIdx = Array.IndexOf(headers, "lastname");
        var otherNamesIdx = Array.IndexOf(headers, "othernames");
        var dobIdx = Array.IndexOf(headers, "dateofbirth");
        var genderIdx = Array.IndexOf(headers, "gender");
        var phoneIdx = Array.IndexOf(headers, "phonenumber");
        var emailIdx = Array.IndexOf(headers, "email");
        var statusIdx = Array.IndexOf(headers, "status");
        if (studentNumberIdx < 0 || firstNameIdx < 0 || lastNameIdx < 0)
            return new BulkImportResult(0, 1, new[] { "CSV must contain: StudentNumber, FirstName, LastName." }, Array.Empty<string>());
        var existingStudents = await students.GetAllAsync(cancellationToken);
        var existingNumbers = new HashSet<string>(existingStudents.Select(s => s.StudentNumber), StringComparer.OrdinalIgnoreCase);
        for (var i = 1; i < lines.Length; i++)
        {
            var values = lines[i].Split(',');
            if (values.Length < headers.Length) { errors.Add($"Row {i + 1}: insufficient columns."); continue; }
            var studentNumber = values.ElementAtOrDefault(studentNumberIdx)?.Trim();
            var firstName = values.ElementAtOrDefault(firstNameIdx)?.Trim();
            var lastName = values.ElementAtOrDefault(lastNameIdx)?.Trim();
            if (string.IsNullOrWhiteSpace(studentNumber) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)) { errors.Add($"Row {i + 1}: StudentNumber, FirstName and LastName are required."); continue; }
            if (existingNumbers.Contains(studentNumber)) { warnings.Add($"Row {i + 1}: Student with number {studentNumber} already exists."); continue; }
            var otherNames = values.ElementAtOrDefault(otherNamesIdx)?.Trim();
            var dobStr = values.ElementAtOrDefault(dobIdx)?.Trim();
            DateOnly? dob = null;
            if (!string.IsNullOrWhiteSpace(dobStr) && DateOnly.TryParse(dobStr, out var parsedDob)) dob = parsedDob;
            var gender = values.ElementAtOrDefault(genderIdx)?.Trim();
            var phone = values.ElementAtOrDefault(phoneIdx)?.Trim();
            var email = values.ElementAtOrDefault(emailIdx)?.Trim();
            var status = values.ElementAtOrDefault(statusIdx)?.Trim() ?? "Active";
            var student = new SchoolManagement.Domain.Students.Student { StudentNumber = studentNumber, FirstName = firstName, LastName = lastName, OtherNames = otherNames, DateOfBirth = dob, Gender = gender, PhoneNumber = phone, Email = email, Status = status };
            await students.AddAsync(student, cancellationToken);
            existingNumbers.Add(studentNumber);
            successCount++;
        }
        if (successCount > 0) await students.SaveChangesAsync(cancellationToken);
        return new BulkImportResult(successCount, errors.Count, errors, warnings);
    }

    public async Task<BulkImportResult> ImportStaffAsync(BulkImportRequest request, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var warnings = new List<string>();
        var successCount = 0;
        var lines = request.CsvData.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) return new BulkImportResult(0, 1, new[] { "CSV data is empty or missing headers." }, Array.Empty<string>());
        var headers = lines[0].Split(',').Select(h => h.Trim().ToLowerInvariant()).ToArray();
        var staffNumberIdx = Array.IndexOf(headers, "staffnumber");
        var firstNameIdx = Array.IndexOf(headers, "firstname");
        var lastNameIdx = Array.IndexOf(headers, "lastname");
        var employmentTypeIdx = Array.IndexOf(headers, "employmenttype");
        var nationalIdIdx = Array.IndexOf(headers, "nationalid");
        var phoneIdx = Array.IndexOf(headers, "phonenumber");
        var emailIdx = Array.IndexOf(headers, "email");
        if (staffNumberIdx < 0 || firstNameIdx < 0 || lastNameIdx < 0 || employmentTypeIdx < 0) return new BulkImportResult(0, 1, new[] { "CSV must contain: StaffNumber, FirstName, LastName, EmploymentType." }, Array.Empty<string>());
        var existingStaff = await staff.GetAllAsync(cancellationToken: cancellationToken);
        var existingNumbers = new HashSet<string>(existingStaff.Select(s => s.StaffNumber), StringComparer.OrdinalIgnoreCase);
        for (var i = 1; i < lines.Length; i++)
        {
            var values = lines[i].Split(',');
            if (values.Length < headers.Length) { errors.Add($"Row {i + 1}: insufficient columns."); continue; }
            var staffNumber = values.ElementAtOrDefault(staffNumberIdx)?.Trim();
            var firstName = values.ElementAtOrDefault(firstNameIdx)?.Trim();
            var lastName = values.ElementAtOrDefault(lastNameIdx)?.Trim();
            var employmentType = values.ElementAtOrDefault(employmentTypeIdx)?.Trim();
            if (string.IsNullOrWhiteSpace(staffNumber) || string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || string.IsNullOrWhiteSpace(employmentType)) { errors.Add($"Row {i + 1}: StaffNumber, FirstName, LastName and EmploymentType are required."); continue; }
            if (existingNumbers.Contains(staffNumber)) { warnings.Add($"Row {i + 1}: Staff with number {staffNumber} already exists."); continue; }
            var nationalId = values.ElementAtOrDefault(nationalIdIdx)?.Trim();
            var phone = values.ElementAtOrDefault(phoneIdx)?.Trim();
            var email = values.ElementAtOrDefault(emailIdx)?.Trim();
            var staffMember = new StaffMember { StaffNumber = staffNumber, FirstName = firstName, LastName = lastName, EmploymentType = employmentType, NationalId = nationalId, PhoneNumber = phone, Email = email };
            await staff.AddAsync(staffMember, cancellationToken);
            existingNumbers.Add(staffNumber);
            successCount++;
        }
        if (successCount > 0) await staff.SaveChangesAsync(cancellationToken);
        return new BulkImportResult(successCount, errors.Count, errors, warnings);
    }

    public async Task<string> ExportStudentsAsync(IReadOnlyDictionary<string, string?>? filters, CancellationToken cancellationToken = default)
    {
        var allStudents = await students.GetAllAsync(cancellationToken);
        var query = allStudents.AsQueryable();
        if (filters != null)
        {
            if (filters.TryGetValue("status", out var status) && !string.IsNullOrWhiteSpace(status)) query = query.Where(s => s.Status == status.Trim());
            if (filters.TryGetValue("search", out var search) && !string.IsNullOrWhiteSpace(search)) query = query.Where(s => s.StudentNumber.Contains(search.Trim()) || s.FirstName.Contains(search.Trim()) || s.LastName.Contains(search.Trim()));
        }
        var studentList = query.OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToList();
        var sb = new StringBuilder();
        sb.AppendLine("StudentNumber,FirstName,LastName,OtherNames,DateOfBirth,Gender,PhoneNumber,Email,Status,CreatedAt");
        foreach (var s in studentList) sb.AppendLine($"{Escape(s.StudentNumber)},{Escape(s.FirstName)},{Escape(s.LastName)},{Escape(s.OtherNames)},{Escape(s.DateOfBirth?.ToString(\"yyyy-MM-dd\"))},{Escape(s.Gender)},{Escape(s.PhoneNumber)},{Escape(s.Email)},{Escape(s.Status)},{Escape(s.CreatedAt.ToString(\"o\"))}");
        return sb.ToString();
    }

    public async Task<string> ExportStaffAsync(IReadOnlyDictionary<string, string?>? filters, CancellationToken cancellationToken = default)
    {
        var allStaff = await staff.GetAllAsync(activeOnly: true, cancellationToken);
        var query = allStaff.AsQueryable();
        if (filters != null)
        {
            if (filters.TryGetValue("activeOnly", out var activeOnlyStr) && bool.TryParse(activeOnlyStr, out var activeOnly) && activeOnly) query = query.Where(s => s.IsActive);
            if (filters.TryGetValue("search", out var search) && !string.IsNullOrWhiteSpace(search)) query = query.Where(s => s.StaffNumber.Contains(search.Trim()) || s.FirstName.Contains(search.Trim()) || s.LastName.Contains(search.Trim()));
        }
        var staffList = query.OrderBy(s => s.LastName).ThenBy(s => s.FirstName).ToList();
        var sb = new StringBuilder();
        sb.AppendLine("StaffNumber,FirstName,LastName,NationalId,PhoneNumber,Email,EmploymentType,IsActive");
        foreach (var s in staffList) sb.AppendLine($"{Escape(s.StaffNumber)},{Escape(s.FirstName)},{Escape(s.LastName)},{Escape(s.NationalId)},{Escape(s.PhoneNumber)},{Escape(s.Email)},{Escape(s.EmploymentType)},{s.IsActive}");
        return sb.ToString();
    }

    private static string Escape(string? value)
    {
        if (value is null) return string.Empty;
        if (value.Contains(',') || value.Contains('\"') || value.Contains('\n')) return $"\"{value.Replace(\"\"\", \"\"\"\") }\"";
        return value;
    }
}
