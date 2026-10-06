import { useState } from 'react';

export function StudentOversight({ canManage = true }: { canManage?: boolean }) {
  return (
    <div className="panel" aria-label="Student Oversight">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">STUDENTS</span>
          <h3>Student Oversight</h3>
          <p>View and monitor student-related information across the institution</p>
        </div>
      </div>
      
      <div className="student-overview-grid">
        <div className="overview-section">
          <h3>Student Overview</h3>
          <p>View overall student population statistics and demographics</p>
          {!canManage && (
            <button className="secondary-button">View Overview</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Student Search</h3>
          <p>Search for specific students across all departments and programmes</p>
          {canManage && (
            <button className="primary-button">Search Students</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Enrollment Statistics</h3>
          <p>View enrollment trends and statistics</p>
          {!canManage && (
            <button className="secondary-button">View Enrollment Stats</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Attendance Overview</h3>
          <p>View overall attendance rates and trends</p>
          {!canManage && (
            <button className="secondary-button">View Attendance Overview</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Academic Performance</h3>
          <p>View overall academic performance metrics</p>
          {!canManage && (
            <button className="secondary-button">View Academic Performance</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Student Discipline</h3>
          <p>View discipline records and trends</p>
          {!canManage && (
            <button className="secondary-button">View Discipline Records</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Student Welfare</h3>
          <p>View welfare records and support services utilization</p>
          {!canManage && (
            <button className="secondary-button">View Welfare Records</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Student Reports</h3>
          <p>Generate reports on student-related matters</p>
          {canManage && (
            <button className="primary-button">Generate Reports</button>
          )}
        </div>
      </div>
    </div>
  );
}