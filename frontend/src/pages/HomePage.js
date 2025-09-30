import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We will create this CSS file next

const HomePage = () => {
    return (
        <div className="home-container">
            <div className="home-content">
                <h1 className="home-title">
                    Welcome to the Campus Security & Monitoring System
                </h1>
                <p className="home-subtitle">
                    Unified data | Proactive insights | Enhanced security
                </p>
                <div className="home-buttons">
                    <Link to="/upload" className="home-button primary">
                        Data Upload Center
                    </Link>
                    <Link to="/user" className="home-button secondary">
                        Users
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
