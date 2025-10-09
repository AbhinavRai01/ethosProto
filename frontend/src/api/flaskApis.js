import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/';


const calculateDayOftheWeek = (dateString) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const [day, month, year] = dateString.split('-').map(Number);

    // Note: JavaScript months are 0-indexed (0 for January, 11 for December)
    const date = new Date(year, month - 1, day);

    return days[date.getDay()];
};
export const fetchPredictions = async (entityId, date) => {
    try {
        const response = await axios.post(`${API_URL}predict`, {
            entity_id: entityId,
            day: calculateDayOftheWeek(date)
        });

        console.log("Prediction successful:", response.data);
        return response.data;

    } catch (error) {
        console.error("Error fetching predictions:", error);
        return null;
    }
};

export const searchEntityByFaceImage = async (imageFile) => {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await axios.post(`${API_URL}search_by_face`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log("Face search successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching by face image:", error);
        return null;
    }
};