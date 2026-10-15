import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import AdminRoute from "./routes/AdminRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

// 처음 화면에 꼭 필요하지 않은 페이지는 방문할 때 내려받음 (첫 로딩 용량 감소)
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MyPage = lazy(() => import("./pages/MyPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function App() {
  return (
    <>
      <Header />
      {/* 페이지 파일을 받는 짧은 순간에는 빈 화면 (로딩 문구 깜빡임 방지) */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* 비로그인 전용: 로그인 상태면 메인으로 */}
          <Route element={<GuestRoute />}>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* 로그인 필요: 비로그인 시 /login으로 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/mypage" element={<MyPage />} />
          </Route>

          {/* 관리자 전용: 비로그인 → /login, 일반 회원 → 메인 */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
