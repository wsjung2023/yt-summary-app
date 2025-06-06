"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firestore";      // 이미 써 두신 db
import { addChannelFn } from "@/lib/firebase";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const uid = "demo";                      // 👉 실제론 auth.currentUser!.uid

  // 🔄 실시간 채널 목록
  useEffect(() => {
    const col = collection(db, `users/${uid}/channels`);
    return onSnapshot(query(col), snap =>
      setChannels(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // ➕ 채널 추가
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
          className="bg-indigo-600 text-white px-4 rounded">추가</button>
      </div>

      <ul className="space-y-2">
        {channels.map(c => (
          <li key={c.id} className="flex items-center gap-2">
            <img src={c.thumb} alt="" className="w-8 h-8 rounded-full"/>
            <span>{c.title}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
