import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { AuthContext } from "./AuthContext";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 앱 시작 시 로그인 여부를 확인하는 동안 true (이 동안 로그인/비로그인 화면을 그리지 않음)
  const [isLoading, setIsLoading] = useState(true);

  // 쿠키의 토큰으로 현재 회원 정보를 다시 불러옴 (없거나 만료면 비로그인)
  const refresh = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const me = await authApi.login({ email, password, rememberMe });
    setUser(me);
    return me;
  }, []);

  // 서버 호출이 실패해도(네트워크 오류 등) 화면에서는 로그아웃 처리
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // 앱 시작 시 한 번 확인 → 새로고침해도 로그인 유지
  useEffect(() => {
    let ignore = false; // 언마운트(또는 StrictMode 재실행) 후 늦게 온 응답은 무시
    authApi
      .getMe()
      .then((me) => !ignore && setUser(me))
      .catch(() => !ignore && setUser(null))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refresh }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
