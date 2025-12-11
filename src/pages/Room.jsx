// src/pages/Room.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import SharedPomodoroTimer from "../components/SharedPomodoroTimer.jsx";

export default function Room() {
  const { roomId } = useParams();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Load room data
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId);

    const load = async () => {
      try {
        const snap = await getDoc(roomRef);
        if (!snap.exists()) {
          setNotFound(true);
          setLoadingRoom(false);
          return;
        }
        setRoom({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Failed to load room", err);
      } finally {
        setLoadingRoom(false);
      }
    };

    load();

    // Also realtime updates
    const unsub = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      setRoom({ id: snap.id, ...snap.data() });
    });

    return () => unsub();
  }, [roomId]);

  // Join participants list
  useEffect(() => {
    if (!user || !roomId) return;

    const partRef = doc(db, "rooms", roomId, "participants", user.uid);
    setDoc(
      partRef,
      {
        uid: user.uid,
        displayName: user.displayName || user.email || "Guest",
        joinedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => console.error("Failed to join participants", err));
  }, [user, roomId]);

  // Listen to participants
  useEffect(() => {
    if (!roomId) return;
    const ref = collection(db, "rooms", roomId, "participants");
    const q = query(ref, orderBy("joinedAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setParticipants(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [roomId]);

  // Listen to messages
  useEffect(() => {
    if (!roomId) return;
    const ref = collection(db, "rooms", roomId, "messages");
    const q = query(ref, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
      );
    });

    return () => unsub();
  }, [roomId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user || !messageText.trim() || !roomId) return;

    setSending(true);
    try {
      const ref = collection(db, "rooms", roomId, "messages");
      await addDoc(ref, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Someone",
        text: messageText.trim(),
        createdAt: serverTimestamp(),
      });
      setMessageText("");
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm text-center space-y-3 max-w-sm">
          <p className="font-semibold">You need to log in to join a room.</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  if (loadingRoom) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Loading room...
        </p>
      </main>
    );
  }

  if (notFound || !room) {
    return (
      <main className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-sm text-center space-y-3 max-w-sm">
          <p className="font-semibold mb-1">Room not found</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The room ID might be invalid or the room was deleted.
          </p>
          <Link
            to="/rooms"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white"
          >
            Back to rooms
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 flex justify-center">
      <div className="w-full max-w-6xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-blue-500 dark:text-blue-300">
              Study room
            </p>
            <h1 className="text-xl sm:text-2xl font-bold">
              {room.name || "Focus room"}{" "}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                · #{roomId}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Everyone here shares the same timer and chat.
            </p>
          </div>

          <Link
            to="/rooms"
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
          >
            ← Back to all rooms
          </Link>
        </div>

        {/* Main layout: timer + chat + participants */}
        <div className="grid lg:grid-cols-[1.5fr,1fr] gap-4">
          {/* Left: shared timer + chat */}
          <div className="space-y-4">
            {/* Shared timer */}
            <SharedPomodoroTimer roomId={roomId} />

            {/* Chat */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-[360px]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Room chat 💬</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Be kind & stay on-topic
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
                {messages.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    No messages yet. Say hi and share what you&apos;re working
                    on!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.uid === user.uid;
                    return (
                      <div
                        key={msg.id}
                        className={
                          "max-w-[80%] rounded-2xl px-3 py-2 text-xs mb-1 " +
                          (isMe
                            ? "ml-auto bg-blue-500 text-white"
                            : "mr-auto bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100")
                        }
                      >
                        {!isMe && (
                          <p className="text-[10px] font-semibold mb-0.5 opacity-80">
                            {msg.displayName || "Someone"}
                          </p>
                        )}
                        <p>{msg.text}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 mt-auto"
              >
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </section>
          </div>

          {/* Right: participants + room info */}
          <div className="space-y-4">
            {/* Participants */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">People in this room</h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {participants.length} online
                </span>
              </div>

              {participants.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  You&apos;re the first one here. Share the room link with your
                  friends!
                </p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/70"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-[11px] font-semibold">
                        {(p.displayName || p.email || "U")[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-50">
                          {p.displayName || "Study buddy"}
                        </p>
                        <p className="text-[10px] text-emerald-500">
                          ● focusing
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Room tips / info */}
            <section className="bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl p-4 text-xs text-white space-y-2 shadow-md">
              <h2 className="text-sm font-semibold mb-1">
                How to use this room
              </h2>
              <ul className="list-disc ml-4 space-y-1">
                <li>Agree on a task with others in chat.</li>
                <li>Start the shared timer so everyone stays in sync.</li>
                <li>Keep chat clean and study-focused.</li>
                <li>After a few sessions, check your Weekly Report.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
