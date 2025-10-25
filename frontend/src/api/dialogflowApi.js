import axios from 'axios';
import { useEffect } from 'react';
import { searchEntityByName, searchEntityByFaceId} from './searchApis';
import { getUserById } from './userApi';
import { fetchPredictions } from './flaskApis';
import {Link} from "react-router-dom";

const DIALOGFLOW_API_URL = 'http://localhost:5000/api/dialogflow/query';


export const NameSearchResults = ({ results }) => {
    useEffect(() => {
        console.log("NameSearchResults received results:", results);
    }, [results]);
    
    if (!results || !results.results || results.results.length === 0) {
        return <p className="text-sm text-gray-300">No users found matching your query.</p>;
    }
    return (
        <div className="space-y-3">
            <p className="font-bold text-white mb-2">Found {results.totalResults} matching users:</p>
            <ul className="divide-y divide-purple-500/20">
                {results.results.map(user => (
                    <Link to={`/user/${user.entity_id}`} key={user.entity_id}>
                    <li key={user.id} className="py-3">
                        <p className="font-semibold text-purple-400">{user.name}</p>
                        <p className="text-xs text-gray-400">ID: {user.entity_id} | Type: {user.role}</p>
                    </li>
                    </Link>
                ))}
            </ul>
             <Link
                to="/user"
                className="block w-full text-center bg-purple-600/30 text-purple-300 font-semibold py-2 px-4 rounded-lg hover:bg-purple-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors mt-4"
            >
                View All Search Results
            </Link>
        </div>
    );
};

export const FaceIdSearchResult = ({ result }) => {
    if (!result.result || !result.result.name) {
        return <p className="text-sm text-gray-300">No user found for that Face ID.</p>;
    }
    const user = result.result;
    return (
        <div className="space-y-3 text-center p-2 bg-gray-800/50 rounded-lg">
            <p className="font-bold text-white text-sm">Found User for Face ID</p>
            <Link to={`/user/${user.entity_id}`}>
            <img src={user.imageUrl} onError={(e) => e.target.src='https://placehold.co/400x400/2d3748/e2e8f0?text=Image+Error'} alt={user.name} className="w-20 h-20 object-cover rounded-full mx-auto ring-2 ring-purple-500 ring-offset-4 ring-offset-gray-700"/>
            <div className="pt-2">
                <p className="font-semibold text-purple-300 text-lg leading-tight">{user.name}</p>
                <p className="text-sm text-gray-400">{user.entity_id}</p>
                <p className="text-xs text-gray-500 bg-gray-900/50 rounded-full px-2 py-0.5 inline-block mt-1">{user.role}</p>
            </div>
            </Link>
        </div>
    );
};

export const IdSearchResult = ({ result }) => {
    const { result: user, idType } = result;
    if (!user || !user.name) {
        return <p className="text-sm text-gray-300">No user found for that {idType}.</p>;
    }
    return (
         <div className="space-y-3 text-center p-2 bg-gray-800/50 rounded-lg">
            <p className="font-bold text-white pb-4 text-sm">Found User for {idType}</p>
            <Link to={`/user/${user.entity_id}`}>
            <img src={"https://imgs.search.brave.com/6a4g3zdS7joqe94_dxRALe339M7G6VmnlEauFC57oyU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4t/aWNvbnMtcG5nLmZs/YXRpY29uLmNvbS8x/MjgvMTc3MDEvMTc3/MDEyODYucG5n"} alt={user.name} className="w-20 h-20 object-cover rounded-full mx-auto ring-2 ring-purple-500 ring-offset-4 ring-offset-gray-700"/>
            <div className="pt-2">
                <p className="font-semibold text-purple-300 text-lg leading-tight">{user.name}</p>
                <p className="text-sm text-gray-400">{user.entity_id}</p>
                <p className="text-xs text-gray-500 bg-gray-900/50 rounded-full px-2 py-0.5 inline-block mt-1">{user.role}</p>
            </div>
            </Link>
        </div>
    );
};


export const TimelineResults = ({ results, Hour }) => {
    if (!results || !Array.isArray(results) || results.length === 0) {
        return <p className="text-sm text-gray-300">No timeline data found.</p>;
    }
    if (typeof Hour !== 'string' || !Hour.includes(':')) {
        return <p className="text-sm text-center text-gray-300 p-3 bg-red-800/50 rounded-lg">Error: Invalid time data received.</p>;
    }
    
    const eventsArray = results;

    const [targetHour] = Hour.split(':').map(Number);
    const specificEvent = eventsArray.find(event => {
        const [eventHour] = event.Hour.split(':').map(Number);
        return eventHour === targetHour;
    });
    const formatDisplayTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedHours = h % 12 || 12;
        const formattedMinutes = m < 10 ? `0${m}` : m;
        return `${formattedHours}:${formattedMinutes} ${ampm}`;
    };
    return (
        <div className="space-y-3">
            {specificEvent ? (
                <div className="p-3 bg-purple-900/50 border border-purple-500 rounded-lg text-center">
                    <p className="font-bold text-white text-sm mb-1">Expected Location at {formatDisplayTime(Hour)}:</p>
                    <p className="font-semibold text-purple-300 text-lg">{specificEvent["Predicted Location"]}</p>
                    <p className="text-xs text-gray-300">({specificEvent.Hour})</p>
                </div>
            ) : (
                 <p className="text-sm text-center text-gray-300 p-3 bg-gray-800/50 rounded-lg">No event found for the specified Hour.</p>
            )}
            <p className="font-bold text-white text-sm pt-2 border-t border-purple-500/20">Full Day Timeline:</p>
            <div className="flex text-xs font-semibold text-gray-400 px-2 pb-1">
                <div className="w-1F/4">Time</div>
                <div className="w-2/4">Location</div>
                <div className="w-1/4 text-right">Confidence</div>
            </div>
            <div className="space-y-1 text-sm max-h-60 overflow-y-auto pr-2">
                {eventsArray.map((event, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-800/50 rounded-md">
                        <div className="w-1/4 text-gray-300">{event.Hour}</div>
                        <div className="w-2/4 font-medium text-purple-400">{event["Predicted Location"]}</div>
                        <div className="w-1/4 text-right text-gray-400 text-xs">{event.Confidence}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GenerateTimelineResult = ({ results, date }) => {
    if (!results || !Array.isArray(results) || results.length === 0) {
        return <p className="text-sm text-gray-300">No timeline data to generate.</p>;
    }

    const eventsArray = results;

    return (
        <div className="space-y-3">
            <p className="font-bold text-white text-center text-md pb-2 border-b border-purple-500/20">
                Generated Timeline for <br/> {date}
            </p>
            
            <div className="flex text-xs font-semibold text-gray-400 px-2 pb-1">
                <div className="w-1/4">Time</div>
                <div className="w-2/4">Location</div>
                <div className="w-1/4 text-right">Confidence</div>
            </div>

            <div className="space-y-1 text-sm max-h-72 overflow-y-auto pr-2">
                {eventsArray.map((event, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-800/50 rounded-md">
                        <div className="w-1/4 text-gray-300">{event.Hour}</div>
                        <div className="w-2/4 font-medium text-purple-400">{event["Predicted Location"]}</div>
                        <div className="w-1/4 text-right text-gray-400 text-xs">{event.Confidence}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getDayIndexFromString = (dateString) => {
    const date = new Date(`${dateString}T12:00:00`);
    return date.getDay();
};
// --- Main API Call Function ---
export const sendDialogflowQuery = async (query) => {
    try {
        const response = await axios.post(DIALOGFLOW_API_URL, { "userQuery": query });
        
        console.log("Raw Dialogflow response.data:", response.data);
        const data = JSON.parse(response.data);
        console.log("Parsed Dialogflow data:", data);

        switch (data.operation) {
            case "1": {
                const results = await searchEntityByName(data.username);
                console.log("Name search results (from searchEntityByName):", results);
                return { type: 'name_search', content: results };
            }
            case "2": {
                const date_time = new Date(data.date_time);
                const date = date_time.toISOString().split('T')[0];
                const Hour = date_time.toTimeString().split(' ')[0];
                const entityId = 'E' + data.entity_id;
                const results = await fetchPredictions(entityId, getDayIndexFromString(date));
                console.log("Timeline results (from fetchPredictions):", results);
                return { type: 'timeline', content: { results, Hour } };
            }
             case "3": { // get_faceid
                const results = await searchEntityByFaceId('F' + data.face_id);
                console.log("Face ID search results:", results);
                const userResult = results.results && results.results.length > 0 ? results.results[0] : null;
                return { type: 'faceid_search', content: { result: userResult } };
            }
            case "4": { // get_entityid
                const results = await getUserById('E' + data.entity_id);
                console.log("Entity ID search results:", results);
                const userResult = results.results && results.results.length > 0 ? results.results[0] : null;
                return { type: 'id_search', content: { result: userResult, idType: 'Entity ID' } };
            }
            case "5": { // generate_timeline
                 const date_time = new Date(data.date);
                 const date = date_time.toISOString().split('T')[0];
                 const time = "00:00:00"; // Default to start of day if no time given
                 const entityId = 'E' + data.entity_id;
                 const results = await fetchPredictions(entityId, getDayIndexFromString(date));
                 console.log("Generate timeline results (from fetchPredictions):", results);
                 return { type: 'generate_timeline', content: { results, date } };
            }
            default:
                console.warn("Unknown Dialogflow operation:", data.operation);
                return { type: 'text', content: "Sorry, I couldn't process that request." };
        }
    } catch (error) {
        console.error("Error sending query to Dialogflow API:", error);
        return { type: 'error', content: 'There was an error connecting to the NLU service.' };
    }
};

