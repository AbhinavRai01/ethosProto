import axios from 'axios';

// The base URL for your upload API endpoints.
// Adjust this to your actual server URL in a production environment.
const API_URL = 'http://localhost:5000/api/uploads';

/**
 * A generic helper function to upload a file to a specific endpoint.
 * @param {File} file - The file to be uploaded.
 * @param {string} endpoint - The specific API endpoint (e.g., '/swipes', '/bookings').
 * @returns {Promise<any>} The response data from the server.
 * @throws Will throw an error if the upload fails.
 */
const uploadFile = async (file, endpoint) => {
    const formData = new FormData();
    // The key 'file' must match the one used in the multer middleware on the backend.
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_URL}${endpoint}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log(`Successfully uploaded to ${endpoint}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};

// --- Exported API functions for each model ---

// 1. Upload Campus Card Swipes
export const uploadCampusCardSwipes = (file) => {
    return uploadFile(file, '/swipes');
};

// 2. Upload Bookings
export const uploadBookings = (file) => {
    return uploadFile(file, '/bookings');
};

// 3. Upload CCTV Frames
export const uploadCctvFrames = (file) => {
    return uploadFile(file, '/cctv');
};

// 4. Upload Library Checkouts
export const uploadLibraryCheckouts = (file) => {
    return uploadFile(file, '/library');
};

// 5. Upload Free Text Notes
export const uploadFreeTextNotes = (file) => {
    return uploadFile(file, '/notes');
};

