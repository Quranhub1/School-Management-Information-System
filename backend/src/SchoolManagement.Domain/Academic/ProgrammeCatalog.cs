namespace SchoolManagement.Domain.Academic;

public sealed record ProgrammeCatalogEntry(
    string Code,
    string Name,
    string Award,
    string Authority,
    string Family,
    string AssessmentModel,
    string Source,
    bool IsReferenceOnly = false);

public static class ProgrammeCatalog
{
    public static IReadOnlyList<ProgrammeCatalogEntry> Uhpab { get; } =
    [
        new("CM", "Certificate in Midwifery", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CN", "Certificate in Nursing", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CMHN", "Certificate in Mental Health Nursing", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CEC", "Certificate in Emergency Care", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CEH", "Certificate in Environmental Health Sciences", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CLT", "Certificate in Medical Laboratory Techniques", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CMR", "Certificate in Medical Records and Health Informatics", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CTA", "Certificate in Medical Theatre Techniques", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("CPH", "Certificate in Pharmacy", "Certificate", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DN", "Diploma in Nursing", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DM", "Diploma in Midwifery", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DMHN", "Diploma in Mental Health Nursing", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DCM", "Diploma in Clinical Medicine and Community Health", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DCO", "Diploma in Clinical Ophthalmology", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DCP", "Diploma in Clinical Psychiatry", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DDT", "Diploma in Dental Technology", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DEH", "Diploma in Environmental Health Sciences", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DHP", "Diploma in Health Promotion and Education", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("MLT", "Diploma in Medical Laboratory Technology", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DMR", "Diploma in Medical Radiography", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("MER", "Diploma in Medical Records and Health Informatics", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DOT", "Diploma in Occupational Therapy", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("OTD", "Diploma in Orthopaedic Technology", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("PHA", "Diploma in Pharmacy", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("DPT", "Diploma in Physiotherapy", "Diploma", "UHPAB", "Health", "Academic", "UHPAB"),
        new("PHD", "Diploma in Public Health Dentistry", "Diploma", "UHPAB", "Health", "Academic", "UHPAB")
    ];

    public static IReadOnlyList<ProgrammeCatalogEntry> Uvtab { get; } =
    [
        new("UVTAB-BME-C", "Biomedical Engineering", "Certificate", "UVTAB", "Engineering", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-BME-D", "Biomedical Engineering", "Diploma", "UVTAB", "Engineering", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-SON-C", "Sonography", "Certificate", "UVTAB", "Health", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-SON-D", "Sonography", "Diploma", "UVTAB", "Health", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-FSN-C", "Food Science and Nutrition", "Certificate", "UVTAB", "FoodScienceAndNutrition", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-FSN-D", "Food Science and Nutrition", "Diploma", "UVTAB", "FoodScienceAndNutrition", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-MR-C", "Medical Records", "Certificate", "UVTAB", "Health", "CompetencyBased", "Institution/UVTAB reference", true),
        new("UVTAB-MR-D", "Medical Records", "Diploma", "UVTAB", "Health", "CompetencyBased", "Institution/UVTAB reference", true)
    ];

    public static IReadOnlyList<ProgrammeCatalogEntry> All => Uhpab.Concat(Uvtab).ToArray();
}
