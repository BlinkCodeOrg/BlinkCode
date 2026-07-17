import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useAppUpdates } from './providers/AppUpdatesProvider';

function UpdateEffect() {
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setCompleted(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);
  if (completed) return null;
  return (
    <>
      <motion.div
        className="browser-update-animation"
        initial={{ top: '150%', opacity: 0.5 }}
        animate={{ top: '-150%', opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.div
        className="browser-update-animation-border"
        initial={{ '--background-top': '150%' } as never}
        animate={{ '--background-top': '-50%' } as never}
        transition={{ duration: 0.5, delay: 0.28 }}
      />
    </>
  );
}

export function ConditionalUpdateEffect() {
  const { hasUpdated } = useAppUpdates();
  return hasUpdated ? <UpdateEffect /> : null;
}
