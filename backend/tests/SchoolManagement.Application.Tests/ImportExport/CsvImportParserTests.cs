using SchoolManagement.Application.ImportExport;
using Xunit;

namespace SchoolManagement.Application.Tests.ImportExport;

public sealed class CsvImportParserTests
{
    [Fact]
    public void ParseRows_preserves_quoted_commas_and_escaped_quotes()
    {
        var rows = CsvImportParser.ParseRows("Name,Description\r\n\"Jane, Doe\",\"Said \"\"hello\"\"\"\r\n");

        Assert.Equal(2, rows.Count);
        Assert.Equal("Jane, Doe", rows[1][0]);
        Assert.Equal("Said \"hello\"", rows[1][1]);
    }

    [Fact]
    public void ParseRows_preserves_newlines_inside_quoted_fields()
    {
        var rows = CsvImportParser.ParseRows("Name,Notes\r\nJane,\"First line\r\nSecond line\"\r\n");

        Assert.Equal(2, rows.Count);
        Assert.Equal("First line\r\nSecond line", rows[1][1]);
    }

    [Fact]
    public void ParseRows_rejects_unterminated_quoted_fields()
    {
        var exception = Assert.Throws<FormatException>(() => CsvImportParser.ParseRows("Name,Notes\r\nJane,\"unfinished"));

        Assert.Contains("unterminated", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
