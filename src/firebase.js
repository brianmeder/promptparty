// ============================
//  Document Purpose: 
//  To initializes Firebase.
//  (Runs automatically with 
//  "npm run start" of App.js)
// ============================
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object
const firebaseConfig = {
	apiKey: "AIzaSyBFfQh3WvOQUapkDJVPfdVO-L87b82NVmk",
	authDomain: "promptparty-429bf.firebaseapp.com",
	projectId: "promptparty-429bf",
	storageBucket: "promptparty-429bf.firebasestorage.app",
	messagingSenderId: "1085773448981",
	appId: "1:1085773448981:web:51b9e8fb7ef8b00c9acb1c",
	measurementId: "G-KFHRR23SFG"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Set up Firebase Auth and Google Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize the Firebase db (colloquially known as Firestore)
// Free "spark"-tier limits:
// [==> 50k reads, 20k writes, 10k del per day,
//  ==> 1 GB storage, 50 concurrent connections]
// (DB is set to the North Virgina us-east4 location since
//  this website "gcping.com" showed lowest latency there)
const db = getFirestore(app);

export { auth, googleProvider, db, signOut };
