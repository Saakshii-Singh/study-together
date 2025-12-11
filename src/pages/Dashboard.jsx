// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  increment,
  limit,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import PomodoroTimer from "../components/PomodoroTimer.jsx";
import WeeklyStatsGoals from "../components/WeeklyStatsGoals.jsx";

const DAILY_GOAL_KEY = "studyTogetherDailyGoal";

export default function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [dailyGoal, setDailyGoal] = useState(60); // minutes

  // Load daily goal from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(DAILY_GOAL_KEY);
    if (saved) {
      const num = Number(saved);
      if (!Number.isNaN(num) && num >= 0) setDailyGoal(num);
    }
  }, []);

  // Save daily goal
  useEffect(() => {
    localStorage.setItem(DAILY_GOAL_KEY, String(dailyGoal));
  }, [dailyGoal]);

  // Listen to userSessions from Firestore
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "userSessions");
    const q = query(
      ref,
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(200)
    );

    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const { todayMinutes, totalMinutes, totalSessions, todayLabel } = useMemo(() => {
    if (!user) {
      return {
        todayMinutes: 0,
        totalMinutes: 0,
        totalSessions: 0,
        todayLabel: "",
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const keyOf = (d) => d.toISOString().slice(0, 10);
    const todayKey = keyOf(today);

    let tMinutes = 0;
    let totalMin = 0;
    let tSessions = 0;

    sessions.forEach((s) => {
      const ts = s.createdAt?.toMillis?.();
      if (!ts) return;
      const d = new Date(ts);
      const key = keyOf(d);

      const m = s.minutes || 0;
      totalMin += m;
      tSessions += 1;
      if (key === todayKey) tMinutes += m;
    });

    return {
      todayMinutes: tMinutes,
      totalMinutes: totalMin,
      totalSessions: tSessions,
      todayLabel: today.toLocaleDateString(undefined, { weekday: "long" }),
    };
  }, [sessions, user]);

  const dailyProgress =
    dailyGoal > 0 ? Math.min(100, (todayMinutes / dailyGoal) * 100) : 0;

  // Called when focus session completed in PomodoroTimer
  const handleSessionComplete = async (minutes) => {
    if (!user || !minutes || minutes <= 0) return;

    try {
      // Log session
      const sessionsRef = collection(db, "userSessions");
      await addDoc(sessionsRef, {
        uid: user.uid,
        minutes,
        createdAt: serverTimestamp(),
      });

      // Update aggregate stats
      const statsRef = doc(db, "userStats", user.uid);
      await setDoc(
        statsRef,
        {
          uid: user.uid,
          totalMinutes: increment(minutes),
          totalSessions: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Error logging session:", err);
    }
  };

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Please log in to see your dashboard.
        </p>
      </main>
    );
  }

  return (
      <main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.15fr,1fr] gap-6">
        {/* LEFT: Timer + daily goal */}
        <div className="space-y-4">
          {/* Focus / break timer */}
          <PomodoroTimer onSessionComplete={handleSessionComplete} />

          {/* Daily focus goal card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span>🎯 Daily focus goal</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Every time a focus session finishes, we add minutes here.
                </p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {todayLabel || "Today"}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  Today&apos;s progress
                </span>
                <span className="font-semibold">
                  {todayMinutes}/{dailyGoal} min
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Set goal:</span>
              <input
                type="number"
                min={0}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value) || 0)}
                className="w-20 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
              <span>min/day</span>
            </div>
          </div>
        </div>

        {/* RIGHT: User summary + weekly stats */}
        <div className="space-y-4">
          {/* User summary card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                {user.displayName?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Hi, {user.displayName || "Study buddy"} ✨
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Welcome to your StudyTogether dashboard.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mt-2">
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl px-3 py-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Focus sessions
                </p>
                <p className="text-lg font-bold">{totalSessions}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl px-3 py-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total focus time
                </p>
                <p className="text-lg font-bold">{totalMinutes} min</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              We count only finished focus sessions – breaks don&apos;t count
              towards your stats.
            </p>
          </div>

          {/* Weekly stats + goals component */}
          <WeeklyStatsGoals />
        </div>
      </div>
    </main>
  );
}
