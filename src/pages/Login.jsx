// src/pages/Login.jsx
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, loading, loginWithGoogle } = useAuth();

  // already logged in → send to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-6">
        <h1 className="text-2xl font-bold text-center">Welcome back 👋</h1>
        <p className="text-sm text-gray-300 text-center">
          Sign in with Google to join study rooms and sync your Pomodoro timer.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full font-semibold hover:bg-slate-100 transition disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Make sure Google sign-in is enabled in your Firebase console.
        </p>
      </div>
    </main>
  );
}
