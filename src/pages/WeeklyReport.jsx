// src/pages/WeeklyReport.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export default function WeeklyReport() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!user) return;

    // session logs
    const sRef = query(
      collection(db, "userSessions"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubSessions = onSnapshot(sRef, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // tasks
    const tRef = collection(db, "userTasks", user.uid, "tasks");
    const unsubTasks = onSnapshot(tRef, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSessions();
      unsubTasks();
    };
  }, [user]);

  const {
    totalMinutes,
    tasksCompleted,
    dailyBreakdown,
    weekRangeLabel,
  } = useMemo(() => {
    if (!user) {
      return {
        totalMinutes: 0,
        tasksCompleted: 0,
        dailyBreakdown: [],
        weekRangeLabel: "",
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const keyOf = (d) => d.toISOString().slice(0, 10);
    const days = [];
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = keyOf(d);
      days.push(d);
      dayMap[key] = 0;
    }

    // sessions minutes
    let total = 0;
    sessions.forEach((s) => {
      const ts = s.createdAt?.toMillis?.();
      if (!ts) return;
      const d = new Date(ts);
      if (d < startOfWeek || d > today) return;

      const key = keyOf(d);
      if (!dayMap.hasOwnProperty(key)) return;
      const m = s.minutes || 0;

      dayMap[key] += m;
      total += m;
    });

    // tasks completed this week
    const startMs = startOfWeek.getTime();
    const completedTasks = tasks.filter((t) => {
      const ts = t.completedAt?.toMillis?.();
      return t.done && ts && ts >= startMs;
    });

    const breakdown = days.map((d) => {
      const key = keyOf(d);
      return {
        key,
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        minutes: dayMap[key] || 0,
      };
    });

    const rangeLabel =
      startOfWeek.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }) +
      " – " +
      today.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

    return {
      totalMinutes: total,
      tasksCompleted: completedTasks.length,
      dailyBreakdown: breakdown,
      weekRangeLabel: rangeLabel,
    };
  }, [sessions, tasks, user]);

  if (!user) {
    return (
<main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-8 flex justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Please log in to see your weekly report.
        </p>
      </main>
    );
  }

  const maxMinutes = Math.max(
    30,
    ...dailyBreakdown.map((d) => d.minutes || 0)
  );

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">
            Weekly report
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Your{" "}
            <span className="text-blue-500 dark:text-blue-400">
              focus overview
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Last 7 days · {weekRangeLabel}
          </p>
        </header>

        {/* Summary cards */}
        <section className="grid sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Total focus time
            </p>
            <p className="text-2xl font-bold">{totalMinutes} min</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Completed focus sessions recorded from your Pomodoro timer.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Tasks completed
            </p>
            <p className="text-2xl font-bold">{tasksCompleted}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Finished tasks from your Tasks page this week.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl p-4 text-white shadow-md">
            <p className="text-[11px] uppercase tracking-[0.2em] mb-1">
              Keep going
            </p>
            <p className="text-sm">
              Even one focused hour per day is{" "}
              <span className="font-semibold">7 hours</span> per week. You’re
              building that habit right now.
            </p>
          </div>
        </section>

        {/* Mini bar chart */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Focus per day</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Last 7 days
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end">
            {dailyBreakdown.map((d) => {
              const height = maxMinutes ? (d.minutes / maxMinutes) * 100 : 0;
              return (
                <div
                  key={d.key}
                  className="flex flex-col items-center gap-1 text-[11px]"
                >
                  <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex items-end">
                    <div
                      className="w-full bg-blue-500 dark:bg-blue-400 transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">
                    {d.label}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">
                    {d.minutes}m
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Completed tasks list */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold mb-1">
            Tasks you completed this week ✅
          </h2>

          {tasksCompleted === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No finished tasks yet. Complete tasks on the Tasks page and
              they&apos;ll show up here.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {tasks
                .filter((t) => t.done && t.completedAt)
                .sort(
                  (a, b) =>
                    b.completedAt.toMillis() - a.completedAt.toMillis()
                )
                .map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700"
                  >
                    <span className="flex-1 text-slate-800 dark:text-slate-50">
                      {t.text}
                    </span>
                    {(t.startTime || t.endTime) && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-3">
                        ⏰ {t.startTime || "??"} – {t.endTime || "??"}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
