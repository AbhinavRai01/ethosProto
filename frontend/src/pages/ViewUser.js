import { React, useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

const { getUserById, getSwipesByEntityId, getCCTVCapturesByEntityId, getBookingsByEntityId, getWifiLogsByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } = require('../api/userApi')
// --- End of Mock API ---

// --- Helper Components ---

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
                <p className="text-md text-gray-300 capitalize">{user.type}</p>
                <div className="mt-2">
                    <StatusPill status={user.status} />
                </div>
            </div>
        </div>

        <div className="mt-8">
            <h4 className="text-xl font-semibold text-white mb-4">Personal Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DetailItem label="Student ID" value={user.student_id} />
                <DetailItem label="Department" value={user.department} />
                <DetailItem label="Email" value={user.email} />
                <DetailItem label="Phone" value={user.phone} />
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

const GenericTable = ({ title, headers, data, renderRow, emptyText }) => {
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
}

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
    }, [entityId]);

    const renderContent = () => {
        switch (activeTab) {
            case 'details':
                return <UserDetails user={user} face={face} />;
            case 'swipes':
                return <GenericTable title="Card Swipes" headers={["Location", "Timestamp"]} data={swipes} emptyText="No card swipes found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ')}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'checkouts':
                 return <GenericTable title="Library Issues" headers={["Book ID", "Timestamp"]} data={checkouts} emptyText="No library checkouts found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.book_id}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'bookings':
                return <GenericTable title="Lab Sessions" headers={["Room ID", "Start Time", "End Time", "Attended"]} data={bookings} emptyText="No lab sessions or bookings found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white">{item.room_id}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.start_time).toLocaleString()}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.end_time).toLocaleString()}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${ item.attended ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300' }`}>{item.attended ? 'Yes' : 'No'}</span></td>
                    </tr>
                )} />;
            case 'cctv':
                return <GenericTable title="CCTV Captures" headers={["Location", "Timestamp"]} data={captures} emptyText="No CCTV captures found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50"><td className="px-6 py-4 text-white">{item.location_id?.replace(/_/g, ' ')}</td><td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td></tr>
                )} />;
            case 'wifi':
                return <GenericTable title="Wifi Logs" headers={["Device Hash", "AP ID", "Timestamp"]} data={logs} emptyText="No WiFi logs found." renderRow={(item) => (
                    <tr key={item._id} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white">{item.device_hash}</td>
                        <td className="px-6 py-4 text-gray-300">{item.ap_id}</td>
                        <td className="px-6 py-4 text-gray-300">{new Date(item.timestamp).toLocaleString()}</td>
                    </tr>
                )} />;
            case 'notes':
                return <GenericTable title="Notes" headers={["Category", "Text", "Timestamp"]} data={notes} emptyText="No notes found." renderRow={(item) => (
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
                 {/* Breadcrumbs */}
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
                        <div>{renderContent()}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

