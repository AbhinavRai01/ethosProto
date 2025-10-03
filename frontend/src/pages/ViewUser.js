import { React, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// --- Mock API Functions ---
// In a real application, these would be in a separate file (e.g., '../api/userApi.js')
// For this example, they are included here to resolve the import error.
import { getUserById, getSwipesByEntityId, getCCTVCapturesByEntityId, getBookingsByEntityId, getWifiLogsByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } from '../api/userApi';

export default function EntityProfilePage() {
    const { entityId } = useParams(); // Get entityId from URL

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

    useEffect(() => {
        if (!entityId) {
            setStatus('idle');
            return;
        }

        const fetchAllData = async () => {
            setStatus('loading');
            try {
                // Fetch all data in parallel for better performance
                const [
                    userResponse,
                    swipesResponse,
                    capturesResponse,
                    bookingsResponse,
                    logsResponse,
                    checkoutsResponse,
                    notesResponse,
                    faceResponse,
                ] = await Promise.all([
                    getUserById(entityId),
                    getSwipesByEntityId(entityId),
                    getCCTVCapturesByEntityId(entityId),
                    getBookingsByEntityId(entityId),
                    getWifiLogsByEntityId(entityId),
                    getCheckoutsByEntityId(entityId),
                    getNotesByEntityId(entityId),
                    getFacesByEntityId(entityId),
                ]);

                setUser(userResponse);
                setSwipes(swipesResponse);
                setCaptures(capturesResponse);
                setBookings(bookingsResponse);
                setLogs(logsResponse);
                setCheckouts(checkoutsResponse);
                setNotes(notesResponse);
                setFace(faceResponse[0] || null);
                setStatus('success');

            } catch (error) {
                console.error("Error fetching entity data:", error);
                setStatus('error');
            }
        };

        fetchAllData();
    }, [entityId]); // Re-run effect if entityId changes

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">
                        User Profile: <span className="text-indigo-600">{entityId}</span>
                    </h2>

                    {/* Data Display Area */}
                    <div className="mt-8 min-h-[400px]">
                        {status === 'loading' && <p className="text-center text-gray-500 pt-10">Fetching data... ⏳</p>}
                        {status === 'error' && <p className="text-center text-red-500 pt-10">Could not fetch user data. Please check the ID and try again. 😥</p>}
                        {status === 'success' && user && (
                            <div className="border border-gray-200 rounded-lg">
                                {/* Tab Navigation */}
                                <div className="flex border-b bg-gray-50/70 overflow-x-auto">
                                    <TabButton name="details" activeTab={activeTab} setActiveTab={setActiveTab}>User Details</TabButton>
                                    <TabButton name="swipes" activeTab={activeTab} setActiveTab={setActiveTab}>Swipes ({swipes.length})</TabButton>
                                    <TabButton name="bookings" activeTab={activeTab} setActiveTab={setActiveTab}>Bookings ({bookings.length})</TabButton>
                                    <TabButton name="cctv" activeTab={activeTab} setActiveTab={setActiveTab}>CCTV Captures ({captures.length})</TabButton>
                                    <TabButton name="wifi" activeTab={activeTab} setActiveTab={setActiveTab}>Wifi Logs ({logs.length})</TabButton>
                                    <TabButton name="checkouts" activeTab={activeTab} setActiveTab={setActiveTab}>Library Checkouts ({checkouts.length})</TabButton>
                                    <TabButton name="notes" activeTab={activeTab} setActiveTab={setActiveTab}>Notes ({notes.length})</TabButton>
                                </div>
                                
                                {/* Tab Content */}
                                <div className="p-6">
                                    {activeTab === 'details' && <UserDetails user={user} face={face} />}
                                    {activeTab === 'swipes' && <SwipesTable swipes={swipes} />}
                                    {activeTab === 'cctv' && <CapturesTable captures={captures} />}
                                    {activeTab === 'bookings' && <BookingsTable bookings={bookings} />}
                                    {activeTab === 'wifi' && <WifiLogsTable logs={logs} />}
                                    {activeTab === 'checkouts' && <CheckoutsTable checkouts={checkouts} />}
                                    {activeTab === 'notes' && <NotesTable notes={notes} />}
                                </div>
                            </div>
                        )}
                         {status === 'success' && !user && <p className="text-center text-gray-500 pt-10">User not found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---

const TabButton = ({ name, activeTab, setActiveTab, disabled = false, children }) => (
    <button
        onClick={() => !disabled && setActiveTab(name)}
        className={`px-4 py-3 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
            activeTab === name ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'text-gray-500 hover:bg-gray-100'
        } ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}`}
        disabled={disabled}
    >
        {children}
    </button>
);

const UserDetails = ({ user, face }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <DetailItem label="Name" value={user.name} />
            <DetailItem label="Entity ID" value={user.entity_id} />
            <DetailItem label="Student ID" value={user.student_id} />
            <DetailItem label="Department" value={user.department} />
            <DetailItem label="Email" value={user.email} />
            <DetailItem label="Role" value={user.role} highlight />
            <DetailItem label="Device Hash" value={user.device_hash} />
        </div>
        <div className="flex justify-center items-start pt-4 sm:pt-0">
            {face && face.image_path ? (
                <img 
                    src={`http://localhost:3000${face.image_path}`} 
                    alt={`Face of ${user.name}`}
                    className="rounded-lg shadow-md object-cover h-48 w-48"
                />
            ) : (
                <div className="h-48 w-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            )}
        </div>
    </div>
);

const DetailItem = ({ label, value, highlight = false }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-base font-semibold ${highlight ? 'text-indigo-600' : 'text-gray-800'} capitalize break-words`}>{value || 'N/A'}</p>
    </div>
);

const SwipesTable = ({ swipes }) => {
    if (!swipes || swipes.length === 0) return <p className="text-gray-500 text-center py-8">No swipe data found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {swipes.map((swipe) => (
                        <tr key={swipe._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{swipe.location_id?.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(swipe.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CapturesTable = ({ captures }) => {
    if (!captures || captures.length === 0) return <p className="text-gray-500 text-center py-8">No CCTV Captures found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {captures.map((capture) => (
                        <tr key={capture._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{capture.location_id?.replace(/_/g, ' ')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(capture.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const BookingsTable = ({ bookings }) => {
    if (!bookings || bookings.length === 0) return <p className="text-gray-500 text-center py-8">No bookings found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                        <tr key={booking._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.room_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.start_time).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.end_time).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ booking.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                                    {booking.attended ? 'Yes' : 'No'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const WifiLogsTable = ({ logs }) => {
    if (!logs || logs.length === 0) return <p className="text-gray-500 text-center py-8">No WiFi logs found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Hash</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AP ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                        <tr key={log._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.device_hash}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ap_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CheckoutsTable = ({ checkouts }) => {
    if (!checkouts || checkouts.length === 0) return <p className="text-gray-500 text-center py-8">No library checkouts found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {checkouts.map((checkout) => (
                        <tr key={checkout._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{checkout.book_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(checkout.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const NotesTable = ({ notes }) => {
    if (!notes || notes.length === 0) return <p className="text-gray-500 text-center py-8">No notes found for this user.</p>;
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {notes.map((note) => (
                        <tr key={note._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{note.category}</td>
                            <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{note.text}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(note.timestamp).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

