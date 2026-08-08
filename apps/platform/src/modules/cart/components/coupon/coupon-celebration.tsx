import { AlertCircle, CheckCircle2, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { rupee } from "../../store/cart-provider";

interface CouponCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  successData: {
    code: string;
    discountAmount: number; // in paise
  } | null;
  errorText: string | null;
}

const COLORS = [
  "#FFC0CB", // pink
  "#FFD700", // gold
  "#FFB6C1", // light pink
  "#FF69B4", // hot pink
  "#FFA07A", // light salmon
  "#FF8C00", // dark orange
  "#FFE4E1", // misty rose
  "#A3E635", // lime
  "#38BDF8", // sky
];

function createConfetti() {
  return Array.from({ length: 45 }).map((_, i) => ({
    id: i,
    x: Math.random() * 120 - 60, // percentage offset from center
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 10 + 6, // 6px to 16px
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

export default function CouponCelebration({
  isOpen,
  onClose,
  successData,
  errorText,
}: CouponCelebrationProps) {
  const [particles, setParticles] = useState<ReturnType<typeof createConfetti>>(
    [],
  );
  const [stars, setStars] = useState<ReturnType<typeof createStars>>([]);

  useEffect(() => {
    if (isOpen && successData) {
      setParticles(createConfetti());
      setStars(createStars());

      // Auto close success modal after 4 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, successData, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/40 bg-white p-6 text-center shadow-2xl"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-secondary/50 text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X size={16} />
            </button>

            {successData && (
              <>
                {/* Confetti & Star Fireworks */}
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
                    <Sparkles
                      style={{ width: s.size, height: s.size }}
                      className="fill-yellow-400"
                    />
                  </motion.div>
                ))}

                {/* Celebration Header Graphic */}
                <div className="mb-4 flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      delay: 0.1,
                      stiffness: 260,
                      damping: 20,
                    }}
                    className="flex size-16 items-center justify-center rounded-full bg-pinkSoft text-pinkDeep shadow-inner"
                  >
                    <CheckCircle2 size={36} className="animate-bounce" />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="mb-2 font-editorial text-2xl text-foreground">
                    Code{" "}
                    <span className="font-semibold text-pinkDeep">
                      {successData.code.toUpperCase()}
                    </span>{" "}
                    Applied!
                  </h3>

                  {/* Saving bubble */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="mb-4 inline-block rounded-full bg-blush px-6 py-2.5 font-semibold text-lg text-pinkDeep shadow-warm"
                  >
                    Saved {rupee(successData.discountAmount)} 🎉
                  </motion.div>

                  <p className="px-4 text-foreground/60 text-xs">
                    Congratulations! Your cart has been updated with this
                    discount. Let's finish checking out!
                  </p>
                </motion.div>

                {/* Primary Button */}
                <motion.button
                  type="button"
                  onClick={onClose}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 w-full rounded-full bg-pinkDeep py-3.5 font-semibold text-sm text-white shadow-md transition-transform hover:bg-[#A93F63] active:scale-[0.98]"
                >
                  Woohoo! Got it
                </motion.button>
              </>
            )}

            {errorText && (
              <>
                {/* Error Header Graphic */}
                <div className="mb-4 flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner"
                  >
                    <AlertCircle size={36} />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="mb-2 font-editorial text-2xl text-foreground">
                    Couldn't Apply Coupon
                  </h3>

                  <div className="my-4 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-left">
                    <p className="font-medium text-red-800 text-sm leading-relaxed">
                      {errorText}
                    </p>
                  </div>

                  <p className="px-2 text-foreground/50 text-xs">
                    Please check the details above or try another promo code
                    from the list below.
                  </p>
                </motion.div>

                {/* Close Button Action */}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full rounded-full bg-foreground py-3.5 font-semibold text-sm text-white shadow-md transition-transform hover:opacity-90 active:scale-[0.98]"
                >
                  Okay, understood
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
