"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function Toaster({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`flex items-center gap-2 rounded-xl glass-card px-4 py-2.5 text-sm font-medium shadow-xl ${
              t.type === "success" ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {t.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
