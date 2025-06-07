// src/app/dashboard/page.tsx
"use client";

// ────────────────────────────────────────────────────────────────────────────
// 1) Firebase Auth 모듈 불러오기 (클라이언트 사이드에서 로그인된 유저 UID를 얻기 위함)
// ────────────────────────────────────────────────────────────────────────────
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firestore";          // Firestore 초기화
import { addChannelFn } from "@/lib/firebase"; // Cloud Function 호출 헬퍼

// ────────────────────────────────────────────────────────────────────────────
// 2) 타입 정의
// ────────────────────────────────────────────────────────────────────────────
type ChannelDoc = { id: string; url: string };
type VideoDoc   = { id: string; url: string; title: string; thumb: string };

export default function DashboardPage() {
  const router = useRouter();

  // ─── 사용자 & UID 상태 ───
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [uid, setUid]   = useState<string>("");

  // ─── ① 채널 목록 상태 ───
  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  // ─── ② 영상 목록 상태 ───
  const [videos, setVideos]     = useState<VideoDoc[]>([]);
  // ─── ③ 입력창 상태 ───
  const [url, setUrl]           = useState<string>("");

  // ────────────────────────────────────────────────────────────────────────────
  // 3) 로그인 상태 구독
  //    onAuthStateChanged 로 user/Uid 갱신, 로그인 안된 경우 /login 으로 리다이렉트
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.uid) {
        setUid(u.uid);
      } else {
        setUid("");
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  // 로딩 중
  if (user === undefined) {
    return <p className="p-8 text-center">로딩중...</p>;
  }

  // 로그인 전
  if (!user) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다.</h1>
        <p>로그인 후에 채널 목록과 영상을 확인할 수 있습니다.</p>
      </main>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4) 실시간 채널 스트림 구독
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setChannels([]);
      return;
    }
    const colRef = collection(db, `users/${uid}/channels`);
    const q      = query(colRef, orderBy("createdAt", "desc"));
    const unsub  = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const { url } = d.data() as { url: string };
        return { id: d.id, url };
      });
      setChannels(list);
    });
    return () => unsub();
  }, [uid]);

  // ────────────────────────────────────────────────────────────────────────────
  // 5) 실시간 영상 스트림 구독
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setVideos([]);
      return;
    }
    const colRef = collection(db, `users/${uid}/videos`);
    const q      = query(colRef, orderBy("publishedAt", "desc"));
    const unsub  = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as Omit<VideoDoc, "id">;
        return { id: d.id, ...data };
      });
      setVideos(list);
    });
    return () => unsub();
  }, [uid]);

  // ────────────────────────────────────────────────────────────────────────────
  // 6) 채널 추가 핸들러
  // ────────────────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!url.trim()) {
      alert("❌ 빈 문자열은 추가할 수 없습니다.");
      return;
    }
    try {
      const res = await addChannelFn({ uid, url: url.trim() });
      alert(`✅ 채널 추가 완료! id = ${res.data.id}`);
      setUrl("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${e}`;
      alert(`❌ 채널 추가 중 오류: ${msg}`);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 7) 채널 삭제 핸들러
  // ────────────────────────────────────────────────────────────────────────────
  const handleDelete = async (channelId: string) => {
    try {
      await deleteDoc(doc(db, `users/${uid}/channels/${channelId}`));
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : `${e}`;
      alert(`❌ 삭제 중 오류: ${msg}`);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 8) 렌더링
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">내 채널 목록</h1>
        <button
          onClick={() => getAuth().signOut().then(() => router.replace("/login"))}
          className="text-sm text-gray-600 hover:underline"
        >
          로그아웃
        </button>
      </header>

      {/* 입력 + 추가 버튼 */}
      <div className="flex gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded"
          placeholder="https://www.youtube.com/@channel"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          추가
        </button>
      </div>

      {/* 채널 리스트 */}
      <ul className="space-y-2">
        {channels.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between border px-3 py-2 rounded"
          >
            <span className="truncate">{c.url}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-red-500 font-bold px-2 py-1 hover:bg-red-100 rounded transition"
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      {/* 영상 리스트 */}
      <h2 className="text-xl font-bold pt-6">📺 최근 영상</h2>
      <ul className="space-y-1">
        {videos.map((v) => (
          <li key={v.id} className="truncate">
            {v.title}
          </li>
        ))}
      </ul>
    </main>
  );
}
