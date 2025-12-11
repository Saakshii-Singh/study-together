// src/components/RoomChat.jsx
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoomChat({ roomId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // listen to messages in this room
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(list);
    });

    return () => unsub();
  }, [roomId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !roomId || !user) return;

    try {
      setSending(true);
      const messagesRef = collection(db, "rooms", roomId, "messages");

      await addDoc(messagesRef, {
        text: trimmed,
        uid: user.uid,
        author: user.displayName || user.email,
        createdAt: serverTimestamp(),
      });

      setText("");
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-4 flex flex-col h-80">
      <h2 className="text-sm font-semibold text-gray-200 mb-2">
        Room chat 💬
      </h2>

      {/* messages list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500">No messages yet. Say hi! 👋</p>
        )}

        {messages.map((msg) => {
          const isMe = msg.uid === user?.uid;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                  isMe
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-slate-800 text-gray-100 rounded-bl-none"
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] text-gray-300 mb-0.5">
                    {msg.author}
                  </p>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs outline-none focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-semibold disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
