import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';

type Metric = {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'critical';
};

export function PrincipalDashboard({ canManage = true }: { canManage?: boolean }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch data from various endpoints for the principal dashboard
      // In a real implementation, these would be actual API calls
      // For now, we'll use mock data or placeholder values
      
      // Simulate API calls with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, these would come from actual API endpoints
      const mockData = {
        students: 2431,
        staff: 186,
        attendanceRate: 94.2,
        finance: {
          revenue: 12500000,
          expenditure: 11800000,
          balance: 700000
        },
        academicPerformance: {
          averageScore: 72.4,
          passRate: 91.2
        },
        pendingApprovals: {
          admissions: 8,
          procurement: 4,
          finance: 3,
          leave: 6
        },
        institutionalAlerts: [
          { message: '12 hostel indiscipline cases require attention', type: 'warning' },
          { message: '3 critical maintenance issues', type: 'warning' },
          { message: 'Finance reconciliation pending', type: 'warning' },
          { message: '2 staff matters awaiting decision', type: 'warning' }
        ],
        recentActivity: [
          { description: 'New admissions approved', time: '2 hours ago' },
          { description: 'Procurement request submitted', time: '4 hours ago' },
          { description: 'Examination results published', time: '6 hours ago' },
          { description: 'Hostel incident escalated', time: '8 hours ago' }
        ]
      };

      setMetrics([
        { label: 'Students', value: mockData.students },
        { label: 'Staff', value: mockData.staff },
        { label: 'Attendance Rate', value: `${mockData.attendanceRate}%` },
        { label: 'Finance Balance', value: `UGX ${mockData.finance.balance.toLocaleString()}` },
        { label: 'Average Score', value: `${mockData.academicPerformance.averageScore}%` },
        { label: 'Pass Rate', value: `${mockData.academicPerformance.passRate}%` },
        { label: 'Attendance Rate (Academic)', value: `${mockData.attendanceRate}%` },
        { label: 'Pending Admissions', value: mockData.pendingApprovals.admissions },
        { label: 'Pending Procurement', value: mockData.pendingApprovals.procurement },
        { label: 'Pending Finance', value: mockData.pendingApprovals.finance },
        { label: 'Pending Leave', value: mockData.pendingApprovals.leave },
        { label: 'Institutional Alerts', value: mockData.institutionalAlerts.length },
        { label: 'Recent Activity Items', value: mockData.recentActivity.length }
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="panel" aria-label="Principal Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRINCIPAL</span>
          <h3>Principal Dashboard</h3>
          <p>Live institutional overview showing key metrics and alerts</p>
        </div>
      </div>
      <div className="dashboard-loading">Loading dashboard data...</div>
    </div>;
  }

  if (error) {
    return <div className="panel" aria-label="Principal Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRINCIPAL</span>
          <h3>Principal Dashboard</h3>
          <p>Live institutional overview showing key metrics and alerts</p>
        </div>
      </div>
      <div className="dashboard-error">{error}</div>
    </div>;
  }

  return (
    <div className="panel" aria-label="Principal Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">PRINCIPAL</span>
          <h3>Principal Dashboard</h3>
          <p>Live institutional overview showing key metrics and alerts</p>
        </div>
      </div>
      <div className="principal-dashboard-grid">
        {/* First row - Key metrics */}
        <div className="dashboard-metric-row">
          <div className="dashboard-metric-card">
            <h4>Students</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Students')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Staff</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Staff')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Attendance Rate</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Attendance Rate')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Finance Balance</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Finance Balance')?.value}</div>
          </div>
        </div>
        
        {/* Second row - Academic performance */}
        <div className="dashboard-metric-row">
          <div className="dashboard-metric-card">
            <h4>Average Score</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Average Score')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Pass Rate</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Pass Rate')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Attendance Rate (Academic)</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Attendance Rate (Academic)')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Pending Admissions</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Pending Admissions')?.value}</div>
          </div>
        </div>
        
        {/* Third row - More pending approvals */}
        <div className="dashboard-metric-row">
          <div className="dashboard-metric-card">
            <h4>Pending Procurement</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Pending Procurement')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Pending Finance</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Pending Finance')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Pending Leave</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Pending Leave')?.value}</div>
          </div>
          <div className="dashboard-metric-card">
            <h4>Institutional Alerts</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Institutional Alerts')?.value}</div>
          </div>
        </div>
        
        {/* Fourth row - Recent activity */}
        <div className="dashboard-metric-row">
          <div className="dashboard-metric-card">
            <h4>Recent Activity Items</h4>
            <div className="dashboard-metric-value">{metrics.find(m => m.label === 'Recent Activity Items')?.value}</div>
          </div>
          {/* In a real implementation, this would show the actual recent activity */}
          <div className="dashboard-metric-card" style={{ gridColumn: 'span 3' }}>
            <h4>Recent Institutional Activity</h4>
            <div className="recent-activity-list">
              <div className="activity-item">• New admissions approved</div>
              <div className="activity-item">• Procurement request submitted</div>
              <div className="activity-item">• Examination results published</div>
              <div className="activity-item">• Hostel incident escalated</div>
            </div>
          </div>
        </div>
        
        {/* Institutional Alerts section */}
        <div className="dashboard-alerts-section" style={{ gridColumn: 'span 4' }}>
          <h4>Institutional Alerts</h4>
          <div className="alerts-list">
            <div className="alert-item warning">• 12 hostel indiscipline cases require attention</div>
            <div className="alert-item warning">• 3 critical maintenance issues</div>
            <div className="alert-item warning">• Finance reconciliation pending</div>
            <div className="alert-item warning">• 2 staff matters awaiting decision</div>
          </div>
        </div>
      </div>
    </div>
  );
}