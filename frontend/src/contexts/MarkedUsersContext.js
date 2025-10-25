import React, { createContext, useState, useContext, useEffect } from 'react';

const MarkedUsersContext = createContext();

export const useMarkedUsers = () => useContext(MarkedUsersContext);

export const MarkedUsersProvider = ({ children }) => {
    const [markedUsers, setMarkedUsers] = useState(() => {
        try {
            const item = window.localStorage.getItem('markedUsers');
            return item ? JSON.parse(item) : [];
        } catch (error) {
            console.error(error);
            return [];
        }
    });

    useEffect(() => {
        window.localStorage.setItem('markedUsers', JSON.stringify(markedUsers));
    }, [markedUsers]);

    const markUser = (user) => {
        setMarkedUsers((prevUsers) => {
            if (prevUsers.find(u => u.entity_id === user.entity_id)) {
                return prevUsers; 
            }
            return [...prevUsers, user];
        });
    };

    const unmarkUser = (entityId) => {
        setMarkedUsers((prevUsers) => prevUsers.filter(user => user.entity_id !== entityId));
    };
    
    const isUserMarked = (entityId) => {
        return markedUsers.some(user => user.entity_id === entityId);
    };

    return (
        <MarkedUsersContext.Provider value={{ markedUsers, markUser, unmarkUser, isUserMarked }}>
            {children}
        </MarkedUsersContext.Provider>
    );
};