import React, { useState } from 'react';
import { useMarkedUsers } from '../contexts/MarkedUsersContext';
import { Link } from 'react-router-dom';

const MarkedUsersTab = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { markedUsers, unmarkUser } = useMarkedUsers();

    if (markedUsers.length === 0 && !isOpen) {
        return null;
    }

    return (
        <>
            <div 
                className={`fixed top-1/2 right-0 transform -translate-y-1/2 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[320px]'}`}
            >
                <div className="w-80 h-[60vh] bg-gray-800 border-l-2 border-t-2 border-b-2 border-purple-500/50 rounded-l-lg shadow-2xl flex flex-col">
                    <h3 className="text-lg font-bold text-white p-4 border-b border-gray-700">
                        Marked Users ({markedUsers.length})
                    </h3>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {markedUsers.length > 0 ? (
                            markedUsers.map(user => (
                                <div key={user.entity_id} className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-4">
                                    <img 
                                        src={user.imageUrl || 'https://placehold.co/48x48/4A5568/E2E8F0?text=...'} 
                                        alt={user.name} 
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div className="flex-grow">
                                        <Link to={`/user/${user.entity_id}`} className="font-semibold text-white hover:text-purple-400 transition-colors">
                                            {user.name}
                                        </Link>
                                        <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                                    </div>
                                    <button onClick={() => unmarkUser(user.entity_id)} className="text-gray-500 hover:text-red-400" title="Unmark User">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center mt-8">No users are marked.</p>
                        )}
                    </div>
                </div>

                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute top-1/2 -left-8 transform -translate-y-1/2 -rotate-90 origin-bottom-left bg-gray-800 text-white font-bold py-2 px-4 rounded-t-md border-t-2 border-l-2 border-r-2 border-purple-500/50"
                >
                    Marked Users
                </button>
            </div>
        </>
    );
};

export default MarkedUsersTab;