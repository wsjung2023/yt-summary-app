"use client";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// 맨 위 기존 import 들 아래
import { getFunctions, httpsCallable } from "firebase/functions";

/* 0. 환경변수 읽기 */
const apiKey     = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId  = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/* 1. 변수 선언(초기값 undefined) → 반드시 **파일 최상단** 스코프 */
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let provider: GoogleAuthProvider | undefined;

/* 2. 조건부 초기화 (빌드 서버에서 env 없으면 그냥 패스) */
if (apiKey && authDomain && projectId) {
  const firebaseConfig = { apiKey, authDomain, projectId };
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} else {
  console.warn("⚠️  Firebase env vars missing – skipped init.");
}

/* 3. 한 번만 export  */
export { app, auth, provider };

export const functions = getFunctions();                 // us-central1 기본
export const addChannelFn = httpsCallable<
  { uid: string; url: string },                          //   보내는 타입
  { id: string }                                         //   돌아오는 타입
>(functions, "addChannel");