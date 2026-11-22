// 1) Firebase Console > Project settings > Your apps > SDK setup and configuration
// 2) Replace the placeholder values below with your own Firebase web app config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRCLz8HnMM-GLIPok7Z021_s36kgI5L4o",
  authDomain: "my-daily-planner-4f6ab.firebaseapp.com",
  projectId: "my-daily-planner-4f6ab",
  storageBucket: "my-daily-planner-4f6ab.firebasestorage.app",
  messagingSenderId: "756111166880",
  appId: "1:756111166880:web:113ba1ba9aaacd12b068c5",
  measurementId: "G-0KRJP086WJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Anonymous sign-in gives each browser session a UID for security rules.
export const userReady = signInAnonymously(auth).then(credential => credential.user);
