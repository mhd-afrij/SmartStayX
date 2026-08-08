import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ConfirmModal — Reusable confirmation dialog for destructive actions (delete, etc.)
const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  const confirmColor =
    variant === "danger" ? "bg-[#EF4444]" : "bg-[#F59E0B]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4"
          >
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-2xl">
              {title && (
                <h3
                  id="confirm-modal-title"
                  className="text-lg font-semibold text-slate-900 mb-2"
                >
                  {title}
                </h3>
              )}
              {message && (
                <p className="text-sm text-slate-500 mb-6">{message}</p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-black/[0.08] text-slate-500 hover:text-slate-900 hover:bg-[#f4f2ef] transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  ref={confirmRef}
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-medium rounded-xl text-white ${confirmColor} hover:opacity-90 transition-all`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
