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
                page.DefaultTextStyle(TextStyle.Default.FontSize(11).FontFamily("Helvetica"));

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
                page.DefaultTextStyle(TextStyle.Default.FontSize(11).FontFamily("Helvetica"));

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
            column.Item().AlignCenter().Text("SCHOOL MANAGEMENT INFORMATION SYSTEM")
                .Bold().FontSize(16).FontFamily("Helvetica");
            column.Item().AlignCenter().Text(title)
                .SemiBold().FontSize(13).FontFamily("Helvetica");
            column.Item().PaddingTop(5).LineHorizontal(1);
        });
    }

    private static void ComposeTranscript(IContainer container, StudentPortalProfile profile, IReadOnlyList<TranscriptEntry> entries, IReadOnlyList<AcademicResultSummary> summaries)
    {
        container.Column(column =>
        {
            column.Spacing(10);
            column.Item().Text($"Student: {profile.FullName}").Bold();
            column.Item().Text($"Student Number: {profile.StudentNumber}");
            column.Item().Text($"Status: {profile.Status}");

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Course").Bold();
                    header.Cell().Element(CellStyle).Text("Course Name").Bold();
                    header.Cell().Element(CellStyle).Text("Mark").Bold();
                    header.Cell().Element(CellStyle).Text("Grade").Bold();
                });

                foreach (var entry in entries)
                {
                    table.Cell().Element(CellStyle).Text(entry.CourseCode ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.CourseName ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.Mark?.ToString("0.##") ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.Grade ?? "—");
                }
            });

            if (summaries.Count > 0)
            {
                column.Item().PaddingTop(8).Text("Academic Summary").Bold().FontSize(12);
                foreach (var summary in summaries)
                {
                    column.Item().Text($"{summary.AcademicYear} — {summary.Semester}: GPA {summary.Gpa:0.00}, Credits {summary.CreditsEarned:0.##}");
                }
            }
        });
    }

    private static void ComposeReportCard(IContainer container, StudentPortalProfile profile, AcademicResultSummary summary, IReadOnlyList<TranscriptEntry> entries)
    {
        container.Column(column =>
        {
            column.Spacing(10);
            column.Item().Text($"Student: {profile.FullName}").Bold();
            column.Item().Text($"Student Number: {profile.StudentNumber}");
            column.Item().Text($"Academic Year: {summary.AcademicYear}");
            column.Item().Text($"Semester: {summary.Semester}");

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(4);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(1);
                });

                table.Header(header =>
                {
                    header.Cell().Element(CellStyle).Text("Course").Bold();
                    header.Cell().Element(CellStyle).Text("Course Name").Bold();
                    header.Cell().Element(CellStyle).Text("Mark").Bold();
                    header.Cell().Element(CellStyle).Text("Grade").Bold();
                });

                foreach (var entry in entries)
                {
                    table.Cell().Element(CellStyle).Text(entry.CourseCode ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.CourseName ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.Mark?.ToString("0.##") ?? "—");
                    table.Cell().Element(CellStyle).Text(entry.Grade ?? "—");
                }
            });

            column.Item().PaddingTop(8).Text($"GPA: {summary.Gpa:0.00}").Bold();
            column.Item().Text($"Credits Earned: {summary.CreditsEarned:0.##}");
        });
    }

    private static IContainer CellStyle(IContainer container) =>
        container.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(5);
}
