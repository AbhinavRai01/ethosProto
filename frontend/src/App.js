// src/App.js

import { Route, Routes } from "react-router-dom";
import ViewAndUploadUser from "./pages/ViewAndUploadUser";
import UploadPage from "./pages/UploadFile";
import HomePage from "./pages/HomePage"; // 1. Import the new HomePage component
import './App.css'; // Make sure global styles are imported

export default function App() {
  return (
    <div>
      <Routes>
        {/* 2. Set HomePage as the default route */}
        <Route path="/" element={<HomePage />} />
        <Route path="/user" element={<ViewAndUploadUser />} />
        <Route path="/upload" element={<UploadPage />} />
      </Routes>
    </div>
  );
}
