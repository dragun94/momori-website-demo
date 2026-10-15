import { Link } from "react-router-dom";

// TODO: 로그인 기능은 다음 작업에서 구현
function LoginPage() {
  return (
    <main className="page">
      <div className="card">
        <header className="brand">
          <Link to="/" className="brand__logo">
            모모리
          </Link>
        </header>
        <h1 className="page-title">로그인</h1>

        <p className="footer-link">
          아직 회원이 아니신가요?
          <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
