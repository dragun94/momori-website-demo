import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Header.css";

/** 모든 페이지 상단 헤더: 로고 + 로그인 상태별 메뉴 */
function Header() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // 서버 호출 → 상태 초기화 → 메인으로 이동
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
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo">
          모모리
        </Link>

        {/* 로그인 확인 중에는 메뉴를 숨겨 '로그인 → OO님' 깜빡임 방지 */}
        {!isLoading && (
          <nav className="header__nav" aria-label="회원 메뉴">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link to="/admin" className="header__link header__link--admin">
                    관리자
                  </Link>
                )}
                <span className="header__user">
                  <span className="header__who">
                    <strong className="header__name">{user.name}</strong>님
                  </span>{" "}
                  <span>반갑습니다</span>
                </span>
                <Link to="/mypage" className="header__link">
                  마이페이지
                </Link>
                <button
                  type="button"
                  className="header__link"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="header__link">
                  로그인
                </Link>
                <Link to="/signup" className="header__link header__link--point">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
