"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!query) return alert("Enter something");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Error");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error");
    }

    setLoading(false);
  };

  return (
    <main style={{ padding: 20, maxWidth: 700, margin: "auto" }}>
      <h1 style={{ color: "#a855f7" }}>⚡ Satya AI</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste reel / news..."
        style={{
          padding: 10,
          width: "100%",
          marginTop: 10,
          background: "#111",
          color: "#fff",
          border: "1px solid #333",
        }}
      />

      <button
        onClick={submit}
        style={{
          marginTop: 10,
          padding: 10,
          background: "#7c3aed",
          color: "#fff",
          border: "none",
        }}
      >
        Analyze
      </button>

      {loading && <p>Analyzing...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <Card t="🔥 Verdict" v={result.verdict} />
          <Card t="📊 Analysis" v={result.main_response} />
          <Card t="🧠 Fix" v={result.fix} />
          <Card t="🎬 Script" v={result.reel_script} />
          <Card t="🚀 Caption" v={result.viralKit?.caption} />
          <Card t="🏷 Hashtags" v={result.viralKit?.hashtags} />
        </div>
      )}
    </main>
  );
}

function Card({ t, v }: any) {
  return (
    <div style={{ marginTop: 10, padding: 10, background: "#111", border: "1px solid #333" }}>
      <b>{t}</b>
      <p>{v}</p>
    </div>
  );
}