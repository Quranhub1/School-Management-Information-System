using Microsoft.EntityFrameworkCore.Migrations;

namespace SchoolManagement.Infrastructure.Migrations;

public partial class AddInstitutionEmailSettings : Migration
{
    protected override void Up(MigrationBuilder m)
    {
        m.AddColumn<bool>("EmailEnabled", "InstitutionSettings", type: "boolean", nullable: false, defaultValue: false);
        m.AddColumn<string>("EmailFromAddress", "InstitutionSettings", type: "character varying(255)", maxLength: 255, nullable: true);
        m.AddColumn<string>("EmailFromName", "InstitutionSettings", type: "character varying(200)", maxLength: 200, nullable: true);
        m.AddColumn<string>("EmailSmtpHost", "InstitutionSettings", type: "character varying(255)", maxLength: 255, nullable: true);
        m.AddColumn<int>("EmailSmtpPort", "InstitutionSettings", type: "integer", nullable: true);
        m.AddColumn<string>("EmailSmtpPasswordProtected", "InstitutionSettings", type: "character varying(4000)", maxLength: 4000, nullable: true);
        m.AddColumn<string>("EmailSmtpSecureMode", "InstitutionSettings", type: "character varying(30)", maxLength: 30, nullable: true);
        m.AddColumn<string>("EmailSmtpUsername", "InstitutionSettings", type: "character varying(255)", maxLength: 255, nullable: true);
    }
    protected override void Down(MigrationBuilder m)
    {
        m.DropColumn("EmailEnabled", "InstitutionSettings");
        m.DropColumn("EmailFromAddress", "InstitutionSettings");
        m.DropColumn("EmailFromName", "InstitutionSettings");
        m.DropColumn("EmailSmtpHost", "InstitutionSettings");
        m.DropColumn("EmailSmtpPort", "InstitutionSettings");
        m.DropColumn("EmailSmtpPasswordProtected", "InstitutionSettings");
        m.DropColumn("EmailSmtpSecureMode", "InstitutionSettings");
        m.DropColumn("EmailSmtpUsername", "InstitutionSettings");
    }
}
