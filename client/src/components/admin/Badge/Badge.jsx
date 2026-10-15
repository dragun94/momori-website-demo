import "./Badge.css";

/** 상태 뱃지. tone: "neutral" | "success" | "warning" | "danger" */
function Badge({ tone = "neutral", children }) {
  return <span className={`a-badge a-badge--${tone}`}>{children}</span>;
}

export default Badge;
