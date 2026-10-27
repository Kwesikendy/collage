import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingMark() {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const interval = window.setInterval(() => setCycle((value) => value + 1), 9000);
    return () => window.clearInterval(interval);
  }, [reduce]);

  return (
    <figure className="landing-mark">
      <div className="landing-mark__frame">
        <span className="landing-mark__crop landing-mark__crop--tl" />
        <span className="landing-mark__crop landing-mark__crop--tr" />
        <span className="landing-mark__crop landing-mark__crop--bl" />
        <span className="landing-mark__crop landing-mark__crop--br" />
        <svg key={cycle} viewBox="0 0 100 100" className="landing-mark__svg" aria-hidden="true">
          <motion.circle
            cx="50"
            cy="50"
            r="41"
            fill="none"
            stroke="#d8ccbf"
            strokeWidth="0.35"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="31"
            fill="none"
            stroke="#cbbba8"
            strokeWidth="0.3"
            strokeDasharray="0.8 1.6"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.28, ease }}
          />
          <line x1="50" y1="8" x2="50" y2="18" stroke="#c9bfb3" strokeWidth="0.35" />
          <line x1="50" y1="82" x2="50" y2="92" stroke="#c9bfb3" strokeWidth="0.35" />
          <line x1="8" y1="50" x2="18" y2="50" stroke="#c9bfb3" strokeWidth="0.35" />
          <line x1="82" y1="50" x2="92" y2="50" stroke="#c9bfb3" strokeWidth="0.35" />
          <motion.path
            d="M 46 18 A 32 32 0 0 0 18 46 L 30 46 A 20 20 0 0 1 46 30 Z"
            fill="#231F20"
            initial={reduce ? false : { opacity: 0, x: -12, y: -10, rotate: -16 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.2, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <motion.path
            d="M 18 54 A 32 32 0 0 0 44 82 L 44 70 A 20 20 0 0 1 30 54 Z"
            fill="#E52329"
            initial={reduce ? false : { opacity: 0, x: -14, y: 10, rotate: 13 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.34, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <motion.path
            d="M 54 82 A 32 32 0 0 0 80 66 L 69 57 A 20 20 0 0 1 54 70 Z"
            fill="#231F20"
            initial={reduce ? false : { opacity: 0, x: 13, y: 12, rotate: -13 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.48, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="7.5"
            fill="#E52329"
            initial={reduce ? false : { scale: 0.45, opacity: 0 }}
            animate={reduce ? {} : { scale: [0.45, 1.12, 1], opacity: 1 }}
            transition={{ duration: 0.56, delay: 0.72, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {!reduce && (
            <motion.circle
              cx="50"
              cy="50"
              r="10"
              fill="none"
              stroke="#E52329"
              strokeWidth="0.25"
              animate={{ scale: [1, 1.23, 1], opacity: [0, 0.32, 0] }}
              transition={{ duration: 3.8, delay: 1.45, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '50px 50px' }}
            />
          )}
        </svg>
      </div>
      <figcaption className="landing-mark-caption">One job, four connected states.</figcaption>
    </figure>
  );
}
