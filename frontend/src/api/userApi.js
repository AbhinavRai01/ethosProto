import axios from 'axios';
const API_URL = 'http://localhost:3000/api/users'; // Adjust the URL as needed

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
        return response.data;
    } catch (error) {
        console.error('Error fetching swipes by entity ID:', error);
        throw error;
    }
};



