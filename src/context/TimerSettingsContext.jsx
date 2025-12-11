import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";

const TimerSettingsContext = createContext(null);

export function TimerSettingsProvider({ children }) {
  const { user } = useAuth();
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [loading, setLoading] = useState(true);

  // Load saved settings from Firestore
  useEffect(() => {
    if (!user) {
      setWorkDuration(25);
      setBreakDuration(5);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const ref = doc(db, "userTimerSettings", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setWorkDuration(data.workDuration ?? 25);
          setBreakDuration(data.breakDuration ?? 5);
        } else {
          setWorkDuration(25);
          setBreakDuration(5);
        }
      } catch (err) {
        console.error("Failed to load timer settings", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const updateSettings = async (newWork, newBreak) => {
    setWorkDuration(newWork);
    setBreakDuration(newBreak);

    if (!user) return;

    try {
      const ref = doc(db, "userTimerSettings", user.uid);
      await setDoc(
        ref,
        {
          workDuration: newWork,
          breakDuration: newBreak,
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to save timer settings", err);
    }
  };

  return (
    <TimerSettingsContext.Provider
      value={{ workDuration, breakDuration, updateSettings, loading }}
    >
      {children}
    </TimerSettingsContext.Provider>
  );
}

export function useTimerSettings() {
  return useContext(TimerSettingsContext);
}
