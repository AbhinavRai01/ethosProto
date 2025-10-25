import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPredictions } from '../api/flaskApis';
import { 
    getSwipesByEntityId, 
    getCCTVCapturesByEntityId, 
    getBookingsByEntityId, 
    getWifiLogsByEntityId, 
    getCheckoutsByEntityId 
} from '../api/userApi';


const fetchLastSeen = async (entityId) => {
    try {
        const [swipes, captures, bookings, logs, checkouts] = await Promise.all([
            getSwipesByEntityId(entityId),
            getCCTVCapturesByEntityId(entityId),
            getBookingsByEntityId(entityId),
            getWifiLogsByEntityId(entityId),
            getCheckoutsByEntityId(entityId)
        ]);

        const allEvents = [
            ...swipes.map(e => ({ ...e, location: e.location_id, eventType: 'Card Swipe' })),
            ...captures.map(e => ({ ...e, location: e.location_id, eventType: 'CCTV' })),
            ...bookings.map(e => ({ ...e, location: e.room_id, timestamp: e.start_time, eventType: 'Booking' })),
            ...logs.map(e => ({ ...e, location: `AP ${e.ap_id}`, eventType: 'WiFi Log' })),
            ...checkouts.map(e => ({ ...e, location: 'Library', book: e.book_id, eventType: 'Checkout' }))
        ];

        if (allEvents.length === 0) {
            return { location: 'No recent activity', date: 'N/A', time: '' };
        }

        allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const lastEvent = allEvents[0];
        const d = new Date(lastEvent.timestamp);
        
        return {
            location: lastEvent.location?.replace(/_/g, ' ') || 'Unknown',
            date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        };
    } catch (error) {
        console.error("Error fetching last seen data:", error);
        return { location: 'Error', date: 'Error', time: '' };
    }
};

const fetchExpectedLocation = async (entityId) => {
    try {
        const now = new Date();
        const dayOfWeek = now.getDay(); // This is the number (0-6) we need
        const currentHour = now.getHours();

        // 1. Call the API with the correct day index (number)
        const predictions = await fetchPredictions(entityId, dayOfWeek);

        // 2. Find the prediction for the current hour in the returned array
        if (Array.isArray(predictions)) {
            // Format the current hour to match the API response format (e.g., '09:00')
            const hourString = `${String(currentHour).padStart(2, '0')}:00`;
            
            const currentPrediction = predictions.find(p => p.Hour === hourString);

            if (currentPrediction) {
                return currentPrediction["Predicted Location"]?.replace(/_/g, ' ') || 'Unknown';
            }
        }
        return 'No prediction';

    } catch (error) {
        console.error("Error fetching prediction:", error);
        return 'Error';
    }
};

const MarkedUserCard = ({ user }) => {
    const [lastSeen, setLastSeen] = useState({ location: 'Loading...', date: '...', time: '...' });
    const [expected, setExpected] = useState('Loading...');

    useEffect(() => {
        fetchLastSeen(user.entity_id).then(setLastSeen);
        fetchExpectedLocation(user.entity_id).then(setExpected);
    }, [user.entity_id]);

    return (
        <Link
            to={`/user/${user.entity_id}`}
            className="w-full block p-4 bg-gray-800 rounded-lg border border-gray-700 transition-all duration-300 hover:border-gray-600 hover:bg-gray-700/50"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <img
                        src={user.imageUrl || 'https://placehold.co/64x64/4A5568/E2E8F0?text=...'}
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                        <h4 className="text-xl font-bold text-white">{user.name}</h4>
                        <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                    </div>
                </div>

                <div className="text-left">
                    <p className="text-xs text-purple-400 font-semibold">Last Seen:</p>
                    <p className="text-lg text-white font-bold">{lastSeen.location}</p>
                    <p className="text-xs text-gray-400">{lastSeen.date}{lastSeen.time ? ',' : ''}</p>
                    <p className="text-xs text-gray-400">{lastSeen.time}</p>
                </div>

                <div className="text-left">
                    <p className="text-xs text-purple-400 font-semibold">Expected Location:</p>
                    <p className="text-lg text-white font-bold">{expected}</p>
                    <p className="text-xs text-gray-400">Based on</p>
                    <p className="text-xs text-gray-400">predictive model</p>
                </div>
            </div>
        </Link>
    );
};

export default MarkedUserCard;

