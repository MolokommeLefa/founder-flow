import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { logFocusSession } from "@/hooks/useFocusSessions";

interface FocusTimerState {
  elapsedSeconds: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  toggle: () => void;
  formattedTime: string;
}

const FocusTimerContext = createContext<FocusTimerState | null>(null);

export const useFocusTimer = () => {
  const ctx = useContext(FocusTimerContext);
  if (!ctx) throw new Error("useFocusTimer must be used within FocusTimerProvider");
  return ctx;
};

export const FocusTimerProvider = ({ children }: { children: ReactNode }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    const saved = localStorage.getItem("focusTimer");
    if (saved) {
      const { elapsed, lastTimestamp, running } = JSON.parse(saved);
      if (running) {
        const diff = Math.floor((Date.now() - lastTimestamp) / 1000);
        return elapsed + diff;
      }
      return elapsed;
    }
    return 0;
  });

  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem("focusTimer");
    return saved ? JSON.parse(saved).running : false;
  });

  const sessionStartRef = useRef<Date | null>(null);
  const sessionStartElapsedRef = useRef<number>(0);

  // Persist state
  useEffect(() => {
    localStorage.setItem("focusTimer", JSON.stringify({
      elapsed: elapsedSeconds,
      lastTimestamp: Date.now(),
      running: isRunning,
    }));
  }, [elapsedSeconds, isRunning]);

  // Tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const finalizeSession = useCallback((finalElapsed: number) => {
    if (sessionStartRef.current) {
      const duration = finalElapsed - sessionStartElapsedRef.current;
      if (duration > 0) {
        logFocusSession(duration, sessionStartRef.current, new Date());
      }
      sessionStartRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!isRunning) {
      sessionStartRef.current = new Date();
      sessionStartElapsedRef.current = elapsedSeconds;
    }
    setIsRunning(true);
  }, [isRunning, elapsedSeconds]);

  const stop = useCallback(() => {
    if (isRunning) finalizeSession(elapsedSeconds);
    setIsRunning(false);
  }, [isRunning, elapsedSeconds, finalizeSession]);

  const reset = useCallback(() => {
    if (isRunning) finalizeSession(elapsedSeconds);
    setIsRunning(false);
    setElapsedSeconds(0);
  }, [isRunning, elapsedSeconds, finalizeSession]);

  const toggle = useCallback(() => {
    if (isRunning) {
      finalizeSession(elapsedSeconds);
      setIsRunning(false);
    } else {
      sessionStartRef.current = new Date();
      sessionStartElapsedRef.current = elapsedSeconds;
      setIsRunning(true);
    }
  }, [isRunning, elapsedSeconds, finalizeSession]);

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <FocusTimerContext.Provider value={{ elapsedSeconds, isRunning, start, stop, reset, toggle, formattedTime }}>
      {children}
    </FocusTimerContext.Provider>
  );
};
