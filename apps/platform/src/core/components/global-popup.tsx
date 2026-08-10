import {
  AlertCircle,
  CheckCircle2,
  Info,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { usePopupStore } from "../hooks/use-popup-store";

const COLORS = [
  "#FFC0CB",
  "#FFD700",
  "#FFB6C1",
  "#FF69B4",
  "#FFA07A",
  "#FF8C00",
  "#FFE4E1",
  "#A3E635",
  "#38BDF8",
];

function createConfetti() {
  return Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    x: Math.random() * 120 - 60,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 10 + 6,
    delay: Math.random() * 0.3,
    angle: Math.random() * 360,
  }));
}

function createStars() {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 160 - 80,
    y: Math.random() * 160 - 80,
    delay: Math.random() * 0.2 + 0.1,
    size: Math.random() * 10 + 16,
  }));
}

const DEFAULT_ICON = {
  success: <CheckCircle2 size={36} className="animate-bounce" />,
  error: <AlertCircle size={36} />,
  info: <Info size={36} />,
  cart: <ShoppingBag size={20} />,
};

const OVERLAY_TONE = {
  success: "bg-pinkSoft text-pinkDeep",
  error: "bg-destructive/10 text-destructive",
  info: "bg-secondary/60 text-ink",
};

export default function GlobalPopup() {
  const popup = usePopupStore((s) => s.popup);
  const hidePopup = usePopupStore((s) => s.hidePopup);
  const [particles, setParticles] = useState<ReturnType<typeof createConfetti>>(
    [],
  );
  const [stars, setStars] = useState<ReturnType<typeof createStars>>([]);

  useEffect(() => {
    if (!popup) return;

    if (popup.variant === "success") {
      setParticles(createConfetti());
      setStars(createStars());
    }

    const duration = popup.duration ?? (popup.variant === "cart" ? 2000 : 4000);
    const timer = setTimeout(hidePopup, duration);
    return () => clearTimeout(timer);
  }, [popup, hidePopup]);

  if (popup?.variant === "cart" || popup?.variant === "info") {
    return (
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-border/40 bg-white px-5 py-3 shadow-warm"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              {popup.icon ?? DEFAULT_ICON[popup.variant]}
            </div>
            <div className="text-left">
              <p className="font-semibold text-ink text-sm">{popup.title}</p>
              {popup.description && (
                <p className="text-foreground/60 text-xs">
                  {popup.description}
                </p>
              )}
            </div>
            {popup.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  popup.onAction?.();
                  hidePopup();
                }}
                className="shrink-0 font-bold text-primary text-xs uppercase tracking-wider hover:underline"
              >
                {popup.actionLabel}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const variant = popup?.variant as "success" | "error" | undefined;

  return (
    <AnimatePresence>
      {popup && variant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hidePopup}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/40 bg-white p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={hidePopup}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-secondary/50 text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>

            {variant === "success" && (
              <>
                {particles.map((p) => (
                  <motion.div
                    key={`confetti-${p.id}`}
                    className="pointer-events-none absolute rounded-xs"
                    style={{
                      backgroundColor: p.color,
                      width: p.size,
                      height: p.size,
                      left: `calc(50% + ${p.x}%)`,
                      bottom: "35%",
                    }}
                    initial={{ y: 0, opacity: 0, scale: 0, rotate: 0 }}
                    animate={{
                      y: [0, -320, -120],
                      x: [0, p.x * 2.5, p.x * 3.5],
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.2, 0.8, 0],
                      rotate: [0, p.angle, p.angle * 2],
                    }}
                    transition={{
                      duration: 2.4,
                      ease: "easeOut",
                      delay: p.delay,
                    }}
                  />
                ))}

                {stars.map((s) => (
                  <motion.div
                    key={`star-${s.id}`}
                    className="pointer-events-none absolute text-yellow-400"
                    style={{
                      left: `calc(50% + ${s.x}px)`,
                      top: `calc(50% + ${s.y}px)`,
                    }}
                    initial={{ scale: 0, opacity: 0, rotate: 0 }}
                    animate={{
                      scale: [0, 1.5, 1, 0],
                      opacity: [0, 1, 1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.8,
                      ease: "easeOut",
                      delay: s.delay,
                    }}
                  >
                    <Sparkles size={s.size} className="fill-yellow-400" />
                  </motion.div>
                ))}
              </>
            )}

            <div className="mb-4 flex justify-center">
              <motion.div
                initial={{ scale: 0, rotate: variant === "success" ? -45 : 45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  delay: 0.1,
                  stiffness: 260,
                  damping: 20,
                }}
                className={`flex size-16 items-center justify-center rounded-full shadow-inner ${OVERLAY_TONE[variant]}`}
              >
                {popup.icon ?? DEFAULT_ICON[variant]}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="mb-2 font-editorial text-2xl text-ink">
                {popup.title}
              </h3>

              {popup.description && (
                <p className="px-4 text-foreground/60 text-xs">
                  {popup.description}
                </p>
              )}
            </motion.div>

            <button
              type="button"
              onClick={hidePopup}
              className={`mt-6 w-full rounded-full py-3.5 font-semibold text-sm shadow-md transition-transform active:scale-[0.98] ${
                variant === "success"
                  ? "bg-pinkDeep text-white hover:bg-[#A93F63]"
                  : "bg-primary text-primary-foreground hover:bg-primary/95"
              }`}
            >
              {popup.actionLabel ??
                (variant === "success" ? "Woohoo! Got it" : "Okay, understood")}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
