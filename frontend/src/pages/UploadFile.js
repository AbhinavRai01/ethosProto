import React, { useState } from 'react';
import axios from 'axios';
import { uploadZippedImages } from '../firebase/firebaseApis';
import { storage } from '../firebase/firebaseConfig';

const API_URL = 'http://localhost:5000/api/uploads';

const uploadFile = async (file, endpoint) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}${endpoint}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};

const uploadCampusCardSwipes = (file) => uploadFile(file, '/swipes');
const uploadBookings = (file) => uploadFile(file, '/bookings');
const uploadCctvFrames = (file) => uploadFile(file, '/cctv');
const uploadLibraryCheckouts = (file) => uploadFile(file, '/library');
const uploadFreeTextNotes = (file) => uploadFile(file, '/notes');
const uploadWifiLogs = (file) => uploadFile(file, '/wifi');
const uploadFaceImages = (file) =>{console.log("reached 1"); uploadZippedImages({zipFile: file,storage}) }// New API function for face images
const uploadFaceEmbeddings = (file) => uploadFile(file, '/embeddings');

const UPLOAD_CONFIG = {
    swipes: {
        title: 'Campus Card Swipes',
        apiFunc: uploadCampusCardSwipes,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    bookings: {
        title: 'Room Bookings',
        apiFunc: uploadBookings,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    cctv: {
        title: 'CCTV Frames',
        apiFunc: uploadCctvFrames,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    library: {
        title: 'Library Checkouts',
        apiFunc: uploadLibraryCheckouts,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" /><path d="M4 6h16v12H4z" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    notes: {
        title: 'Free Text Notes',
        apiFunc: uploadFreeTextNotes,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    wifi: {
        title: 'WiFi Association Logs',
        apiFunc: uploadWifiLogs,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.556A5.5 5.5 0 0112 15a5.5 5.5 0 013.889 1.556M12 12v.01m-3.111 2.944a8.5 8.5 0 016.222 0M4.889 10.444a11.5 11.5 0 0114.222 0" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
    faces: {
        title: 'Face Images (ZIP)',
        apiFunc: uploadFaceImages,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg> ),
        accept: '.zip',
    },
    embeddings: {
        title: 'Face Embeddings',
        apiFunc: uploadFaceEmbeddings,
        icon: ( <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5-2.98-.566M17.657 18.657A8 8 0 016.343 7.343m11.314 11.314a8 8 0 00-11.314-11.314" /></svg> ),
        accept: '.csv, .xlsx, .xls',
    },
};

const UploadCard = ({ title, icon, apiFunc, accept }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
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
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
                {icon}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 cursor-pointer"
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    className="w-full sm:w-auto flex-shrink-0 px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    {status === 'uploading' ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {status !== 'idle' && (
                <div className="mt-4 text-sm">
                    {status === 'success' && <p className="text-green-400 font-medium">{message}</p>}
                    {status === 'error' && <p className="text-red-400 font-medium">{message}</p>}
                </div>
            )}
        </div>
    );
};

export default function UploadPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 sm:p-8 md:p-12">
            <div className="w-full max-w-3xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-white">Data Upload Center</h1>
                    <p className="mt-2 text-lg text-gray-400">Upload data files to import them into the system.</p>
                </header>
                <div className="space-y-6">
                    {Object.entries(UPLOAD_CONFIG).map(([key, config]) => (
                        <UploadCard
                            key={key}
                            title={config.title}
                            icon={config.icon}
                            apiFunc={config.apiFunc}
                            accept={config.accept}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

