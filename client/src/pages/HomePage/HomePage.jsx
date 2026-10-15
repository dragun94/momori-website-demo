import BrandHeader from "../../components/BrandHeader";
import Button from "../../components/Button";
import { useAuth } from "../../contexts/AuthContext";
import "./HomePage.css";

// 임시 메인 페이지
function HomePage() {
  const { user, isLoading } = useAuth();

  return (
    <main className="page">
      <div className="card home">
        <BrandHeader
          welcome={user ? `${user.name}님, 우리 아기의 첫 순간을 함께해요` : "우리 아기의 첫 순간을 함께해요"}
        />

        {/* 로그인 확인 중에는 버튼을 그리지 않아 깜빡임 방지 */}
        {!isLoading && (
          <div className="home__actions">
            {user ? (
              <Button to="/mypage">마이페이지</Button>
            ) : (
              <>
                <Button to="/signup">회원가입</Button>
                <Button to="/login" variant="secondary">
                  로그인
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default HomePage;
