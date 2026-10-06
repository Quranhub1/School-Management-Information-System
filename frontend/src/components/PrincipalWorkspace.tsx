import { useState } from 'react';
import { PrincipalDashboard } from './PrincipalDashboard';
import { InstitutionOverview } from './InstitutionOverview';
import { StudentOversight } from './StudentOversight';
import { StaffOversight } from './StaffOversight';
import { AcademicOversight } from './AcademicOversight';
import { AdmissionsOversight } from './AdmissionsOversight';
import { FinanceOversight } from './FinanceOversight';
import { ApprovalCentre } from './ApprovalCentre';
import { DisciplineWelfareOversight } from './DisciplineWelfareOversight';
import { HostelFacilitiesOversight } from './HostelFacilitiesOversight';
import { LibraryOversight } from './LibraryOversight';
import { HROversight } from './HROversight';
import { ReportsAnalytics } from './ReportsAnalytics';
import { CommunicationOversight } from './CommunicationOversight';

export function PrincipalWorkspace({ canManage = true }: { canManage?: boolean }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeInstitutionTab, setActiveInstitutionTab] = useState('profile');
  const [activeStudentTab, setActiveStudentTab] = useState('overview');
  const [activeStaffTab, setActiveStaffTab] = useState('overview');
  const [activeAcademicTab, setActiveAcademicTab] = useState('overview');
  const [activeAdmissionsTab, setActiveAdmissionsTab] = useState('overview');
  const [activeFinanceTab, setActiveFinanceTab] = useState('overview');
  const [activeApprovalTab, setActiveApprovalTab] = useState('pending');
  const [activeDisciplineWelfareTab, setActiveDisciplineWelfareTab] = useState('overview');
  const [activeHostelFacilitiesTab, setActiveHostelFacilitiesTab] = useState('overview');
  const [activeLibraryTab, setActiveLibraryTab] = useState('overview');
  const [activeHRTab, setActiveHRTab] = useState('overview');
  const [activeReportsTab, setActiveReportsTab] = useState('institutional');
  const [activeCommunicationTab, setActiveCommunicationTab] = useState('announcements');

  const sections = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'institution', label: 'Institution', icon: '🏢' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'staff', label: 'Staff', icon: '👔' },
    { id: 'academics', label: 'Academics', icon: '📚' },
    { id: 'admissions', label: 'Admissions', icon: '📝' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'approvals', label: 'Approval Centre', icon: '✅' },
    { id: 'discipline-welfare', label: 'Discipline & Welfare', icon: '⚖️' },
    { id: 'hostel-facilities', label: 'Hostel & Facilities', icon: '🏠' },
    { id: 'library', label: 'Library', icon: '📖' },
    { id: 'hr', label: 'HR', icon: '👥' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
    { id: 'communication', label: 'Communication', icon: '📣' }
  ];

  const institutionTabs = [
    { id: 'profile', label: 'Institution Profile', icon: '📄' },
    { id: 'departments', label: 'Departments', icon: '🏫' },
    { id: 'programmes', label: 'Programmes', icon: '🎓' },
    { id: 'academic-years', label: 'Academic Years', icon: '📅' },
    { id: 'intakes', label: 'Intakes', icon: '📥' },
    { id: 'statistics', label: 'Institutional Statistics', icon: '📊' },
    { id: 'calendar', label: 'Institutional Calendar', icon: '🗓️' },
    { id: 'events', label: 'Important Events', icon: '⚠️' }
  ];

  const studentTabs = [
    { id: 'overview', label: 'Student Overview', icon: '👥' },
    { id: 'search', label: 'Student Search', icon: '🔍' },
    { id: 'enrollment-stats', label: 'Enrollment Statistics', icon: '📈' },
    { id: 'attendance-overview', label: 'Attendance Overview', icon: '📅' },
    { id: 'academic-performance', label: 'Academic Performance', icon: '📊' },
    { id: 'discipline', label: 'Student Discipline', icon: '⚖️' },
    { id: 'welfare', label: 'Student Welfare', icon: '❤️' },
    { id: 'reports', label: 'Student Reports', icon: '📄' }
  ];

  const staffTabs = [
    { id: 'overview', label: 'Staff Overview', icon: '👔' },
    { id: 'directory', label: 'Staff Directory', icon: '👥' },
    { id: 'departments', label: 'Departments', icon: '🏫' },
    { id: 'attendance', label: 'Staff Attendance', icon: '📅' },
    { id: 'leave', label: 'Leave', icon: '🏖️' },
    { id: 'workload', label: 'Workload', icon: '⚖️' },
    { id: 'performance', label: 'Staff Performance', icon: '📊' },
    { id: 'reports', label: 'Staff Reports', icon: '📄' }
  ];

  const academicTabs = [
    { id: 'overview', label: 'Academic Overview', icon: '📊' },
    { id: 'class-performance', label: 'Class Performance', icon: '📈' },
    { id: 'programme-performance', label: 'Programme Performance', icon: '🎓' },
    { id: 'examination-performance', label: 'Examination Performance', icon: '📝' },
    { id: 'results-overview', label: 'Results Overview', icon: '📄' },
    { id: 'attendance-performance', label: 'Attendance Performance', icon: '📊' },
    { id: 'academic-reports', label: 'Academic Reports', icon: '📄' }
  ];

  const admissionsTabs = [
    { id: 'overview', label: 'Admissions Overview', icon: '📝' },
    { id: 'pending-applications', label: 'Pending Applications', icon: '⏳' },
    { id: 'admission-statistics', label: 'Admission Statistics', icon: '📊' },
    { id: 'admission-decisions', label: 'Admission Decisions', icon: '✅' },
    { id: 'intake-performance', label: 'Intake Performance', icon: '📈' },
    { id: 'admission-reports', label: 'Admission Reports', icon: '📄' }
  ];

  const financeTabs = [
    { id: 'overview', label: 'Financial Overview', icon: '💰' },
    { id: 'revenue-overview', label: 'Revenue Overview', icon: '📈' },
    { id: 'expenditure-overview', label: 'Expenditure Overview', icon: '📉' },
    { id: 'budget-overview', label: 'Budget Overview', icon: '📋' },
    { id: 'outstanding-fees', label: 'Outstanding Fees', icon: '💳' },
    { id: 'procurement-financial', label: 'Procurement Financial Overview', icon: '🛒' },
    { id: 'financial-reports', label: 'Financial Reports', icon: '📄' },
    { id: 'approval-requests', label: 'Approval Requests', icon: '✅' }
  ];

  const approvalTabs = [
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'urgent', label: 'Urgent', icon: '⚠️' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'rejected', label: 'Rejected', icon: '❌' }
  ];

  const disciplineWelfareTabs = [
    { id: 'overview', label: 'Discipline Overview', icon: '⚖️' },
    { id: 'escalated-cases', label: 'Escalated Cases', icon: '🚨' },
    { id: 'serious-cases', label: 'Serious Cases', icon: '💥' },
    { id: 'welfare-overview', label: 'Welfare Overview', icon: '❤️' },
    { id: 'welfare-escalations', label: 'Welfare Escalations', icon: '📈' },
    { id: 'discipline-reports', label: 'Discipline Reports', icon: '📄' }
  ];

  const hostelFacilitiesTabs = [
    { id: 'overview', label: 'Hostel Overview', icon: '🏠' },
    { id: 'maintenance-overview', label: 'Maintenance Overview', icon: '🔧' },
    { id: 'inspection-reports', label: 'Inspection Reports', icon: '📄' },
    { id: 'serious-issues', label: 'Serious Issues', icon: '🚨' },
    { id: 'facilities-reports', label: 'Facilities Reports', icon: '📄' }
  ];

  const libraryTabs = [
    { id: 'overview', label: 'Library Overview', icon: '📖' },
    { id: 'books', label: 'Books', icon: '📚' },
    { id: 'loans', label: 'Loans', icon: '📕' },
    { id: 'returns', label: 'Returns', icon: '📗' },
    { id: 'utilization', label: 'Library Utilization', icon: '📊' },
    { id: 'library-reports', label: 'Library Reports', icon: '📄' }
  ];

  const hrTabs = [
    { id: 'overview', label: 'HR Overview', icon: '👥' },
    { id: 'leave-requests', label: 'Leave Requests', icon: '📄' },
    { id: 'staff-appointments', label: 'Staff Appointments', icon: '👔' },
    { id: 'staff-movements', label: 'Staff Movements', icon: '🔄' },
    { id: 'staff-performance', label: 'Staff Performance', icon: '📊' },
    { id: 'staff-disciplinary', label: 'Staff Disciplinary Matters', icon: '⚖️' },
    { id: 'staff-reports', label: 'Staff Reports', icon: '📄' }
  ];

  const reportsTabs = [
    { id: 'institutional', label: 'Institutional Reports', icon: '🏢' },
    { id: 'academic', label: 'Academic Reports', icon: '📚' },
    { id: 'students', label: 'Student Reports', icon: '👥' },
    { id: 'staff', label: 'Staff Reports', icon: '👔' },
    { id: 'finance', label: 'Finance Reports', icon: '💰' },
    { id: 'operations', label: 'Operations Reports', icon: '🏭' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: '📊' },
    { id: 'executive-reports', label: 'Executive Reports', icon: '📋' }
  ];

  const communicationTabs = [
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'notices', label: 'Notices', icon: '📌' },
    { id: 'staff-messages', label: 'Staff Messages', icon: '💬' },
    { id: 'student-notices', label: 'Student Notices', icon: '📝' },
    { id: 'department-notices', label: 'Department Notices', icon: '🏫' },
    { id: 'emergency-notices', label: 'Emergency Notices', icon: '🚨' }
  ];

  const renderInstitutionContent = () => {
    switch (activeInstitutionTab) {
      case 'profile':
        return <div className="institution-form-section">
          <h3>Institution Profile</h3>
          <p>View and manage institution profile information</p>
          <p>Institution profile functionality would be implemented here.</p>
        </div>;
      case 'departments':
        return <div className="institution-form-section">
          <h3>Departments</h3>
          <p>View and manage departments</p>
          <p>Department management functionality would be implemented here.</p>
        </div>;
      case 'programmes':
        return <div className="institution-form-section">
          <h3>Programmes</h3>
          <p>View and manage academic programmes</p>
          <p>Programme management functionality would be implemented here.</p>
        </div>;
      case 'academic-years':
        return <div className="institution-form-section">
          <h3>Academic Years</h3>
          <p>View and manage academic years</p>
          <p>Academic year management functionality would be implemented here.</p>
        </div>;
      case 'intakes':
        return <div className="institution-form-section">
          <h3>Intakes</h3>
          <p>View and manage intakes</p>
          <p>Intake management functionality would be implemented here.</p>
        </div>;
      case 'statistics':
        return <div className="institution-form-section">
          <h3>Institutional Statistics</h3>
          <p>View institutional statistics</p>
          <p>Institutional statistics functionality would be implemented here.</p>
        </div>;
      case 'calendar':
        return <div className="institution-form-section">
          <h3>Institutional Calendar</h3>
          <p>View institutional calendar</p>
          <p>Institutional calendar functionality would be implemented here.</p>
        </div>;
      case 'events':
        return <div className="institution-form-section">
          <h3>Important Events</h3>
          <p>View important events</p>
          <p>Important events functionality would be implemented here.</p>
        </div>;
      default:
        return <div className="institution-form-section">
          <h3>Institution Profile</h3>
          <p>View and manage institution profile information</p>
          <p>Institution profile functionality would be implemented here.</p>
        </div>;
    }
  };

  const renderStudentContent = () => {
    switch (activeStudentTab) {
      case 'overview':
        return <StudentOversight canManage={canManage} />;
      case 'search':
        return <div className="institution-form-section">
          <h3>Student Search</h3>
          <p>Search for students across the institution</p>
          <p>Student search functionality would be implemented here.</p>
        </div>;
      case 'enrollment-stats':
        return <div className="institution-form-section">
          <h3>Enrollment Statistics</h3>
          <p>View enrollment statistics</p>
          <p>Enrollment statistics functionality would be implemented here.</p>
        </div>;
      case 'attendance-overview':
        return <div className="institution-form-section">
          <h3>Attendance Overview</h3>
          <p>View attendance overview</p>
          <p>Attendance overview functionality would be implemented here.</p>
        </div>;
      case 'academic-performance':
        return <div className="institution-form-section">
          <h3>Academic Performance</h3>
          <p>View academic performance</p>
          <p>Academic performance functionality would be implemented here.</p>
        </div>;
      case 'discipline':
        return <div className="institution-form-section">
          <h3>Student Discipline</h3>
          <p>View student discipline records</p>
          <p>Student discipline functionality would be implemented here.</p>
        </div>;
      case 'welfare':
        return <div className="institution-form-section">
          <h3>Student Welfare</h3>
          <p>View student welfare records</p>
          <p>Student welfare functionality would be implemented here.</p>
        </div>;
      case 'reports':
        return <div className="institution-form-section">
          <h3>Student Reports</h3>
          <p>Generate student reports</p>
          <p>Student reports functionality would be implemented here.</p>
        </div>;
      default:
        return <StudentOversight canManage={canManage} />;
    }
  };

  const renderStaffContent = () => {
    switch (activeStaffTab) {
      case 'overview':
        return <StaffOversight canManage={canManage} />;
      case 'directory':
        return <div className="institution-form-section">
          <h3>Staff Directory</h3>
          <p>View staff directory</p>
          <p>Staff directory functionality would be implemented here.</p>
        </div>;
      case 'departments':
        return <div className="institution-form-section">
          <h3>Departments</h3>
          <p>View staff by department</p>
          <p>Staff by department functionality would be implemented here.</p>
        </div>;
      case 'attendance':
        return <div className="institution-form-section">
          <h3>Staff Attendance</h3>
          <p>View staff attendance</p>
          <p>Staff attendance functionality would be implemented here.</p>
        </div>;
      case 'leave':
        return <div className="institution-form-section">
          <h3>Leave</h3>
          <p>View and manage staff leave</p>
          <p>Staff leave functionality would be implemented here.</p>
        </div>;
      case 'workload':
        return <div className="institution-form-section">
          <h3>Workload</h3>
          <p>View staff workload</p>
          <p>Staff workload functionality would be implemented here.</p>
        </div>;
      case 'performance':
        return <div className="institution-form-section">
          <h3>Staff Performance</h3>
          <p>View staff performance</p>
          <p>Staff performance functionality would be implemented here.</p>
        </div>;
      case 'reports':
        return <div className="institution-form-section">
          <h3>Staff Reports</h3>
          <p>Generate staff reports</p>
          <p>Staff reports functionality would be implemented here.</p>
        </div>;
      default:
        return <StaffOversight canManage={canManage} />;
    }
  };

  const renderAcademicContent = () => {
    switch (activeAcademicTab) {
      case 'overview':
        return <AcademicOversight canManage={canManage} />;
      case 'class-performance':
        return <div className="institution-form-section">
          <h3>Class Performance</h3>
          <p>View class performance</p>
          <p>Class performance functionality would be implemented here.</p>
        </div>;
      case 'programme-performance':
        return <div className="institution-form-section">
          <h3>Programme Performance</h3>
          <p>View programme performance</p>
          <p>Programme performance functionality would be implemented here.</p>
        </div>;
      case 'examination-performance':
        return <div className="institution-form-section">
          <h3>Examination Performance</h3>
          <p>View examination performance</p>
          <p>Examination performance functionality would be implemented here.</p>
        </div>;
      case 'results-overview':
        return <div className="institution-form-section">
          <h3>Results Overview</h3>
          <p>View results overview</p>
          <p>Results overview functionality would be implemented here.</p>
        </div>;
      case 'attendance-performance':
        return <div className="institution-form-section">
          <h3>Attendance Performance</h3>
          <p>View attendance performance</p>
          <p>Attendance performance functionality would be implemented here.</p>
        </div>;
      case 'academic-reports':
        return <div className="institution-form-section">
          <h3>Academic Reports</h3>
          <p>Generate academic reports</p>
          <p>Academic reports functionality would be implemented here.</p>
        </div>;
      default:
        return <AcademicOversight canManage={canManage} />;
    }
  };

  const renderAdmissionsContent = () => {
    switch (activeAdmissionsTab) {
      case 'overview':
        return <AdmissionsOversight canManage={canManage} />;
      case 'pending-applications':
        return <div className="institution-form-section">
          <h3>Pending Applications</h3>
          <p>View pending applications</p>
          <p>Pending applications functionality would be implemented here.</p>
        </div>;
      case 'admission-statistics':
        return <div className="institution-form-section">
          <h3>Admission Statistics</h3>
          <p>View admission statistics</p>
          <p>Admission statistics functionality would be implemented here.</p>
        </div>;
      case 'admission-decisions':
        return <div className="institution-form-section">
          <h3>Admission Decisions</h3>
          <p>View admission decisions</p>
          <p>Admission decisions functionality would be implemented here.</p>
        </div>;
      case 'intake-performance':
        return <div className="institution-form-section">
          <h3>Intake Performance</h3>
          <p>View intake performance</p>
          <p>Intake performance functionality would be implemented here.</p>
        </div>;
      case 'admission-reports':
        return <div className="institution-form-section">
          <h3>Admission Reports</h3>
          <p>Generate admission reports</p>
          <p>Admission reports functionality would be implemented here.</p>
        </div>;
      default:
        return <AdmissionsOversight canManage={canManage} />;
    }
  };

  const renderFinanceContent = () => {
    switch (activeFinanceTab) {
      case 'overview':
        return <FinanceOversight canManage={canManage} />;
      case 'revenue-overview':
        return <div className="institution-form-section">
          <h3>Revenue Overview</h3>
          <p>View revenue overview</p>
          <p>Revenue overview functionality would be implemented here.</p>
        </div>;
      case 'expenditure-overview':
        return <div className="institution-form-section">
          <h3>Expenditure Overview</h3>
          <p>View expenditure overview</p>
          <p>Expenditure overview functionality would be implemented here.</p>
        </div>;
      case 'budget-overview':
        return <div className="institution-form-section">
          <h3>Budget Overview</h3>
          <p>View budget overview</p>
          <p>Budget overview functionality would be implemented here.</p>
        </div>;
      case 'outstanding-fees':
        return <div className="institution-form-section">
          <h3>Outstanding Fees</h3>
          <p>View outstanding fees</p>
          <p>Outstanding fees functionality would be implemented here.</p>
        </div>;
      case 'procurement-financial':
        return <div className="institution-form-section">
          <h3>Procurement Financial Overview</h3>
          <p>View procurement financial overview</p>
          <p>Procurement financial overview functionality would be implemented here.</p>
        </div>;
      case 'financial-reports':
        return <div className="institution-form-section">
          <h3>Financial Reports</h3>
          <p>Generate financial reports</p>
          <p>Financial reports functionality would be implemented here.</p>
        </div>;
      case 'approval-requests':
        return <div className="institution-form-section">
          <h3>Approval Requests</h3>
          <p>View approval requests</p>
          <p>Approval requests functionality would be implemented here.</p>
        </div>;
      default:
        return <FinanceOversight canManage={canManage} />;
    }
  };

  const renderApprovalContent = () => {
    switch (activeApprovalTab) {
      case 'pending':
        return <ApprovalCentre filter="pending" canManage={canManage} />;
      case 'urgent':
        return <ApprovalCentre filter="urgent" canManage={canManage} />;
      case 'approved':
        return <ApprovalCentre filter="approved" canManage={canManage} />;
      case 'rejected':
        return <ApprovalCentre filter="rejected" canManage={canManage} />;
      default:
        return <ApprovalCentre filter="pending" canManage={canManage} />;
    }
  };

  const renderDisciplineWelfareContent = () => {
    switch (activeDisciplineWelfareTab) {
      case 'overview':
        return <DisciplineWelfareOversight canManage={canManage} />;
      case 'escalated-cases':
        return <div className="institution-form-section">
          <h3>Escalated Cases</h3>
          <p>View escalated discipline/welfare cases</p>
          <p>Escalated cases functionality would be implemented here.</p>
        </div>;
      case 'serious-cases':
        return <div className="institution-form-section">
          <h3>Serious Cases</h3>
          <p>View serious discipline/welfare cases</p>
          <p>Serious cases functionality would be implemented here.</p>
        </div>;
      case 'welfare-overview':
        return <div className="institution-form-section">
          <h3>Welfare Overview</h3>
          <p>View welfare overview</p>
          <p>Welfare overview functionality would be implemented here.</p>
        </div>;
      case 'welfare-escalations':
        return <div className="institution-form-section">
          <h3>Welfare Escalations</h3>
          <p>View welfare escalations</p>
          <p>Welfare escalations functionality would be implemented here.</p>
        </div>;
      case 'discipline-reports':
        return <div className="institution-form-section">
          <h3>Discipline Reports</h3>
          <p>Generate discipline reports</p>
          <p>Discipline reports functionality would be implemented here.</p>
        </div>;
      default:
        return <DisciplineWelfareOversight canManage={canManage} />;
    }
  };

  const renderHostelFacilitiesContent = () => {
    switch (activeHostelFacilitiesTab) {
      case 'overview':
        return <HostelFacilitiesOversight canManage={canManage} />;
      case 'maintenance-overview':
        return <div className="institution-form-section">
          <h3>Maintenance Overview</h3>
          <p>View maintenance overview</p>
          <p>Maintenance overview functionality would be implemented here.</p>
        </div>;
      case 'inspection-reports':
        return <div className="institution-form-section">
          <h3>Inspection Reports</h3>
          <p>View inspection reports</p>
          <p>Inspection reports functionality would be implemented here.</p>
        </div>;
      case 'serious-issues':
        return <div className="institution-form-section">
          <h3>Serious Issues</h3>
          <p>View serious issues</p>
          <p>Serious issues functionality would be implemented here.</p>
        </div>;
      case 'facilities-reports':
        return <div className="institution-form-section">
          <h3>Facilities Reports</h3>
          <p>Generate facilities reports</p>
          <p>Facilities reports functionality would be implemented here.</p>
        </div>;
      default:
        return <HostelFacilitiesOversight canManage={canManage} />;
    }
  };

  const renderLibraryContent = () => {
    switch (activeLibraryTab) {
      case 'overview':
        return <LibraryOversight canManage={canManage} />;
      case 'books':
        return <div className="institution-form-section">
          <h3>Books</h3>
          <p>View library books</p>
          <p>Library books functionality would be implemented here.</p>
        </div>;
      case 'loans':
        return <div className="institution-form-section">
          <h3>Loans</h3>
          <p>View library loans</p>
          <p>Library loans functionality would be implemented here.</p>
        </div>;
      case 'returns':
        return <div className="institution-form-section">
          <h3>Returns</h3>
          <p>View library returns</p>
          <p>Library returns functionality would be implemented here.</p>
        </div>;
      case 'utilization':
        return <div className="institution-form-section">
          <h3>Library Utilization</h3>
          <p>View library utilization</p>
          <p>Library utilization functionality would be implemented here.</p>
        </div>;
      case 'library-reports':
        return <div className="institution-form-section">
          <h3>Library Reports</h3>
          <p>Generate library reports</p>
          <p>Library reports functionality would be implemented here.</p>
        </div>;
      default:
        return <LibraryOversight canManage={canManage} />;
    }
  };

  const renderHRContent = () => {
    switch (activeHRTab) {
      case 'overview':
        return <HROversight canManage={canManage} />;
      case 'leave-requests':
        return <div className="institution-form-section">
          <h3>Leave Requests</h3>
          <p>View leave requests</p>
          <p>Leave requests functionality would be implemented here.</p>
        </div>;
      case 'staff-appointments':
        return <div className="institution-form-section">
          <h3>Staff Appointments</h3>
          <p>View staff appointments</p>
          <p>Staff appointments functionality would be implemented here.</p>
        </div>;
      case 'staff-movements':
        return <div className="institution-form-section">
          <h3>Staff Movements</h3>
          <p>View staff movements</p>
          <p>Staff movements functionality would be implemented here.</p>
        </div>;
      case 'staff-performance':
        return <div className="institution-form-section">
          <h3>Staff Performance</h3>
          <p>View staff performance</p>
          <p>Staff performance functionality would be implemented here.</p>
        </div>;
      case 'staff-disciplinary':
        return <div className="institution-form-section">
          <h3>Staff Disciplinary Matters</h3>
          <p>View staff disciplinary matters</p>
          <p>Staff disciplinary functionality would be implemented here.</p>
        </div>;
      case 'staff-reports':
        return <div className="institution-form-section">
          <h3>Staff Reports</h3>
          <p>Generate staff reports</p>
          <p>Staff reports functionality would be implemented here.</p>
        </div>;
      default:
        return <HROversight canManage={canManage} />;
    }
  };

  const renderReportsContent = () => {
    switch (activeReportsTab) {
      case 'institutional':
        return <ReportsAnalytics canManage={canManage} reportType="institutional" />;
      case 'academic':
        return <ReportsAnalytics canManage={canManage} reportType="academic" />;
      case 'students':
        return <ReportsAnalytics canManage={canManage} reportType="students" />;
      case 'staff':
        return <ReportsAnalytics canManage={canManage} reportType="staff" />;
      case 'finance':
        return <ReportsAnalytics canManage={canManage} reportType="finance" />;
      case 'operations':
        return <ReportsAnalytics canManage={canManage} reportType="operations" />;
      case 'kpi-dashboard':
        return <div className="institution-form-section">
          <h3>KPI Dashboard</h3>
          <p>View KPI dashboard</p>
          <p>KPI dashboard functionality would be implemented here.</p>
        </div>;
      case 'executive-reports':
        return <div className="institution-form-section">
          <h3>Executive Reports</h3>
          <p>Generate executive reports</p>
          <p>Executive reports functionality would be implemented here.</p>
        </div>;
      default:
        return <ReportsAnalytics canManage={canManage} reportType="institutional" />;
    }
  };

  const renderCommunicationContent = () => {
    switch (activeCommunicationTab) {
      case 'announcements':
        return <div className="institution-form-section">
          <h3>Announcements</h3>
          <p>Create and manage announcements</p>
          <p>Announcements functionality would be implemented here.</p>
        </div>;
      case 'notices':
        return <div className="institution-form-section">
          <h3>Notices</h3>
          <p>Create and manage notices</p>
          <p>Notices functionality would be implemented here.</p>
        </div>;
      case 'staff-messages':
        return <div className="institution-form-section">
          <h3>Staff Messages</h3>
          <p>Create and manage staff messages</p>
          <p>Staff messages functionality would be implemented here.</p>
        </div>;
      case 'student-notices':
        return <div className="institution-form-section">
          <h3>Student Notices</h3>
          <p>Create and manage student notices</p>
          <p>Student notices functionality would be implemented here.</p>
        </div>;
      case 'department-notices':
        return <div className="institution-form-section">
          <h3>Department Notices</h3>
          <p>Create and manage department notices</p>
          <p>Department notices functionality would be implemented here.</p>
        </div>;
      case 'emergency-notices':
        return <div className="institution-form-section">
          <h3>Emergency Notices</h3>
          <p>Create and manage emergency notices</p>
          <p>Emergency notices functionality would be implemented here.</p>
        </div>;
      default:
        return <div className="institution-form-section">
          <h3>Announcements</h3>
          <p>Create and manage announcements</p>
          <p>Announcements functionality would be implemented here.</p>
        </div>;
    }
  };

  return (
    <div className="principal-workspace">
      <div className="principal-workspace-header">
        <h1>Principal Workspace</h1>
        <p>Executive oversight and management interface for the institution</p>
      </div>
      
      <div className="principal-workspace-navigation">
        <div className="principal-workspace-main-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                setActiveSection(section.id);
                // Reset sub-tabs when changing main sections
                if (section.id === 'institution') setActiveInstitutionTab('profile');
                if (section.id === 'students') setActiveStudentTab('overview');
                if (section.id === 'staff') setActiveStaffTab('overview');
                if (section.id === 'academics') setActiveAcademicTab('overview');
                if (section.id === 'admissions') setActiveAdmissionsTab('overview');
                if (section.id === 'finance') setActiveFinanceTab('overview');
                if (section.id === 'approvals') setActiveApprovalTab('pending');
                if (section.id === 'discipline-welfare') setActiveDisciplineWelfareTab('overview');
                if (section.id === 'hostel-facilities') setActiveHostelFacilitiesTab('overview');
                if (section.id === 'library') setActiveLibraryTab('overview');
                if (section.id === 'hr') setActiveHRTab('overview');
                if (section.id === 'reports') setActiveReportsTab('institutional');
                if (section.id === 'communication') setActiveCommunicationTab('announcements');
              }}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
        
        {activeSection === 'institution' && (
          <div className="principal-workspace-sub-nav">
            {institutionTabs.map(tab => (
              <button
                key={tab.id}
                className={activeInstitutionTab === tab.id ? 'active' : ''}
                onClick={() => setActiveInstitutionTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'students' && (
          <div className="principal-workspace-sub-nav">
            {studentTabs.map(tab => (
              <button
                key={tab.id}
                className={activeStudentTab === tab.id ? 'active' : ''}
                onClick={() => setActiveStudentTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'staff' && (
          <div className="principal-workspace-sub-nav">
            {staffTabs.map(tab => (
              <button
                key={tab.id}
                className={activeStaffTab === tab.id ? 'active' : ''}
                onClick={() => setActiveStaffTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'academics' && (
          <div className="principal-workspace-sub-nav">
            {academicTabs.map(tab => (
              <button
                key={tab.id}
                className={activeAcademicTab === tab.id ? 'active' : ''}
                onClick={() => setActiveAcademicTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'admissions' && (
          <div className="principal-workspace-sub-nav">
            {admissionsTabs.map(tab => (
              <button
                key={tab.id}
                className={activeAdmissionsTab === tab.id ? 'active' : ''}
                onClick={() => setActiveAdmissionsTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'finance' && (
          <div className="principal-workspace-sub-nav">
            {financeTabs.map(tab => (
              <button
                key={tab.id}
                className={activeFinanceTab === tab.id ? 'active' : ''}
                onClick={() => setActiveFinanceTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'approvals' && (
          <div className="principal-workspace-sub-nav">
            {approvalTabs.map(tab => (
              <button
                key={tab.id}
                className={activeApprovalTab === tab.id ? 'active' : ''}
                onClick={() => setActiveApprovalTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'discipline-welfare' && (
          <div className="principal-workspace-sub-nav">
            {disciplineWelfareTabs.map(tab => (
              <button
                key={tab.id}
                className={activeDisciplineWelfareTab === tab.id ? 'active' : ''}
                onClick={() => setActiveDisciplineWelfareTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'hostel-facilities' && (
          <div className="principal-workspace-sub-nav">
            {hostelFacilitiesTabs.map(tab => (
              <button
                key={tab.id}
                className={activeHostelFacilitiesTab === tab.id ? 'active' : ''}
                onClick={() => setActiveHostelFacilitiesTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'library' && (
          <div className="principal-workspace-sub-nav">
            {libraryTabs.map(tab => (
              <button
                key={tab.id}
                className={activeLibraryTab === tab.id ? 'active' : ''}
                onClick={() => setActiveLibraryTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'hr' && (
          <div className="principal-workspace-sub-nav">
            {hrTabs.map(tab => (
              <button
                key={tab.id}
                className={activeHRTab === tab.id ? 'active' : ''}
                onClick={() => setActiveHRTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'reports' && (
          <div className="principal-workspace-sub-nav">
            {reportsTabs.map(tab => (
              <button
                key={tab.id}
                className={activeReportsTab === tab.id ? 'active' : ''}
                onClick={() => setActiveReportsTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
        
        {activeSection === 'communication' && (
          <div className="principal-workspace-sub-nav">
            {communicationTabs.map(tab => (
              <button
                key={tab.id}
                className={activeCommunicationTab === tab.id ? 'active' : ''}
                onClick={() => setActiveCommunicationTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="principal-workspace-content">
        {activeSection === 'dashboard' && (
          <PrincipalDashboard canManage={canManage} />
        )}
        
        {activeSection === 'institution' && renderInstitutionContent()}
        
        {activeSection === 'students' && renderStudentContent()}
        
        {activeSection === 'staff' && renderStaffContent()}
        
        {activeSection === 'academics' && renderAcademicContent()}
        
        {activeSection === 'admissions' && renderAdmissionsContent()}
        
        {activeSection === 'finance' && renderFinanceContent()}
        
        {activeSection === 'approvals' && renderApprovalContent()}
        
        {activeSection === 'discipline-welfare' && renderDisciplineWelfareContent()}
        
        {activeSection === 'hostel-facilities' && renderHostelFacilitiesContent()}
        
        {activeSection === 'library' && renderLibraryContent()}
        
        {activeSection === 'hr' && renderHRContent()}
        
        {activeSection === 'reports' && renderReportsContent()}
        
        {activeSection === 'communication' && renderCommunicationContent()}
      </div>
    </div>
  )
}