import React, { useState, useEffect, useMemo } from 'react';

interface SessionTimerProps {
  startedAt: Date;
  durationMinutes: number;
  onEnd: () => void;
}

export function SessionTimer({ startedAt, durationMinutes, onEnd }: SessionTimerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { elapsed, remaining, progress, isOvertime } = useMemo(() => {
    const start = new Date(startedAt).getTime();
    const elapsedMs = now.getTime() - start;
    const totalMs = durationMinutes * 60 * 1000;
    const remainingMs = Math.max(0, totalMs - elapsedMs);

    return {
      elapsed: Math.floor(elapsedMs / 1000),
      remaining: Math.floor(remainingMs / 1000),
      progress: Math.min(100, (elapsedMs / totalMs) * 100),
      isOvertime: elapsedMs > totalMs
    };
  }, [now, startedAt, durationMinutes]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card bg-primary text-primary-content shadow-xl">
      <div className="card-body items-center text-center">
        <h2 className="text-lg font-semibold mb-2">Focus Session</h2>

        {/* Timer Display */}
        <div
          className={`radial-progress text-5xl font-mono ${
            isOvertime ? 'text-warning' : ''
          }`}
          style={{
            '--value': progress,
            '--size': '12rem',
            '--thickness': '8px'
          } as React.CSSProperties}
          role="progressbar"
        >
          {isOvertime ? (
            <span className="text-warning">+{formatTime(elapsed - durationMinutes * 60)}</span>
          ) : (
            formatTime(remaining)
          )}
        </div>

        <p className="text-sm mt-2 opacity-80">
          {isOvertime
            ? 'Session complete! End when ready.'
            : `${formatTime(elapsed)} elapsed`}
        </p>

        {/* End Session Button */}
        <button
          className={`btn mt-4 ${isOvertime ? 'btn-warning' : 'btn-ghost border-primary-content/30'}`}
          onClick={onEnd}
        >
          End Session
        </button>
      </div>
    </div>
  );
}
