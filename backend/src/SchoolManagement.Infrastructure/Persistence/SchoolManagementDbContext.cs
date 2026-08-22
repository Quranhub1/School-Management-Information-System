using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Library;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Students;
using AssessmentGradingScale = SchoolManagement.Domain.Assessment.GradingScale;
using AssessmentGradeBand = SchoolManagement.Domain.Assessment.GradeBand;
using AssessmentTranscriptEntry = SchoolManagement.Domain.Assessment.TranscriptEntry;
using AssessmentAcademicResultSummary = SchoolManagement.Domain.Assessment.AcademicResultSummary;
namespace SchoolManagement.Infrastructure.Persistence;
public sealed class SchoolManagementDbContext(DbContextOptions<SchoolManagementDbContext> options) : DbContext(options)
{
 public DbSet<User> Users=>Set<User>(); public DbSet<Role> Roles=>Set<Role>(); public DbSet<UserRole> UserRoles=>Set<UserRole>(); public DbSet<Applicant> Applicants=>Set<Applicant>(); public DbSet<Student> Students=>Set<Student>(); public DbSet<StudentGuardian> StudentGuardians=>Set<StudentGuardian>(); public DbSet<Faculty> Faculties=>Set<Faculty>(); public DbSet<Department> Departments=>Set<Department>(); public DbSet<Programme> Programmes=>Set<Programme>(); public DbSet<AcademicYear> AcademicYears=>Set<AcademicYear>(); public DbSet<Semester> Semesters=>Set<Semester>(); public DbSet<Intake> Intakes=>Set<Intake>(); public DbSet<Course> Courses=>Set<Course>(); public DbSet<Curriculum> Curricula=>Set<Curriculum>(); public DbSet<CurriculumCourse> CurriculumCourses=>Set<CurriculumCourse>(); public DbSet<Admission> Admissions=>Set<Admission>(); public DbSet<StudentEnrollment> StudentEnrollments=>Set<StudentEnrollment>(); public DbSet<CourseRegistration> CourseRegistrations=>Set<CourseRegistration>(); public DbSet<CourseOffering> CourseOfferings=>Set<CourseOffering>(); public DbSet<TeachingGroup> TeachingGroups=>Set<TeachingGroup>(); public DbSet<TimetableEntry> TimetableEntries=>Set<TimetableEntry>(); public DbSet<AttendanceSession> AttendanceSessions=>Set<AttendanceSession>(); public DbSet<StudentAttendance> StudentAttendances=>Set<StudentAttendance>(); public DbSet<StudentAcademicStatus> StudentAcademicStatuses=>Set<StudentAcademicStatus>(); public DbSet<LearningOutcome> LearningOutcomes=>Set<LearningOutcome>(); public DbSet<AssessmentPlan> AssessmentPlans=>Set<AssessmentPlan>(); public DbSet<StudentAssessment> StudentAssessments=>Set<StudentAssessment>(); public DbSet<AttendanceRecord> AttendanceRecords=>Set<AttendanceRecord>(); public DbSet<AssessmentTranscriptEntry> TranscriptEntries=>Set<AssessmentTranscriptEntry>(); public DbSet<AssessmentAcademicResultSummary> AcademicResultSummaries=>Set<AssessmentAcademicResultSummary>(); public DbSet<Placeme...