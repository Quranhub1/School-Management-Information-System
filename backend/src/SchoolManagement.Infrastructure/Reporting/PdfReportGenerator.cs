using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Infrastructure.Reporting;

public interface IPdfReportGenerator
{
    byte[] GenerateTranscriptPdf(StudentPortalProfile profile, IReadOnlyList<TranscriptEntry> entries, IReadOnlyList<AcademicResultSummary> summaries);
    byte[] GenerateReportCardPdf(StudentPortalProfile profile, AcademicResultSummary summary, IReadOnlyList<TranscriptEntry> entries);
}

public sealed record StudentPortalProfile(Guid StudentId, string StudentNumber, string FullName, string Status, string FirstName, string LastName, string? OtherNames, DateOnly? DateOfBirth, string? Gender, string? NationalId, string? PhoneNumber, string? Email, DateTimeOffset CreatedAt, Guid? AdmissionId);

public sealed class PdfReportGenerator : IPdfReportGenerator
{
    public byte[] GenerateTranscriptPdf(StudentPortalProfile profile, IReadOnlyList<TranscriptEntry> entries, IReadOnlyList<AcademicResultSummary> summaries)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(TextStyle.Default.FontSize(11).FontFamily(Fonts.Helvetica));

                page.Header().Element(c => ComposeHeader(c, $"Academic Transcript — {profile.FullName}"));
                page.Content().PaddingVertical(20).Element(c => ComposeTranscript(c, profile, entries, summaries));
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    public byte[] GenerateReportCardPdf(StudentPortalProfile profile, AcademicResultSummary summary, IReadOnlyList<TranscriptEntry> entries)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(TextStyle.Default.FontSize(11).FontFamily(Fonts.Helvetica));

                page.Header().Element(c => ComposeHeader(c, $"Report Card — {profile.FullName}"));
                page.Content().PaddingVertical(20).Element(c => ComposeReportCard(c, profile, summary, entries));
                page.Footer().AlignCenter().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });

        return document.GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, string title)
    {
        container.Column(column =>
        {
            column.Item().AlignCenter().Text("Institutional Management System").FontSize(16).Bold();
            column.Item().AlignCenter().Text(title).FontSize(12);
            column.Item().PaddingBottom(10);
        });
    }

    private static void ComposeTranscript(IContainer container, StudentPortalProfile profile, IReadOnlyList<TranscriptEntry> entries, IReadOnlyList<AcademicResultSummary> summaries)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.AutoItem().Text($"Student: {profile.FullName}");
                row.AutoItem().Text($"Number: {profile.StudentNumber}");
            });
            column.Item().PaddingTop(10);

            if (entries.Count == 0)
            {
                column.Item().PaddingTop(20).Text("No transcript entries available.");
                return;
            }

            column.Item().Text("Course Results:").Bold();
            column.Item().PaddingTop(8).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(4);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Code");
                    header.Cell().Element(CellStyle).Text("Title");
                    header.Cell().Element(CellStyle).AlignRight().Text("Credits");
                    header.Cell().Element(CellStyle).AlignRight().Text("Score");
                    header.Cell().Element(CellStyle).AlignRight().Text("Grade");
                    header.Cell().Element(CellStyle).AlignRight().Text("Status");
                });

                foreach (var entry in entries)
                {
                    table.Cell().Element(CellStyle).Text(entry.CourseCode);
                    table.Cell().Element(CellStyle).Text(entry.CourseTitle);
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.CreditUnits.ToString("F1"));
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.Score?.ToString("F2") ?? "—");
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.Grade ?? "—");
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.IsPass ? "Pass" : "Fail");
                }
            });

            column.Item().PaddingTop(16).Text("Semester Summaries:").Bold();
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Period");
                    header.Cell().Element(CellStyle).AlignRight().Text("Credits");
                    header.Cell().Element(CellStyle).AlignRight().Text("GPA");
                    header.Cell().Element(CellStyle).AlignRight().Text("CGPA");
                    header.Cell().Element(CellStyle).AlignRight().Text("Standing");
                });

                foreach (var s in summaries)
                {
                    table.Cell().Element(CellStyle).Text($"AY {s.AcademicYearId} / Sem {s.SemesterId}");
                    table.Cell().Element(CellStyle).AlignRight().Text(s.TotalCreditUnits.ToString("F1"));
                    table.Cell().Element(CellStyle).AlignRight().Text(s.Gpa.ToString("F2"));
                    table.Cell().Element(CellStyle).AlignRight().Text(s.Cgpa?.ToString("F2") ?? "—");
                    table.Cell().Element(CellStyle).AlignRight().Text(s.Standing);
                }
            });
        });
    }

    private static void ComposeReportCard(IContainer container, StudentPortalProfile profile, AcademicResultSummary summary, IReadOnlyList<TranscriptEntry> entries)
    {
        container.Column(column =>
        {
            column.Item().Row(row =>
            {
                row.AutoItem().Text($"Student: {profile.FullName}");
                row.AutoItem().Text($"Number: {profile.StudentNumber}");
            });
            column.Item().PaddingTop(10);
            column.Item().Text($"GPA: {summary.Gpa:F2}  |  CGPA: {summary.Cgpa?.ToString("F2") ?? "N/A"}  |  Standing: {summary.Standing}");
            column.Item().PaddingTop(10).Text("Courses:").Bold();
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(4);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Course");
                    header.Cell().Element(CellStyle).Text("Title");
                    header.Cell().Element(CellStyle).AlignRight().Text("Credits");
                    header.Cell().Element(CellStyle).AlignRight().Text("Score");
                    header.Cell().Element(CellStyle).AlignRight().Text("Grade");
                });

                foreach (var entry in entries)
                {
                    table.Cell().Element(CellStyle).Text(entry.CourseCode);
                    table.Cell().Element(CellStyle).Text(entry.CourseTitle);
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.CreditUnits.ToString("F1"));
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.Score?.ToString("F2") ?? "—");
                    table.Cell().Element(CellStyle).AlignRight().Text(entry.Grade ?? "—");
                }
            });
        });
    }

    private static IContainer CellStyle(IContainer container) =>
        container.PaddingVertical(4).BorderBottom(1).BorderColor(Colors.Grey.Lighten2);
}
