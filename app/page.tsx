"use client";

import { useState } from "react";

export default function Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function send() {
    if (!input) return;

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
    setOutput(data.final);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🔮 Satya AI (3 AI)</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste news / link / ask anything..."
        style={{ width: "100%", height: 120 }}
      />

      <button onClick={send}>Analyze / Chat</button>

      <pre style={{ whiteSpace: "pre-wrap", marginTop: 20 }}>
        {output}
      </pre>

      <div style={{ marginTop: 40 }}>
        <p>📧 anmolsingh979299@gmail.com</p>
        <p>📸 @iamanmolsingh07</p>
      </div>
    </div>
  );
}