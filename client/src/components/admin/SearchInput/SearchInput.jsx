import { useState } from "react";
import "./SearchInput.css";

/**
 * 검색창: 엔터 또는 검색 버튼으로 onSearch(검색어) 호출
 * 바깥에서 검색어가 바뀌면(뒤로 가기 등) key를 바꿔 다시 마운트하세요: <SearchInput key={q} defaultValue={q} />
 */
function SearchInput({ defaultValue = "", onSearch, placeholder = "검색어를 입력하세요", label = "검색" }) {
  const [text, setText] = useState(defaultValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(text.trim());
  };

  const handleClear = () => {
    setText("");
    onSearch("");
  };

  return (
    <form className="a-search" role="search" onSubmit={handleSubmit}>
      <input
        type="text"
        className="a-input a-search__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
      {text && (
        <button type="button" className="a-search__clear" onClick={handleClear} aria-label="검색어 지우기">
          ×
        </button>
      )}
      <button type="submit" className="a-btn">
        검색
      </button>
    </form>
  );
}

export default SearchInput;
