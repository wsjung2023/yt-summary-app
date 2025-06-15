import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });   // Cloud Functions 기본 인증
}

export const db = getFirestore();
export { FieldValue };
