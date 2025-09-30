// src/App.js

import { Route, Routes } from "react-router-dom";
import ViewAndUploadUser from "./pages/ViewAndUploadUser";
import UploadPage from "./pages/UploadFile";

export default function App() {
  return (
    <div>
      {/* You can add a navigation bar or header here */}
      <Routes>
        <Route path="/user" element={<ViewAndUploadUser />} />
        <Route path="/upload" element={<UploadPage />} />
        {/* You can add more routes here */}
        {/* <Route path="/" element={<HomePage />} /> */}
      </Routes>
    </div>
  );
}