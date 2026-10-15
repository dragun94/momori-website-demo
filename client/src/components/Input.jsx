import { useId, useState } from "react";
import "./Input.css";

/**
 * 공통 입력 컴포넌트
 * - error: 오류 메시지 (있으면 빨간 테두리 + 아래 표시)
 * - success: 성공 메시지 (error가 없을 때만 표시)
 * - type="password"이면 보기/숨기기 토글 버튼이 자동으로 붙습니다.
 */
function Input({ label, type = "text", error, success, hint, id, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const [visible, setVisible] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword && visible ? "text" : type;
  const message = error || success || hint;
  const status = error ? "error" : success ? "success" : "";

  return (
    <div className={`field ${status ? `field--${status}` : ""}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="field__control">
        <input
          id={inputId}
          type={inputType}
          className="field__input"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field__toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {visible ? "숨기기" : "보기"}
          </button>
        )}
      </div>
      {message && (
        <p id={messageId} className="field__message" role={error ? "alert" : undefined}>
          {message}
        </p>
      )}
    </div>
  );
}

export default Input;
