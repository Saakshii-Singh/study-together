// src/components/RoomPresence.jsx
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoomPresence({ roomId }) {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);

  // Keep my presence updated
  useEffect(() => {
    if (!roomId || !user) return;

    const presenceRef = doc(db, "rooms", roomId, "presence", user.uid);

    const updatePresence = async () => {
      try {
        await setDoc(
          presenceRef,
          {
            uid: user.uid,
            displayName: user.displayName || user.email || "Unknown",
            lastActive: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to update presence", err);
      }
    };

    // initial
    updatePresence();

    // heartbeat every 25s
    const intervalId = setInterval(updatePresence, 25000);

    return () => clearInterval(intervalId);
  }, [roomId, user]);

  // Listen to others
  useEffect(() => {
    if (!roomId) return;

    const ref = collection(db, "rooms", roomId, "presence");

    const unsub = onSnapshot(ref, (snap) => {
      const now = Date.now();
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((p) => {
          const ts = p.lastActive?.toMillis?.();
          if (!ts) return false;
          return now - ts < 60000; // active within last 60s
        });

      setPeople(list);
    });

    return () => unsub();
  }, [roomId]);

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">
        People in this room 👥
      </h2>

      {people.length === 0 && (
        <p className="text-xs text-gray-500">
          No one else is active right now.
        </p>
      )}

      <ul className="flex flex-wrap gap-2 text-xs">
        {people.map((p) => (
          <li
            key={p.id}
            className="px-3 py-1 rounded-full bg-slate-800 border border-slate-600 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span>{p.displayName}</span>
            {user && p.id === user.uid && (
              <span className="text-[10px] text-gray-400">(you)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
