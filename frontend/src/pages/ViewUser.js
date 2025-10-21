import { React, useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { LocationTimeline } from '../components/LocationTimeline';
import { fetchPredictions } from '../api/flaskApis';
import PredictionsTimeline from '../components/PredictionsTimeline';
import { useMemo } from 'react';
import { getDownloadURL,ref,getStorage } from 'firebase/storage';
import { storage } from '../firebase/firebaseConfig';
const { getUserById, getSwipesByEntityId, getCCTVCapturesByEntityId, getBookingsByEntityId, getWifiLogsByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } = require('../api/userApi')

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

    useEffect(() => {
        if (user && user.face_id) {
            const imageRef = ref(storage, `images/${user.face_id}.jpg`);
            getDownloadURL(imageRef)
                .then((url) => {
                    setImageUrl(url);
                })
                .catch((error) => {
                    console.error("Error fetching image URL:", error);
                });
        }
    }, [user]);

    if (!user) {
        return <div>Loading user details...</div>;
    }

    return (
        <div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex items-center gap-6">
                <img 
                    src={imageUrl || 'https://placehold.co/96x96/4A5568/E2E8F0?text=...'} 
                    alt={`Face of ${user.name}`}
                    className="rounded-full h-24 w-24 object-cover border-2 border-gray-600"
                />
                <div>
                    <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                    <p className="text-md text-gray-300 capitalize">{user.role}</p>
                </div>
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
             <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800">
                    <tr>
                        {headers.map(header => (
                             <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {data.map(renderRow)}
                </tbody>
            </table>
        </div>
    );
};

const PredictionsComponent = ({ entityId }) => {
    const [selectedDate, setSelectedDate] = useState('2025-08-27');
    const [predictionData, setPredictionData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedDate) {
            return;
        }
        setIsLoading(true);
        setPredictionData(null);
        try {
            const [year, month, day] = selectedDate.split('-');
            const formattedDate = `${day}-${month}-${year}`;
            const response = await fetchPredictions(entityId, formattedDate);
            setPredictionData(response);
        } catch (error) {
            console.error("Failed to fetch predictions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const timelineItems = useMemo(() => {
        if (!predictionData) return [];
        const { time, location, probability } = predictionData;
        return Object.keys(time).map(key => ({
            id: key,
            time: time[key],
            location: location[key],
            probability: probability[key]
        }));
    }, [predictionData]);

    return (
        <div className="pb-4 font-sans text-gray-100"> 
            <div className=" mx-auto bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-semibold text-gray-50 mb-4">Get Daily Prediction</h2>
                <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                    <label htmlFor="prediction-date" className="font-medium text-gray-300">
                        Select Date:
                    </label>
                    <input
                        type="date"
                        id="prediction-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min="2025-08-27"
                        max="2025-09-27"
                        required
                        className="p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Fetching...' : 'Fetch Prediction'}
                    </button>
                </form>
            </div>
            {isLoading && <p className="text-center text-gray-400 mt-8">Loading...</p>}
            {predictionData && <PredictionsTimeline items={timelineItems} />}
        </div>
    );
};

const AlertBox = ({ message }) => (
    <div
        className="mt-6 flex items-center gap-4 rounded-lg bg-red-900/50 p-4 text-red-300 border border-red-700"
        role="alert"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <p className="font-semibold">{message}</p>
    </div>
);

export default function EntityProfilePage() {
    const { entityId } = useParams();
    const [user, setUser] = useState(null);
    const [swipes, setSwipes] = useState([]);
    const [captures, setCaptures] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [logs, setLogs] = useState([]);
    const [notes, setNotes] = useState([]);
    const [face, setFace] = useState(null);
    const [checkouts, setCheckouts] = useState([]);
    const [status, setStatus] = useState('loading');
    const [activeTab, setActiveTab] = useState('details');
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (!entityId) {
            setStatus('idle');
            return;
        }

        const fetchAllData = async () => {
            setStatus('loading');
            try {
                const [
                    userResponse, swipesResponse, capturesResponse, bookingsResponse,
                    logsResponse, checkoutsResponse, notesResponse, faceResponse,
                ] = await Promise.all([
                    getUserById(entityId), getSwipesByEntityId(entityId),
                    getCCTVCapturesByEntityId(entityId), getBookingsByEntityId(entityId),
                    getWifiLogsByEntityId(entityId), getCheckoutsByEntityId(entityId),
                    getNotesByEntityId(entityId), getFacesByEntityId(entityId),
                ]);

                setUser(userResponse.results[0] || null);
                setSwipes(swipesResponse);
                setCaptures(capturesResponse);
                setBookings(bookingsResponse);
                setLogs(logsResponse);
                setCheckouts(checkoutsResponse);
                setNotes(notesResponse);
                setFace(faceResponse[0] || null);
                setStatus('success');

                const lastDay = "25-09-2025";
                const response = await fetchPredictions(entityId, lastDay);
                const { probability, time } = response;
                const probKeys = Object.keys(probability);
                const last12Keys = probKeys.slice(-12);
                const probValues = last12Keys.map(key => probability[key]);
                const allLowProb = probValues.every(p => p < 0.5);
                
                if (allLowProb && last12Keys.length > 0) {
                    const startTime = time[last12Keys[0]];
                    const lastTimeKey = last12Keys[last12Keys.length - 1];
                    const endTimeHour = (parseInt(lastTimeKey) + 1) % 24;
                    const endTime = `${String(endTimeHour).padStart(2, '0')}:00`;
                    const uncertaintyPeriod = `${startTime} - ${endTime}`;
                    setAlertMessage(`Alert: Low prediction confidence for the period: ${uncertaintyPeriod}.`);
                } else {
                    setAlertMessage('');
                }

            } catch (error) {
                console.error("Error fetching entity data:", error);
                setStatus('error');
            }
        };

        fetchAllData();
    }, [entityId]);

    useEffect(() => {
        const events = [];
        swipes.forEach(s => events.push({ id: s._id, type: 'Card Swipe', details: s.location_id, timestamp: s.timestamp }));
        captures.forEach(c => events.push({ id: c._id, type: 'CCTV Capture', details: c.location_id, timestamp: c.timestamp }));
        bookings.forEach(b => events.push({ id: b._id, type: 'Room Booking', details: b.room_id, timestamp: b.start_time }));
        logs.forEach(l => events.push({ id: l._id, type: 'WiFi Log', details: `AP: ${l.ap_id}`, timestamp: l.timestamp }));
        checkouts.forEach(co => events.push({ id: co._id, type: 'Library Checkout', details: co.book_id, timestamp: co.timestamp }));
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setTimelineEvents(events);
    }, [swipes, captures, bookings, logs, checkouts, notes]);

    const renderContent = () => {
        switch (activeTab) {
            case 'details':
                return <UserDetails user={user} face={face} />;
            case 'swipes':
                return <GenericTable headers={["Location", "Timestamp"]} data={swipes} emptyText="No card swipes found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ')}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'checkouts':
                 return <GenericTable headers={["Book ID", "Timestamp"]} data={checkouts} emptyText="No library checkouts found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.book_id}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'bookings':
                return <GenericTable headers={["Room ID", "Start Time", "End Time", "Attended"]} data={bookings} emptyText="No lab sessions or bookings found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white">{item.room_id}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.start_time).toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.end_time).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ item.attended ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300' }`}>{item.attended ? 'Yes' : 'No'}</span></td>
                    </tr>
                )} />;
            case 'cctv':
                return <GenericTable headers={["Location", "Timestamp"]} data={captures} emptyText="No CCTV captures found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ')}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'wifi':
                return <GenericTable headers={["Device Hash", "AP ID", "Timestamp"]} data={logs} emptyText="No WiFi logs found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white">{item.device_hash}</td>
                        <td className="px-6 py-4 text-gray-300">{item.ap_id}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                )} />;
            case 'notes':
                return <GenericTable headers={["Category", "Text", "Timestamp"]} data={notes} emptyText="No notes found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white">{item.category}</td>
                        <td className="px-6 py-4 text-gray-300 whitespace-normal">{item.text}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                )} />;
            default:
                return null;
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

                {status === 'loading' && <p className="text-center text-gray-400 pt-20">Fetching data... ⏳</p>}
                {status === 'error' && <p className="text-center text-red-400 pt-20">Could not fetch user data. 😥</p>}
                {status === 'success' && !user && <p className="text-center text-gray-400 pt-20">User not found.</p>}
                
                {status === 'success' && user && (
                    <div>
                        <div className="border-b border-gray-700 mb-6">
                            <nav className="flex space-x-2 overflow-x-auto pb-2">
                                <TabButton name="details" activeTab={activeTab} setActiveTab={setActiveTab}>Personal Details</TabButton>
                                <TabButton name="swipes" activeTab={activeTab} setActiveTab={setActiveTab}>Card Swipes ({swipes.length})</TabButton>
                                <TabButton name="bookings" activeTab={activeTab} setActiveTab={setActiveTab}>Bookings ({bookings.length})</TabButton>
                                <TabButton name="cctv" activeTab={activeTab} setActiveTab={setActiveTab}>CCTV Captures ({captures.length})</TabButton>
                                <TabButton name="wifi" activeTab={activeTab} setActiveTab={setActiveTab}>Wifi Logs ({logs.length})</TabButton>
                                <TabButton name="checkouts" activeTab={activeTab} setActiveTab={setActiveTab}>Library Issues ({checkouts.length})</TabButton>
                                <TabButton name="notes" activeTab={activeTab} setActiveTab={setActiveTab}>Notes ({notes.length})</TabButton>
                            </nav>
                        </div>
                        <div>
                            {renderContent()}
                            {timelineEvents.length > 0 && <LocationTimeline events={timelineEvents} />}
                        </div>
                        {alertMessage && <AlertBox message={alertMessage} />}
                        <div className="mt-12">
                            <PredictionsComponent entityId={entityId} />
                            </div>
                    </div>
                )}
            </div>
        </div>
    );
}
