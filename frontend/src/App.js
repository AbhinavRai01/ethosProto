// src/App.js

import { Route, Routes } from "react-router-dom";
import SearchAndUploadUser from "./pages/SearchAndUploadUser";
import UploadPage from "./pages/UploadFile";
import HomePage from "./pages/HomePage"; // 1. Import the new HomePage component
import EntityProfilePage from "./pages/ViewUser";
import Navbar from "./components/Navbar";
import './App.css'; // Make sure global styles are imported

export default function App() {
  return (
    <div className="font-inter">
      <Navbar/>
      <Routes>
        {/* 2. Set HomePage as the default route */}
        <Route path="/" element={<HomePage />} />
        <Route path="/user" element={<SearchAndUploadUser />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/user/:entityId" element={<EntityProfilePage />} />
      </Routes>
    </div>
  );
}
