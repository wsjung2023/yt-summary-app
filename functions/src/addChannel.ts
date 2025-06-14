import { onCall, HttpsError } from "firebase-functions/v2/https";
import { google } from "googleapis";
import { db, FieldValue } from "./init";
import { toChannelId } from "./toChannelId";

const apiKey = process.env.YT_API_KEY!;

/** 채널 등록 */
export const addChannel = onCall<{ uid: string; input: string }>(async (req) => {
  const { uid, input } = req.data;
  if (!uid || !input) {
    throw new HttpsError("invalid-argument", "uid / input 이 필요합니다");
  }
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "env YT_API_KEY 가 없습니다");
  }

  // 1. URL·@handle → 채널 ID 변환
  let channelId: string;
  try {
    channelId = await toChannelId(input);
  } catch (e: any) {
    throw new HttpsError("invalid-argument", e.message ?? "채널 변환 실패");
  }

  // 2. 채널 기본 정보 조회
  const yt = google.youtube({ version: "v3", auth: apiKey });
  const { data } = await yt.channels.list({
    part: ["snippet"],
    id: [channelId],
    maxResults: 1,
  });
  const ch = data.items?.[0];
  if (!ch) throw new HttpsError("not-found", "채널을 찾을 수 없습니다");

  // 3. Firestore 저장 (users/{uid}/channels/{channelId})
  await db.doc(`users/${uid}/channels/${channelId}`).set(
    {
      url   : input,
      title : ch.snippet?.title ?? "",
      thumb : ch.snippet?.thumbnails?.default?.url ?? "",
      addedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ok: true, channelId };
});
