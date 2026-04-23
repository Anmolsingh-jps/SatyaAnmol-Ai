export default function ResultCard({ title, value }: any) {
  return (
    <div className="bg-white/10 p-4 rounded border border-white/20">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-sm mt-1">{value}</p>
    </div>
  );
}