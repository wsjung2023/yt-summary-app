"use client";
export const dynamic = "force-dynamic";


import { auth, provider } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function Login() {
  const router = useRouter();
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // 빌드 단계(키 없음) · 런타임(초기화 실패) 모두 대비
  const disabled = !auth || !provider;

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("로그인에 실패했습니다.");
    }
  };

  return (
    <main className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
      >
        Google로 로그인
      </button>
    </main>
  );  
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
