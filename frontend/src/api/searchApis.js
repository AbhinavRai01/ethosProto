import axios from "axios";

const API_URL = "http://localhost:3000/api/search";

export const searchEntityByName = async (query, page = 1) => {
    try {
        const response = await axios.get(`${API_URL}/name/${query}/${page}`);
        return response.data;
    } catch (error) {
        console.error("Error searching entities:", error);
        throw error;
    }
}

export const searchEntityByFaceId = async (faceId, page = 1) => {
    try {
        const response = await axios.get(`${API_URL}/face/${faceId}/${page}`);
        return response.data;
    } catch (error) {
        console.error("Error searching entity by face ID:", error);
        throw error;
    }
}

export const searchEntityByCardId = async (cardId, page = 1) => {
    try {
        const response = await axios.get(`${API_URL}/card/${cardId}/${page}`);
        return response.data;
    } catch (error) {
        console.error("Error searching entity by card ID:", error);
        throw error;
    }
}