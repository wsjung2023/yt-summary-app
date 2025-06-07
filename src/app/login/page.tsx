// src/app/login/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 🔥 라이브러리 초기화 코드에서 내보낸 auth/provider 가져오기
import { auth as _auth, provider as _provider } from "@/lib/firebase";
// ↳ lib/firebase.ts 에는 initializeApp() 후에
//    export const auth     = getAuth(app);
//    export const provider = new GoogleAuthProvider();
//    이렇게 정의해 두셨다고 가정합니다.

import {
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";

export default function Login() {
  const router = useRouter();

  const auth = _auth!;         // non-null assertion“내가 보장할게, 절대 undefined가 아니야!”
  const provider = _provider!;

  // 빌드 단계(키 없음)·런타임(초기화 실패) 모두 대비
  const disabled = !auth || !provider;

  // 이미 로그인된 유저라면 /dashboard 로 보내기
  useEffect(() => {
    // onAuthStateChanged 첫 번째 인자는 auth 인스턴스,
    // 두 번째 인자는 (user: User | null) => void 콜백입니다.
    const unsubscribe = onAuthStateChanged(auth, (u: User | null) => {
      if (u) {
        router.replace("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    if (disabled) return;
    try {
      // 여기서 auth, provider 를 실제로 사용해야 unused-vars 에러가 사라집니다.
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("로그인 실패: " + msg);
    }
  };

  return (
    <main className="p-8 h-screen flex items-center justify-center">
      <button
        onClick={handleLogin}
        disabled={disabled}
        className="bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold"
      >
        Google 계정으로 로그인
      </button>
    </main>
  );
}
