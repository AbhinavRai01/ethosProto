import React from 'react';
import { Link } from 'react-router-dom';
import ChatSideTab from '../components/ChatSideTab';

const HomePage = () => {
  return (
    // Use a fragment to include the main content and the side tab
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 sm:p-8 md:p-12 bg-gray-900 text-white min-h-[91vh]">
        
        {/* Centered content container */}
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
          
          {/* Header Section */}
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Security Dashboard
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Manage and monitor campus security effectively.
            </p>
          </div>

          {/* Grid for the main action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            
            {/* Card 1: Users */}
            <div className="group relative flex flex-col items-center justify-center p-8 bg-black/20 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1">
              <h3 className="text-2xl font-bold mb-4">View Users</h3>
              <p className="text-gray-400 mb-6 text-center">
                Browse, search, and manage student, faculty, or staff records.
              </p>
              <Link 
                to="/user" 
                className="w-full text-center bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
              >
                Go to Users
              </Link>
            </div>

            {/* Card 2: Upload Data */}
            <div className="group relative flex flex-col items-center justify-center p-8 bg-black/20 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1">
              <h3 className="text-2xl font-bold mb-4">Upload Data</h3>
              <p className="text-gray-400 mb-6 text-center">
                Bulk upload incident reports, security logs, or other data files.
              </p>
              <Link 
                to="/upload" 
                className="w-full text-center bg-purple-600/20 text-purple-400 font-bold py-3 px-6 rounded-lg hover:bg-purple-600/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition-colors"
              >
                Upload Files
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* The ChatSideTab component is now included here */}
      <ChatSideTab />
    </>
  );
};

export default HomePage;

