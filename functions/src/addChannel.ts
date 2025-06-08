// functions/src/addChannel.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
//import { initializeApp } from "firebase-admin/app";
//import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fetch from "node-fetch";
import { db, FieldValue } from "./init";       // ← 공통 초기화된 db 가져오기
  

//initializeApp();
//const db = getFirestore();

export const addChannel = onCall<{ uid: string; url: string }>(async (req) => {
  const { uid, url } = req.data;
  if (!uid || !url) {
    throw new HttpsError("invalid-argument", "Bad payload");
  }

  const key = process.env.YT_API_KEY;
  if (!key) {
    throw new HttpsError("failed-precondition", "YT_API_KEY not set");
  }

  // 끝부분 값만 꺼내서
  let handle = url.split("/").pop()?.replace(/^@/, "") || "";
  if (!handle) {
    throw new HttpsError("invalid-argument", "Invalid URL");
  }

  // 구분: legacy username vs. @handle
  let apiUrl: string;
  let isLegacy = url.includes("/user/") || !url.includes("@");
  if (isLegacy) {
    // legacy username
    apiUrl =
      `https://www.googleapis.com/youtube/v3/channels` +
      `?part=snippet&forUsername=${handle}&key=${key}`;
  } else {
    // 새로운 @handle 은 search 로 먼저 조회
    apiUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=channel&q=${handle}&key=${key}`;
  }

  // 1) 첫 번째 호출: legacy 채널이면 items[0].id, search 인 경우 items[0].snippet.channelId
  const r1 = await fetch(apiUrl).catch(e => {
    throw new HttpsError("internal", "Network error: " + e.message);
  });
  if (!r1.ok) {
    const text = await r1.text().catch(() => "");
    console.error("YouTube API failed:", r1.status, text);
    throw new HttpsError("internal", `YouTube API error ${r1.status}`);
  }
  const j1 = await r1.json() as any;
  if (!j1.items?.length) {
    throw new HttpsError("not-found", "Channel not found");
  }

  // 채널 ID 얻어내기
  let channelId: string;
  if (isLegacy) {
    channelId = j1.items[0].id;
  } else {
    channelId = j1.items[0].snippet.channelId;
  }

  // 2) 채널 정보(snippet) 조회
  const r2 = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${key}`
  ).catch(e => {
    throw new HttpsError("internal", "Network error: " + e.message);
  });
  if (!r2.ok) {
    const text = await r2.text().catch(() => "");
    console.error("YouTube channels API failed:", r2.status, text);
    throw new HttpsError("internal", `YouTube Channels API error ${r2.status}`);
  }
  const j2 = await r2.json() as any;
  if (!j2.items?.length) {
    throw new HttpsError("not-found", "Channel not found (2)");
  }

  const ch = j2.items[0];
  await db.doc(`users/${uid}/channels/${channelId}`).set({
    url,
    title:      ch.snippet.title,
    thumb:      ch.snippet.thumbnails.default.url,
    addedAt:    FieldValue.serverTimestamp(),
  });

  return { id: channelId };
});




//firebase functions:env:set YT_API_KEY="AIzaSyDKabqghaswc5Be_z3aYwzM-IbI9HFHHPM"
//npm run build 
//firebase deploy --only functions