import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/**
 * 전역 로그인 상태
 * @returns {{ user: object | null, isLoading: boolean, login: Function, logout: Function, refresh: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있어요.");
  return context;
}
