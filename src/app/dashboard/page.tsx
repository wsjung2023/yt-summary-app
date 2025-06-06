// src/app/dashboard/page.tsx
"use client";

// ────────────────────────────────────────────────────────────────────────────────────────────
// 1) Firebase Auth 모듈 불러오기 (클라이언트 사이드에서 로그인된 유저 UID를 얻기 위함)
//    - onAuthStateChanged를 이용하여 사용자의 로그인 상태 변화를 추적합니다.
// ────────────────────────────────────────────────────────────────────────────────────────────
import { getAuth, onAuthStateChanged, User } from "firebase/auth";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  //DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firestore";         // ← Firestore 초기화 코드 (예: initializeApp + getFirestore)
import { addChannelFn } from "@/lib/firebase"; // ← addChannelFn(클라우드 함수 호출 헬퍼)

// ────────────────────────────────────────────────────────────────────────────────────────────
// 2) 타입 정의
// ────────────────────────────────────────────────────────────────────────────────────────────
type ChannelDoc = { id: string; url: string };
type VideoDoc   = { id: string; url: string; title: string; thumb: string };

/**
 * Dashboard 페이지 컴포넌트
 *  - 로그인된 사용자가 속한 users/{uid}/channels 문서를 실시간 구독 → 채널 목록 렌더링
 *  - 로그인된 사용자가 속한 users/{uid}/videos 문서를 실시간 구독 → 최근 영상 목록 렌더링
 *  - 채널 추가 버튼 → addChannelFn 클라우드 함수 호출
 *  - 채널 삭제 버튼 → Firestore deleteDoc 호출
 */
export default function Dashboard() {
  // ─── 로그인된 사용자의 UID를 상태로 관리 ───
  const [uid, setUid] = useState<string>("");

  // ─── ① 실시간 채널 목록 ───
  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  // ─── ② 실시간 영상 목록 ───
  const [videos, setVideos] = useState<VideoDoc[]>([]);

  // ─── ③ 입력창 상태 ───
  const [url, setUrl] = useState("");

  /**
   * ───────── onAuthStateChanged 로직 ─────────
   * 로그인 상태가 바뀔 때마다 `uid`를 갱신
   *  - 로그인 성공 → user.uid (문자열)로 setUid
   *  - 로그아웃 혹은 로그인 실패 → setUid("") (빈 문자열)
   */
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid("");
      }
    });
    return () => unsubscribe();
  }, []);

  /**
   * ───────── 실시간 채널 구독 ─────────
   * uid가 빈 문자열이 아니면, users/{uid}/channels 경로를 구독
   * orderBy("createdAt", "desc") → 최신순 정렬
   */
  useEffect(() => {
    if (!uid) {
      // 아직 로그인 전이라면 채널 스트림을 초기화
      setChannels([]);
      return;
    }

    const colRef = collection(db, `users/${uid}/channels`);
    const q      = query(colRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChannelDoc[] = snapshot.docs.map((d) => {
        const data = d.data() as { url: string };
        return { id: d.id, url: data.url };
      });
      setChannels(list);
    });

    return () => unsubscribe();
  }, [uid]);

  /**
   * ───────── 실시간 영상 스트림 구독 ─────────
   * uid가 빈 문자열이 아니면, users/{uid}/videos 경로를 구독
   * orderBy("publishedAt", "desc") → 최신순 정렬
   */
  useEffect(() => {
    if (!uid) {
      setVideos([]);
      return;
    }

    const colRef = collection(db, `users/${uid}/videos`);
    const q      = query(colRef, orderBy("publishedAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      const videoList: VideoDoc[] = snap.docs.map((d) => {
        // d.data() 안에 url, title, thumb 필드가 들어 있다고 가정
        const data = d.data() as Omit<VideoDoc, "id">;
        return { id: d.id, ...data };
      });
      setVideos(videoList);
    });

    return () => unsubscribe();
  }, [uid]);

  /**
   * ───────── 채널 추가 버튼 클릭 핸들러 ─────────
   * 1) url이 공백이거나 로그인 상태가 아니면 무시
   * 2) addChannelFn({ uid, url }) 호출 → Cloud Function 에서 Firestore에 문서 생성
   * 3) 성공 시 alert, form 초기화 / 실패 시 alert 에러 메시지 표시
   */
  const handleAdd = async () => {
    if (!uid) {
      alert("❌ 채널을 추가하려면 로그인해야 합니다.");
      return;
    }
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

  /**
   * ───────── 채널 삭제 핸들러 ─────────
   * Firestore에서 users/{uid}/channels/{channelId} 문서 삭제
   * onSnapshot이 자동으로 바뀌면 화면에서 제거됨
   */
  const handleDelete = async (channelId: string) => {
    if (!uid) {
      alert("❌ 로그인 상태가 아닙니다.");
      return;
    }

    try {
      await deleteDoc(doc(db, `users/${uid}/channels/${channelId}`));
      // 삭제되면 onSnapshot 구독이 알아서 갱신됨 → 화면에서 목록 자동 제거
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : `${err}`;
      alert(`삭제 중 오류 발생: ${msg}`);
    }
  };

  /**
   * ───────── 렌더링 ─────────
   *  - uid가 아직 빈 문자열이면 “로그인 후 이용하세요” 메시지를 보여줄 수도 있고,
   *    (이 예시에서는 간단히 타이틀만 보여줍니다.)
   */
  if (!uid) {
    return (
      <main className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다.</h1>
        <p>로그인 후에 채널 목록과 영상을 확인할 수 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">내 채널 목록</h1>

      {/* ───── 입력 + 추가 버튼 ───── */}
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channel"
          className="flex-1 border px-3 py-2 rounded"
        />
        <button
          onClick={handleAdd}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          추가
        </button>
      </div>

      {/* ───── 채널 리스트 (삭제 버튼 포함) ───── */}
      <ul className="space-y-2">
        {channels.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between gap-2 border rounded px-3 py-2"
          >
            {/* 채널 URL */}
            <span className="truncate">{c.url}</span>
            {/* 삭제(X) 버튼 */}
            <button
              onClick={() => handleDelete(c.id)}
              className="text-red-500 font-bold px-2 py-1 hover:bg-red-100 rounded transition"
            >
              ✖
            </button>
          </li>
        ))}
      </ul>

      {/* ───── 최근 영상 목록 ───── */}
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
