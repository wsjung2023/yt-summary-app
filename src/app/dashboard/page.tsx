"use client";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firestore";

export default function Dashboard() {
  const handleClick = async () => {
    await addDoc(collection(db, "test"), {
      msg: "hello from client",
      ts: Date.now(),
    });
    alert("Firestore에 문서를 썼어요!");
  };

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">안녕, 대시보드!</h1>

      <button
        onClick={handleClick}
        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
      >
        Firestore 테스트 쓰기
      </button>
    </main>
  );
}
