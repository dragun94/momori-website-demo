import { useAuth } from "../../contexts/AuthContext";
import "./MyPage.css";

// ProtectedRoute 안에서만 렌더링되므로 user가 항상 있음
function MyPage() {
  const { user } = useAuth();

  const rows = [
    { label: "이름", value: user.name },
    { label: "이메일", value: user.email },
    { label: "휴대폰", value: user.phone || "등록된 번호가 없어요" },
  ];

  return (
    <main className="page">
      <div className="card">
        <h1 className="page-title">마이페이지</h1>
        <p className="mypage__greeting">
          <strong>{user.name}</strong>님, 반가워요 🍼
        </p>

        <dl className="profile">
          {rows.map((row) => (
            <div key={row.label} className="profile__row">
              <dt className="profile__label">{row.label}</dt>
              <dd className="profile__value">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}

export default MyPage;
