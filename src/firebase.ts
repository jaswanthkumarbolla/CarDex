import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { CarDexEntry } from "./types";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)"
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Sign in anonymously to enable Firestore access
signInAnonymously(auth).catch((err) => {
  console.warn("Firebase anonymous authentication notice:", err.message);
});

// Helper function to save a car entry into Firestore
export async function saveCarToFirestore(car: CarDexEntry): Promise<void> {
  try {
    const docId = car.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const carRef = doc(db, "scanned_cars", docId);
    await setDoc(carRef, {
      ...car,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving car to Firestore:", error);
  }
}

// Helper function to subscribe to real-time car updates from Firestore
export function subscribeToFirestoreCars(
  onCarsUpdated: (cars: CarDexEntry[]) => void
) {
  try {
    const carsCollection = collection(db, "scanned_cars");
    const carsQuery = query(carsCollection);

    return onSnapshot(
      carsQuery,
      (snapshot) => {
        const firestoreCars: CarDexEntry[] = snapshot.docs.map((doc) => {
          const data = doc.data() as CarDexEntry;
          return data;
        });
        onCarsUpdated(firestoreCars);
      },
      (error) => {
        console.warn("Firestore subscription error:", error);
      }
    );
  } catch (error) {
    console.warn("Failed to subscribe to Firestore cars:", error);
    return () => {};
  }
}

export default app;
