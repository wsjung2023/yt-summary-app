// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";      // Auth는 안 import
import { getFunctions, httpsCallable } from "firebase/functions";

const apiKey     = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth>   | undefined;    // <-- 이렇게 변경
let provider: GoogleAuthProvider       | undefined;
let functions: ReturnType<typeof getFunctions> | undefined;

if (apiKey && authDomain && projectId) {
  const cfg = { apiKey, authDomain, projectId };
  app = getApps().length ? getApps()[0] : initializeApp(cfg);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  functions = getFunctions(app, "us-central1");
} else {
  console.warn("⚠️ Firebase env vars missing – skipped init.");
}

export { app, auth, provider, functions };

export const addChannelFn = functions
  ? httpsCallable<{ uid: string; url: string }, { id: string }>(
      functions,
      "addChannel"
    )
  : async () => {
      throw new Error("Firebase Functions not initialized");
    };
