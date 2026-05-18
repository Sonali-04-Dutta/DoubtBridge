import admin from "firebase-admin";
import { env } from "./env.js";
import { ApiError } from "../utils/ApiError.js";

let authInstance = null;

const getFirebaseCredentials = () => {
  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    throw new ApiError(
      500,
      "Firebase auth is not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    projectId: env.firebaseProjectId,
    clientEmail: env.firebaseClientEmail,
    privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n")
  };
};

export const getFirebaseAuth = () => {
  if (authInstance) {
    return authInstance;
  }

  if (!admin.apps.length) {
    const credential = getFirebaseCredentials();
    admin.initializeApp({ credential: admin.credential.cert(credential) });
  }

  authInstance = admin.auth();
  return authInstance;
};
