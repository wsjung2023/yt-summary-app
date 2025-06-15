// src/app/dashboard/page.tsx
"use client";
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

// ① functions 클라이언트 SDK 가져오기
import { httpsCallable } from "firebase/functions";
import { functions }     from "@/lib/firebase";   // 이미 초기화돼 있는 인스턴스

type ChannelDoc = { id: string; url: string };
type VideoDoc   = { id: string; url: string; title: string; thumb: string };

export default function Dashboard() {
  const router = useRouter();



  // ── 1) Auth 상태 ────────────────────────────────
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [uid,  setUid]  = useState<string>("");

  // ── 2) 구독 데이터 상태 ───────────────────────────
  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  const [videos,   setVideos]   = useState<VideoDoc[]>([]);
  const [url,      setUrl]      = useState<string>("");


  // ── 3) onAuthStateChanged ─────────────────────────
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setUid(u.uid);
      else  router.replace("/login");
    });
    return () => unsub();
  }, [router]);

  // ── 4) 채널 구독 ───────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const col = collection(db, `users/${uid}/channels`);
    const q   = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setChannels(
        snap.docs.map(d => {
          const { url } = d.data() as { url: string };
          return { id: d.id, url };
        })
      );
    });
    return () => unsub();
  }, [uid]);

  // ── 5) 영상 구독 ───────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const col = collection(db, `users/${uid}/videos`);
    const q   = query(col, orderBy("publishedAt", "desc"));
    const unsub = onSnapshot(q, snap => {
      setVideos(
        snap.docs.map(d => {
          const data = d.data() as Omit<VideoDoc, "id">;
          return { id: d.id, ...data };
        })
      );
    });
    return () => unsub();
  }, [uid]);

  // ── 6) 채널 추가 + 영상 즉시 가져오기 ─────────────────
  const handleAdd = async () => {
    // 1) addChannel 호출
    let res;
    try {
     res = await addChannelFn({ uid, input: url.trim() });
     alert(`✅ 채널 추가 완료! id=${res.data.channelId}`);
    } catch (e: any) {
      console.error("addChannel error", e);
      alert(`❌ ${e.code || "error"}: ${e.message}\n${e.details || ""}`);
      return;
    }

    // 2) 추가된 채널 ID 로 fetchVideos 호출
    try {
      // fetchVideos 함수명과 파라미터 타입(요구에 따라 조정)
      const fetchFn = httpsCallable<
        { uid: string; channelId: string },
        { count: number }
      >(functions, "fetchVideos");

      const { data } = await fetchFn({
        uid,
        channelId: res.data.channelId,
      });

      console.log(`🎉 ${data.count}개의 영상을 Firestore에 저장했어요.`);
    } catch (e: any) {
      console.error("fetchVideos 실패", e);
      alert(`❌ fetchVideos error: ${e.message || e}`);
    }

    // 3) 입력창 비우기
    setUrl("");
  };

  // ── 6-1) 채널 삭제 ──────────────────────────────────
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, `users/${uid}/channels/${id}`));
  };

  // ── 7) 로딩 / 로그인 필요 화면 ─────────────────────
  if (user === undefined) {
    return <p className="p-8 text-center">로딩 중…</p>;
  }
  if (!uid) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
      </main>
    );
  }

  // ── 8) 최종 UI 렌더링 ─────────────────────────────
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
          <li
            key={c.id}
            className="flex justify-between items-center border px-3 py-2 rounded"
          >
            <span className="truncate">{c.url}</span>
            <button
              onClick={() => handleDelete(c.id)}
              className="text-red-500"
            >
              ✖
            </button>
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

//git add . && git commit -m "feat: blank dashboard" && git push
//git add . && git commit -m "ci: disable ESLint errors on build" && git push