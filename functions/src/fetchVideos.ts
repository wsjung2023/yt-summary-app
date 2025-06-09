import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp, getApps } from "firebase-admin/app";
import { fetchVideosLogic } from "./shared/fetchVideosLogic";

if (!getApps().length) initializeApp();

/**
 * 파라미터: { uid, channelId }
 * 반환값:   { count }
 */
export const fetchVideos = onCall<{ uid: string; channelId: string }>(async (req) => {
  const { uid, channelId } = req.data;
  if (!uid || !channelId) {
    throw new HttpsError("invalid-argument", "uid / channelId required");
  }
  return fetchVideosLogic({ uid, channelId });
});
