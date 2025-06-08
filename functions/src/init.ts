// functions/src/init.ts
import { initializeApp, getApps }   from "firebase-admin/app";
import { getFirestore, FieldValue }             from "firebase-admin/firestore";
     
// 이미 초기화된 앱이 없으면 초기화
if (!getApps().length) {
  initializeApp();
}
export const db = getFirestore();
// 여기에 같이 export 해주면 좋습니다!
export { FieldValue };