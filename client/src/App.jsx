import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import ShopLayout from "./layouts/ShopLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import AdminRoute from "./routes/AdminRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

// 처음 화면에 꼭 필요하지 않은 페이지는 방문할 때 내려받음 (첫 로딩 용량 감소)
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MyPage = lazy(() => import("./pages/MyPage"));

// 관리자 화면은 관리자만 내려받음
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const ComingSoonPage = lazy(() => import("./pages/admin/ComingSoonPage"));
const CategoryPage = lazy(() => import("./pages/admin/CategoryPage"));
const ProductListPage = lazy(() => import("./pages/admin/ProductListPage"));
const ProductFormPage = lazy(() => import("./pages/admin/ProductFormPage"));

// createBrowserRouter(데이터 라우터): 상품 폼의 "수정 중 이탈 확인"(useBlocker)에 필요
const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      {
        // 비로그인 전용: 로그인 상태면 메인(또는 원래 가려던 페이지)으로
        element: <GuestRoute />,
        children: [
          { path: "/signup", element: <SignupPage /> },
          { path: "/login", element: <LoginPage /> },
        ],
      },
      {
        // 로그인 필요: 비로그인 시 /login으로
        element: <ProtectedRoute />,
        children: [{ path: "/mypage", element: <MyPage /> }],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    // 관리자 전용: 비로그인 → /login, 일반 회원 → 메인
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: (
          <Suspense fallback={null}>
            <AdminLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <ComingSoonPage title="대시보드" /> },
          { path: "products", element: <ProductListPage /> },
          // key: 등록 ↔ 수정 화면 전환 시 폼 상태를 새로 시작
          { path: "products/new", element: <ProductFormPage key="new" /> },
          { path: "products/:id/edit", element: <ProductFormPage key="edit" /> },
          { path: "categories", element: <CategoryPage /> },
          { path: "orders", element: <ComingSoonPage title="주문 관리" /> },
          { path: "users", element: <ComingSoonPage title="회원 관리" /> },
          { path: "*", element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
