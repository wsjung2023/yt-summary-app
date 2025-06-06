// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,       // ↞ 이미 추가하셨다면 생략
} from "firebase/firestore";
import { db } from "../../lib/firestore";      // ← 실제 경로 확인
import { addChannelFn } from "@/lib/firebase";

export default function Dashboard() {
  /* ✏️ ① 채널 목록 */
  const [channels, setChannels] = useState<any[]>([]);

  /* ✏️ ② 최근 영상 목록 (← 새로 추가) */
  const [videos, setVideos]   = useState<any[]>([]);

  const [url, setUrl] = useState("");
  const uid = "demo"; // 실제로는 auth.currentUser!.uid

  /* ------------ 실시간 채널 목록 ------------- */
  useEffect(() => {
    const col = collection(db, `users/${uid}/channels`);
    return onSnapshot(query(col), snap =>
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);

  /* ------------ 실시간 영상 목록 ------------- */
  useEffect(() => {
    if (!uid) return;

    const col = collection(db, `users/${uid}/videos`);
    return onSnapshot(
      query(col, orderBy("publishedAt", "desc")),        // 최신순 정렬
      snap => setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [uid]);

  /* ------------ 채널 추가 ------------- */
  const handleAdd = async () => {
    if (!url) return;
    try {
      const res = await addChannelFn({ uid, url });
      alert(`✅ 추가 완료! id=${res.data.id}`);
      setUrl("");
    } catch (err: any) {
      alert(`❌ 실패: ${err.message ?? err}`);
    }
  };

  /* ------------ JSX ------------- */
  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">내 채널 목록</h1>

      <div className="flex gap-2">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channel"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 rounded"
        >
          추가
        </button>
      </div>

      <ul className="space-y-2">
        {channels.map(c => (
          <li key={c.id} className="flex items-center gap-2">
            <span>{c.url}</span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold pt-6">📺 최근 영상</h2>
      <ul className="space-y-1">
        {videos.map(v => (
          <li key={v.id}>{v.title}</li>
        ))}
      </ul>
    </main>
  );
}
