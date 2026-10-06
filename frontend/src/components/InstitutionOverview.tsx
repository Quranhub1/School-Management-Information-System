import { useState } from 'react';

export function InstitutionOverview({ canManage = true }: { canManage?: boolean }) {
  return (
    <div className="panel" aria-label="Institution Overview">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INSTITUTION</span>
          <h3>Institution Overview</h3>
          <p>View and manage institution-wide information</p>
        </div>
      </div>
      
      <div className="institution-overview-grid">
        <div className="overview-section">
          <h3>Institution Profile</h3>
          <p>View detailed information about the institution including name, address, contact information, etc.</p>
          {canManage && (
            <button className="primary-button">Edit Institution Profile</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Departments</h3>
          <p>View and manage academic and administrative departments</p>
          {canManage && (
            <button className="primary-button">Manage Departments</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Programmes</h3>
          <p>View and manage academic programmes offered by the institution</p>
          {canManage && (
            <button className="primary-button">Manage Programmes</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Academic Years</h3>
          <p>View and manage academic years and terms</p>
          {canManage && (
            <button className="primary-button">Manage Academic Years</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Intakes</h3>
          <p>View and manage student intakes throughout the year</p>
          {canManage && (
            <button className="primary-button">Manage Intakes</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Institutional Statistics</h3>
          <p>View key statistics about the institution</p>
          {!canManage && (
            <button className="secondary-button">View Statistics</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Institutional Calendar</h3>
          <p>View the institutional calendar with important dates</p>
          {!canManage && (
            <button className="secondary-button">View Calendar</button>
          )}
        </div>
        
        <div className="overview-section">
          <h3>Important Events</h3>
          <p>View and manage important institutional events</p>
          {canManage && (
            <button className="primary-button">Manage Events</button>
          )}
        </div>
      </div>
    </div>
  );
}