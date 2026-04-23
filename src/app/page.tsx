"use client";

import { useState } from "react";
import InputBox from "@/components/InputBox";
import Loader from "@/components/Loader";
import ResultCard from "@/components/ResultCard";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!query) return alert("Enter something");

    setLoading(true);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    setResult(data);

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-4xl text-purple-400 mb-6">
        Satya AI ⚡
      </h1>

      <InputBox value={query} setValue={setQuery} onSubmit={submit} />

      {loading && <Loader />}

      {result && (
        <div className="mt-6 w-full max-w-xl space-y-4">

          <ResultCard title="🔥 Verdict" value={result.verdict} />
          <ResultCard title="📊 Analysis" value={result.main_response} />
          <ResultCard title="🧠 Fix" value={result.fix} />
          <ResultCard title="🎬 Script" value={result.reel_script} />
          <ResultCard title="🚀 Caption" value={result.viralKit.caption} />
          <ResultCard title="🏷 Hashtags" value={result.viralKit.hashtags} />

        </div>
      )}
    </main>
  );
}