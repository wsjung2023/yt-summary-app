// src/app/dashboard/page.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firestore";
import { addChannelFn } from "@/lib/firebase";

type ChannelDoc = { id: string; url: string };
type VideoDoc   = { id: string; url: string; title: string; thumb: string };

export default function Dashboard() {
  const router = useRouter();
  // 1) Firebase Auth 상태 + uid
  const [user, setUser] = useState<User| null | undefined>(undefined);
  const [uid,  setUid]  = useState<string>("");
  
  // 3) 실시간 채널 & 영상 구독



  // ───────── onAuthStateChanged ─────────
  useEffect(() => {
    const auth = getAuth();
    // 로그인 상태 변화 구독
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setUid(u.uid);
      } else {
        // 로그아웃 되었거나 인증 안 된 상태면 /login 으로 보냄
        router.replace("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 로딩 중
  if (user === undefined) {
    return <p className="p-8 text-center">로딩 중...</p>;
  }

  // 로그인 필요
  if (!uid) {
    return (
      <main className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다.</h1>
        <p>로그인 후에 채널 목록과 영상을 확인할 수 있습니다.</p>
      </main>
    );
  }

  // ─── 2) channel subscription ────────────────────────────
  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  useEffect(() => {
    const colRef = collection(db, `users/${uid}/channels`);
    const q      = query(colRef, orderBy("createdAt", "desc"));
    const unsub  = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => {
        const { url } = d.data() as { url: string };
        return { id: d.id, url };
      });
      setChannels(list);
    });
    return () => unsub();
  }, [uid]);

  // ─── 3) video subscription ──────────────────────────────
  const [videos,   setVideos]   = useState<VideoDoc[]>([]);  
  useEffect(() => {
    const colRef = collection(db, `users/${uid}/videos`);
    const q      = query(colRef, orderBy("publishedAt", "desc"));
    const unsub  = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => {
        const data = d.data() as Omit<VideoDoc, "id">;
        return { id: d.id, ...data };
      });
      setVideos(list);
    });
    return () => unsub();
  }, [uid]);


  // 3.5) 채널 추가 삭제
  const [url,      setUrl]      = useState<string>("");  
  const handleAdd = async () => {
    const trimmed = url.trim();
    if (!url.trim()) return;
    try {
      const res = await addChannelFn({ uid, url: url.trim() });
      alert(`✅ 채널 추가 완료! id=${res.data.id}`);
      setUrl("");
    } catch (e: any) {
      alert(`❌ 채널 추가 실패: ${e.message || e}`);
    }
  };

  // ───────── 채널 삭제 핸들러 ─────────
  const handleDelete = async (channelId: string) => {
    try {
      await deleteDoc(doc(db, `users/${uid}/channels/${channelId}`));
    } catch (e: any) {
      alert(`❌ 삭제 실패: ${e.message || e}`);
    }
  };

  
  // ─── 5) final JSX ───────────────────────────────────────
  //return (
  // <main className="p-8 space-y-6 max-w-xl mx-auto">
  //    {/* … 나머지 UI … */}
  //  </main>
  //);

  // ─── 5) 로딩 / 로그인 필요 화면 ───────────
  if (user === undefined) {
    return <p className="p-8 text-center">로딩 중...</p>;
  }
  if (!uid) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
        <p>로그인 후 이용하세요.</p>
      </main>
    );
  }
  // ───────── UI 렌더링 ─────────
  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">내 채널 목록</h1>

      {/* 입력 + 추가 버튼 */}
      <div className="flex gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded"
          placeholder="https://www.youtube.com/@channel"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
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
        {channels.map((c) => (
          <li
            key={c.id}
            className="flex justify-between items-center border px-3 py-2 rounded"
          >
            <span className="truncate">{c.url}</span>
            <button
              className="text-red-500 hover:bg-red-100 px-2 rounded"
              onClick={() => handleDelete(c.id)}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      {/* 최근 영상 리스트 */}
      <h2 className="text-xl font-bold pt-6">📺 최근 영상</h2>
      <ul className="space-y-1">
        {videos.map((v) => (
          <li key={v.id}>{v.title}</li>
        ))}
      </ul>
    </main>
  );
}
//git add . && git commit -m "feat: blank dashboard" && git push