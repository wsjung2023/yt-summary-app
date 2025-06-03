"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

/* ───── 0. ENV 읽기 ───── */
const apiKey     = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/* ───── 1. 빌드 서버에서 키가 없으면 빈 export 후 종료 ───── */
if (!apiKey || !authDomain || !projectId) {
  console.warn("⚠️  Firebase env vars missing – skipping init during build.");
  // 빈 객체를 export 해서 다른 모듈 import 에러 방지
  export const auth     = undefined as any;
  export const provider = undefined as any;
  export const app      = undefined as any;
} else {
  /* ───── 2. 정상 초기화 & export ───── */
  const firebaseConfig = { apiKey, authDomain, projectId };
  const appInstance =
    getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

  export const app      = appInstance;
  export const auth     = getAuth(appInstance);
  export const provider = new GoogleAuthProvider();
}
