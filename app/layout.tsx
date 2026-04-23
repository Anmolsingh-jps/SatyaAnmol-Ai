"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!query) return alert("Enter something");

    setLoading(true);

    const res = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    setResult(data);

    setLoading(false);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>🔥 Satya AI</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste reel / news..."
        style={{ padding: 10, width: 300 }}
      />

      <br />

      <button onClick={submit} style={{ marginTop: 10 }}>
        Analyze
      </button>

      {loading && <p>Analyzing...</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <p><b>Verdict:</b> {result.verdict}</p>
          <p><b>Analysis:</b> {result.main_response}</p>
          <p><b>Fix:</b> {result.fix}</p>
          <p><b>Caption:</b> {result.viralKit?.caption}</p>
        </div>
      )}
    </main>
  );
}