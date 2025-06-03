"use client";

import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firestore";

type ChannelDoc = { url: string };

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [channels, setChannels] = useState<
    (QueryDocumentSnapshot<ChannelDoc>)[]
  >([]);

  // 실시간 구독
  useEffect(() => {
    return onSnapshot(collection(db, "channels"), (snap) => {
      setChannels(snap.docs as any);
    });
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) return;
    await addDoc(collection(db, "channels"), { url: url.trim() });
    setUrl("");
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "channels", id));
  };

  return (
    <main className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">내 채널 목록</h1>

      {/* 입력 폼 */}
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channel"
          className="flex-1 border px-3 py-2 rounded-lg"
        />
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold"
        >
          추가
        </button>
      </div>

      {/* 채널 리스트 */}
      <ul className="space-y-2">
        {channels.map((c) => (
          <li
            key={c.id}
            className="flex justify-between items-center border px-3 py-2 rounded-lg"
          >
            <span className="truncate">{c.data().url}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-red-500 font-bold"
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
