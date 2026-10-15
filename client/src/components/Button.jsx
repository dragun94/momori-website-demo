import "./Button.css";

/**
 * 공통 버튼
 * - variant: "primary" | "secondary"
 * - loading: true면 스피너 표시 + 클릭 불가
 */
function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export default Button;
