using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;
#nullable disable
namespace SchoolManagement.Infrastructure.Migrations;
public sealed partial class AddInstitutionCampusManagement : Migration {
 protected override void Up(MigrationBuilder b) {
  b.CreateTable(name:"Institutions",columns:t=>new {
   Id=t.Column<Guid>(type:"uuid",nullable:false),Code=t.Column<string>(type:"character varying(50)",maxLength:50,nullable:false),Name=t.Column<string>(type:"character varying(250)",maxLength:250,nullable:false),InstitutionType=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:false),RegistrationNumber=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:true),Regulator=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:true),Address=t.Column<string>(type:"character varying(500)",maxLength:500,nullable:true),District=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:true),Region=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:true),Phone=t.Column<string>(type:"character varying(50)",maxLength:50,nullable:true),Email=t.Column<string>(type:"character varying(200)",maxLength:200,nullable:true),Website=t.Column<string>(type:"character varying(200)",maxLength:200,nullable:true),IsActive=t.Column<bool>(type:"boolean",nullable:false)
  },constraints:t=>t.PrimaryKey("PK_Institutions",x=>x.Id));
  b.CreateTable(name:"Campuses",columns:t=>new {Id=t.Column<Guid>(type:"uuid",nullable:false),InstitutionId=t.Column<Guid>(type:"uuid",nullable:false),Code=t.Column<string>(type:"character varying(50)",maxLength:50,nullable:false),Name=t.Column<string>(type:"character varying(200)",maxLength:200,nullable:false),Address=t.Column<string>(type:"character varying(500)",maxLength:500,nullable:true),District=t.Column<string>(type:"character varying(100)",maxLength:100,nullable:true),IsActive=t.Column<bool>(type:"boolean",nullable:false)},constraints:t=>{t.PrimaryKey("PK_Campuses",x=>x.Id);t.ForeignKey("FK_Campuses_Institutions_InstitutionId",x=>x.InstitutionId,"Institutions","Id",onDelete:ReferentialAction.Restrict);});
  b.CreateIndex("IX_Institutions_Code","Institutions","Code",unique:true);b.CreateIndex("IX_Campuses_InstitutionId_Code","Campuses",new[]{"InstitutionId","Code"},unique:true);
 }
 protected override void Down(MigrationBuilder b){b.DropTable("Campuses");b.DropTable("Institutions");}
}