using SchoolManagement.Api.Controllers;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Hostel;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class AcademicAndHostelResponseDtoTests
{
    [Fact]
    public void Stream_and_subject_response_DTOs_preserve_academic_fields()
    {
        var stream = new SchoolManagement.Domain.Academic.Stream
        {
            Name = "Evening",
            Code = "EVE",
            AcademicClassId = Guid.NewGuid(),
            ClassFormId = "FORM-2"
        };
        var subject = new Subject
        {
            ProgrammeId = Guid.NewGuid(),
            CourseId = Guid.NewGuid(),
            YearOfStudy = 2,
            PeriodSequence = 1,
            IsCompulsory = false,
            ElectiveGroup = "Clinical"
        };

        var streamResponse = StreamResponseDto.FromDomain(stream);
        var subjectResponse = SubjectResponseDto.FromDomain(subject);

        Assert.Equal(stream.AcademicClassId, streamResponse.AcademicClassId);
        Assert.Equal(stream.ClassFormId, streamResponse.ClassFormId);
        Assert.Equal(subject.ProgrammeId, subjectResponse.ProgrammeId);
        Assert.Equal(subject.CourseId, subjectResponse.CourseId);
        Assert.Equal(subject.ElectiveGroup, subjectResponse.ElectiveGroup);
    }

    [Fact]
    public void Hostel_response_DTOs_project_nested_rooms_beds_and_allocations()
    {
        var allocation = new HostelAllocation
        {
            BedId = Guid.NewGuid(),
            StudentId = Guid.NewGuid(),
            StartDate = new DateOnly(2026, 11, 1),
            Status = "Active",
            Notes = "First allocation"
        };
        var bed = new HostelBed
        {
            RoomId = Guid.NewGuid(),
            BedNumber = "B-01",
            Allocations = [allocation]
        };
        var room = new HostelRoom
        {
            HostelId = Guid.NewGuid(),
            RoomNumber = "R-01",
            Capacity = 2,
            Beds = [bed]
        };
        var hostel = new Hostel
        {
            Name = "Main hostel",
            Description = "Student accommodation",
            Rooms = [room]
        };

        var response = HostelResponseDto.FromDomain(hostel);

        Assert.Equal(hostel.Id, response.Id);
        Assert.Single(response.Rooms);
        Assert.Single(response.Rooms.First().Beds);
        Assert.Single(response.Rooms.First().Beds.First().Allocations);
        Assert.Equal(allocation.StudentId, response.Rooms.First().Beds.First().Allocations.First().StudentId);
    }
}
