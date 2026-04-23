"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!query) return;

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-3xl mb-6 text-purple-400">
        Satya AI ⚡
      </h1>

      <input
        className="w-full max-w-xl p-3 bg-white/10 rounded"
        placeholder="Paste reel / news..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        onClick={submit}
        className="mt-3 px-6 py-2 bg-purple-600 rounded"
      >
        Analyze
      </button>

      {result && (
        <div className="mt-6 w-full max-w-xl space-y-3">

          <Box t="Verdict" v={result.verdict} />
          <Box t="Analysis" v={result.main_response} />
          <Box t="Fix" v={result.fix} />
          <Box t="Script" v={result.reel_script} />
          <Box t="Caption" v={result.viralKit.caption} />

        </div>
      )}

    </main>
  );
}

function Box({ t, v }: any) {
  return (
    <div className="bg-white/10 p-3 rounded">
      <p className="text-gray-400 text-sm">{t}</p>
      <p className="text-sm">{v}</p>
    </div>
  );
}