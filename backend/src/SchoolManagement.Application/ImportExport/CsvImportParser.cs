namespace SchoolManagement.Application.ImportExport;

public static class CsvImportParser
{
    public static IReadOnlyList<string[]> ParseRows(string csvData)
    {
        if (string.IsNullOrWhiteSpace(csvData)) return Array.Empty<string[]>();
        var rows = new List<string[]>();
        var fields = new List<string>();
        var field = new System.Text.StringBuilder();
        var inQuotes = false;
        for (var index = 0; index < csvData.Length; index++)
        {
            var character = csvData[index];
            if (inQuotes)
            {
                if (character == '"')
                {
                    if (index + 1 < csvData.Length && csvData[index + 1] == '"')
                    {
                        field.Append('"');
                        index++;
                    }
                    else inQuotes = false;
                }
                else field.Append(character);
                continue;
            }
            if (character == '"' && field.Length == 0) inQuotes = true;
            else if (character == '"') throw new FormatException("CSV contains an unexpected quote inside an unquoted field.");
            else if (character == ',') { fields.Add(field.ToString()); field.Clear(); }
            else if (character is '\r' or '\n')
            {
                fields.Add(field.ToString());
                field.Clear();
                if (fields.Any(value => !string.IsNullOrWhiteSpace(value))) rows.Add(fields.ToArray());
                fields.Clear();
                if (character == '\r' && index + 1 < csvData.Length && csvData[index + 1] == '\n') index++;
            }
            else field.Append(character);
        }
        if (inQuotes) throw new FormatException("CSV contains an unterminated quoted field.");
        if (field.Length > 0 || fields.Count > 0)
        {
            fields.Add(field.ToString());
            if (fields.Any(value => !string.IsNullOrWhiteSpace(value))) rows.Add(fields.ToArray());
        }
        return rows;
    }
}
