import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase for both client and server environments.
 * Uses experimentalForceLongPolling to address connection issues in restrictive environments.
 */
export function initializeFirebase() {
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Initialize Firestore with long polling to bypass potential connection blocks
    // This is critical for preventing "Could not reach Cloud Firestore backend" errors.
    initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } else {
    app = getApp();
  }
  
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  
  // Set persistence and other auth configurations if needed
  auth.useDeviceLanguage();
  
  return { app, auth, firestore };
}
