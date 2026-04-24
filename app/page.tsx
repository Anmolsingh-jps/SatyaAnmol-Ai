"use client";

import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input) return;

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: input
        })
      });

      const data = await res.json();
      setOutput(data.final || data.reply || "No response");
    } catch (err) {
      setOutput("❌ Error fetching response");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070710",
        color: "#fff",
        padding: 20,
        fontFamily: "sans-serif"
      }}
    >
      <h1>🔮 Satya AI</h1>

      <p style={{ color: "#aaa" }}>
        Paste news, link, ya koi bhi question — AI analyze karega
      </p>

      {/* INPUT */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste news, link ya kuch bhi..."
        style={{
          width: "100%",
          height: 120,
          padding: 10,
          borderRadius: 8,
          border: "none",
          marginTop: 10
        }}
      />

      {/* BUTTON */}
      <button
        onClick={handleSend}
        style={{
          marginTop: 10,
          padding: "10px 20px",
          background: "#a855f7",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer"
        }}
      >
        {loading ? "Analyzing..." : "Analyze / Chat"}
      </button>

      {/* OUTPUT */}
      <div
        style={{
          marginTop: 20,
          whiteSpace: "pre-wrap",
          background: "#111",
          padding: 15,
          borderRadius: 10
        }}
      >
        {output}
      </div>

      {/* CONTACT */}
      <div style={{ marginTop: 40 }}>
        <p>📧 anmolsingh979299@gmail.com</p>
        <p>📸 @iamanmolsingh07</p>
      </div>
    </div>
  );
}