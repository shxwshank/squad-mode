import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

/**
 * Bottom sheet: slides up with an iOS-like drawer curve, drags down to dismiss,
 * closes on Escape or backdrop tap, traps nothing fancy but moves focus in and back.
 */
export function Sheet({ open, onClose, labelledBy, children, closeLabel = 'Close' }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const returnTo = useRef(null);
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return undefined;
    returnTo.current = document.activeElement;
    const t = setTimeout(() => {
      const first = ref.current?.querySelector('[data-autofocus]') || ref.current;
      first?.focus({ preventScroll: true });
    }, 60);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button:not(:disabled), input, select, textarea, a[href]');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      const r = returnTo.current;
      if (r && typeof r.focus === 'function' && document.contains(r)) r.focus({ preventScroll: true });
    };
  }, [open, onClose]);

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="backdrop"
            className="backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            key="sheet"
            ref={ref}
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            {...slide}
            transition={{ duration: reduce ? 0.15 : 0.42, ease: [0.32, 0.72, 0, 1] }}
            drag={reduce ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.9 }}
            dragListener={false}
            dragControls={controls}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div
              className="sheet-grab"
              onPointerDown={(e) => { if (!reduce) controls.start(e); }}
              aria-hidden="true"
            >
              <div className="sheet-handle" />
            </div>
            <button type="button" className="icon-btn sheet-close" onClick={onClose} aria-label={closeLabel}>
              <X size={20} />
            </button>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
