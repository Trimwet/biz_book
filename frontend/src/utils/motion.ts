// Reusable motion presets powered by framer-motion
// Usage: import { m, fadeIn, slideUp, scaleIn } from '@/utils/motion'
// Then: <m.div {...fadeIn()} />

import { motion as m } from 'framer-motion';

// Base transition
const t = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1], // standard easeOut
};

export const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { ...t, delay } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
});

export const slideUp = (delay = 0, distance = 16) => ({
  initial: { opacity: 0, y: distance },
  animate: { opacity: 1, y: 0, transition: { ...t, delay } },
  exit: { opacity: 0, y: distance / 2, transition: { duration: 0.25 } },
});

export const slideRight = (delay = 0, distance = 20) => ({
  initial: { opacity: 0, x: -distance },
  animate: { opacity: 1, x: 0, transition: { ...t, delay } },
  exit: { opacity: 0, x: distance / 2, transition: { duration: 0.25 } },
});

export const scaleIn = (delay = 0, from = 0.96) => ({
  initial: { opacity: 0, scale: from },
  animate: { opacity: 1, scale: 1, transition: { ...t, delay } },
  exit: { opacity: 0, scale: from, transition: { duration: 0.25 } },
});

export const staggerChildren = (stagger = 0.06, delayChildren = 0) => ({
  variants: {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  },
  initial: 'hidden',
  animate: 'show',
});

export { m };