import "./Table.css";

/**
 * 관리자 공통 테이블
 * - columns: [{ key, header, render?(row, index), width?, align? }]
 * - loading: 처음 불러올 때는 안내 문구, 이미 데이터가 있으면 흐리게 표시 (페이지 이동 시 깜빡임 방지)
 */
function Table({ columns, rows, rowKey = "_id", loading = false, emptyMessage = "데이터가 없어요" }) {
  const showLoading = loading && rows.length === 0;

  return (
    <div className="a-table-wrap">
      <table className={`a-table ${loading && rows.length ? "a-table--loading" : ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width, textAlign: col.align }} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showLoading || rows.length === 0 ? (
            <tr>
              <td className="a-table__state" colSpan={columns.length}>
                {showLoading ? "불러오는 중…" : emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row[rowKey]}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align }}>
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
