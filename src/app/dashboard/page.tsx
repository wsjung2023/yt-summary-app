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
  const [user, setUser] = useState<User| null | undefined>(undefined);
  const [uid,  setUid]  = useState<string>("");

  const [channels, setChannels] = useState<ChannelDoc[]>([]);
  const [videos,   setVideos]   = useState<VideoDoc[]>([]);
  const [url,      setUrl]      = useState<string>("");

  // ─── 1) auth listener ─────────────────────────────────
  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (!u) router.replace("/login");
      else  setUid(u.uid);
    });
  }, [router]);

  // ─── 2) channel subscription ────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, `users/${uid}/channels`),
      orderBy("createdAt","desc")
    );
    return onSnapshot(q, snap => {
      setChannels(snap.docs.map(d => {
        const {url} = d.data() as {url:string};
        return {id:d.id, url};
      }));
    });
  }, [uid]);

  // ─── 3) video subscription ──────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, `users/${uid}/videos`),
      orderBy("publishedAt","desc")
    );
    return onSnapshot(q, snap => {
      setVideos(snap.docs.map(d => {
        const data = d.data() as Omit<VideoDoc,"id">;
        return { id:d.id, ...data };
      }));
    });
  }, [uid]);

  // ─── 4) now your rendering guards ────────────────────────
  if (user === undefined) {
    return <p className="p-8 text-center">로딩중…</p>;
  }
  if (!uid) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-bold">로그인이 필요합니다.</h1>
        <p>로그인 후에 채널과 영상을 확인할 수 있어요.</p>
      </main>
    );
  }

  // ─── 5) final JSX ───────────────────────────────────────
  return (
    <main className="p-8 space-y-6 max-w-xl mx-auto">
      {/* … 나머지 UI … */}
    </main>
  );
}
