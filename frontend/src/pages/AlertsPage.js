// --- Helper Components (Icons) ---
import { useState,useCallback, useEffect } from "react";
import { fetchActiveAlerts,fetchDismissedAlerts,fetchHighPriorityAlerts,dismissAlert } from "../api/alertApis";
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// --- Main Dashboard Component ---

export default function AlertsDashboard() {
  const [view, setView] = useState('active'); // 'active', 'highPriority', or 'dismissed'
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({ active: 0, highPriority: 0, dismissed: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all stats for the top cards
  const fetchStats = useCallback(async () => {
    try {
      // We fetch page 1 just to get the total counts
      const activeData = await fetchActiveAlerts(1);
      const highPriorityData = await fetchHighPriorityAlerts(1);
      const dismissedData = await fetchDismissedAlerts(1);
      
      setStats({
        active: activeData.totalAlerts,
        highPriority: highPriorityData.totalAlerts,
        dismissed: dismissedData.totalAlerts,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to load dashboard stats.");
    }
  }, []);

  // Fetch the list of alerts (active or dismissed)
  const fetchAlertsList = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchFn;
      if (view === 'active') {
        fetchFn = fetchActiveAlerts;
      } else if (view === 'dismissed') {
        fetchFn = fetchDismissedAlerts;
      } else { // view === 'highPriority'
        fetchFn = fetchHighPriorityAlerts;
      }
      
      const data = await fetchFn(page);
      
      setAlerts(data.alerts);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(`Error fetching ${view} alerts:`, err);
      setError(`Failed to load ${view} alerts.`);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [view, page]);

  // Initial load: fetch stats and the first page of active alerts
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refetch alerts when view or page changes
  useEffect(() => {
    fetchAlertsList();
  }, [view, page, fetchAlertsList]);

  // Handle dismissing an alert
  const handleDismiss = async (alertId) => {
    try {
      await dismissAlert(alertId);
      // Refetch everything to update counts and lists
      fetchStats();
      fetchAlertsList();
    } catch (err) {
      console.error("Error dismissing alert:", err);
      setError("Failed to dismiss alert. Please try again.");
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  };

  // Toggle view
  const showView = (newView) => {
    setView(newView);
    setPage(1);
    setAlerts([]);
  };
  
  // Format the date
  const formatAlertDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get table title based on view
  const getTitle = () => {
    if (view === 'active') return 'Active Alerts';
    if (view === 'dismissed') return 'Dismissed Log';
    if (view === 'highPriority') return 'High Priority Alerts';
    return 'Alerts';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 px-[13%] p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">Unseen Alerts</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Active Unseen Alerts" 
          value={stats.active} 
          icon={<ClockIcon />} 
          onClick={() => showView('active')}
          isButton={true}
          isActive={view === 'active'}
        />
        <StatCard 
          title="High Priority" 
          value={stats.highPriority} 
          icon={<AlertTriangleIcon />} 
          valueColor="text-red-500" 
          onClick={() => showView('highPriority')}
          isButton={true}
          isActive={view === 'highPriority'}
        />
        <StatCard 
          title="Dismissed Today" 
          value={stats.dismissed} 
          icon={<CheckCircleIcon />} 
          onClick={() => showView('dismissed')}
          isButton={true}
          isActive={view === 'dismissed'}
        />

      </div>

      {/* Table Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-xl font-semibold">{getTitle()}</h2>
          <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600">
            Sort By: Time
          </button>
        </div>
        
        {error && <div className="p-6 text-red-400 bg-red-900 border border-red-700 rounded-md mx-6">{error}</div>}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Known Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time Since Last Seen</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Alert Generated</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-gray-400">Loading alerts...</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-gray-400">No alerts found.</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{alert.entity_name || alert._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.last_seen_location}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${alert.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
                      {formatAlertDate(alert.last_seen_timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatAlertDate(alert.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(view === 'active' || view === 'highPriority') && (
                        <button
                          onClick={() => handleDismiss(alert._id)}
                          className="text-gray-400 hover:text-white"
                        >
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className="flex items-center bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon />
            <span className="ml-2">Previous</span>
          </button>
          
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={page === totalPages}
            className="flex items-center bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-2">Next</span>
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Stat Card Component ---

function StatCard({ title, value, icon, valueColor = "text-gray-100", onClick, isButton = false, isActive = false }) {
  const content = (
    <>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      </div>
    </>
  );

  const activeClasses = isActive ? 'ring-2 ring-blue-500' : '';

  if (isButton) {
    return (
      <button
        onClick={onClick}
        className={`bg-gray-800 rounded-lg p-6 flex items-center space-x-4 w-full text-left hover:bg-gray-700 transition-colors ${activeClasses}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 flex items-center space-x-4 ${activeClasses}`}>
      {content}
    </div>
  );
}
