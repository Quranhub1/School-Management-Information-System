import { useState, useEffect } from 'react';

type ApprovalItem = {
  id: string;
  type: 'finance' | 'procurement' | 'admissions' | 'leave' | 'maintenance' | 'other';
  title: string;
  requestedBy: string;
  department: string;
  description: string;
  estimatedCost?: number; // For finance/procurement
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  dateSubmitted: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  accountantReview?: string; // For finance/procurement
};

export function ApprovalCentre({ 
  filter = 'all',
  canManage = true 
}: { 
  filter?: 'all' | 'pending' | 'urgent' | 'approved' | 'rejected';
  canManage?: boolean;
}) {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);

  useEffect(() => {
    loadApprovalData();
  }, [filter]);

  const loadApprovalData = async () => {
    setLoading(true);
    setError(null);
    try {
      // In a real implementation, this would fetch from an API endpoint
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data for approvals
      const mockApprovals: ApprovalItem[] = [
        {
          id: 'APPR-001',
          type: 'finance',
          title: 'Budget Increase for Science Department',
          requestedBy: 'Head of Science Department',
          department: 'Science',
          description: 'Request for additional funds to purchase laboratory equipment for the new academic year',
          estimatedCost: 2500000,
          urgency: 'high',
          dateSubmitted: '2026-10-01',
          status: 'pending',
          accountantReview: 'Reviewed - Recommended for approval'
        },
        {
          id: 'APPR-002',
          type: 'procurement',
          title: 'Purchase of New Textbooks for English Department',
          requestedBy: 'Head of English Department',
          department: 'English',
          description: 'Purchase of latest edition textbooks for literature and language courses',
          estimatedCost: 1800000,
          urgency: 'medium',
          dateSubmitted: '2026-09-28',
          status: 'pending',
          accountantReview: 'Reviewed - Recommended for approval'
        },
        {
          id: 'APPR-003',
          type: 'admissions',
          title: 'Admission of International Student',
          requestedBy: 'Admissions Officer',
          department: 'Admissions',
          description: 'Admission request for international student from Kenya for Nursing programme',
          estimatedCost: 0,
          urgency: 'medium',
          dateSubmitted: '2026-09-25',
          status: 'pending',
          accountantReview: 'N/A'
        },
        {
          id: 'APPR-004',
          type: 'leave',
          title: 'Extended Leave Request',
          requestedBy: 'Senior Lecturer, Mathematics',
          department: 'Mathematics',
          description: 'Request for 3-month extended leave for personal health reasons',
          estimatedCost: 0,
          urgency: 'low',
          dateSubmitted: '2026-09-20',
          status: 'pending',
          accountantReview: 'N/A'
        },
        {
          id: 'APPR-005',
          type: 'maintenance',
          title: 'Library Roof Repair',
          requestedBy: 'Head Librarian',
          department: 'Library',
          description: 'Repair of leaking roof in the main library building',
          estimatedCost: 1200000,
          urgency: 'high',
          dateSubmitted: '2026-09-15',
          status: 'pending',
          accountantReview: 'Reviewed - Recommended for approval'
        },
        {
          id: 'APPR-006',
          type: 'finance',
          title: 'Staff Bonus Approval',
          requestedBy: 'HR Manager',
          department: 'Human Resources',
          description: 'Approval for end-of-year bonuses for qualifying staff members',
          estimatedCost: 800000,
          urgency: 'medium',
          dateSubmitted: '2026-09-10',
          status: 'approved',
          accountantReview: 'Reviewed - Recommended for approval'
        },
        {
          id: 'APPR-007',
          type: 'procurement',
          title: 'Purchase of Sports Equipment',
          requestedBy: 'Sports Director',
          department: 'Sports',
          description: 'Purchase of new sports equipment for the athletic department',
          estimatedCost: 900000,
          urgency: 'medium',
          dateSubmitted: '2026-09-05',
          status: 'rejected',
          accountantReview: 'Reviewed - Not recommended due to budget constraints'
        }
      ];

      // Filter based on the filter parameter
      let filteredApprovals = mockApprovals;
      if (filter !== 'all') {
        filteredApprovals = mockApprovals.filter(approval => 
          filter === 'urgent' ? approval.urgency === 'high' || approval.urgency === 'urgent' :
          approval.status === filter
        );
      }

      setApprovals(filteredApprovals);
    } catch (err) {
      setError('Failed to load approval data');
      console.error('Approval data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (approvalId: string) => {
    // In a real implementation, this would send an API request to approve the item
    alert(`Approval ${approvalId} has been approved`);
    // Refresh the data
    loadApprovalData();
  };

  const handleReject = (approvalId: string) => {
    // In a real implementation, this would send an API request to reject the item
    alert(`Approval ${approvalId} has been rejected`);
    // Refresh the data
    loadApprovalData();
  };

  const handleReturn = (approvalId: string) => {
    // In a real implementation, this would send an API request to return the item for revision
    alert(`Approval ${approvalId} has been returned for revision`);
    // Refresh the data
    loadApprovalData();
  };

  if (loading) {
    return <div className="panel" aria-label="Approval Centre">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">APPROVAL CENTRE</span>
          <h3>Approval Centre</h3>
          <p>Review and approve/reject requests from across the institution</p>
        </div>
      </div>
      <div className="approval-centre-loading">Loading approval data...</div>
    </div>;
  }

  if (error) {
    return <div className="panel" aria-label="Approval Centre">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">APPROVAL CENTRE</span>
          <h3>Approval Centre</h3>
          <p>Review and approve/reject requests from across the institution</p>
        </div>
      </div>
      <div className="approval-centre-error">{error}</div>
    </div>;
  }

  // Count approvals by status and urgency for the filter tabs
  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const urgentCount = approvals.filter(a => a.urgency === 'high' || a.urgency === 'urgent').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <div className="panel" aria-label="Approval Centre">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">APPROVAL CENTRE</span>
          <h3>Approval Centre</h3>
          <p>Review and approve/reject requests from across the institution</p>
        </div>
      </div>
      
      <div className="approval-centre-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({approvals.length})
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button 
          className={filter === 'urgent' ? 'active' : ''}
          onClick={() => setFilter('urgent')}
        >
          Urgent ({urgentCount})
        </button>
        <button 
          className={filter === 'approved' ? 'active' : ''}
          onClick={() => setFilter('approved')}
        >
          Approved ({approvedCount})
        </button>
        <button 
          className={filter === 'rejected' ? 'active' : ''}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({rejectedCount})
        </button>
      </div>
      
      {approvals.length === 0 ? (
        <div className="approval-centre-empty">
          <p>No approval requests found matching the current filter.</p>
        </div>
      ) : (
        <div className="approval-centre-content">
          {approvals.map(approval => (
            <div key={approval.id} className="approval-card">
              <div className="approval-card-header">
                <h4>{approval.title}</h4>
                <div className="approval-meta">
                  <span className={`approval-type-${approval.type}`}>{approval.type}</span>
                  <span className={`approval-urgency-${approval.urgency}`}>{approval.urgency}</span>
                  <span className={`approval-status-${approval.status}`}>{approval.status}</span>
                </div>
              </div>
              <div className="approval-card-body">
                <p><strong>Requested by:</strong> {approval.requestedBy}</p>
                <p><strong>Department:</strong> {approval.department}</p>
                <p><strong>Description:</strong> {approval.description}</p>
                {approval.estimatedCost && (
                  <p><strong>Estimated Cost:</strong> UGX {approval.estimatedCost.toLocaleString()}</p>
                )}
                <p><strong>Submitted:</strong> {new Date(approval.dateSubmitted).toLocaleDateString()}</p>
                {approval.accountantReview && (
                  <p><strong>Accountant Review:</strong> {approval.accountantReview}</p>
                )}
              </div>
              <div className="approval-card-actions">
                {canManage && approval.status === 'pending' && (
                  <>
                    <button 
                      className="approval-button approve"
                      onClick={() => handleApprove(approval.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="approval-button reject"
                      onClick={() => handleReject(approval.id)}
                    >
                      Reject
                    </button>
                    {approval.type === 'finance' || approval.type === 'procurement' && (
                      <button 
                        className="approval-button return"
                        onClick={() => handleReturn(approval.id)}
                      >
                        Return for Revision
                      </button>
                    )}
                  </>
                )}
                {!canManage && (
                  <button className="approval-button view" disabled>
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}