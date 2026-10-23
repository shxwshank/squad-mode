import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
  }, []);
  const push = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2);
      // one at a time reads calmer on a phone; a new toast replaces the old
      setToasts([{ id, ...toast }]);
      timers.current[id] = setTimeout(() => dismiss(id), toast.duration || 4200);
    },
    [dismiss],
  );
  return { toasts, push, dismiss };
}

export function Toasts({ toasts, dismiss }) {
  const reduce = useReducedMotion();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className="toast"
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-120%)' }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, transform: 'translateY(0%)' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-120%)' }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="tick" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
            <div className="t-main">
              <div>{t.title}</div>
              {t.sub ? <div className="t-sub">{t.sub}</div> : null}
            </div>
            {t.action ? (
              <button
                type="button"
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
