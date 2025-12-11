// src/pages/Tasks.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import CongratulationsPopup from "../components/CongratulationPopup.jsx";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "userTasks", user.uid, "tasks");
    const unsub = onSnapshot(ref, (snap) => {
      setTasks(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            if (a.done === b.done) return 0;
            return a.done ? 1 : -1; // undone first
          })
      );
    });

    return () => unsub();
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    const ref = collection(db, "userTasks", user.uid, "tasks");
    await addDoc(ref, {
      text: text.trim(),
      done: false,
      createdAt: serverTimestamp(),
      completedAt: null,
      startTime: startTime || null,
      endTime: endTime || null,
    });

    setText("");
    setStartTime("");
    setEndTime("");
  };

  const toggleTask = async (task) => {
    if (!user) return;
    const ref = doc(db, "userTasks", user.uid, "tasks", task.id);

    await updateDoc(ref, {
      done: !task.done,
      completedAt: !task.done ? serverTimestamp() : null,
    });

    if (!task.done) {
      setShowPopup(true);
    }
  };

  const deleteTask = async (id) => {
    if (!user) return;
    const ref = doc(db, "userTasks", user.uid, "tasks", id);
    await deleteDoc(ref);
  };

  const remaining = tasks.filter((t) => !t.done).length;
  const completed = tasks.filter((t) => t.done).length;

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Please log in to manage your tasks.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex justify-center px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">
            Today&apos;s plan
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Plan your{" "}
            <span className="text-blue-500 dark:text-blue-400">focus slots</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
            Break your day into clear tasks with time ranges. Finished tasks
            will show up in your Weekly Report.
          </p>
        </header>

        {/* Small stats chips */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800">
            ✅ Completed: {completed}
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200 border border-amber-200/70 dark:border-amber-800">
            📌 Remaining: {remaining}
          </span>
        </div>

        {/* Add task form */}
        <form
          onSubmit={addTask}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm"
        >
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            New task
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Solve 3 DSA questions, revise OS notes, watch DBMS lecture"
            className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-500/70"
          />

          <div className="flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                From:
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                To:
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              (Optional, but helps you block your day 💪)
            </span>
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white"
          >
            <span>➕</span>
            <span>Add task</span>
          </button>
        </form>

        {/* Task list */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your tasks</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tap a task to mark it done ✅
            </p>
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No tasks yet. Start by adding just 2–3 important things for
              today. Keep it light and realistic.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-start justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-[2px] text-lg">
                        {task.done ? "✅" : "⭕"}
                      </span>
                      <div>
                        <p
                          className={
                            task.done
                              ? "line-through text-slate-400"
                              : "text-slate-900 dark:text-slate-50"
                          }
                        >
                          {task.text}
                        </p>

                        {(task.startTime || task.endTime) && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            ⏰ {task.startTime || "??"} – {task.endTime || "??"}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="text-[11px] text-red-400 hover:text-red-300 mt-1"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CongratulationsPopup
        show={showPopup}
        message="You finished a task. Love that focus! 🎉"
        onClose={() => setShowPopup(false)}
      />
    </main>
  );
}
