import { Link } from "react-router-dom";
import "../components/Button.css";

function HomePage() {
  return (
    <main className="page">
      <div className="card home">
        <header className="brand">
          <span className="brand__logo">모모리</span>
          <p className="brand__welcome">우리 아기의 첫 순간을 함께해요</p>
        </header>

        <div className="home__actions">
          <Link to="/signup" className="btn btn--primary">
            회원가입
          </Link>
          <Link to="/login" className="btn btn--secondary">
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
