// functions/src/fetchVideosDaily.ts
import type { PubSubMessage } from "@google-cloud/pubsub";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fetchVideosLogic } from "./shared/fetchVideosLogic";

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Pub/Sub-triggered 작업자  
 * (Cloud Scheduler 가 “fetchvideos-daily” 토픽에 빈 메시지를 발행)
 */
export async function fetchVideosDaily(
  message: PubSubMessage,              // ① 메시지(본문은 안 씀)
  context: { timestamp: string }       // ② context(필요 없으면 생략해도 OK)
): Promise<void> {
  console.log("[fetchVideosDaily] start — scheduler timestamp:", context.timestamp);

  const usersSnap = await db.collection("users").get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const chSnap = await db.collection(`users/${uid}/channels`).get();
    for (const ch of chSnap.docs) {
      await fetchVideosLogic({ uid, channelId: ch.id });
    }
  }

  console.log("[fetchVideosDaily] done");
}
