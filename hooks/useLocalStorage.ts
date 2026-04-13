import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 状態の初期化
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isFirstRender = useRef(true);

  // 初回マウント時に保存されているデータを取得（自動で反映はしない）
  const getStoredData = useCallback((): T | null => {
    if (typeof window === "undefined") return null;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [key]);

  // 状態が変化した時に localStorage を更新（初回レンダリング時はスキップ）
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue, getStoredData] as const;
}
