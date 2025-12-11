import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeString = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateString = time.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 text-sm text-gray-200">
      <p className="text-xs text-gray-400 mb-1">Current time</p>
      <p className="text-2xl font-bold tracking-wide">{timeString}</p>
      <p className="text-[11px] text-gray-400 mt-1">{dateString}</p>
    </div>
  );
}
