import { useState } from 'react';

export function StaffOversight({ canManage = true }: { canManage?: boolean }) {
  return (
    <div className="panel" aria-label="Staff Oversight">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">STAFF</span>
          <h3>Staff Oversight</h3>
          <p>View and monitor staff-related information across the institution</p>
        </div>
      </div>
      
      <div className="staff-overview-grid">
        <div className="overview-section">
          <h3>Staff Overview</h3>
          <p>View overall staff population statistics and demographics</p>
          {!canManage && (
            <button className="secondary-button">View Overview</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Directory</h3>
          <p>View and search the complete staff directory</p>
          {canManage && (
            <button className="primary-button">Search Directory</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Departments</h3>
          <p>View staff distribution across departments</p>
          {!canManage && (
            <button className="secondary-button">View Department Distribution</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Attendance</h3>
          <p>View staff attendance records and trends</p>
          {!canManage && (
            <button className="secondary-button">View Attendance Records</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Leave</h3>
          <p>View and monitor staff leave requests and approvals</p>
          {canManage && (
            <button className="primary-button">Manage Leave Requests</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Workload</h3>
          <p>View staff workload and distribution</p>
          {!canManage && (
            <button className="secondary-button">View Workload Analysis</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Performance</h3>
          <p>View staff performance evaluations and metrics</p>
          {!canManage && (
            <button className="secondary-button">View Performance Reports</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Reports</h3>
          <p>Generate reports on staff-related matters</p>
          {canManage && (
            <button className="primary-button">Generate Reports</button>
          )}
        </div>
      </div>
    </div>
  );
}