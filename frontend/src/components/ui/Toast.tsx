import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: "success" | "error";
}

export default function Toast({ message, isVisible, onClose, type = "success" }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-charcoal text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
              type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}>
            {type === "success" ? "✓" : "!"}
          </div>
          <div>
            <p className="font-bold text-lg leading-none mb-1">{type === "success" ? "Success!" : "Error"}</p>
            <p className="text-sm text-gray-300 font-medium">{message}</p>
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
