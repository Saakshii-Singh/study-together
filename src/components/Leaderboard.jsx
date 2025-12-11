// src/components/Leaderboard.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const ref = collection(db, "userStats");
    const q = query(ref, orderBy("totalMinutes", "desc"), limit(10));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRows(list);
    });

    return () => unsub();
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-1">Focus leaderboard 🏆</h2>
      <p className="text-xs text-gray-400 mb-4">
        Top users by total focus minutes (global, from Firestore).
      </p>

      {rows.length === 0 && (
        <p className="text-xs text-gray-500">No data yet. Finish a session to appear here.</p>
      )}

      <ul className="space-y-2 text-sm">
        {rows.map((u, idx) => {
          const isMe = user && u.id === user.uid;
          return (
            <li
              key={u.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                isMe ? "bg-blue-500/20 border border-blue-400/60" : "bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 text-right">
                  {idx + 1}.
                </span>
                <span className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                  {u.displayName?.[0]?.toUpperCase() || "U"}
                </span>
                <div>
                  <p className={`text-xs ${isMe ? "font-semibold" : ""}`}>
                    {u.displayName || "Unknown user"}
                    {isMe && " (you)"}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {u.totalSessions || 0} sessions
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{u.totalMinutes || 0} min</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
