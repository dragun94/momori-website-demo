import "./FormField.css";

/**
 * 라벨 + 입력칸 + 오류/도움말 묶음
 * 입력칸(children)에는 id={htmlFor}, aria-invalid를 직접 넣어 주세요.
 */
function FormField({ label, htmlFor, required = false, error, hint, children }) {
  return (
    <div className={`a-field ${error ? "a-field--error" : ""}`}>
      {label && (
        <label className="a-field__label" htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="a-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="a-field__error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="a-field__hint">{hint}</p>
      )}
    </div>
  );
}

export default FormField;
