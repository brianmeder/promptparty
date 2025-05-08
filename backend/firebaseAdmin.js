// ============================
//  Document Purpose: 
//  To initialize Firebase Admin.
//  Needed for using Firebase db
//  on a backend server.
//  (Runs automatically with 
//  "npm run start" of App.js)
// ============================
import admin from "firebase-admin";
import serviceAccount from "./promptparty-429bf-firebase-adminsdk-fbsvc-9c70a2dc8a.json" assert { type: "json" };

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://promptparty-429bf.firebaseio.com",
});

const db = admin.firestore();

export { admin, db };


