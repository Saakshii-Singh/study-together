import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, limit } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

const GOALS_KEY = "studyTogetherGoals";

export default function WeeklyStatsGoals() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [weeklyGoal, setWeeklyGoal] = useState(300); // minutes
  const [dailyGoal, setDailyGoal] = useState(60);    // minutes

  // load goals
  useEffect(() => {
    const saved = localStorage.getItem(GOALS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.weeklyGoal) setWeeklyGoal(parsed.weeklyGoal);
        if (parsed.dailyGoal) setDailyGoal(parsed.dailyGoal);
      } catch (e) {
        console.error("Failed to parse goals", e);
      }
    }
  }, []);

  // save goals
  useEffect(() => {
    localStorage.setItem(
      GOALS_KEY,
      JSON.stringify({ weeklyGoal, dailyGoal })
    );
  }, [weeklyGoal, dailyGoal]);

  // listen to last sessions
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
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSessions(list);
    });

    return () => unsub();
  }, [user]);

  // listen to tasks (for weekly tasks count)
  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "userTasks", user.uid, "tasks");
    const unsub = onSnapshot(ref, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  const {
    weeklyMinutes,
    todayMinutes,
    dailyBreakdown,
    todayLabel,
    tasksThisWeek,
  } = useMemo(() => {
    if (!user) {
      return {
        weeklyMinutes: 0,
        todayMinutes: 0,
        dailyBreakdown: [],
        todayLabel: "",
        tasksThisWeek: 0,
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const keyOf = (d) => d.toISOString().slice(0, 10);
    const todayKey = keyOf(today);
    const map = {};
    days.forEach((d) => {
      map[keyOf(d)] = 0;
    });

    let weeklyTotal = 0;
    let todayTotal = 0;

    // sessions minutes
    sessions.forEach((s) => {
      const ts = s.createdAt?.toMillis?.();
      if (!ts) return;
      const d = new Date(ts);
      const k = keyOf(d);
      if (!map.hasOwnProperty(k)) return;

      const m = s.minutes || 0;
      map[k] += m;
      weeklyTotal += m;
      if (k === todayKey) todayTotal += m;
    });

    // tasks completed this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - 6);
    const startMs = startOfWeek.getTime();

    const tasksWeek = tasks.filter((t) => {
      const ts = t.completedAt?.toMillis?.();
      return t.done && ts && ts >= startMs;
    }).length;

    const breakdown = days.map((d) => {
      const k = keyOf(d);
      return {
        key: k,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: map[k] || 0,
      };
    });

    return {
      weeklyMinutes: weeklyTotal,
      todayMinutes: todayTotal,
      dailyBreakdown: breakdown,
      todayLabel: today.toLocaleDateString(undefined, { weekday: "long" }),
      tasksThisWeek: tasksWeek,
    };
  }, [sessions, tasks, user]);

  const weeklyProgress =
    weeklyGoal > 0 ? Math.min(100, (weeklyMinutes / weeklyGoal) * 100) : 0;
  const dailyProgress =
    dailyGoal > 0 ? Math.min(100, (todayMinutes / dailyGoal) * 100) : 0;

  if (!user) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Weekly stats 📅</h2>
        <p className="text-xs text-gray-400">
          Based on your completed focus sessions and tasks (last 7 days).
        </p>
      </div>

      {/* totals */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-slate-800/60 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">This week</p>
          <p className="text-xl font-bold">{weeklyMinutes} min</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">Today ({todayLabel})</p>
          <p className="text-xl font-bold">{todayMinutes} min</p>
        </div>
      </div>

      {/* tasks summary */}
      <div className="text-xs text-gray-300">
        Tasks completed this week:{" "}
        <span className="font-semibold text-emerald-400">
          {tasksThisWeek}
        </span>
      </div>

      {/* weekly + daily goal progress */}
      <div className="space-y-3 text-xs">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300">Weekly goal</span>
            <span className="text-gray-400">
              {weeklyMinutes}/{weeklyGoal} min
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-gray-400">Set:</span>
            <input
              type="number"
              min={0}
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] outline-none"
            />
            <span className="text-[11px] text-gray-400">min/week</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-300">Daily goal</span>
            <span className="text-gray-400">
              {todayMinutes}/{dailyGoal} min
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-gray-400">Set:</span>
            <input
              type="number"
              min={0}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value) || 0)}
              className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] outline-none"
            />
            <span className="text-[11px] text-gray-400">min/day</span>
          </div>
        </div>
      </div>

      {/* small weekly breakdown list */}
      <div className="mt-2">
        <p className="text-[11px] text-gray-400 mb-1">Last 7 days:</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
          {dailyBreakdown.map((d) => (
            <div
              key={d.key}
              className="bg-slate-800/60 rounded-lg px-1 py-1 flex flex-col items-center"
            >
              <span className="text-gray-400">{d.label}</span>
              <span className="font-semibold">{d.minutes}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
