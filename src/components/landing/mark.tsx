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
          {/* Outer orbital ring - subtle graphite */}
          <motion.circle
            cx="50"
            cy="50"
            r="41"
            fill="none"
            stroke="#33302E"
            strokeWidth="0.28"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{ duration: 1.2, ease }}
          />
          {/* Secondary dashed orbital ring - muted warm stone */}
          <motion.circle
            cx="50"
            cy="50"
            r="31"
            fill="none"
            stroke="#C9C2B9"
            strokeOpacity="0.24"
            strokeWidth="0.24"
            strokeDasharray="0.7 1.7"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.28, ease }}
          />
          {/* Inner reference ring */}
          <circle
            cx="50"
            cy="50"
            r="16.5"
            fill="none"
            stroke="#33302E"
            strokeOpacity="0.65"
            strokeWidth="0.22"
          />
          {/* Thinner connecting cardinal lines */}
          <line x1="50" y1="9" x2="50" y2="18" stroke="#33302E" strokeWidth="0.25" />
          <line x1="50" y1="82" x2="50" y2="91" stroke="#33302E" strokeWidth="0.25" />
          <line x1="9" y1="50" x2="18" y2="50" stroke="#33302E" strokeWidth="0.25" />
          <line x1="82" y1="50" x2="91" y2="50" stroke="#33302E" strokeWidth="0.25" />
          {/* Cardinal operational nodes */}
          <circle cx="50" cy="9" r="0.95" fill="#C9C2B9" fillOpacity="0.55" />
          <circle cx="91" cy="50" r="0.95" fill="#C9C2B9" fillOpacity="0.55" />
          <circle cx="50" cy="91" r="0.95" fill="#E5232B" fillOpacity="0.75" />
          <circle cx="9" cy="50" r="0.95" fill="#C9C2B9" fillOpacity="0.55" />
          {/* Top-left segment - warm ivory with controlled luminance */}
          <motion.path
            d="M 46 18 A 32 32 0 0 0 18 46 L 30 46 A 20 20 0 0 1 46 30 Z"
            fill="#F4F0E9"
            fillOpacity="0.86"
            initial={reduce ? false : { opacity: 0, x: -12, y: -10, rotate: -16 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.2, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {/* Bottom-left segment - Collage brand red */}
          <motion.path
            d="M 18 54 A 32 32 0 0 0 44 82 L 44 70 A 20 20 0 0 1 30 54 Z"
            fill="#E5232B"
            fillOpacity="0.92"
            initial={reduce ? false : { opacity: 0, x: -14, y: 10, rotate: 13 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.34, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {/* Bottom-right segment - muted warm stone */}
          <motion.path
            d="M 54 82 A 32 32 0 0 0 80 66 L 69 57 A 20 20 0 0 1 54 70 Z"
            fill="#C9C2B9"
            fillOpacity="0.68"
            initial={reduce ? false : { opacity: 0, x: 13, y: 12, rotate: -13 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, delay: 0.48, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {/* Central Collage core symbol */}
          <motion.circle
            cx="50"
            cy="50"
            r="7.2"
            fill="#E5232B"
            initial={reduce ? false : { scale: 0.45, opacity: 0 }}
            animate={reduce ? {} : { scale: [0.45, 1.1, 1], opacity: 1 }}
            transition={{ duration: 0.56, delay: 0.72, ease }}
            style={{ transformOrigin: '50px 50px' }}
          />
          {!reduce && (
            <motion.circle
              cx="50"
              cy="50"
              r="10.2"
              fill="none"
              stroke="#E5232B"
              strokeWidth="0.22"
              animate={{ scale: [1, 1.22, 1], opacity: [0, 0.24, 0] }}
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
