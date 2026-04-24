"use client";
import { useState, useRef, useEffect } from "react";

export default function SatyaAI() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<any>(null);
  const [fileB64, setFileB64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanPos, setScanPos] = useState(0);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    let interval: any;
    if (analyzing) interval = setInterval(() => setScanPos(p => (p + 2) % 101), 30);
    else setScanPos(0);
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
    setAnalyzing(true); setResult(null);
    try {
      const res = await fetch("/api/satya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, fileData: fileB64, fileMimeType: file?.type }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) { alert("Server Error"); } 
    finally { setAnalyzing(false); }
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white p-6 font-sans">
      <div className="max-w-xl mx-auto pt-10 space-y-8">
        <header className="text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent italic">SATYA AI</h1>
          <p className="text-[10px] tracking-[0.4em] text-gray-500 mt-2 font-bold uppercase">Web Developed by Anmol Singh</p>
        </header>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-2 shadow-2xl">
          <textarea className="w-full bg-transparent p-4 min-h-[140px] outline-none text-lg resize-none" placeholder="Paste Link or Ask Satya..." value={text} onChange={(e) => setText(e.target.value)} />
          <div onClick={() => fileRef.current.click()} className="relative border-t border-white/10 p-5 text-center cursor-pointer hover:bg-white/10 transition-all rounded-b-3xl overflow-hidden">
            {analyzing && <div style={{ top: `${scanPos}%` }} className="absolute left-0 right-0 h-[2px] bg-purple-500 shadow-[0_0_15px_purple] z-20" />}
            <input type="file" ref={fileRef} className="hidden" onChange={(e) => processFile(e.target.files![0])} />
            <span className="text-sm text-gray-400">{file ? `✅ ${file.name}` : "📁 Upload Photo/Video"}</span>
          </div>
        </div>

        <button onClick={handleAnalyze} disabled={analyzing} className="w-full py-5 bg-purple-600 rounded-full font-black text-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50">
          {analyzing ? "ANALYZING WORLDWIDE..." : "VERIFY TRUTH"}
        </button>

        {result && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className={`p-6 rounded-3xl border ${result.verdict === 'FAKE' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{result.verdict}</span>
              <p className="text-xl mt-2 leading-relaxed">{result.reply}</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl">
              <h3 className="text-blue-400 font-bold text-xs uppercase mb-2">🚀 Viral Strategy Kit</h3>
              <p className="text-sm italic text-gray-300">"{result.viralKit?.caption}"</p>
              <div className="mt-3 text-blue-300 text-xs font-mono">{result.viralKit?.hashtags}</div>
            </div>
          </div>
        )}
      </div>
      <footer className="text-center mt-10 opacity-20 text-[10px] uppercase tracking-widest">Engineered by Anmol Singh</footer>
    </div>
  );
}
