import "./Pagination.css";

const VISIBLE_PAGES = 5;

/** 이전 / 1 2 3 4 5 / 다음 (현재 페이지를 가운데에 두고 최대 5개 표시) */
function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - Math.floor(VISIBLE_PAGES / 2), totalPages - VISIBLE_PAGES + 1));
  const end = Math.min(totalPages, start + VISIBLE_PAGES - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="a-pagination" aria-label="페이지 이동">
      <button
        type="button"
        className="a-pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className="a-pagination__btn"
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="a-pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        다음
      </button>
    </nav>
  );
}

export default Pagination;
