import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Failed to write localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState] as const;
}

export function usePersistentSet<T>(key: string, defaultValue: Set<T>) {
  const [state, setState] = useState<Set<T>>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        const array = JSON.parse(stored) as T[];
        return new Set(array);
      }
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(Array.from(state)));
    } catch (error) {
      console.warn(`Failed to write localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState] as const;
}
