// src/components/TaskList.jsx
import { useEffect, useState } from "react";

const STORAGE_KEY = "studyTogetherTasks";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");

  // load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTasks(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error("Failed to parse tasks", err);
      }
    }
  }, []);

  // save when tasks change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), text: trimmed, done: false },
    ]);
    setText("");
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-1">Focus tasks ✅</h2>
      <p className="text-xs text-gray-400 mb-3">
        Write what you plan to do in today&apos;s sessions.
      </p>

      {/* input */}
      <form onSubmit={addTask} className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task (e.g. Finish DSA 2 questions)"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-semibold"
        >
          Add
        </button>
      </form>

      {/* list */}
      {tasks.length === 0 && (
        <p className="text-xs text-gray-500">
          No tasks yet. Add a few things you want to focus on.
        </p>
      )}

      <ul className="space-y-2 text-xs">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60"
          >
            <button
              type="button"
              onClick={() => toggleTask(task.id)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  task.done
                    ? "bg-green-500 border-green-500"
                    : "border-slate-500"
                }`}
              >
                {task.done && (
                  <span className="text-[10px] text-white">✓</span>
                )}
              </span>
              <span
                className={
                  task.done ? "line-through text-gray-500" : "text-gray-100"
                }
              >
                {task.text}
              </span>
            </button>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              className="ml-2 text-[10px] text-gray-400 hover:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
