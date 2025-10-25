import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/';


const calculateDayOftheWeek = (dateString) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const [day, month, year] = dateString.split('-').map(Number);

    // Note: JavaScript months are 0-indexed (0 for January, 11 for December)
    const date = new Date(year, month - 1, day);

    return days[date.getDay()];
};

const calculateDayIndex = (dateObject) => {
    // If the input is already a Date object, just call getDay() on it.
    return dateObject.getDay();
};


export const fetchPredictions = async (entityId, dayIndex) => {
    try {
        const response = await axios.post(`${API_URL}predict`, {
            entity_id: entityId,
            day: dayIndex,
        });
        console.log("Prediction successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching predictions:", error);
        return null;
    }
};

export const fetchLocationDensity = async (dayofWeek) => {
    try {
        const response = await axios.post(`${API_URL}locations`, {
            day_of_week: dayofWeek
        });
        console.log("Location density fetch successful:", response.data);
        return response.data;
    } catch(error) {
        console.error("Error fetching location density:", error);
        return null;
    }
}

export const fetchDepartmentDensity = async (dayofWeek, department) => {
    try {
        const response = await axios.post(`${API_URL}locations`, {
            day_of_week: dayofWeek,
            department: department
        });
        console.log("Location density by department fetch successful:", response.data);
        return response.data;
    } catch(error) {
        console.error("Error fetching location density by department:", error);
        return null;
    }
}
export const searchEntityByFaceImage = async (imageFile) => {
    try {

        if (!imageFile) {
            console.error("No image file provided");
            return null;
        }

        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await axios.post(`${API_URL}image-search`, formData);
        console.log("Face search successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error searching by face image:", error);
        return null;
    }
};