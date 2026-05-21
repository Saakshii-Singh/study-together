// src/pages/Room.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    const checkRoom = async () => {
      try {
        const docRef = doc(db, "rooms", roomId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setExists(true);
        } else {
          setExists(false);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkRoom();
  }, [roomId]);

  // ⏳ Loading
  if (loading) {
    return (
      <div className="text-white flex justify-center mt-20">
        Loading room...
      </div>
    );
  }

  // ❌ Not found
  if (!exists) {
    return (
      <div className="text-center text-white mt-20">
        <h2 className="text-xl font-bold">Room not found</h2>
        <button
          onClick={() => navigate("/rooms")}
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
        >
          Back to Rooms
        </button>
      </div>
    );
  }

  // ✅ Success
  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-bold">Room: {roomId}</h1>
      <p>Welcome to your study room 🎯</p>
    </div>
  );
}