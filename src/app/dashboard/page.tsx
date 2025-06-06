// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firestore";   // ← 프로젝트 구조에 맞춰 이미 존재하는 경로
import { addChannelFn } from "@/lib/firebase"; // ← addChannel 클라우드-함수 호출 헬퍼

/* ---------- 타입 ---------- */
type ChannelDoc = { id: string; url: string };
type VideoDoc   = { id: string; url: string; title: string; thumb: string };

/* ---------- 페이지 ---------- */
export default function Dashboard() {
  /* ① 채널 목록 (실시간) */
  const [channels, setChannels] = useState<ChannelDoc[]>([]);

  /* ② 최근 영상 목록 (실시간) */
  const [videos, setVideos] = useState<VideoDoc[]>([]);

  /* ③ 입력창 상태 */
  const [url, setUrl] = useState("");

  /* ④ (실제 앱이면) auth.currentUser!.uid 사용 */
  const uid = "demo";

  /* ───────── 실시간 채널 스트림 ───────── */
  useEffect(() => {
    const col = collection(db, `users/${uid}/channels`);
    return onSnapshot(query(col, orderBy("createdAt", "desc")), snap => {
      setChannels(
        snap.docs.map(d => {
          const { url } = d.data() as { url: string };
          return { id: d.id, url };
        })
      );
    });
  }, [uid]);

  /* ───────── 실시간 영상 스트림 ───────── */
  useEffect(() => {
    const col = collection(db, `users/${uid}/videos`);
    return onSnapshot(
      query(col, orderBy("publishedAt", "desc")),
      snap =>
        setVideos(
          snap.docs.map(d => {
            const data = d.data() as Omit<VideoDoc, "id">;
            return { id: d.id, ...data };
          })
        )
    );
  }, [uid]);

  /* ───────── 채널 추가 ───────── */
  const handleAdd = async () => {
    if (!url.trim()) return;
    try {
      const res = await addChannelFn({ uid, url: url.trim() });
      alert(`✅ 추가 완료! id=${res.data.id}`);
      setUrl("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${e}`;
      alert(`❌ 실패: ${msg}`);
    }
  };

  /* ───────── 화면 ───────── */
  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">내 채널 목록</h1>

      {/* 입력 + 버튼 */}
      <div className="flex gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded"
          placeholder="https://www.youtube.com/@channel"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={handleAdd}
        >
          추가
        </button>
      </div>

      {/* 채널 리스트 */}
      <ul className="space-y-2">
        {channels.map(c => (
          <li key={c.id} className="flex items-center gap-2">
            <span>{c.url}</span>
          </li>
        ))}
      </ul>

      {/* 영상 리스트 */}
      <h2 className="text-xl font-bold pt-6">📺 최근 영상</h2>
      <ul className="space-y-1">
        {videos.map(v => (
          <li key={v.id}>{v.title}</li>
        ))}
      </ul>
    </main>
  );
}
