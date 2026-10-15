import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * 비로그인 회원만 볼 수 있는 페이지 (/login, /signup)
 * 이미 로그인했거나 방금 로그인에 성공하면 원래 가려던 페이지(없으면 메인)로 이동
 */
function GuestRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (user) return <Navigate to={location.state?.from ?? "/"} replace />;
  return <Outlet />;
}

export default GuestRoute;
