// src/pages/Rooms.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Rooms() {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  // Simple unique id generator
  const generateRoomId = () => {
    // e.g. room-1733849374-abc123
    const random = Math.random().toString(36).substring(2, 8);
    const ts = Date.now().toString(36);
    return `room-${ts}-${random}`;
  };

  // ✅ CREATE ROOM (no Firestore here)
  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}?code=${roomId}`);
  };

  // ✅ JOIN ROOM (navigate using typed code)
  const handleJoinRoom = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) {
      alert("Please enter a room code.");
      return;
    }
    navigate(`/room/${trimmed}?code=${trimmed}`);
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-2">Study Rooms</h1>
        <p className="text-sm text-gray-300 text-center mb-4">
          Create a new room and share the code (room ID), or join an existing
          room using its code.
        </p>

        {/* Create Room */}
        <div className="space-y-3 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-200">
            Create a new room
          </h2>
          <button
            onClick={handleCreateRoom}
            className="w-full px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 font-semibold"
          >
            Create Room
          </button>
          <p className="text-xs text-gray-400">
            A unique room ID will be generated and shown in the URL. Share that
            ID with your friends so they can join.
          </p>
        </div>

        {/* Join Room */}
        <div className="space-y-3 border border-slate-700 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-gray-200">
            Join with room code
          </h2>
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter room code (room ID)"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={handleJoinRoom}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
            >
              Join
            </button>
          </div>
          <p className="text-xs text-gray-400">
            Use the text after <span className="font-mono">/room/</span> in the
            URL as the room code.
          </p>
        </div>
      </div>
    </main>
  );
}
