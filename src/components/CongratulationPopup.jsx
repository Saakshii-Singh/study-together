export default function CongratulationsPopup({ show, message, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-slate-900 text-black dark:text-white
          rounded-2xl shadow-lg px-6 py-4 text-center space-y-3">
        <h2 className="text-xl font-bold">🎉 Congratulations!</h2>
        <p>{message || "You completed a task!"}</p>
        <button
          className="px-4 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
