import { useState, useRef, useCallback, useEffect } from "react";

/* ─── Google Fonts ─── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
document.head.appendChild(fontLink);

/* ─── CSS Keyframes injected once ─── */
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes scan { 0%{top:-4px} 100%{top:100%} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes fadeSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 8px #a855f750} 50%{box-shadow:0 0 24px #a855f790} }
  @keyframes barFill { from{width:0%} to{width:var(--w)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.6} 94%{opacity:1} }
  .satya-card { animation: fadeSlideIn 0.4s ease forwards; }
  .analyze-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 0 32px #a855f760 !important; }
  .hashtag:hover { background:rgba(168,85,247,0.25) !important; transform:scale(1.04); }
  .model-tab:hover { border-color:rgba(168,85,247,0.4) !important; }
  .copy-btn:hover { background:rgba(168,85,247,0.3) !important; }
  ::placeholder { color:#4b5563; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:#0a0a0f; }
  ::-webkit-scrollbar-thumb { background:#3d2060; border-radius:4px; }
`;
document.head.appendChild(styleEl);

/* ─── Constants ─── */
const PURPLE = "#a855f7";
const PURPLE_DIM = "rgba(168,85,247,0.12)";
const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const GRAY = "#6b7280";

const MODELS = {
  claude: {
    id: "claude",
    name: "Claude 3.5 Sonnet",
    badge: "ANTHROPIC",
    accent: "#a855f7",
    icon: "◈",
    desc: "Deep reasoning & nuanced analysis",
    persona:
      "You are Claude 3.5 Sonnet by Anthropic — precise, thoughtful, and analytical. You excel at nuanced reasoning, catching subtle misinformation, and providing well-sourced explanations.",
  },
  gpt: {
    id: "gpt",
    name: "GPT-4o-mini",
    badge: "OPENAI",
    accent: "#10b981",
    icon: "◎",
    desc: "Fast, efficient fact verification",
    persona:
      "You are GPT-4o-mini by OpenAI — efficient, clear, and data-driven. You provide concise fact-checks with rapid cross-referencing. Respond in OpenAI's characteristic direct, structured style.",
  },
  gemini: {
    id: "gemini",
    name: "Gemini Flash",
    badge: "GOOGLE",
    accent: "#3b82f6",
    icon: "◇",
    desc: "Multimodal & visual analysis",
    persona:
      "You are Gemini 2.0 Flash by Google DeepMind — multimodal and visually intelligent. You excel at analyzing both text and visual content for misinformation, deepfakes, and manipulated media. Respond in Google's precise, knowledge-graph-aware style.",
  },
};

const buildSystemPrompt = (persona) => `${persona}

You power Satya AI, a multi-model fact-checking engine. Analyze submitted content (text, image, or both) and return ONLY a valid JSON object — no markdown fences, no preamble.

Return EXACTLY this structure:
{
  "isReal": true or false,
  "confidence": integer 0-100,
  "verdict": "REAL" or "FAKE" or "MISLEADING" or "UNVERIFIED",
  "reasoning": "2-3 sentence detailed analysis explaining your verdict",
  "redFlags": ["specific red flag 1", "specific red flag 2"],
  "suggestions": {
    "hook": "A specific, compelling opening hook idea for this content as a video/reel",
    "lighting": "A precise, actionable lighting improvement tip",
    "editing": "A specific editing or pacing suggestion",
    "contentTips": ["creative tip 1", "growth tip 2", "engagement tip 3"]
  },
  "viralKit": {
    "caption": "A high-engagement, platform-native caption (2-3 sentences with relevant emojis)",
    "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10"]
  }
}`;

/* ─── Verdict helpers ─── */
const verdictMeta = {
  REAL:        { color: GREEN,  icon: "✓", label: "VERIFIED REAL" },
  FAKE:        { color: RED,    icon: "✗", label: "DETECTED FAKE" },
  MISLEADING:  { color: AMBER,  icon: "⚠", label: "MISLEADING" },
  UNVERIFIED:  { color: GRAY,   icon: "?", label: "UNVERIFIED" },
};

/* ─── Main Component ─── */
export default function SatyaAI() {
  const [model, setModel] = useState("claude");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);         // File object
  const [fileB64, setFileB64] = useState(null);   // base64 string
  const [fileMime, setFileMime] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState("");
  const fileRef = useRef(null);
  const scanRef = useRef(null);

  /* scanning animation during analysis */
  useEffect(() => {
    if (analyzing) {
      let p = 0;
      scanRef.current = setInterval(() => {
        p = (p + 1) % 101;
        setScanPos(p);
      }, 20);
    } else {
      clearInterval(scanRef.current);
      setScanPos(0);
    }
    return () => clearInterval(scanRef.current);
  }, [analyzing]);

  const processFile = useCallback((f) => {
    if (!f) return;
    const valid = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/webm"];
    if (!valid.includes(f.type)) { setError("Supported: JPEG · PNG · GIF · WEBP · MP4 · WEBM"); return; }
    setFile(f); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileB64(e.target.result.split(",")[1]);
      setFileMime(f.type);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const copyText = (str, key) => {
    navigator.clipboard?.writeText(str).then(() => {
      setCopied(key); setTimeout(() => setCopied(""), 2000);
    });
  };

  const analyze = async () => {
    if (!text.trim() && !file) { setError("Enter text or upload a file to fact-check."); return; }
    setAnalyzing(true); setResult(null); setError(null);

    try {
      const m = MODELS[model];
      const contentParts = [];

      /* attach image if present */
      if (fileB64 && fileMime?.startsWith("image/")) {
        contentParts.push({ type: "image", source: { type: "base64", media_type: fileMime, data: fileB64 } });
      }

      const userText = text.trim()
        ? `Fact-check this content: "${text}"${fileB64 ? " (also analyze the attached image)" : ""}`
        : "Fact-check the attached visual content for authenticity and misinformation.";

      if (fileMime?.startsWith("video/")) {
        contentParts.push({ type: "text", text: `${userText}\n\n[NOTE: A video file was attached. Analyze based on the described context and any visible metadata cues, noting that direct video frame analysis would require the Gemini API.]` });
      } else {
        contentParts.push({ type: "text", text: userText });
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(m.persona),
          messages: [{ role: "user", content: contentParts }],
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || `API ${res.status}`);
      }

      const data = await res.json();
      const raw = data.content.map((b) => b.text || "").join("");
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult({ ...parsed, _model: m });

    } catch (err) {
      setError(err instanceof SyntaxError ? "Failed to parse AI response — please retry." : err.message || "Unknown error.");
    } finally {
      setAnalyzing(false);
    }
  };

  const M = MODELS[model];
  const vm = result ? verdictMeta[result.verdict] || verdictMeta.UNVERIFIED : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070710",
      backgroundImage: `
        radial-gradient(ellipse 80% 60% at 50% -10%, rgba(88,28,135,0.18) 0%, transparent 70%),
        url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.025'%3E%3Cpath d='M0 0h40v1H0zM0 0v40h1V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
      `,
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      padding: "24px 20px 60px",
    }}>

      {/* ── Header ── */}
      <header style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", marginBottom: "10px" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg,#6d28d9,#a855f7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 0 28px rgba(168,85,247,0.45)",
            animation: "flicker 8s infinite",
          }}>🔮</div>
          <h1 style={{
            margin: 0, fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(1.8rem,5vw,2.6rem)", fontWeight: 900, letterSpacing: "0.12em",
            background: "linear-gradient(90deg,#c084fc,#a855f7,#7c3aed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>SATYA AI</h1>
        </div>
        <p style={{ margin: "0 0 14px", color: "#6b7280", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", letterSpacing: "0.18em" }}>
          MULTI-MODEL · FACT-CHECKING · POWERHOUSE
        </p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
          {["🔍 Fact-Check","🎬 Video Optimize","🚀 Viral Kit","🖼️ Image Analysis"].map(t => (
            <span key={t} style={{
              background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)",
              borderRadius: 20, padding: "3px 13px", fontSize: "0.72rem", color: "#c084fc",
              fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── Model Selector ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 18, padding: 8,
        }}>
          {Object.values(MODELS).map(m => {
            const active = model === m.id;
            return (
              <button key={m.id} className="model-tab"
                onClick={() => { setModel(m.id); setResult(null); setError(null); }}
                style={{
                  border: active ? `1px solid ${m.accent}50` : "1px solid transparent",
                  background: active ? `${m.accent}14` : "transparent",
                  borderRadius: 12, padding: "12px 8px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.2s",
                }}>
                <span style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "0.58rem", fontWeight: 600,
                  letterSpacing: "0.12em", padding: "2px 9px", borderRadius: 6,
                  background: active ? m.accent : "rgba(255,255,255,0.05)",
                  color: active ? "#fff" : "#6b7280",
                }}>{m.badge}</span>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: active ? m.accent : "#9ca3af" }}>{m.name}</span>
                <span style={{ fontSize: "0.7rem", color: "#4b5563", textAlign: "center" }}>{m.desc}</span>
              </button>
            );
          })}
        </div>

        {/* ── Text Input ── */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <textarea value={text} onChange={e => setText(e.target.value)}
            placeholder="Paste a news headline, article, tweet, or video description to fact-check…"
            style={{
              width: "100%", minHeight: 120, background: "transparent", border: "none",
              outline: "none", padding: "16px", color: "#e2e8f0", fontSize: "0.93rem",
              resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", lineHeight: 1.65,
            }}
          />
        </div>

        {/* ── Upload Zone ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? PURPLE : "rgba(168,85,247,0.25)"}`,
            borderRadius: 16, padding: "28px 20px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(168,85,247,0.07)" : "rgba(255,255,255,0.015)",
            transition: "all 0.2s", position: "relative", overflow: "hidden",
          }}>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }}
            onChange={e => processFile(e.target.files[0])} />

          {/* scan line overlay when analyzing */}
          {analyzing && (
            <div style={{
              position: "absolute", top: `${scanPos}%`, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg,transparent,#a855f7,transparent)", pointerEvents: "none",
            }} />
          )}

          {file ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {fileMime?.startsWith("image/") && fileB64 ? (
                <img src={`data:${fileMime};base64,${fileB64}`} alt="Uploaded preview"
                  style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 10, objectFit: "contain",
                    boxShadow: "0 0 24px rgba(168,85,247,0.2)" }} />
              ) : (
                <div style={{ fontSize: 48 }}>🎥</div>
              )}
              <p style={{ color: PURPLE, fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>{file.name}</p>
              <p style={{ color: "#4b5563", fontSize: "0.75rem", margin: 0 }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB · {fileMime}
              </p>
              <button onClick={e => { e.stopPropagation(); setFile(null); setFileB64(null); setFileMime(null); }}
                style={{
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.28)",
                  color: "#f87171", borderRadius: 8, padding: "4px 14px", cursor: "pointer", fontSize: "0.78rem",
                }}>✕ Remove</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 34, marginBottom: 10, opacity: 0.7 }}>📁</div>
              <p style={{ color: "#9ca3af", margin: "0 0 4px", fontWeight: 500, fontSize: "0.9rem" }}>
                Drop image or video here, or <span style={{ color: PURPLE }}>browse</span>
              </p>
              <p style={{ color: "#4b5563", fontSize: "0.75rem", margin: 0 }}>
                JPEG · PNG · WEBP · GIF · MP4 · WEBM &nbsp;•&nbsp; Gemini Flash excels at visual deepfake detection
              </p>
            </>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: 12, padding: "12px 16px", color: "#fca5a5", fontSize: "0.88rem",
          }}>⚠️ {error}</div>
        )}

        {/* ── Analyze Button ── */}
        <button className="analyze-btn" onClick={analyze} disabled={analyzing}
          style={{
            width: "100%", padding: "16px 24px",
            background: analyzing
              ? "rgba(168,85,247,0.2)"
              : `linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #7c3aed 100%)`,
            border: analyzing ? "1px solid rgba(168,85,247,0.3)" : "none",
            borderRadius: 13, color: "#fff", fontSize: "1rem", fontWeight: 700,
            cursor: analyzing ? "not-allowed" : "pointer",
            letterSpacing: "0.06em", transition: "all 0.25s",
            boxShadow: analyzing ? "none" : "0 0 24px rgba(168,85,247,0.35)",
            fontFamily: "'Orbitron',sans-serif",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
          {analyzing ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "1.1rem" }}>⚡</span>
              SCANNING WITH {M.badge}…
            </>
          ) : (
            <>{M.icon} ANALYZE WITH {M.badge}</>
          )}
        </button>

        {/* ─────── RESULTS ─────── */}
        {result && vm && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Verdict */}
            <div className="satya-card" style={{
              background: `${vm.color}0d`, border: `1px solid ${vm.color}35`,
              borderRadius: 18, padding: "24px 28px", position: "relative", overflow: "hidden",
            }}>
              {/* corner accent */}
              <div style={{
                position: "absolute", top: 0, right: 0, width: 80, height: 80,
                background: `radial-gradient(circle at top right, ${vm.color}20, transparent 70%)`,
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* big verdict icon */}
                <div style={{ textAlign: "center", minWidth: 90 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%", margin: "0 auto 10px",
                    background: `${vm.color}18`, border: `2px solid ${vm.color}60`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 32, color: vm.color, fontWeight: 900,
                    boxShadow: `0 0 20px ${vm.color}30`,
                  }}>{vm.icon}</div>
                  <div style={{
                    background: `${vm.color}20`, border: `1px solid ${vm.color}40`,
                    borderRadius: 8, padding: "4px 10px",
                    color: vm.color, fontFamily: "'JetBrains Mono',monospace",
                    fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                  }}>{vm.label}</div>
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  {/* Confidence bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                      CONFIDENCE
                    </span>
                    <div style={{ flex: 1, height: 7, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${result.confidence}%`,
                        background: `linear-gradient(90deg, ${vm.color}99, ${vm.color})`,
                        borderRadius: 4, transition: "width 1.2s ease",
                      }} />
                    </div>
                    <span style={{ color: vm.color, fontWeight: 800, fontSize: "0.9rem", fontFamily: "'JetBrains Mono',monospace", minWidth: 40 }}>
                      {result.confidence}%
                    </span>
                  </div>

                  <p style={{ color: "#cbd5e1", margin: "0 0 10px", lineHeight: 1.65, fontSize: "0.88rem" }}>
                    {result.reasoning}
                  </p>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "3px 10px", fontSize: "0.7rem", color: "#6b7280",
                    fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    <span style={{ color: result._model.accent }}>{result._model.icon}</span>
                    {result._model.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {result.redFlags?.length > 0 && (
              <div className="satya-card" style={{
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 16, padding: "20px 24px",
              }}>
                <h3 style={{ margin: "0 0 14px", fontSize: "0.82rem", fontFamily: "'JetBrains Mono',monospace",
                  color: "#f87171", letterSpacing: "0.12em" }}>🚩 RED FLAGS DETECTED</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.redFlags.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 10, alignItems: "flex-start",
                      background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "10px 14px",
                    }}>
                      <span style={{ color: "#f87171", flexShrink: 0, fontWeight: 700 }}>→</span>
                      <span style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Optimization */}
            <div className="satya-card" style={{
              background: PURPLE_DIM, border: `1px solid rgba(168,85,247,0.2)`,
              borderRadius: 16, padding: "20px 24px",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "0.82rem", fontFamily: "'JetBrains Mono',monospace",
                color: "#c084fc", letterSpacing: "0.12em" }}>🎬 VIDEO OPTIMIZATION</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                {[
                  { key: "hook",    icon: "🎣", label: "HOOK",     val: result.suggestions?.hook },
                  { key: "light",   icon: "💡", label: "LIGHTING", val: result.suggestions?.lighting },
                  { key: "edit",    icon: "✂️", label: "EDITING",  val: result.suggestions?.editing },
                ].map(s => s.val && (
                  <div key={s.key} style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(168,85,247,0.12)",
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{ fontSize: "0.68rem", fontFamily: "'JetBrains Mono',monospace",
                      color: "#9333ea", letterSpacing: "0.12em", marginBottom: 8 }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: "0.84rem", lineHeight: 1.6 }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {result.suggestions?.contentTips?.length > 0 && (
                <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.suggestions.contentTips.map((tip, i) => (
                    <span key={i} style={{
                      background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.22)",
                      borderRadius: 8, padding: "5px 13px", fontSize: "0.78rem", color: "#c084fc",
                    }}>💡 {tip}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Viral Growth Kit */}
            <div className="satya-card" style={{
              background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 16, padding: "20px 24px",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "0.82rem", fontFamily: "'JetBrains Mono',monospace",
                color: "#6ee7b7", letterSpacing: "0.12em" }}>🚀 VIRAL GROWTH KIT</h3>

              {/* Caption */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(16,185,129,0.12)",
                borderRadius: 12, padding: "16px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: "0.68rem", fontFamily: "'JetBrains Mono',monospace",
                    color: "#059669", letterSpacing: "0.12em" }}>✍️ CAPTION</span>
                  <button className="copy-btn"
                    onClick={() => copyText(result.viralKit?.caption || "", "caption")}
                    style={{
                      background: copied === "caption" ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "3px 12px",
                      color: "#6ee7b7", cursor: "pointer", fontSize: "0.72rem", transition: "background 0.2s",
                    }}>
                    {copied === "caption" ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.7, fontSize: "0.88rem" }}>
                  {result.viralKit?.caption}
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <div style={{ fontSize: "0.68rem", fontFamily: "'JetBrains Mono',monospace",
                  color: "#059669", letterSpacing: "0.12em", marginBottom: 10 }}>#️⃣ HASHTAGS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.viralKit?.hashtags?.map((h, i) => (
                    <span key={i} className="hashtag"
                      onClick={() => copyText(h, `h${i}`)}
                      title="Click to copy"
                      style={{
                        background: copied === `h${i}` ? "rgba(16,185,129,0.28)" : "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.22)", borderRadius: 8,
                        padding: "5px 13px", fontSize: "0.8rem", color: "#6ee7b7",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>{h}</span>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <button className="copy-btn"
                    onClick={() => copyText((result.viralKit?.hashtags || []).join(" "), "all")}
                    style={{
                      background: copied === "all" ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "6px 16px",
                      color: "#6ee7b7", cursor: "pointer", fontSize: "0.78rem", transition: "background 0.2s",
                    }}>
                    {copied === "all" ? "✓ All Copied!" : "📋 Copy All Hashtags"}
                  </button>
                </div>
              </div>
            </div>

            {/* Raw JSON toggle */}
            <details style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "12px 16px",
            }}>
              <summary style={{ color: "#4b5563", fontSize: "0.78rem", cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.08em" }}>
                {"{ } "} VIEW RAW JSON RESPONSE
              </summary>
              <pre style={{
                marginTop: 12, color: "#6b7280", fontSize: "0.72rem", overflowX: "auto",
                fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6,
              }}>{JSON.stringify(result, null, 2)}</pre>
            </details>

          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", marginTop: 48, color: "#1f2937",
        fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.1em",
      }}>
        SATYA AI · MULTI-MODEL FACT-CHECKING · POWERED BY CLAUDE · GPT-4O-MINI · GEMINI FLASH
      </div>
    </div>
  );
}
