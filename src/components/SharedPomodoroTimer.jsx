import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useTimerSettings } from "../context/TimerSettingsContext.jsx";

export default function SharedPomodoroTimer({ roomId }) {
  const { workDuration, breakDuration } = useTimerSettings();
  const [mode, setMode] = useState("work");
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [running, setRunning] = useState(false);
  const [updating, setUpdating] = useState(false);

  const roomRef = doc(db, "rooms", roomId);

  // listen to room timer state
  useEffect(() => {
    const unsub = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      if (!data || !data.timer) return;

      const t = data.timer;
      setMode(t.mode || "work");
      setSecondsLeft(t.secondsLeft ?? workDuration * 60);
      setRunning(!!t.running);
    });

    return () => unsub();
  }, [roomRef, workDuration]);

  // when work/break duration changes, if timer is stopped, reset to new value
  useEffect(() => {
    if (!running) {
      setSecondsLeft(
        (mode === "work" ? workDuration : breakDuration) * 60
      );
    }
  }, [workDuration, breakDuration, mode, running]);

  const pushUpdate = async (newState) => {
    setUpdating(true);
    try {
      await updateDoc(roomRef, {
        timer: {
          ...newState,
          updatedAt: serverTimestamp(),
        },
      });
    } catch (err) {
      console.error("Failed to update room timer", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleStart = () => {
    pushUpdate({ mode, secondsLeft, running: true });
  };

  const handlePause = () => {
    pushUpdate({ mode, secondsLeft, running: false });
  };

  const handleReset = () => {
    const base = mode === "work" ? workDuration : breakDuration;
    pushUpdate({ mode, secondsLeft: base * 60, running: false });
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>⏱️ Room timer</span>
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Everyone in the room sees this timer.
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {mode === "work"
            ? `${workDuration} min focus`
            : `${breakDuration} min break`}
        </span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-3xl font-bold tracking-widest">
          {minutes}:{seconds}
        </p>
        <div className="flex gap-2">
          {!running ? (
            <button
              onClick={handleStart}
              disabled={updating}
              className="px-4 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white disabled:opacity-60"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              disabled={updating}
              className="px-4 py-1 rounded-full bg-yellow-500 hover:bg-yellow-600 text-xs font-semibold text-white disabled:opacity-60"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={updating}
            className="px-4 py-1 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
