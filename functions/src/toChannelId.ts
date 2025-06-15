/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * 채널 URL / @handle / legacy user name → UC… 채널 ID 변환
 * 실패 시 Error throw
 */
//import { google } from "googleapis";

const apiKey = process.env.YT_API_KEY!;
if (!apiKey) throw new Error("env YT_API_KEY 없음");

//const yt = google.youtube({ version: "v3", auth: apiKey });
// google API 타입만 쓰고 인스턴스는 만들지 않아도 됨

export async function toChannelId(raw: string): Promise<string> {
  const tail = raw.trim().split("/").pop()?.replace(/\s+/g, "") ?? "";
  if (!tail) throw new Error("채널 URL / @handle / ID 를 넣어주세요");

  /* 1️⃣ 이미 UC… 형태인가? ───────────── */
  const mUC = tail.match(/^UC[\w-]{22}$/);
  if (mUC) return mUC[0];

  /* 2️⃣ legacy / @handle 구분 ────────── */
  const handle = tail.replace(/^@/, "");
  const isLegacy = raw.includes("/user/") || (!raw.includes("@") && !raw.includes("/channel/"));

  let apiUrl: string;
  if (isLegacy) {
    // legacy username → channels.list ?forUsername=
    apiUrl = `https://www.googleapis.com/youtube/v3/channels`
           + `?part=id&forUsername=${handle}&key=${apiKey}`;
  } else {
    // @handle 또는 custom URL → search.list
    apiUrl = `https://www.googleapis.com/youtube/v3/search`
           + `?part=snippet&type=channel&q=${handle}&maxResults=1&key=${apiKey}`;
  }

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);

  const j = await res.json() as any;
  const id = isLegacy
    ? j.items?.[0]?.id
    : j.items?.[0]?.snippet?.channelId;

  if (!id) throw new Error("채널을 찾을 수 없습니다");
  return id;
}
