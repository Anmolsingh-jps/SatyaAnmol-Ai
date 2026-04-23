export default function InputBox({ value, setValue, onSubmit }: any) {
  return (
    <>
      <input
        className="w-full max-w-xl p-4 bg-white/10 rounded border border-white/20"
        placeholder="Paste reel / news..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button
        onClick={onSubmit}
        className="mt-4 px-6 py-2 bg-purple-600 rounded"
      >
        Analyze
      </button>
    </>
  );
}