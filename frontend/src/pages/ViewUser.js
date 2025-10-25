import React, { useState, useEffect, useMemo } from 'react'; 
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage'; 

import { LocationTimeline } from '../components/LocationTimeline';
import { fetchPredictions } from '../api/flaskApis';
import PredictionsTimeline from '../components/PredictionsTimeline';
import { storage } from '../firebase/firebaseConfig';
import { useMarkedUsers } from '../contexts/MarkedUsersContext';
import { getUserById, getSwipesByEntityId, getCCTVCapturesByEntityId, getBookingsByEntityId, getWifiLogsByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } from '../api/userApi';

const TabButton = ({ name, activeTab, setActiveTab, children }) => (
    <button
        onClick={() => setActiveTab(name)}
        className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap ${
            activeTab === name ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const DetailItem = ({ label, value }) => (
    <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-white font-medium break-words">{value || 'N/A'}</p>
    </div>
);

const UserDetails = ({ user }) => {
    const [imageUrl, setImageUrl] = useState('');
    const { markUser, unmarkUser, isUserMarked } = useMarkedUsers();

    // Check if user is defined before checking if it's marked
    const isMarked = user ? isUserMarked(user.entity_id) : false;

    useEffect(() => {
        // Reset image URL when user changes
        setImageUrl('');
        if (user && user.face_id) {
             if (typeof user.face_id === 'string' && user.face_id.trim() !== '') {
                try {
                    const imageRef = ref(storage, `images/${user.face_id}.jpg`);
                    getDownloadURL(imageRef)
                        .then((url) => {
                            setImageUrl(url);
                        })
                        .catch((error) => {
                            console.error(`Error fetching image URL for face_id ${user.face_id}:`, error);
                            // Keep imageUrl empty or set a specific placeholder on error
                        });
                 } catch (refError) {
                      console.error("Error creating storage reference:", refError);
                 }
            } else {
                 // Log if face_id is present but invalid/empty
                 if (user.hasOwnProperty('face_id')) {
                    console.log("User has invalid or empty face_id:", user.face_id);
                 }
            }
        }
    }, [user]); // Dependency array includes user

    const handleMarkToggle = () => {
        if (!user) return; // Prevent action if user data isn't loaded
        if (isMarked) {
            unmarkUser(user.entity_id);
        } else {
            markUser({
                entity_id: user.entity_id,
                name: user.name,
                role: user.role,
                imageUrl: imageUrl // Use the state variable which might be empty or contain the URL
            });
        }
    };

    if (!user) {
        // Consistent loading message style
        return <div className="text-center text-gray-400 py-10">Loading user details...</div>;
    }

    return (
        <div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex flex-col sm:flex-row items-center gap-6">
                <img
                    src={imageUrl || 'https://placehold.co/96x96/4A5568/E2E8F0?text=No+Image'} // Updated placeholder text
                    alt={`Face of ${user.name}`}
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/96x96/4A5568/E2E8F0?text=Error'; }} // Added onerror fallback
                    className="rounded-full h-24 w-24 object-cover border-2 border-gray-600 flex-shrink-0"
                />
                <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-white">{user.name || 'Unknown User'}</h3>
                    <p className="text-md text-gray-300 capitalize">{user.role || 'Unknown Role'}</p>
                </div>
                <button
                    onClick={handleMarkToggle}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors w-full sm:w-auto mt-4 sm:mt-0 ${
                        isMarked
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                >
                    {isMarked ? 'Unmark User' : 'Mark this User'}
                </button>
            </div>

            <div className="mt-8">
                <h4 className="text-xl font-semibold text-white mb-4">Personal Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailItem label="Entity ID" value={user.entity_id} />
                    <DetailItem label="Department" value={user.department} />
                    <DetailItem label="Email" value={user.email} />
                    <DetailItem label="Device Hash" value={user.device_hash} />
                </div>
            </div>
        </div>
    );
};

const GenericTable = ({ headers, data, renderRow, emptyText }) => {
    if (!data || data.length === 0) return <p className="text-gray-400 text-center py-12">{emptyText}</p>;
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            {headers.map(header => (
                                <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider whitespace-nowrap">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {/* Ensure renderRow provides a unique key */}
                        {data.map((item, index) => renderRow(item, index))}
                    </tbody>
                </table>
             </div>
        </div>
    );
};

// --- Updated PredictionsComponent ---
const PredictionsComponent = ({ entityId }) => {
    const [selectedDate, setSelectedDate] = useState(() => {
        // Default to today's date in YYYY-MM-DD format, adjusted for local timezone
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localDate = new Date(today.getTime() - (offset*60*1000));
        return localDate.toISOString().split('T')[0];
    });
    const [predictionData, setPredictionData] = useState(null); // Will store the array [{Hour, Predicted Location, Confidence}]
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(''); // State to hold fetch errors

    // Function to calculate day of the week (0=Sun, 1=Mon, ..., 6=Sat) based on LOCAL date
    const calculateDayOftheWeek = (dateString) => {
        // Use local noon to avoid timezone shifts near midnight affecting the day calculation
        const date = new Date(`${dateString}T12:00:00`);
        return date.getDay();
    };


    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission
        if (!selectedDate || !entityId) {
            setError('Please select a date and ensure an entity ID is provided.');
            return;
        }
        setIsLoading(true);
        setPredictionData(null); // Clear previous predictions
        setError(''); // Clear previous errors
        try {
            const dayOfWeek = calculateDayOftheWeek(selectedDate);
            // Call the API with entityId and the calculated dayOfWeek (integer)
            const response = await fetchPredictions(entityId, dayOfWeek);
            if (response && Array.isArray(response)) {
                setPredictionData(response);
            } else {
                 // Handle cases where the response is not as expected
                 console.error("Invalid prediction data received:", response);
                 setError('Received invalid data format for predictions.');
                 setPredictionData([]); // Set to empty array to avoid errors in useMemo
            }
        } catch (fetchError) {
            console.error("Failed to fetch predictions:", fetchError);
            setError(`Failed to fetch predictions. ${fetchError.message || 'Check network or API.'}`);
            setPredictionData([]); // Ensure predictionData is an array even on error
        } finally {
            setIsLoading(false);
        }
    };

    // UseMemo to format data for the timeline component
    const timelineItems = useMemo(() => {
        // Ensure predictionData is an array before mapping
        if (!predictionData || !Array.isArray(predictionData)) return [];

        // Map the new data structure {Hour, Predicted Location, Confidence}
        return predictionData.map((item, index) => ({
            id: `${entityId}-${selectedDate}-${item.Hour || index}`, // Create a more unique key
            time: item.Hour || 'N/A', // Use Hour field
            location: item["Predicted Location"] || 'Unknown', // Access using bracket notation, provide fallback
            probability: parseFloat(item.Confidence)/100 || 'N/A' // Use the Confidence field
        }));
    }, [predictionData, entityId, selectedDate]); // Added dependencies for correctness

    return (
        <div className="pb-4 font-sans text-gray-100">
            <div className=" mx-auto bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-gray-50 mb-4">Get Daily Prediction</h2>
                <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
                    <label htmlFor="prediction-date" className="font-medium text-gray-300 shrink-0">
                        Select Date:
                    </label>
                    <input
                        type="date"
                        id="prediction-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        // Add constraints appropriate for your data if needed
                        // min="YYYY-MM-DD"
                        // max="YYYY-MM-DD"
                        required
                        className="p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none flex-grow"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0" // Use opacity for disabled state
                    >
                        {isLoading ? 'Fetching...' : 'Fetch Prediction'}
                    </button>
                </form>
                {/* Display fetch error messages */}
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </div>

            {/* Loading Indicator */}
            {isLoading && <p className="text-center text-gray-400 mt-8">Loading predictions...</p>}

             {/* Render timeline only if data exists, is not loading, and is not an empty array */}
            {!isLoading && predictionData && Array.isArray(predictionData) && predictionData.length > 0 && (
                <PredictionsTimeline items={timelineItems} />
            )}

            {/* Message when no data is available after fetch attempt (and no error occurred) */}
            {!isLoading && predictionData && Array.isArray(predictionData) && predictionData.length === 0 && !error && (
                 <p className="text-center text-gray-400 mt-8">No prediction data available for the selected date.</p>
            )}
             {/* Initial state message before first fetch */}
            {!isLoading && predictionData === null && !error && (
                 <p className="text-center text-gray-400 mt-8">Select a date and click 'Fetch Prediction' to view the schedule.</p>
            )}
        </div>
    );
};


export default function EntityProfilePage() {
    const { entityId } = useParams();
    const [user, setUser] = useState(null);
    const [swipes, setSwipes] = useState([]);
    const [captures, setCaptures] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [notes, setNotes] = useState([]);
    const [checkouts, setCheckouts] = useState([]);
    const [status, setStatus] = useState('loading');
    const [activeTab, setActiveTab] = useState('swipes'); // Default to a data tab
    const [timelineEvents, setTimelineEvents] = useState([]);

    // Removed alertMessage state and related logic

    useEffect(() => {
        if (!entityId) {
            setStatus('idle'); // Set status to idle if no entityId
            setUser(null); // Clear user data if entityId is missing
            // Clear other data states as well
            setSwipes([]);
            setCaptures([]);
            setBookings([]);
            setLogs([]);
            setCheckouts([]);
            setNotes([]);
            setTimelineEvents([]);
            return;
        }

        const fetchAllData = async () => {
            setStatus('loading');
            try {
                // Fetch only historical data here
                const [
                    userResponse, swipesResponse, capturesResponse, bookingsResponse,
                    logsResponse, checkoutsResponse, notesResponse,
                ] = await Promise.all([
                    getUserById(entityId), getSwipesByEntityId(entityId),
                    getCCTVCapturesByEntityId(entityId), getBookingsByEntityId(entityId),
                    getWifiLogsByEntityId(entityId), getCheckoutsByEntityId(entityId),
                    getNotesByEntityId(entityId),
                    // Removed face fetch as it's handled in UserDetails
                ]).catch(err => {
                     console.error("Error fetching one or more data sources:", err);
                     throw err; // Propagate the error to the outer catch block
                });

                setUser(userResponse?.results?.[0] || null);
                // Ensure arrays are initialized even if fetches return null/undefined
                setSwipes(swipesResponse || []);
                setCaptures(capturesResponse || []);
                setBookings(bookingsResponse || []);
                setLogs(logsResponse || []);
                setCheckouts(checkoutsResponse || []);
                setNotes(notesResponse || []);
                setStatus('success');

                // Removed prediction fetching and alert logic

            } catch (error) {
                console.error("Error fetching entity data:", error);
                setStatus('error'); // Set error status if any fetch fails
                setUser(null); // Clear user on error
            }
        };

        fetchAllData();
    }, [entityId]); // Rerun when entityId changes

    // Combine historical events for LocationTimeline
    useEffect(() => {
        const events = [];
        // Helper function to safely add events, adding checks for item properties
        const addEvents = (data, type, detailKey, timeKey) => {
            if (Array.isArray(data)) {
                 data.forEach((item, index) => {
                     if (!item) return; // Skip null/undefined items
                     // Use a combination of properties for a more unique key if _id is missing
                     const keySuffix = item._id || `${item[timeKey]}-${index}`;
                     const id = `${type.toLowerCase().replace(/\s+/g, '-')}-${keySuffix}`;
                     const timestamp = item[timeKey];
                     const details = item[detailKey];
                     // Only add if timestamp and details are valid
                     if (timestamp && details) {
                         // Check if timestamp is a valid date before pushing
                         const dateObj = new Date(timestamp);
                         if (!isNaN(dateObj.getTime())) {
                            events.push({ id, type, details, timestamp });
                         } else {
                            console.warn(`Invalid timestamp found for type ${type}:`, timestamp, item);
                         }
                     }
                 });
            }
        };

        addEvents(swipes, 'Card Swipe', 'location_id', 'timestamp');
        addEvents(captures, 'CCTV Capture', 'location_id', 'timestamp');
        addEvents(bookings, 'Room Booking', 'room_id', 'start_time'); // Use start_time for bookings
        addEvents(logs, 'WiFi Log', 'ap_id', 'timestamp'); // Use ap_id for details
        addEvents(checkouts, 'Library Checkout', 'book_id', 'timestamp');

        // Sort events safely
        try {
            // Filter again just in case invalid dates made it through
            const validEvents = events.filter(e => e.timestamp && !isNaN(new Date(e.timestamp).getTime()));
            validEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setTimelineEvents(validEvents);
        } catch (e) {
            console.error("Error sorting timeline events:", e);
            setTimelineEvents([]); // Reset on error
        }

    }, [swipes, captures, bookings, logs, checkouts]); // Dependencies include all data sources for the timeline

     // Define renderRow functions with unique keys and checks
     const renderSwipeRow = (item, index) => (
        <tr key={`swipe-${item._id || index}`} className="hover:bg-gray-700/50">
            <td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ') || 'N/A'}</td>
            <td className="px-6 py-4 text-gray-300">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
        </tr>
     );

     const renderCheckoutRow = (item, index) => (
         <tr key={`checkout-${item._id || index}`} className="hover:bg-gray-700/50">
             <td className="px-6 py-4 text-white">{item.book_id || 'N/A'}</td>
             <td className="px-6 py-4 text-gray-300">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
         </tr>
     );

      const renderBookingRow = (item, index) => (
          <tr key={`booking-${item._id || index}`} className="hover:bg-gray-700/50">
              <td className="px-6 py-4 text-white">{item.room_id || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.start_time ? new Date(item.start_time).toLocaleString() : 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.end_time ? new Date(item.end_time).toLocaleString() : 'N/A'}</td>
              <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ item.attended === 'YES' || item.attended === true ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300' }`}>{item.attended === 'YES' || item.attended === true ? 'Yes' : 'No'}</span></td>
          </tr>
      );

      const renderCctvRow = (item, index) => (
          <tr key={`cctv-${item._id || index}`} className="hover:bg-gray-700/50">
              <td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ') || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
          </tr>
      );

      const renderWifiRow = (item, index) => (
           <tr key={`wifi-${item._id || index}`} className="hover:bg-gray-700/50">
              <td className="px-6 py-4 text-white">{item.device_hash || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.ap_id || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
          </tr>
      );

      const renderNoteRow = (item, index) => (
          <tr key={`note-${item._id || index}`} className="hover:bg-gray-700/50">
              <td className="px-6 py-4 text-white">{item.category || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300 whitespace-normal">{item.text || 'N/A'}</td>
              <td className="px-6 py-4 text-gray-300">{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</td>
          </tr>
      );


    const renderContent = () => {
        switch (activeTab) {
            case 'swipes':
                return <GenericTable headers={["Location", "Timestamp"]} data={swipes} emptyText="No card swipes found." renderRow={renderSwipeRow} />;
            case 'checkouts':
                 return <GenericTable headers={["Book ID", "Timestamp"]} data={checkouts} emptyText="No library checkouts found." renderRow={renderCheckoutRow} />;
            case 'bookings':
                return <GenericTable headers={["Room ID", "Start Time", "End Time", "Attended"]} data={bookings} emptyText="No lab sessions or bookings found." renderRow={renderBookingRow} />;
            case 'cctv':
                return <GenericTable headers={["Location", "Timestamp"]} data={captures} emptyText="No CCTV captures found." renderRow={renderCctvRow} />;
            case 'wifi':
                return <GenericTable headers={["Device Hash", "AP ID", "Timestamp"]} data={logs} emptyText="No WiFi logs found." renderRow={renderWifiRow} />;
            case 'notes':
                return <GenericTable headers={["Category", "Text", "Timestamp"]} data={notes} emptyText="No notes found." renderRow={renderNoteRow} />;
            default:
                 // Fallback to swipes if tab is unknown
                 if (activeTab !== 'swipes') setActiveTab('swipes');
                 return <GenericTable headers={["Location", "Timestamp"]} data={swipes} emptyText="No card swipes found." renderRow={renderSwipeRow} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 md:p-12">
            <div className="w-full max-w-5xl mx-auto">
                 <div className="mb-6 text-sm text-gray-400">
                    <RouterLink to="/search" className="hover:text-white">Users</RouterLink>
                    <span className="mx-2">/</span>
                    <span>{user ? user.name : entityId}</span>
                </div>

                {/* Status Messages */}
                {status === 'loading' && <p className="text-center text-gray-400 pt-20">Fetching data... ⏳</p>}
                {status === 'error' && <p className="text-center text-red-400 pt-20">Could not fetch user data. Please try again later. 😥</p>}
                {status === 'success' && !user && <p className="text-center text-gray-400 pt-20">User not found.</p>}

                {/* Main Content Area: Render only when user data is successfully loaded */}
                {status === 'success' && user && (
                    <div>
                        {/* User Details Section - Always visible */}
                        <UserDetails user={user} />

                        {/* Tabs for Historical Data */}
                        <div className="border-b border-gray-700 my-8">
                            <nav className="flex space-x-2 overflow-x-auto pb-2 -mb-px">
                                {/* Removed 'Personal Details' tab from here */}
                                <TabButton name="swipes" activeTab={activeTab} setActiveTab={setActiveTab}>Card Swipes ({Array.isArray(swipes) ? swipes.length : 0})</TabButton>
                                <TabButton name="bookings" activeTab={activeTab} setActiveTab={setActiveTab}>Bookings ({Array.isArray(bookings) ? bookings.length : 0})</TabButton>
                                <TabButton name="cctv" activeTab={activeTab} setActiveTab={setActiveTab}>CCTV Captures ({Array.isArray(captures) ? captures.length : 0})</TabButton>
                                <TabButton name="wifi" activeTab={activeTab} setActiveTab={setActiveTab}>Wifi Logs ({Array.isArray(logs) ? logs.length : 0})</TabButton>
                                <TabButton name="checkouts" activeTab={activeTab} setActiveTab={setActiveTab}>Library Issues ({Array.isArray(checkouts) ? checkouts.length : 0})</TabButton>
                                <TabButton name="notes" activeTab={activeTab} setActiveTab={setActiveTab}>Notes ({Array.isArray(notes) ? notes.length : 0})</TabButton>
                            </nav>
                        </div>

                        {/* Content based on selected tab (Tables) */}
                        <div className="mb-12">
                            {renderContent()}
                        </div>

                        {/* Historical Timeline Section */}
                        <div className="mb-12">
                           <h4 className="text-xl font-semibold text-white mb-4">Historical Activity Timeline</h4>
                           {timelineEvents.length > 0
                               ? <LocationTimeline events={timelineEvents} />
                               : <p className="text-gray-400 text-center py-10">No historical events found.</p>
                           }
                        </div>

                        {/* Predictions Section */}
                        <div className="mt-12">
                           <h4 className="text-xl font-semibold text-white mb-4">Predicted Daily Schedule</h4>
                            <PredictionsComponent entityId={entityId} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

