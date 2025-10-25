import React from 'react';
import { Link } from 'react-router-dom';
import ChatSideTab from '../components/ChatSideTab';
import { useMarkedUsers } from '../contexts/MarkedUsersContext';
import MarkedUserCard from '../components/MarkedUsersCard';

const ActionButton = ({ to, title, description, icon }) => (
    <Link 
        to={to} 
        className="group relative flex flex-col items-center justify-center text-center p-6 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1"
    >
        <div className="text-purple-400 mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
    </Link>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const AlertsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
);

const ReportsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);


const HomePage = () => {
    const { markedUsers } = useMarkedUsers();

    return (
        <>
            <main className="flex-grow flex flex-col items-center p-6 sm:p-8 md:p-12 bg-gray-900 text-white min-h-screen">
                
                <div className="w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <ActionButton to="/upload" title="Upload" description="Upload new data" icon={<UploadIcon />} />
                        <ActionButton to="/user" title="Search" description="Search for users or data" icon={<SearchIcon />} />
                        <ActionButton to="#" title="Alerts" description="View active alerts" icon={<AlertsIcon />} />
                        <ActionButton to="/activity" title="Activity" description="View campus activity on a heatmap" icon={<ReportsIcon />} />
                    </div>

                    <div className="w-full">
                        <h2 className="text-3xl font-bold text-white mb-6">Marked Users</h2>
                        {markedUsers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                                {markedUsers.map(user => (
                                    <MarkedUserCard 
                                        key={user.entity_id} 
                                        user={user} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-16 bg-gray-800/30 rounded-lg">
                                <p>No users are marked.</p>
                                <p className="text-sm mt-2">Mark a user from their profile page to see them here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <ChatSideTab />
        </>
    );
};

export default HomePage;

