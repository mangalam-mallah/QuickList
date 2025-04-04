import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import Constants  from "expo-constants";


// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
};

// Initialize Firebase app (only once)
const app = initializeApp(firebaseConfig);

// Get Firestore instance with persistence enabled
const db = getFirestore(app);

export { app, db };
