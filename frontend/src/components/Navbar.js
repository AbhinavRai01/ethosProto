import React from 'react';
import { Link } from 'react-router-dom';

// This is the SVG icon, kept inside the component for simplicity.
const LogoIcon = () => (
  <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 4C12.9543 4 4 7.25611 4 11.2727C4 14.0109 8.16144 16.3957 14.31 17.6364C8.16144 18.877 4 21.2618 4 24C4 26.7382 8.16144 29.123 14.31 30.3636C8.16144 31.6043 4 33.9891 4 36.7273C4 40.7439 12.9543 44 24 44C35.0457 44 44 40.7439 44 36.7273C44 33.9891 39.8386 31.6043 33.69 30.3636C39.8386 29.123 44 26.7382 44 24C44 21.2618 39.8386 18.877 33.69 17.6364C39.8386 16.3957 44 14.0109 44 11.2727C44 7.25611 35.0457 4 24 4Z"
      fill="currentColor"
    />
  </svg>
);

const Header = () => {
  // A placeholder URL for the avatar image
  const avatarUrl = 'https://i.imgur.com/3Y2g6a2.png';

  return (
    // The bottom border has been changed from border-b to border-b-2 to make it thicker.
    <header className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-700/20 bg-gray-900 text-white">
      {/* Left Side: Logo and Brand Name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 text-purple-500">
          <LogoIcon />
        </div>
        <h1 className="text-xl font-bold">Campus Security</h1>
      </div>

      {/* Right Side: Navigation and Profile */}
      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <Link to="/" className="hover:text-purple-500 transition-colors">
            Dashboard
          </Link>
          <Link to="/user" className="hover:text-purple-500 transition-colors">
            Search
          </Link>
          <Link to="#" className="hover:text-purple-500 transition-colors">
            Alerts
          </Link>
          <Link to="/upload" className="hover:text-purple-500 transition-colors">
            Upload
          </Link>
        </nav>
        
      </div>
    </header>
  );
};

export default Header;
