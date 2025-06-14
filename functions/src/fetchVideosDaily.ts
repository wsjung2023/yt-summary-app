// functions/src/fetchVideosDaily.ts
import type { MessagePublishedData } from
  "@google/events/cloud/pubsub/v1/MessagePublishedData";   // ✅ 교체
// import type { PubSubMessage } from "@google-cloud/pubsub"; ← 지움

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { fetchVideosLogic } from "./shared/fetchVideosLogic";

if (!getApps().length) initializeApp();
const db = getFirestore();

/**
 * Pub/Sub trigger (Cloud Scheduler → fetchvideos-daily 토픽)
 */
export async function fetchVideosDaily(                     // ✅ 시그니처 교체
  event: MessagePublishedData,   // v2 Cloud Event 형식
): Promise<void> {
  console.log("[fetchVideosDaily] start");

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
