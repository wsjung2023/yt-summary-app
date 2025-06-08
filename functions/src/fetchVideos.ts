// functions/src/fetchVideos.ts

import { onCall, HttpsError } from "firebase-functions/v2/https";
//import { initializeApp }              from "firebase-admin/app";
//import { getFirestore, FieldValue }   from "firebase-admin/firestore";
import fetch                          from "node-fetch";
import { db, FieldValue } from "./init";       // ← 공통 초기화된 db 가져오기

//initializeApp();
//const db = getFirestore();

interface FetchVideosData {
  uid: string;
  channelId: string;
}

export const fetchVideos = onCall<FetchVideosData>(async (req) => {
  const { uid, channelId } = req.data;
  if (!uid || !channelId) {
    throw new HttpsError("invalid-argument", "Bad payload");
  }

  const key = process.env.YT_API_KEY;
  if (!key) {
    throw new HttpsError("failed-precondition", "YT_API_KEY not set");
  }

  // YouTube Search API: 채널의 최신 영상 10개 가져오기
  const apiUrl =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet&channelId=${channelId}` +
    `&order=date&maxResults=10&type=video&key=${key}`;

  let res;
  try {
    res = await fetch(apiUrl);
  } catch (e: any) {
    throw new HttpsError("internal", "Network error: " + e.message);
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("YouTube Search API failed:", res.status, txt);
    throw new HttpsError("internal", `YouTube Search API error ${res.status}`);
  }

  const json = (await res.json()) as any;
  if (!json.items) {
    throw new HttpsError("internal", "Unexpected API response");
  }

  // Firestore에 저장
  const batch = db.batch();
  const videosCol = db.collection(`users/${uid}/videos`);
  json.items.forEach((item: any) => {
    const vid = item.id.videoId;
    const docRef = videosCol.doc(vid);
    batch.set(docRef, {
      url:   `https://www.youtube.com/watch?v=${vid}`,
      title: item.snippet.title,
      thumb: item.snippet.thumbnails.default.url,
      publishedAt: FieldValue.serverTimestamp(), // 나중에 실제 publishedAt 필드를 item.snippet.publishedAt 으로 바꿔주세요
    });
  });
  await batch.commit();

  return { count: json.items.length };
});
