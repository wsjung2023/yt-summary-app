export const dynamic = "force-dynamic";

"use client";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  return (
    <main className="h-screen flex items-center justify-center">
      <button
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold"
        onClick={async () => {
          await signInWithPopup(auth, provider);
          router.push("/dashboard");
        }}
      >
        Google 계정으로 로그인
      </button>
    </main>
  );
}
