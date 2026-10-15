import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/Header";

/** 쇼핑몰 화면 공통 틀: 상단 헤더 + 페이지 */
function ShopLayout() {
  return (
    <>
      <Header />
      {/* 페이지 파일을 받는 짧은 순간에는 빈 화면 (로딩 문구 깜빡임 방지) */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </>
  );
}

export default ShopLayout;
