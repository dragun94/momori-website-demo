import { Suspense, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import ToastProvider from "../../components/admin/Toast";
import { useAuth } from "../../contexts/AuthContext";
import "./admin.css";
import "./AdminLayout.css";

const MENU = [
  { to: "/admin", label: "대시보드", end: true },
  { to: "/admin/products", label: "상품 관리" },
  { to: "/admin/categories", label: "카테고리 관리" },
  { to: "/admin/orders", label: "주문 관리" },
  { to: "/admin/users", label: "회원 관리" },
];

/** 관리자 화면 공통 틀: 상단바 + 왼쪽 사이드바(좁은 화면에서는 햄버거 메뉴) + 페이지 */
function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <ToastProvider>
      <div className="admin">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-topbar__menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            aria-controls="admin-sidebar"
          >
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
          <Link to="/admin" className="admin-topbar__title" onClick={closeMenu}>
            모모리 <span>관리자</span>
          </Link>
          <div className="admin-topbar__right">
            <span className="admin-topbar__user">
              <strong>{user.name}</strong>님
            </span>
            <Link to="/" className="a-btn a-btn--ghost a-btn--sm">
              쇼핑몰로 가기
            </Link>
            <button type="button" className="a-btn a-btn--sm" onClick={handleLogout} disabled={loggingOut}>
              로그아웃
            </button>
          </div>
        </header>

        <div className="admin-body">
          <aside id="admin-sidebar" className={`admin-sidebar ${menuOpen ? "is-open" : ""}`}>
            <nav aria-label="관리자 메뉴">
              <ul className="admin-sidebar__list">
                {MENU.map((item) => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end} className="admin-sidebar__link" onClick={closeMenu}>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          {menuOpen && <div className="admin-backdrop" onClick={closeMenu} aria-hidden="true" />}

          <main className="admin-main">
            <Suspense fallback={<p className="a-muted">불러오는 중…</p>}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default AdminLayout;
