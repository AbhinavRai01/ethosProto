// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARGcZ1QehQVCycPofE7bNc1z8f273D8rA",
  authDomain: "ethosproto-d2ed5.firebaseapp.com",
  projectId: "ethosproto-d2ed5",
  storageBucket: "ethosproto-d2ed5.firebasestorage.app",
  messagingSenderId: "889530020275",
  appId: "1:889530020275:web:f818f084e2a4ea32e69bc6",
  measurementId: "G-4V1V1NJ046"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, storage, analytics };