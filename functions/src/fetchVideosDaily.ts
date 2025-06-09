import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fetchVideosLogic } from "./shared/fetchVideosLogic";

if (!getApps().length) initializeApp();
const db = getFirestore();

/**  
 * 매일 09:00(UTC) → 한국 18:00  
 * 필요하면 schedule·timeZone 수정
 */
export const fetchVideosDaily = onSchedule(
  { schedule: "0 9 * * *", timeZone: "UTC" },   // 추천: 객체형, timeZone 명시
  async () => {
    const usersSnap = await db.collection("users").get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const chSnap = await db.collection(`users/${uid}/channels`).get(); 

      for (const ch of chSnap.docs) {
        await fetchVideosLogic({
          uid,
          channelId: ch.id,
          //db,        // 미리 만든 인스턴스 재사용
          //silent: true,
        });
      }
    }
  }
);
