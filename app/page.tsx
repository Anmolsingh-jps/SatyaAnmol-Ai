"use client";
import { useState, useRef, useEffect } from "react";

/* ─── Global Styles & Animations ─── */
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes scan { 0%{top:-4px} 100%{top:100%} }
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    .satya-card { animation: fadeSlideIn 0.4s ease forwards; }
    .analyze-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 0 32px #a855f760 !important; }
    .hashtag:hover { background:rgba(168,85,247,0.25) !important; transform:scale(1.04); }
  `;
  document.head.appendChild(styleEl);
}

const MODELS = {
  gemini: { id: "gemini", name: "Gemini 2.0", badge: "GOOGLE", accent: "#3b82f6" },
  gpt: { id: "gpt", name: "GPT-4o", badge: "OPENAI", accent: "#10b981" },
  claude: { id: "claude", name: "Claude 3.5", badge: "SONNET", accent: "#a855f7" },
};

export default function SatyaAI() {
  const [model, setModel] = useState("gemini");
  const [text, setText] = useState("");
  const [file, setFile] = useState<any>(null);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      interval = setInterval(() => setScanPos(p => (p + 1) % 101), 20);
    } else {
      setScanPos(0);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const processFile = (f: File) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e: any) => setFileB64(e.target.result.split(",")[1]);
    reader.readAsDataURL(f);
  };

  const handleAnalyze = async () => {
    if (!text && !file) { setError("Bhai, kuch likho ya image/video upload karo!"); return; }
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch("/api/satya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, fileData: fileB64, fileMimeType: file?.type, selectedModel: model }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.reply || "Error");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070710] text-[#e2e8f0] p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">SATYA AI PRO</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest">Global Truth Engine by Anmol Singh</p>
        </header>

        <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {Object.values(MODELS).map((m) => (
            <button key={m.id} onClick={() => setModel(m.id)} className={`py-3 rounded-xl transition-all text-sm font-bold flex flex-col items-center ${model === m.id ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-white/5"}`}>
              <span className="text-[10px] opacity-70 mb-1">{m.badge}</span>
              {m.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[120px] outline-none focus:border-purple-500" placeholder="Paste link or text to verify..." value={text} onChange={(e) => setText(e.target.value)} />
          <div onClick={() => fileRef.current.click()} className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:bg-white/5 overflow-hidden">
            {analyzing && <div style={{ top: `${scanPos}%` }} className="absolute left-0 right-0 h-1 bg-purple-500 shadow-[0_0_15px_#a855f7]" />}
            <input type="file" ref={fileRef} className="hidden" onChange={(e) => processFile(e.target.files![0])} />
            <div className={file ? "text-purple-400" : "text-gray-500"}>{file ? `✓ ${file.name}` : "Upload Media"}</div>
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={analyzing} className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-bold text-lg analyze-btn disabled:opacity-50">
          {analyzing ? "SCANNING..." : "ANALYZE & VERIFY"}
        </button>

        {result && (
          <div className="satya-card space-y-4">
            <div className={`p-6 rounded-3xl border ${result.verdict === 'FAKE' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-400 uppercase">Verdict</span><span className={`px-3 py-1 rounded-full text-xs font-black ${result.verdict === 'FAKE' ? 'bg-red-500' : 'bg-green-500'}`}>{result.verdict}</span></div>
              <p className="text-lg">{result.reply}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
              <h3 className="text-purple-400 font-bold text-sm uppercase tracking-widest">🚀 Viral Kit</h3>
              <div className="bg-black/40 p-4 rounded-xl text-sm italic text-gray-300">"{result.viralKit?.caption}"</div>
              <div className="flex flex-wrap gap-2">{result.viralKit?.hashtags?.split(" ").map((h: string, i: number) => (<span key={i} className="hashtag px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300">{h}</span>))}</div>
            </div>
          </div>
        )}

        <footer className="text-center py-10 opacity-30 text-[10px] uppercase tracking-[0.2em]">Engineered by Anmol Singh</footer>
      </div>
    </div>
  );
}
