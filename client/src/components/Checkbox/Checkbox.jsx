import { useId } from "react";
import "./Checkbox.css";

/**
 * 공통 체크박스 (라벨 전체가 터치 영역)
 * - strong: 굵은 라벨 (전체 동의 등)
 */
function Checkbox({ children, checked, onChange, strong = false, id, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <label className={`checkbox ${strong ? "checkbox--strong" : ""}`} htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        className="checkbox__input"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        {...props}
      />
      <span className="checkbox__box" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="checkbox__label">{children}</span>
    </label>
  );
}

export default Checkbox;
