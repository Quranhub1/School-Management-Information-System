namespace SchoolManagement.Domain.People;

public static class PersonName
{
    public static string Format(string? surname, string? firstName, string? otherNames = null)
        => string.Join(" ", new[] { surname, firstName, otherNames }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim()))
            .ToUpperInvariant();
}
