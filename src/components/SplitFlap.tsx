import { useEffect, useRef, useState } from 'react';

interface SplitFlapProps {
  value: string;
}

export function SplitFlap({ value }: SplitFlapProps) {
  const previous = useRef(value);
  const [current, setCurrent] = useState(value);
  const [outgoing, setOutgoing] = useState<string | null>(null);

  useEffect(() => {
    if (value === previous.current) return;
    const from = previous.current;
    previous.current = value;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCurrent(value);
      setOutgoing(null);
      return;
    }
    setOutgoing(from);
    setCurrent(value);
    const timer = window.setTimeout(() => setOutgoing(null), 460);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <span className={`flap num${outgoing !== null ? ' is-flipping' : ''}`} aria-hidden="true">
      <span className="flap-current">{current}</span>
      {outgoing !== null ? (
        <>
          <span className="flap-leave">{outgoing}</span>
          <span className="flap-enter">{current}</span>
        </>
      ) : null}
    </span>
  );
}
