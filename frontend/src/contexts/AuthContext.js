import React, { createContext, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginDo } from '../api/otherApis';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('site_token') || null);

    const login = useCallback(async (username, password) => {
        try {
            console.log("Logging");
            const response = await loginDo(username, password);

            console.log("Received response from API:", response);

            if (response && response.token) {
                console.log("Login successful, token received.");
                setToken(response.token);
                setUser(response.user);
                localStorage.setItem('site_token', response.token);
                navigate('/');
            } else {
                throw new Error('Login failed: The server response did not include a token.');
            }
        } catch (error) {
            console.error("An error occurred during the login API call:", error);
            throw error;
        }
    }, [navigate]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('site_token');
        navigate('/login');
    }, [navigate]);

    const value = {
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

