import { React, useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

const { getUserById, getSwipesByEntityId, getCCTVCapturesByEntityId, getBookingsByEntityId, getWifiLogsByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } = require('../api/userApi')

const StatusPill = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full inline-block";
    const statusClasses = {
        'Active': 'bg-green-500/30 text-green-300',
        'On Leave': 'bg-yellow-500/30 text-yellow-300',
        'Inactive': 'bg-red-500/30 text-red-300'
    };
    return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-500/30 text-gray-300'}`}>{status}</span>;
};

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

const UserDetails = ({ user, face }) => (
    <div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 flex items-center gap-6">
            <img 
                src={face?.image_path || 'https://placehold.co/100x100/2d3748/a0aec0?text=User'} 
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
                <DetailItem label="Student ID" value={user.student_id} />
                <DetailItem label="Department" value={user.department} />
                <DetailItem label="Email" value={user.email} />
                <DetailItem label="Device Hash" value={user.device_hash} />
            </div>
        </div>
    </div>
);

const DetailItem = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-400">{label}</p>
        <p className="text-base font-semibold text-white break-words">{value || 'N/A'}</p>
    </div>
);

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

const LocationTimeline = ({ events }) => {
    const [timeframe, setTimeframe] = useState('monthly'); // 'monthly' or 'weekly'
    const [viewDate, setViewDate] = useState(new Date('2025-09-01T00:00:00Z'));

    const getMonthName = (date) => date.toLocaleString('default', { month: 'long' });

    let filteredEvents = [];
    let labels = [];
    let totalDuration = 1;

    if (timeframe === 'monthly') {
        const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
        totalDuration = endOfMonth.getTime() - startOfMonth.getTime();
        
        filteredEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startOfMonth && eventDate <= endOfMonth;
        });

        // Generate labels for every 5 days
        const daysInMonth = endOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i += 5) {
            labels.push({ day: i, position: (i - 1) / (daysInMonth - 1) * 100 });
        }
    } else { // weekly
        const endOfWeek = new Date('2025-09-28T23:59:59Z');
        const startOfWeek = new Date('2025-09-22T00:00:00Z');
        totalDuration = endOfWeek.getTime() - startOfWeek.getTime();

        filteredEvents = events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });
        
        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        labels = weekDays.map((day, index) => ({ day, position: (index / 6) * 100 }));
    }

    const calculatePosition = (timestamp) => {
        const eventDate = new Date(timestamp);
        let start;
        if (timeframe === 'monthly') {
            start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        } else {
             start = new Date('2025-09-22T00:00:00Z');
        }
        return ((eventDate.getTime() - start.getTime()) / totalDuration) * 100;
    };
    
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-semibold text-white flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M21 21H3V3"/><path d="M12 12L3 20"/><path d="M18 6L3 21"/></svg>
                    Location Timeline
                </h4>
                <div className="flex items-center bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setTimeframe('monthly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${timeframe === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Monthly</button>
                    <button onClick={() => setTimeframe('weekly')} className={`px-3 py-1 text-sm font-semibold rounded-md transition ${timeframe === 'weekly' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Weekly</button>
                </div>
            </div>

            <div className="relative h-24">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-600"></div>
                <div className="relative w-full h-full">
                    {filteredEvents.map(event => (
                        <div key={event.id} className="group absolute top-1/2 -translate-y-1/2" style={{ left: `${calculatePosition(event.timestamp)}%` }}>
                            <div className="w-4 h-4 bg-gray-900 border-2 border-purple-500 rounded-full cursor-pointer"></div>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 border border-gray-600 rounded-lg text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <p className="font-bold text-white capitalize">{event.type.replace(/_/g, ' ')}</p>
                                <p className="text-gray-300">{event.details}</p>
                                <p className="text-gray-400 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute top-full left-0 w-full flex justify-between mt-2">
                    {labels.map(label => (
                        <span key={label.day} className="text-xs text-gray-400" style={{ position: 'absolute', left: `${label.position}%`, transform: 'translateX(-50%)' }}>
                            {label.day}
                        </span>
                    ))}
                </div>
            </div>
             <p className="text-center text-sm text-gray-400 mt-10">
                {timeframe === 'monthly' ? `Showing activity for ${getMonthName(viewDate)} 2025` : 'Showing activity for the last week of September'}
            </p>
        </div>
    );
};


// --- Main Page Component ---
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
                    getUserById(entityId),
                    getSwipesByEntityId(entityId),
                    getCCTVCapturesByEntityId(entityId),
                    getBookingsByEntityId(entityId),
                    getWifiLogsByEntityId(entityId),
                    getCheckoutsByEntityId(entityId),
                    getNotesByEntityId(entityId),
                    getFacesByEntityId(entityId),
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
            } catch (error) {
                console.error("Error fetching entity data:", error);
                setStatus('error');
            }
        };

        fetchAllData();
    }, [entityId]);

    // Process all fetched data into a unified timeline format
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
                            {/* The timeline is always visible below the tab content */}
                            {timelineEvents.length > 0 && <LocationTimeline events={timelineEvents} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

