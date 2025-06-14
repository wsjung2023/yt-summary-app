import { google } from "googleapis";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const YT_KEY = process.env.YT_API_KEY!;
const db     = getFirestore();

// YouTube Data API v3 클라이언트
const youtube = google.youtube({
  version: "v3",
  auth   : YT_KEY,
});

/** 사용자가 채널 URL을 넣어도 ID만 뽑아내도록(UC…) */
function toChannelId(raw: string): string {
  const m = raw.match(/(UC[\w-]{22})/);
  if (!m) throw new Error("잘못된 채널 주소 / ID");
  return m[1];
}

export interface FetchVideosOpts {
  uid: string;          // Firestore users/{uid}
  channelId: string;    // 채널 ID 또는 URL
}

export async function fetchVideosLogic({ uid, channelId }: FetchVideosOpts) {
  /** ★ URL이 오면 ID만 추출 */
  const cid = toChannelId(channelId);

  /** ★ 24 h 전 → ISO 8601 */
  const oneWeekAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  console.log("[logic] try   uid:", uid, "cid:", cid);

  const { data } = await youtube.search.list({
    part       : ["snippet"],
    channelId  : cid,
    type       : ["video"],
    order      : "date",
    maxResults : 50,
    publishedAfter: oneWeekAgoISO,   // ← 24h → 7d 로 완화
  });

  if (!data.items?.length) {
    console.log("[logic] no new videos");
    return;
  }

  const batch = db.batch();
  let saved = 0;

  for (const v of data.items) {
    if (!v.id?.videoId || !v.snippet) continue;

    const ref = db.doc(`users/${uid}/channels/${cid}/videos/${v.id.videoId}`);
    batch.set(ref, {
      title       : v.snippet.title,
      thumb       : v.snippet.thumbnails?.default?.url ?? "",
      publishedAt : v.snippet.publishedAt,
      addedAt     : FieldValue.serverTimestamp(),
    }, { merge: true });
    saved++;
  }

  await batch.commit();
  console.log(`[logic] saved ${saved} videos`);
}
