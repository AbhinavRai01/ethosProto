import React, { useState, useCallback, useEffect } from "react";

// --- API Functions (Bundled) ---
const BASE_URL = 'http://localhost:5000/api/alerts';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// --- API Fetch Functions ---
export const fetchActiveAlerts = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/missing/active/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching active missing alerts:", error); throw error; }
};
export const fetchHighPriorityAlerts = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/missing/high/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching high priority alerts:", error); throw error; }
};
export const fetchDismissedAlerts = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/missing/dismissed/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching dismissed alerts:", error); throw error; }
};
export const dismissAlert = async (alertId) => {
  try { const response = await fetch(`${BASE_URL}/missing/${alertId}/dismiss`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } }); return await handleResponse(response); } catch (error) { console.error("Error dismissing alert:", error); throw error; }
};
export const fetchActiveOvercrowdAlerts = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/overcrowd/active/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching active overcrowd alerts:", error); throw error; }
};
export const fetchActiveViolationAlerts = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/violation/active/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching active violation alerts:", error); throw error; }
};
export const fetchAllAlertsSortedByScore = async (page = 1) => {
  try { const response = await fetch(`${BASE_URL}/all/sorted-by-score/${page}`); return await handleResponse(response); } catch (error) { console.error("Error fetching all alerts sorted by score:", error); throw error; }
};
export const fetchAlertScoreExtremes = async () => {
  try { const response = await fetch(`${BASE_URL}/extremes`); return await handleResponse(response); } catch (error) { console.error("Error fetching alert score extremes:", error); throw error; }
};

// --- Helper Components (Icons) ---
const AlertTriangleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>);
const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const CheckCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const ShieldAlertIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>);
const ChevronLeftIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>);
const ChevronRightIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>);
const TrendingUpIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const ClockSortIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);

// --- Normalization Logic ---
const normalizeScore = (score, extremes) => {
  if (score == null || extremes == null || extremes.lowest == null || extremes.highest == null) {
    return 'N/A';
  }

  const actualMinScore = extremes.lowest.risk_score ?? 0;
  const actualMaxScore = extremes.highest.risk_score ?? 100;
  const displayMin = 25;
  const displayMax = 100;

  if (actualMaxScore <= actualMinScore) {
    return score > actualMinScore ? displayMax : displayMin;
  }

  const clampedScore = Math.max(actualMinScore, Math.min(actualMaxScore, score));
  const normalized = ((clampedScore - actualMinScore) / (actualMaxScore - actualMinScore)) * (displayMax - displayMin) + displayMin;

  return Math.round(normalized);
};

// --- UPDATED: Integrated Recommendation Logic ---
/**
 * Generates a recommended action based on the alert data.
 * @param {object} alert - The alert object including alertType and normalizedScore.
 * @returns {string} - The recommended action text.
 */
const getRecommendation = (alert) => {
  const normalizedScore = alert.normalizedScore;
  const alertType = alert.alertType;

  // --- Missing Person Rules ---
  if (alertType === 'missing') {
    if (typeof normalizedScore === 'number') {
      if (normalizedScore >= 80) {
        return 'Dispatch security personnel.';
      } else if (normalizedScore >= 40) {
        return 'Make a phone call to the entity.';
      } else {
        return 'Send automated email notification.';
      }
    }
    return 'Review alert details and determine action.';
  }

  // --- Overcrowding Rules ---
  if (alertType === 'overcrowd') {
    return 'Dispatch security personnel to manage crowd.';
  }

  // --- Violation Rules ---
  if (alertType === 'violation') {
    return 'Make a phone call or investigate further; Grant access / Log violation.';
  }

  // Default fallback
  return 'Review alert details and determine action.';
};

// --- Main Dashboard Component ---
export default function AlertsDashboard() {
  const [view, setView] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortMethod, setSortMethod] = useState('time');
  const [stats, setStats] = useState({ active: 0, highPriority: 0, dismissed: 0, overcrowd: 0, violation: 0 });
  const [scoreExtremes, setScoreExtremes] = useState(null);

  // Fetch stats (counts)
const fetchStats = useCallback(async () => {
  try {
    const [activeData, highPriorityData, dismissedData, overcrowdData, violationData] = await Promise.all([
      fetchActiveAlerts(1), fetchHighPriorityAlerts(1), fetchDismissedAlerts(1),
      fetchActiveOvercrowdAlerts(1), fetchActiveViolationAlerts(1)
    ]);

    // --- ADD THIS LOG ---
    console.log("DEBUG: Data received for stats", {
      activeData,
      highPriorityData,
      dismissedData,
      overcrowdData,
      violationData
    });
    // -------------------

    const statsToSet = {
      active: activeData.totalAlerts,
      highPriority: highPriorityData.totalAlerts,
      dismissed: dismissedData.totalAlerts,
      overcrowd: overcrowdData.totalAlerts,
      violation: violationData.totalAlerts,
    };

    // --- AND ADD THIS LOG ---
    console.log("DEBUG: Setting stats to:", statsToSet);
    // ------------------------

    setStats(statsToSet);

  } catch (err) { 
    console.error("Error fetching stats:", err); 
  }
}, []);

  const fetchExtremes = useCallback(async () => {
    try {
      const extremesData = await fetchAlertScoreExtremes();
      setScoreExtremes(extremesData);
    } catch (err) {
      console.error("Error fetching score extremes:", err);
      setScoreExtremes({});
    }
  }, []);

  // Fetch the actual list of alerts
  const fetchAlertsList = useCallback(async (currentExtremes) => {
    if (currentExtremes === null) return;

    setLoading(true); setError(null);
    try {
      let fetchFn;
      switch (view) {
        case 'active': fetchFn = fetchActiveAlerts; break;
        case 'highPriority': fetchFn = fetchHighPriorityAlerts; break;
        case 'dismissed': fetchFn = fetchDismissedAlerts; break;
        case 'overcrowd': fetchFn = fetchActiveOvercrowdAlerts; break;
        case 'violation': fetchFn = fetchActiveViolationAlerts; break;
        case 'sortedByScore': fetchFn = fetchAllAlertsSortedByScore; break;
        default: fetchFn = fetchActiveAlerts;
      }
      const data = await fetchFn(page);

      const alertsWithDetails = data.alerts.map(a => {
        let typeKey = 'missing';
        if (data.alertType === 'overcrowd' || a.alertType === 'overcrowd') typeKey = 'overcrowd';
        else if (data.alertType === 'violation' || a.alertType === 'violation') typeKey = 'violation';
        else if (data.alertType === 'allActiveSorted' || data.alertType === 'highPriorityCombined') {
          if (a.population !== undefined) typeKey = 'overcrowd';
          else if (a.violation_type !== undefined) typeKey = 'violation';
        }

        const extremesForType = currentExtremes ? currentExtremes[typeKey] : null;

        return {
          ...a,
          alertType: typeKey,
          normalizedScore: normalizeScore(a.risk_score, extremesForType)
        };
      });

      setAlerts(alertsWithDetails);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(`Error fetching ${view} alerts:`, err);
      setError(`Failed to load ${view} alerts.`); setAlerts([]);
    } finally { setLoading(false); }
  }, [view, page]);

  useEffect(() => {
    fetchStats();
    fetchExtremes();
  }, [fetchStats, fetchExtremes]);

  useEffect(()=>{
    console.log(stats);
  },[stats])

  useEffect(() => {
    if (scoreExtremes !== null) {
      fetchAlertsList(scoreExtremes);
    }
  }, [view, page, fetchAlertsList, scoreExtremes]);

  const handleDismiss = async (alertId) => {
    if (!['active', 'highPriority', 'sortedByScore'].includes(view)) return;
    try {
      const alertToDismiss = alerts.find(a => a._id === alertId && a.alertType === 'missing');
      if (alertToDismiss) {
        await dismissAlert(alertId);
        fetchStats();
        fetchAlertsList(scoreExtremes);
      } else { console.warn("Dismiss action only available for Missing Person alerts."); }
    } catch (err) { console.error("Error dismissing alert:", err); setError("Failed to dismiss alert. Please try again."); }
  };

  const handleNextPage = () => { if (page < totalPages) setPage(p => p + 1); };
  const handlePrevPage = () => { if (page > 1) setPage(p => p - 1); };

  const showView = (newView) => {
    setView(newView); setPage(1); setAlerts([]);
    setSortMethod(newView === 'sortedByScore' ? 'score' : 'time');
  };

  const formatAlertDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTitle = () => {
    switch (view) {
      case 'active': return 'Active Missing Person Alerts';
      case 'highPriority': return 'High Priority Alerts (All Types)';
      case 'dismissed': return 'Dismissed Missing Person Log';
      case 'overcrowd': return 'Active Overcrowding Alerts';
      case 'violation': return 'Active Violation Alerts';
      case 'sortedByScore': return 'All Active Alerts (Sorted by Score)';
      default: return 'Alerts';
    }
  };

  const renderTableHeaders = () => {
    const missingHeaders = ["Student Name", "Last Known Location", "Time Since Last Seen", "Alert Generated", "Risk (25-100)", "Recommendation", "Actions"];
    const overcrowdHeaders = ["Location Name", "Population", "Priority", "Alert Timestamp", "Risk (25-100)", "Recommendation", "Actions"];
    const violationHeaders = ["Entity Name", "Location", "Violation Type", "Timestamp", "Risk (25-100)", "Recommendation", "Actions"];
    const sortedHeaders = ["Alert Type", "Identifier", "Location", "Timestamp", "Risk (25-100)", "Recommendation", "Actions"];

    let headers = [];
    if (view === 'active' || view === 'highPriority' || view === 'dismissed') {
      headers = [...missingHeaders];
      if (view === 'dismissed') {
        headers.splice(4, 1); headers.splice(4, 1);
      }
    } else if (view === 'overcrowd') {
      headers = [...overcrowdHeaders];
    } else if (view === 'violation') {
      headers = [...violationHeaders];
    } else if (view === 'sortedByScore') {
      headers = sortedHeaders;
    }

    return ( <tr> {headers.map((header) => (<th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{header}</th>))} </tr> );
  };

  const renderTableRows = () => {
    const colSpan = renderTableHeaders().props.children.length;
    if (loading) return <tr><td colSpan={colSpan} className="text-center p-8 text-gray-400">Loading alerts...</td></tr>;
    if (alerts.length === 0) return <tr><td colSpan={colSpan} className="text-center p-8 text-gray-400">No alerts found.</td></tr>;

    return alerts.map((alert) => {
      const recommendation = getRecommendation(alert);
      const normalizedDisplayScore = alert.normalizedScore;

      const scoreColorClass = normalizedDisplayScore >= 90 ? 'bg-red-900 bg-opacity-30' : normalizedDisplayScore >= 60 ? 'bg-yellow-900 bg-opacity-30' : '';
      const uniqueKey = `${alert.alertType}-${alert._id || alert.location_name || Date.now() + Math.random()}`;

      return (
        <tr key={uniqueKey} className={`hover:bg-gray-750 ${scoreColorClass}`}>
          {view === 'sortedByScore' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{alert.alertType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{alert.entity_name || alert.location_name || alert.entity_id || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.last_seen_location || alert.location_id || alert.location_name || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatAlertDate(alert.timestamp || alert.last_seen_timestamp || alert.updatedAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400">{normalizedDisplayScore}</td>
              <td className="px-6 py-4 text-sm text-gray-300">{recommendation}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {alert.alertType === 'missing' ? (<button onClick={() => handleDismiss(alert._id)} className="text-gray-400 hover:text-white">Dismiss</button>) : (<span className="text-gray-500">N/A</span>)}
              </td>
            </>
          )}
          {view === 'overcrowd' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{alert.location_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.population}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><span className={`capitalize px-2 py-1 rounded-full text-xs ${alert.priority === 'high' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{alert.priority || 'normal'}</span></td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatAlertDate(alert.timestamp)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400">{normalizedDisplayScore}</td>
              <td className="px-6 py-4 text-sm text-gray-300">{recommendation}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><span className="text-gray-500">N/A</span></td>
            </>
          )}
          {view === 'violation' && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{alert.entity_name || alert.entity_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.location_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.violation_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatAlertDate(alert.timestamp)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400">{normalizedDisplayScore}</td>
              <td className="px-6 py-4 text-sm text-gray-300">{recommendation}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><span className="text-gray-500">N/A</span></td>
            </>
          )}
          {(view === 'active' || view === 'highPriority' || view === 'dismissed') && (
            <>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{alert.entity_name || alert._id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{alert.last_seen_location}</td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${alert.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>{alert.time_since_last_seen || formatAlertDate(alert.last_seen_timestamp)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatAlertDate(alert.alert_generated_at || alert.createdAt)}</td>
              {view !== 'dismissed' && <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-400">{normalizedDisplayScore}</td>}
              {view !== 'dismissed' && <td className="px-6 py-4 text-sm text-gray-300">{recommendation}</td>}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {(view === 'active' || view === 'highPriority') ? (<button onClick={() => handleDismiss(alert._id)} className="text-gray-400 hover:text-white">Dismiss</button>)
                : view === 'dismissed' ? (<span className="text-gray-500 italic">Dismissed until {formatAlertDate(alert.dismissed_until)}</span>)
                : null}
              </td>
            </>
          )}
        </tr>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 px-[13%] p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">System Alerts</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard title="Active Missing" value={stats.active} icon={<ClockIcon />} onClick={() => showView('active')} isButton={true} isActive={view === 'active'} />
        <StatCard title="High Priority" value={stats.highPriority} icon={<AlertTriangleIcon />} valueColor="text-red-500" onClick={() => showView('highPriority')} isButton={true} isActive={view === 'highPriority'} />
        <StatCard title="Overcrowding" value={stats.overcrowd} icon={<UsersIcon />} valueColor="text-yellow-500" onClick={() => showView('overcrowd')} isButton={true} isActive={view === 'overcrowd'} />
        <StatCard title="Violations" value={stats.violation} icon={<ShieldAlertIcon />} valueColor="text-orange-500" onClick={() => showView('violation')} isButton={true} isActive={view === 'violation'} />
        <StatCard title="Dismissed Missing Log" value={stats.dismissed} icon={<CheckCircleIcon />} onClick={() => showView('dismissed')} isButton={true} isActive={view === 'dismissed'} />
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-xl font-semibold">{getTitle()}</h2>
          <div className="flex space-x-2">
            <button onClick={() => showView('sortedByScore')} className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'sortedByScore' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              <TrendingUpIcon /> <span>Sort By Score</span>
            </button>
            <button onClick={() => showView('active')} className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sortMethod === 'time' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              <ClockSortIcon /> <span>Sort By Time</span>
            </button>
          </div>
        </div>

        {error && <div className="p-6 text-red-400 bg-red-900 border border-red-700 rounded-md mx-6">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b border-gray-700">
              {renderTableHeaders()}
            </thead>
            <tbody className="divide-y divide-gray-700">
              {renderTableRows()}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-700">
          <button onClick={handlePrevPage} disabled={page === 1} className="flex items-center bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeftIcon /><span className="ml-2">Previous</span>
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={page === totalPages} className="flex items-center bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="mr-2">Next</span><ChevronRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, valueColor = "text-gray-100", onClick, isButton = false, isActive = false }) {
  const content = ( <> <div className="flex-shrink-0">{icon}</div> <div> <p className="text-sm font-medium text-gray-400">{title}</p> <p className={`text-3xl font-bold ${valueColor}`}>{value}</p> </div> </> );
  const activeClasses = isActive ? 'ring-2 ring-blue-500' : '';
  if (isButton) { return ( <button onClick={onClick} className={`bg-gray-800 rounded-lg p-6 flex items-center space-x-4 w-full text-left hover:bg-gray-700 transition-colors ${activeClasses}`}> {content} </button> ); }
  return ( <div className={`bg-gray-800 rounded-lg p-6 flex items-center space-x-4 ${activeClasses}`}> {content} </div> );
}