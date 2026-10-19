using System.Text.Json.Serialization;

namespace SchoolManagement.Domain.Staff;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum StaffType
{
    Teaching,
    NonTeaching
}
