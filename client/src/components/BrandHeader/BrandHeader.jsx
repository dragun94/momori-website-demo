import { Link } from "react-router-dom";
import "./BrandHeader.css";

/** 페이지 상단의 큰 "모모리" 로고 + 환영 문구 (메인, 로그인, 회원가입) */
function BrandHeader({ welcome }) {
  return (
    <header className="brand">
      <Link to="/" className="brand__logo">
        모모리
      </Link>
      {welcome && <p className="brand__welcome">{welcome}</p>}
    </header>
  );
}

export default BrandHeader;
