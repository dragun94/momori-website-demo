import { Link } from "react-router-dom";
import "./Button.css";

/**
 * 공통 버튼
 * - variant: "primary" | "secondary"
 * - loading: true면 스피너 표시 + 클릭 불가
 * - to: 지정하면 버튼 모양의 링크(<Link>)로 렌더링
 */
function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  to,
  ...props
}) {
  const classes = `btn btn--${variant} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
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
