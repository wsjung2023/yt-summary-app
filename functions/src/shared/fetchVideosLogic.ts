// functions/src/shared/fetchVideosLogic.ts
import { google } from "googleapis";   // ← youtube_v3 삭제
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const YT_KEY = process.env.YT_API_KEY!;
const db     = getFirestore();

// 👉 YouTube 클라이언트에 auth 주입 (API Key)
const youtube = google.youtube({
  version : "v3",
  auth    : YT_KEY          // ← 핵심!!
});

export interface FetchVideosOpts {
  uid: string;
  channelId: string;
}

/**  
 * 1) YouTube Data API로 최근 영상 n개(기본 20)를 가져와  
 * 2) Firestore  users/{uid}/videos  서브컬렉션에 저장  
 */
export async function fetchVideosLogic({ uid, channelId }: FetchVideosOpts) {
  // 최근 업로드 50개 조회
  const { data } = await youtube.search.list({
    part      : ["snippet"],
    channelId : channelId,
    type      : ["video"],
    order     : "date",
    maxResults: 50,
    key       : process.env.YT_API_KEY!,   // ← ★ 여기!
  });

  if (!data.items?.length) return;

  // Firestore 저장
  const batch = db.batch();
  data.items.forEach(v => {
    if (!v.id?.videoId || !v.snippet) return;
    const ref = db.doc(`users/${uid}/videos/${v.id.videoId}`);
    batch.set(ref, {
      title       : v.snippet.title,
      thumb       : v.snippet.thumbnails?.default?.url ?? "",
      publishedAt : v.snippet.publishedAt,
      channelId,
      addedAt     : FieldValue.serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
  return { count: data.items.length };
}
