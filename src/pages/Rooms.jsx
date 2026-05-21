// src/pages/Rooms.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Rooms() {
  const [joinCode, setJoinCode] = useState("");
  const navigate = useNavigate();

  const generateRoomId = () => {
    const random = Math.random().toString(36).substring(2, 8);
    const ts = Date.now().toString(36);
    return `room-${ts}-${random}`;
  };

  // ✅ CREATE ROOM
  const handleCreateRoom = async () => {
    console.log("CLICKED ✅");

    try {
      const roomId = generateRoomId();
      console.log("Room ID:", roomId);

      await setDoc(doc(db, "rooms", roomId), {
        createdAt: new Date(),
        members: [],
      });

      console.log("SAVED TO FIRESTORE ✅");

      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("ERROR ❌:", error);
    }
  };

  // ✅ JOIN ROOM
  const handleJoinRoom = () => {
    const trimmed = joinCode.trim();

    if (!trimmed) {
      alert("Please enter a room code.");
      return;
    }

    navigate(`/room/${trimmed}`);
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl bg-slate-900/80 border border-slate-700 rounded-2xl p-8 space-y-6">
        
        <h1 className="text-2xl font-bold text-center">
          Study Rooms
        </h1>

        {/* CREATE */}
        <div className="space-y-3 border border-slate-700 rounded-xl p-4">
          <button
            onClick={handleCreateRoom}
            className="w-full px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 font-semibold"
          >
            Create Room
          </button>
        </div>

        {/* JOIN */}
        <div className="space-y-3 border border-slate-700 rounded-xl p-4">
          <div className="flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter room code"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 outline-none"
            />

            <button
              onClick={handleJoinRoom}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600"
            >
              Join
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}