import { Route, Routes } from "react-router-dom";
import SearchAndUploadUser from "./pages/SearchAndUploadUser";
import UploadPage from "./pages/UploadFile";
import HomePage from "./pages/HomePage";
import EntityProfilePage from "./pages/ViewUser";
import LoginPage from "./pages/loginPage";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./pages/ProtectedRoute";
import CampusActivity  from "./pages/CampusActivity";
import QueryChat from "./pages/QueryChat";
import { MarkedUsersProvider } from "./contexts/MarkedUsersContext";
import './App.css';

export default function App() {
  return (
    <div className="font-inter">
      <AuthProvider>
      <MarkedUsersProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activity" 
            element={
              <ProtectedRoute>
                <CampusActivity />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user" 
            element={
              <ProtectedRoute>
                <SearchAndUploadUser />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user/:entityId" 
            element={
              <ProtectedRoute>
                <EntityProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <QueryChat />
              </ProtectedRoute>
            } 
          />
        </Routes>
        </MarkedUsersProvider>
      </AuthProvider>
    </div>
  );
}
