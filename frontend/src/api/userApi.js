import axios from 'axios';
const API_URL = 'http://localhost:5000/api/users'; // Adjust the URL as needed

// Function to upload an Excel file
export const uploadEntities = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading entities:', error);
        throw error;
    }
};

export const getUserById = async (userId) => {
    try {

        console.log("Fetching user with ID:", userId);
        
        const response = await axios.get(`${API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error;
    }
};

export const getSwipesByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/swipes`);
        //console.log("Swipes response:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching swipes by entity ID:', error);
        throw error;
    }
};

export const getCCTVCapturesByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/captures`);
        //console.log("CCTV captures response:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching CCTV captures by entity ID:', error);
        throw error;
    }
};

export const getBookingsByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/bookings`);
        //console.log("Bookings response", response.data);
        return response.data;
    } catch(error) {
        console.error('Error fetching Bookings', error);
        throw error;
    }
};

export const getWifiLogsByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/device`);
        //console.log("Device response", response.data);
        return response.data;
    } catch(error) {
        console.error('Error fetching Wifi Logs', error);
        throw error;
    }
};

export const getCheckoutsByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/checkouts`);
        //console.log("Checkouts response", response.data);
        return response.data;
    } catch(error) {
        console.error('Error fetching Checkouts', error);
        throw error;
    }
};

export const getNotesByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/notes`);
        //console.log("Notes response", response.data);
        return response.data;
    } catch(error) {
        console.error('Error fetching Notes', error);
        throw error;
    }
};

export const getFacesByEntityId = async (entityId) => {
    try {
        const response = await axios.get(`${API_URL}/${entityId}/face`);
        //console.log("Face response", response.data);
        return response.data;
    } catch(error) {
        console.error('Error fetching Face image', error);
        throw error;
    }
};





