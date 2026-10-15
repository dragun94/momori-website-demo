import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginRedirectState } from "./redirect";

/**
 * 관리자(role: 'admin')만 볼 수 있는 페이지
 * - 비로그인: /login으로 (로그인 후 돌아옴)
 * - 일반 회원: 메인으로
 * 화면만 막는 것이므로, 관리자 API는 서버에서도 requireAuth + requireAdmin으로 막아야 함
 */
function AdminRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace state={loginRedirectState(location)} />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

export default AdminRoute;
