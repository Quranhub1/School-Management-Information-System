import { useState } from 'react';

export function HROversight({ canManage = true }: { canManage?: boolean }) {
  return (
    <div className="panel" aria-label="HR Oversight">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HR</span>
          <h3>HR Oversight</h3>
          <p>View and monitor human resources-related information across the institution</p>
        </div>
      </div>
      
      <div className="hr-overview-grid">
        <div className="overview-section">
          <h3>HR Overview</h3>
          <p>View overall HR statistics and workforce demographics</p>
          {!canManage && (
            <button className="secondary-button">View Overview</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Leave Requests</h3>
          <p>View and manage employee leave requests</p>
          {canManage && (
            <button className="primary-button">Manage Leave Requests</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Appointments</h3>
          <p>View and manage new staff appointments and promotions</p>
          {canManage && (
            <button className="primary-button">Manage Appointments</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Movements</h3>
          <p>View staff transfers, movements, and organizational changes</p>
          {!canManage && (
            <button className="secondary-button">View Staff Movements</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Performance</h3>
          <p>View staff performance evaluations and development plans</p>
          {!canManage && (
            <button className="secondary-button">View Performance Evaluations</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Disciplinary Matters</h3>
          <p>View and manage staff disciplinary cases and actions</p>
          {!canManage && (
            <button className="secondary-button">View Disciplinary Matters</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Staff Reports</h3>
          <p>Generate reports on HR-related matters</p>
          {canManage && (
            <button className="primary-button">Generate Reports</button>
          )}
        </div>
      </div>
    </div>
  );
}