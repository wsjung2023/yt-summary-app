import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";

initializeApp();
const db = getFirestore();

interface AddChannelData { uid: string; url: string }

export const addChannel = onCall<AddChannelData>(async (req) => {
  const { uid, url } = req.data;

  // 간단한 검증 400에 해당
  if (!uid || !url) {
    throw new HttpsError("invalid-argument", "Bad payload");
  }

  // Youtube 채널 핸들 꺼내기기
  const handle = url.split("/").pop()?.replace("@", "") || "";
  if (!handle) throw new HttpsError("invalid-argument", "Invalid URL");

  // YouTube Data API 호출
  const key  = process.env.YT_API_KEY!;
  const api  = `https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=${handle}&key=${key}`;
  const res  = await fetch(api);                // <-전역 fetch 사용
  const json = await res.json() as any;
  if (!json.items?.length) throw new HttpsError("not-found", "Channel not found");

  const ch = json.items[0];
  await db.doc(`users/${uid}/channels/${ch.id}`).set({
    url,
    title:  ch.snippet.title,
    thumb:  ch.snippet.thumbnails.default.url,
    addedAt: FieldValue.serverTimestamp(),
  });

  return { id: ch.id };
});