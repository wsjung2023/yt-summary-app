"use client";
export const dynamic = "force-dynamic";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  // 빌드 단계(키 없음) · 런타임(초기화 실패) 모두 대비
  const disabled = !auth || !provider;

  return (
    <main className="h-screen flex items-center justify-center">
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
        disabled={disabled}
        onClick={async () => {
          if (disabled) return;                    // 런타임 가드
          await signInWithPopup(auth!, provider!); // `!` ← non-null 단언
          router.push("/dashboard");
        }}
      >
        Google 계정으로 로그인
      </button>
    </main>
  );
}
