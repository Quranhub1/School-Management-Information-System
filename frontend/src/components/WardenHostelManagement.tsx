import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';
import { getCheckInCheckOutRecords, createCheckInCheckOutRecord, CheckInCheckOutRecord } from '../api/hostelWarden';
import { getMaintenanceRequests, createMaintenanceRequest, MaintenanceRequest } from '../api/hostelWarden';
import { getHostelInspections, createHostelInspection, HostelInspection } from '../api/hostelWarden';
import { getIndisciplineCases, createIndisciplineCase, IndisciplineCase, IndisciplineSummary } from '../api/indiscipline';

// Import the existing HostelManagement component to reuse its core functionality
import { HostelManagement } from './HostelManagement';

export function WardenHostelManagement({ canManage = true }: { canManage?: boolean }) {
  // State for Warden-specific features
  const [checkInRecords, setCheckInRecords] = useState<CheckInCheckOutRecord[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [hostelInspections, setHostelInspections] = useState<HostelInspection[]>([]);
  const [indisciplineCases, setIndisciplineCases] = useState<IndisciplineCase[]>([]);
  const [indisciplineSummary, setIndisciplineSummary] = useState<IndisciplineSummary>({
    openCases: 0,
    underInvestigation: 0,
    pendingAction: 0,
    resolved: 0,
    seriousCases: 0,
    byCategory: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWardenData();
  }, []);

  const loadWardenData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Load all Warden-specific data
      const [
        checkInsResponse,
        maintenanceResponse,
        inspectionsResponse,
        indisciplineCasesResponse,
        indisciplineSummaryResponse
      ] = await Promise.all([
        fetch(`/api/hostel/check-in-out`, { headers }),
        fetch(`/api/hostel/maintenance-requests`, { headers }),
        fetch(`/api/hostel/inspections`, { headers }),
        fetch(`/api/indiscipline/cases`, { headers }),
        fetch(`/api/indiscipline/cases/summary`, { headers })
      ]);
      
      const [
        checkInsData,
        maintenanceData,
        inspectionsData,
        indisciplineCasesData,
        indisciplineSummaryData
      ] = await Promise.all([
        checkInsResponse.json(),
        maintenanceResponse.json(),
        inspectionsResponse.json(),
        indisciplineCasesResponse.json(),
        indisciplineSummaryResponse.json()
      ]);
      
      setCheckInRecords(checkInsData);
      setMaintenanceRequests(maintenanceData);
      setHostelInspections(inspectionsData);
      setIndisciplineCases(indisciplineCasesData);
      setIndisciplineSummary(indisciplineSummaryData);
    } catch (err) {
      setError('Failed to load Warden hostel data');
      console.error('Warden hostel data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="panel" aria-label="Warden Hostel Management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HOSTEL</span>
          <h3>Warden Hostel Management</h3>
          <p>Manage hostel operations including check-ins, maintenance, inspections, and discipline</p>
        </div>
      </div>
      <div className="warden-hostel-loading">Loading Warden hostel data...</div>
    </div>;
  }

  if (error) {
    return <div className="panel" aria-label="Warden Hostel Management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HOSTEL</span>
          <h3>Warden Hostel Management</h3>
          <p>Manage hostel operations including check-ins, maintenance, inspections, and discipline</p>
        </div>
      </div>
      <div className="warden-hostel-error">{error}</div>
    </div>;
  }

  return (
    <section className="panel" aria-label="Warden Hostel Management">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">HOSTEL</span>
          <h3>Warden Hostel Management</h3>
          <p>Manage hostel operations including check-ins, maintenance, inspections, and discipline</p>
        </div>
      </div>
      
      {/* Reuse the existing HostelManagement component for core hostel functionality */}
      <HostelManagement canManage={canManage} />
      
      {/* Warden-specific sections */}
      <div className="warden-hostel-sections">
        <div className="warden-hostel-section">
          <h3>Check-in / Check-out Records</h3>
          {/* Simple display of recent check-ins */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Check-in Time</th>
                  <th>Check-out Time</th>
                  <th>Purpose</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {checkInRecords
                  .slice(0, 10) // Show last 10
                  .map(record => (
                    <tr key={record.id}>
                      <td>{record.studentName}</td>
                      <td>{new Date(record.checkInTime).toLocaleString()}</td>
                      <td>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : 'Still in'}</td>
                      <td>{record.purpose}</td>
                      <td>{record.checkInBy}</td>
                    </tr>
                  ))}
                {checkInRecords.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">No check-in/check-out records found.</td>
                  </tr)
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="warden-hostel-section">
          <h3>Maintenance Requests</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>Priority</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {maintenanceRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.title}</td>
                    <td>{request.location}</td>
                    <td>{request.requestedBy}</td>
                    <td>
                      <span className={`maintenance-status-${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-${request.priority.toLowerCase()}`}>
                        {request.priority}
                      </span>
                    </td>
                    {canManage && (
                      <td className="table-actions">
                        <button className="action-button">Edit</button>
                        <button className="action-button destructive">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
                {maintenanceRequests.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="empty">
                      No maintenance requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="warden-hostel-section">
          <h3>Hostel Inspections</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Inspector</th>
                  <th>Areas Inspected</th>
                  <th>Status</th>
                  <th>Follow-up Required</th>
                </tr>
              </thead>
              <tbody>
                {hostelInspections.map(inspection => (
                  <tr key={inspection.id}>
                    <td>{new Date(inspection.inspectionDate).toLocaleDateString()}</td>
                    <td>{inspection.inspectorName}</td>
                    <td>{inspection.areasInspected.join(', ')}</td>
                    <td>
                      <span className={`inspection-status-${inspection.status.toLowerCase()}`}>
                        {inspection.status}
                      </span>
                    </td>
                    <td>{inspection.followUpRequired ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
                {hostelInspections.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">No hostel inspections found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="warden-hostel-section">
          <h3>Indiscipline Cases</h3>
          <div className="indiscipline-summary">
            <div className="summary-item">
              <span>Open Cases</span>
              <strong>{indisciplineSummary.openCases}</strong>
            </div>
            <div className="summary-item">
              <span>Under Investigation</span>
              <strong>{indisciplineSummary.underInvestigation}</strong>
            </div>
            <div className="summary-item">
              <span>Pending Action</span>
              <strong>{indisciplineSummary.pendingAction}</strong>
            </div>
            <div className="summary-item">
              <span>Resolved</span>
              <strong>{indisciplineSummary.resolved}</strong>
            </div>
            <div className="summary-item">
              <span>Serious Cases</span>
              <strong>{indisciplineSummary.seriousCases}</strong>
            </div>
          </div>
          
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Incident Type</th>
                  <th>Description</th>
                  <th>Status</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {indisciplineCases.map(caseItem => (
                  <tr key={caseItem.id}>
                    <td>{caseItem.studentName}</td>
                    <td>{new Date(caseItem.date).toLocaleDateString()}</td>
                    <td>{caseItem.incidentType}</td>
                    <td>{caseItem.description.substring(0, 50)}{caseItem.description.length > 50 ? '...' : ''}</td>
                    <td>
                      <span className={`indiscipline-status-${caseItem.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="table-actions">
                        <button className="action-button">Edit</button>
                        <button className="action-button destructive">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
                {indisciplineCases.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="empty">
                      No indiscipline cases found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}