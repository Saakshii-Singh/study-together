import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useEffect, useState } from "react";

export default function Home() {
  const { theme } = useTheme();
  const [quote, setQuote] = useState("");
  const [time, setTime] = useState("");

  // Motivational quotes
  const quotes = [
    "Stay focused. Consistency is the secret ingredient.",
    "Small progress is still progress — keep going!",
    "Discipline beats motivation every single day.",
    "One hour of focus can change your entire day.",
    "Success is built in quiet, focused moments.",
  ];

  // Set random quote
  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      let now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center px-6 py-8">

      {/* Quote */}
      <h1 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent mb-3">
        {quote}
      </h1>

      {/* Clock */}
      <p className="text-lg sm:text-2xl font-semibold text-center">
        ⏰ {time}
      </p>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        Make time your ally, not your enemy 💙
      </p>

      {/* CTA Buttons */}
      <div className="flex gap-4 mt-8">
        <Link
          to="/login"
          className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm"
        >
          Get Started
        </Link>
        <Link
          to="/rooms"
          className="px-5 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold text-sm"
        >
          Join Study Room
        </Link>
      </div>
    </main>
  );
}
