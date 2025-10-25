import React from 'react';
import { useMarkedUsers } from '../contexts/MarkedUsersContext';
import MarkedUserCard from './MarkedUsersCard';

const MarkedUsersSection = () => {
    const { markedUsers } = useMarkedUsers();

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold tracking-tight text-white text-center">
                Marked Users
            </h3>
            {markedUsers.length > 0 ? (
                <div className="space-y-4">
                    {markedUsers.map(user => (
                        <MarkedUserCard key={user.entity_id} user={user} />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center py-8">
                    No users are marked. Mark a user from their profile page to see them here.
                </p>
            )}
        </div>
    );
};

export default MarkedUsersSection;
