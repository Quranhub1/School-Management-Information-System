import { useEffect, useState } from 'react';
import { getAccessToken } from '../api/auth';

type Metric = {
  label: string;
  value: string | number;
  status?: 'normal' | 'warning' | 'critical';
};

type WardenDashboardProps = {
  canManage?: boolean;
};

export function WardenDashboard({ canManage = true }: WardenDashboardProps) {
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

      // Fetch data from various endpoints
      const [
        hostelResponse,
        stockResponse,
        welfareResponse,
        indisciplineResponse
      ] = await Promise.all([
        fetch(`/api/hostel`, { headers }),
        fetch(`/api/inventory/stock/low-stock`, { headers }),
        fetch(`/api/inventory/welfare/daily`, { headers }),
        fetch(`/api/indiscipline/cases/summary`, { headers }) // This endpoint doesn't exist yet
      ]);

      // Process hostel data
      const hostelData = await hostelResponse.json();
      const pendingMaintenance = hostelData.pendingMaintenance ?? 0;
      const todaysCheckins = hostelData.todaysCheckins ?? 0;
      const todaysCheckouts = hostelData.todaysCheckouts ?? 0;
      const inspectionStatus = hostelData.inspectionStatus ?? 'Pending';

      // Process stock data
      const lowStockItems = await stockResponse.json();
      const lowStockCount = Array.isArray(lowStockItems) ? lowStockItems.length : 0;

      // Process welfare data
      const welfareData = await welfareResponse.json();
      const welfareIssues = welfareData.issues ?? 0;

      // Process indiscipline data (placeholder for now)
      const indisciplineData = await indisciplineResponse.json();
      const openCases = indisciplineData.openCases ?? 0;
      const underInvestigation = indisciplineData.underInvestigation ?? 0;
      const pendingAction = indisciplineData.pendingAction ?? 0;

      setMetrics([
        { label: 'Pending Maintenance Requests', value: pendingMaintenance, status: pendingMaintenance > 5 ? 'warning' : 'normal' },
        { label: "Today's Check-ins", value: todaysCheckins },
        { label: "Today's Check-outs", value: todaysCheckouts },
        { label: 'Hostel Inspection Status', value: inspectionStatus },
        { label: 'Open Indiscipline Cases', value: openCases, status: openCases > 10 ? 'warning' : 'normal' },
        { label: 'Under Investigation', value: underInvestigation },
        { label: 'Pending Action', value: pendingAction },
        { label: 'Pending Welfare Issues', value: welfareIssues, status: welfareIssues > 5 ? 'warning' : 'normal' },
        { label: 'Low Stock Items', value: lowStockCount, status: lowStockCount > 0 ? 'warning' : 'normal' },
        { label: 'Pending Stock Requests', value: 0 }, // Placeholder
        { label: 'Food Stock Alerts', value: 0 }, // Placeholder
        { label: "Today's Meal Count", value: 0 }, // Placeholder
        { label: 'Pending Kitchen Requisitions', value: 0 }, // Placeholder
        { label: 'Recent Warden Activity', value: 'Loading...' }, // Placeholder
        { label: 'Important Alerts', value: 0 } // Placeholder
      ]);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="panel" aria-label="Warden Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WARDEN</span>
          <h3>Warden Dashboard</h3>
          <p>Live operational dashboard showing key metrics and alerts</p>
        </div>
      </div>
      <div className="dashboard-loading">Loading dashboard data...</div>
    </div>;
  }

  if (error) {
    return <div className="panel" aria-label="Warden Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WARDEN</span>
          <h3>Warden Dashboard</h3>
          <p>Live operational dashboard showing key metrics and alerts</p>
        </div>
      </div>
      <div className="dashboard-error">{error}</div>
    </div>;
  }

  return (
    <div className="panel" aria-label="Warden Dashboard">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">WARDEN</span>
          <h3>Warden Dashboard</h3>
          <p>Live operational dashboard showing key metrics and alerts</p>
        </div>
      </div>
      <div className="warden-dashboard-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`warden-metric-card ${metric.status || ''}`}>
            <h4>{metric.label}</h4>
            <div className="warden-metric-value">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}