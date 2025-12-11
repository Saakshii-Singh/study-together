import { useEffect, useState } from "react";

const QUOTES = [
  "Small consistent steps beat big inconsistent efforts.",
  "You don’t need more time, you need more focus.",
  "One focused hour can beat a whole distracted day.",
  "Discipline is just remembering what you really want.",
  "Done is better than perfect. Just start.",
  "Future you is watching. Don’t disappoint her.",
  "If it takes 5 minutes, do it now.",
  "You’re one deep session away from feeling proud of yourself.",
];

function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

export default function MotivationQuote() {
  const [quote, setQuote] = useState(randomQuote);

  const refresh = () => setQuote(randomQuote());

  // change quote every time component mounts (already does)
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 text-sm text-gray-200 flex flex-col justify-between">
      <div>
        <p className="text-xs text-gray-400 mb-1">Motivation for you 💫</p>
        <p className="text-sm">{quote}</p>
      </div>
      <button
        type="button"
        onClick={refresh}
        className="mt-3 self-end text-[11px] text-blue-400 hover:text-blue-300"
      >
        New quote →
      </button>
    </div>
  );
}
