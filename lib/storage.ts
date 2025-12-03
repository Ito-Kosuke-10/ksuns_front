export type BrowserStorage = Storage | null;

/**
 * ブラウザ環境であれば localStorage を返し、
 * SSR やストレージが使えない環境では null を返す。
 */
export function getBrowserStorage(): BrowserStorage {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

