import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginRedirectState } from "./redirect";

/**
 * 로그인한 회원만 볼 수 있는 페이지
 * 비로그인 시 /login으로 보내고, 로그인 후 원래 주소로 돌아옴
 */
function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null; // 확인 중에는 아무것도 그리지 않아 깜빡임 방지
  if (!user) return <Navigate to="/login" replace state={loginRedirectState(location)} />;
  return <Outlet />;
}

export default ProtectedRoute;
