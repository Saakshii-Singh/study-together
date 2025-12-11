import { useEffect, useState } from "react";
import { useTimerSettings } from "../context/TimerSettingsContext.jsx";

export default function PomodoroTimer({ onSessionComplete }) {
  const { workDuration, breakDuration, updateSettings, loading } =
    useTimerSettings();

  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [running, setRunning] = useState(false);

  // local input fields (so user can type)
  const [focusInput, setFocusInput] = useState(workDuration);
  const [breakInput, setBreakInput] = useState(breakDuration);

  // when global settings change (e.g. from Firestore), sync inputs + timer
  useEffect(() => {
    setFocusInput(workDuration);
    setBreakInput(breakDuration);

    // only reset timer if not running, so we don't suddenly jump during active session
    if (!running) {
      setSecondsLeft(
        (mode === "work" ? workDuration : breakDuration) * 60
      );
    }
  }, [workDuration, breakDuration, mode, running]);

  // main countdown effect
  useEffect(() => {
    if (!running || loading) return;

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // timer finished
          if (mode === "work") {
            // completed a focus session
            if (typeof onSessionComplete === "function") {
              onSessionComplete(workDuration);
            }
            setMode("break");
            return breakDuration * 60;
          } else {
            // completed a break -> go back to work
            setMode("work");
            return workDuration * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [running, mode, workDuration, breakDuration, onSessionComplete, loading]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const handleStart = () => {
    if (loading) return;
    setRunning(true);
  };

  const handleReset = () => {
    setRunning(false);
    setMode("work");
    setSecondsLeft(workDuration * 60);
  };

  const applyFocusChange = (value) => {
    const num = Number(value) || 0;
    setFocusInput(num);
    if (num > 0) {
      // update global settings
      updateSettings(num, breakDuration);
      // if in work mode and not running, reset timer to new duration
      if (!running && mode === "work") {
        setSecondsLeft(num * 60);
      }
    }
  };

  const applyBreakChange = (value) => {
    const num = Number(value) || 0;
    setBreakInput(num);
    if (num > 0) {
      updateSettings(workDuration, num);
      if (!running && mode === "break") {
        setSecondsLeft(num * 60);
      }
    }
  };

  const label = mode === "work" ? "Focus Time" : "Break Time";
  const chip =
    mode === "work"
      ? `${workDuration} min focus`
      : `${breakDuration} min break`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>🧠 {label}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stay focused until the timer ends.
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {chip}
        </span>
      </div>

      {/* Timer display */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-5xl font-bold tracking-widest">
          {minutes}:{seconds}
        </p>
        <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-blue-500" />
        </div>

        <div className="flex gap-3 mt-2">
          {!running ? (
            <button
              onClick={handleStart}
              className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-semibold text-white"
            >
              {loading ? "Loading..." : "Start"}
            </button>
          ) : (
            <button
              onClick={() => setRunning(false)}
              className="px-6 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-sm font-semibold text-white"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Duration controls */}
      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs text-slate-700 dark:text-gray-200 space-y-2">
        <p className="font-semibold">Session length</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Adjust your focus and break durations. These settings are saved to
          your account and used everywhere.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 dark:text-slate-400">
              Focus duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={focusInput}
              onChange={(e) => applyFocusChange(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 dark:text-slate-400">
              Break duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={breakInput}
              onChange={(e) => applyBreakChange(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
