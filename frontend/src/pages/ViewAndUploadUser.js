import { React, useState } from 'react';
// This component correctly uses your actual API functions
import { uploadEntities, getSwipesByEntityId, getUserById, getCCTVCapturesByEntityId, getBookingsByEntityId } from '../api/userApi';

export default function ViewAndUploadUser() {
    // State for the search functionality
    const [userId, setUserId] = useState("");
    const [searchedUser, setSearchedUser] = useState(null);
    const [swipes, setSwipes] = useState([]);
    const [captures, setCaptures] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [searchStatus, setSearchStatus] = useState('idle');
    const [activeTab, setActiveTab] = useState('details');

    // State for the upload functionality
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadMessage, setUploadMessage] = useState('');

    const handleSearch = async () => {
        if (!userId) return;
        
        setSearchStatus('loading');
        setSearchedUser(null);
        setSwipes([]);
        setCaptures([]);
        setBookings([]);
        setActiveTab('details');

        try {
            const userResponse = await getUserById(userId);
            const swipesResponse = await getSwipesByEntityId(userId);
            const capturesResponse = await getCCTVCapturesByEntityId(userId);
            const bookingsResponse = await getBookingsByEntityId(userId); 

            setSearchedUser(userResponse);
            setSwipes(swipesResponse);
            setCaptures(capturesResponse);
            setBookings(bookingsResponse);
            setSearchStatus('success');
        } catch (error) {
            console.error("Error fetching user data:", error);
            setSearchStatus('error');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploadStatus('uploading');
        try {
            const response = await uploadEntities(selectedFile);
            setUploadStatus('success');
            setUploadMessage(response.message || 'File uploaded successfully!');
            setSelectedFile(null);
            document.getElementById('file-input').value = '';
        } catch (error) {
            setUploadStatus('error');
            setUploadMessage('Upload failed. Please try again.');
            console.error('Upload failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto space-y-8">
                {/* Upload Section */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">Upload Entities</h2>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input
                            type="file"
                            id="file-input"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploadStatus === 'uploading'}
                            className="w-full sm:w-auto flex-shrink-0 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload File'}
                        </button>
                    </div>
                    {uploadMessage && (
                        <p className={`mt-4 text-sm ${uploadStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {uploadMessage}
                        </p>
                    )}
                </div>

                {/* View User Section */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">View User Data</h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter Entity ID (e.g., F100000)"
                            className="flex-grow p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={searchStatus === 'loading' || !userId}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {searchStatus === 'loading' ? 'Searching...' : 'Get User'}
                        </button>
                    </div>

                    {/* Data Display Area */}
                    <div className="mt-8 min-h-[200px]">
                        {searchStatus === 'loading' && <p className="text-center text-gray-500 pt-10">Fetching data... ⏳</p>}
                        {searchStatus === 'error' && <p className="text-center text-red-500 pt-10">Could not fetch user data. Please check the ID and try again. 😥</p>}
                        {searchStatus === 'success' && searchedUser && (
                            <div className="border border-gray-200 rounded-lg">
                                {/* Tab Navigation */}
                                <div className="flex border-b bg-gray-50/70 overflow-x-auto">
                                    <TabButton name="details" activeTab={activeTab} setActiveTab={setActiveTab}>User Details</TabButton>
                                    <TabButton name="swipes" activeTab={activeTab} setActiveTab={setActiveTab}>Swipes ({swipes.length})</TabButton>
                                    <TabButton name="bookings" activeTab={activeTab} setActiveTab={setActiveTab}>Bookings ({bookings.length})</TabButton>
                                    <TabButton name="cctv" activeTab={activeTab} setActiveTab={setActiveTab}>CCTV Captures ({captures.length})</TabButton>
                                </div>
                                
                                {/* Tab Content */}
                                <div className="p-6">
                                    {activeTab === 'details' && <UserDetails user={searchedUser} />}
                                    {activeTab === 'swipes' && <SwipesTable swipes={swipes} />}
                                    {activeTab === 'cctv' && <CapturesTable captures={captures} />}
                                    {activeTab === 'bookings' && <BookingsTable bookings={bookings} />}
                                </div>
                            </div>
                        )}
                         {searchStatus === 'success' && !searchedUser && <p className="text-center text-gray-500 pt-10">User not found.</p>}
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

const UserDetails = ({ user }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <DetailItem label="Name" value={user.name} />
        <DetailItem label="Entity ID" value={user.entity_id} />
        <DetailItem label="Student ID" value={user.student_id} />
        <DetailItem label="Department" value={user.department} />
        <DetailItem label="Email" value={user.email} />
        <DetailItem label="Role" value={user.role} highlight />
    </div>
);

const DetailItem = ({ label, value, highlight = false }) => (
    <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-base font-semibold ${highlight ? 'text-indigo-600' : 'text-gray-800'} capitalize break-words`}>{value || 'N/A'}</p>
    </div>
);

const SwipesTable = ({ swipes }) => {
    if (!swipes || swipes.length === 0) {
        return <p className="text-gray-500 text-center py-8">No swipe data found for this user.</p>;
    }
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
    if (!captures || captures.length === 0) {
        return <p className="text-gray-500 text-center py-8">No CCTV Captures found for this user.</p>;
    }
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

// --- MODIFIED BookingsTable Component ---
const BookingsTable = ({ bookings }) => {
    if (!bookings || bookings.length === 0) {
        return <p className="text-gray-500 text-center py-8">No bookings found for this user.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                        {/* CHANGE 1: Added the "Attendance" column header */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                        <tr key={booking._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.room_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.start_time).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.end_time).toLocaleString()}</td>
                            {/* CHANGE 2: Added the "Attendance" data cell with conditional rendering */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    booking.attended ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
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

