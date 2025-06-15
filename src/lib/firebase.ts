// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,        // ← 이 줄 추가
  type Auth                    // (타입만 필요하면 이렇게)
} from "firebase/auth";
import {
  getFunctions,
  httpsCallable,
  type Functions
} from "firebase/functions";

/* ───── ① .env.local 값 읽기 ───── */
const firebaseConfig = {
  apiKey:        process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
};
if (!firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase env vars missing – skipped init.");
}

/* ───── ② 중복 초기화 방지 ───── */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth: Auth           = getAuth(app);
export const provider             = new GoogleAuthProvider();
export const functions: Functions = getFunctions(app, "us-central1");

/* ───── ③ Cloud Functions 래퍼 ───── */
export const addChannelFn = httpsCallable<
  { uid: string; input: string },        // request
  { ok: boolean; channelId: string }     // response
>(functions, "addChannel");
