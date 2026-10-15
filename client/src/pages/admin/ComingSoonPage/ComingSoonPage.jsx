/** 아직 만들지 않은 관리자 메뉴 (대시보드, 주문 관리, 회원 관리) */
function ComingSoonPage({ title }) {
  return (
    <div className="a-page">
      <div className="a-page__head">
        <h1 className="a-page__title">{title}</h1>
      </div>
      <div className="a-card" style={{ padding: "64px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>준비 중이에요</p>
        <p className="a-muted" style={{ margin: "6px 0 0" }}>
          다음 단계에서 만들 예정이에요.
        </p>
      </div>
    </div>
  );
}

export default ComingSoonPage;
