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
  console.log("[1] function start");

  const usersSnap = await db.collection("users").get();
  console.log("[2] users count =", usersSnap.size);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    console.log(`── [2-1] user ${uid}`);
    const chSnap = await db.collection(`users/${uid}/channels`).get();
    console.log(`──── [2-2] channels =`, chSnap.size);
    for (const ch of chSnap.docs) {
      console.log(`────── [3] call logic uid=${uid} ch=${ch.id}`);
      await fetchVideosLogic({ uid, channelId: ch.id });
    }
  }

  console.log("[fetchVideosDaily] done");
}
