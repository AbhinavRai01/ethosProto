import React, { useState } from 'react';
import axios from 'axios';

// --- API Service Logic (Integrated into this file) ---

// The base URL for your upload API endpoints.
const API_URL = 'http://localhost:3000/api/uploads';

/**
 * A generic helper function to upload a file to a specific endpoint.
 * @param {File} file - The file to be uploaded.
 * @param {string} endpoint - The specific API endpoint (e.g., '/swipes', '/bookings').
 * @returns {Promise<any>} The response data from the server.
 * @throws Will throw an error if the upload fails.
 */
const uploadFile = async (file, endpoint) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}${endpoint}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        console.log(`Successfully uploaded to ${endpoint}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};

// API functions for each model
const uploadCampusCardSwipes = (file) => uploadFile(file, '/swipes');
const uploadBookings = (file) => uploadFile(file, '/bookings');
const uploadCctvFrames = (file) => uploadFile(file, '/cctv');
const uploadLibraryCheckouts = (file) => uploadFile(file, '/library');
const uploadFreeTextNotes = (file) => uploadFile(file, '/notes');

// --- End of API Service Logic ---


// A mapping of upload types to their corresponding API functions and titles
const UPLOAD_CONFIG = {
    swipes: {
        title: 'Campus Card Swipes',
        apiFunc: uploadCampusCardSwipes,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    bookings: {
        title: 'Room Bookings',
        apiFunc: uploadBookings,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    cctv: {
        title: 'CCTV Frames',
        apiFunc: uploadCctvFrames,
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
    },
    library: {
        title: 'Library Checkouts',
        apiFunc: uploadLibraryCheckouts,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                <path d="M4 6h16v12H4z" />
                <path d="M4 6h16v12H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                <path d="M4 6h16v12H4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
            </svg>
        ),
    },
    notes: {
        title: 'Free Text Notes',
        apiFunc: uploadFreeTextNotes,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    },
};

// Reusable Upload Card Component
const UploadCard = ({ title, icon, apiFunc }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatus('idle');
    };

    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        try {
            const response = await apiFunc(file);
            setStatus('success');
            setMessage(`Success! ${response.insertedCount || 0} records uploaded.`);
        } catch (error) {
            setStatus('error');
            setMessage('Upload failed. Please check the console for details.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-4 mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-gray-800 text-white font-semibold rounded-lg shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {status === 'uploading' ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {status !== 'idle' && (
                <div className="mt-4 text-sm">
                    {status === 'success' && <p className="text-green-600 font-medium">{message}</p>}
                    {status === 'error' && <p className="text-red-600 font-medium">{message}</p>}
                </div>
            )}
        </div>
    );
};


// Main Page Component
export default function UploadPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-2xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">
                        Data Upload Center
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Upload Excel or CSV files to import data into the system.
                    </p>
                </header>
                <div className="space-y-6">
                    {Object.entries(UPLOAD_CONFIG).map(([key, config]) => (
                        <UploadCard
                            key={key}
                            title={config.title}
                            icon={config.icon}
                            apiFunc={config.apiFunc}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

