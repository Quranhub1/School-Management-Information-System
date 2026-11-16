using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
    [Migration("20261116120000_AddLibraryPluginSettings")]
[Migration("20261116120000_AddLibraryPluginSettings")]
partial class AddLibraryPluginSettings
{
    protected override void BuildTargetModel(ModelBuilder modelBuilder)
    {
        modelBuilder.HasAnnotation("ProductVersion", "8.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);
        NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);
        modelBuilder.Entity("SchoolManagement.Domain.Library.LibraryPluginSettings", b =>
        {
            b.Property<Guid>("Id").ValueGeneratedOnAdd().HasColumnType("uuid");
            b.Property<string>("KohaOpacUrl").IsRequired().HasColumnType("text");
            b.Property<string>("KohaApiUrl").IsRequired().HasColumnType("text");
            b.Property<string>("KohaUsername").HasColumnType("text");
            b.Property<string>("KohaPasswordProtected").HasColumnType("text");
            b.Property<string>("DSpaceBaseUrl").IsRequired().HasColumnType("text");
            b.Property<string>("DSpaceRestApiUrl").IsRequired().HasColumnType("text");
            b.Property<string>("DSpaceOaiPmhUrl").IsRequired().HasColumnType("text");
            b.Property<string>("DSpaceUsername").HasColumnType("text");
            b.Property<string>("DSpacePasswordProtected").HasColumnType("text");
            b.Property<bool>("KohaEnabled").HasColumnType("boolean");
            b.Property<bool>("DSpaceEnabled").HasColumnType("boolean");
            b.Property<DateTimeOffset>("UpdatedAt").HasColumnType("timestamp with time zone");
            b.HasKey("Id");
            b.ToTable("LibraryPluginSettings");
        });
    }
}
