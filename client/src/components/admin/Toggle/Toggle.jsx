import "./Toggle.css";

/**
 * on/off 스위치 (판매 여부, 노출 여부 등)
 * - label: 화면에는 children을, 스크린리더에는 label을 읽어줌
 */
function Toggle({ checked, onChange, disabled = false, label, children }) {
  return (
    <span className="a-toggle-wrap">
      <button
        type="button"
        role="switch"
        className="a-toggle"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="a-toggle__thumb" />
      </button>
      {children && <span className="a-toggle__text">{children}</span>}
    </span>
  );
}

export default Toggle;
