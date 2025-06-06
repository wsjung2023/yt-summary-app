import * as functions from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

const db = getFirestore();
const YT_KEY = process.env.YT_API_KEY!;

export const fetchVideos = onSchedule(
  { schedule: "0 22 * * *", timeZone: "Asia/Seoul", retryCount: 0 },
  async () => {
    const channels = await db.collectionGroup("channels").get();

    for (const doc of channels.docs) {
      const id = doc.id;
      const api = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${id}&maxResults=5&order=date&type=video&key=${YT_KEY}`;

      const res = await fetch(api);
      const json = (await res.json()) as any;
      if (!json.items) continue;

      const batch = db.batch();
      json.items.forEach((v: any) => {
        const vid = v.id.videoId;
        batch.set(
          doc.ref.collection("videos").doc(vid),
          {
            title: v.snippet.title,
            thumb: v.snippet.thumbnails.default.url,
            publishedAt: v.snippet.publishedAt,
            fetchedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
    }

    functions.logger.info(`Fetched videos for ${channels.size} channel(s)`);
  }
);
