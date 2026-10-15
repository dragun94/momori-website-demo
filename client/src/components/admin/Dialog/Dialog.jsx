import { useEffect, useId } from "react";
import "./Dialog.css";

/**
 * 관리자 공통 모달 틀 (제목 + 내용 + 하단 버튼 영역)
 * - dismissible: false면 ESC/바깥 클릭으로 닫히지 않음 (저장 중 등)
 */
function Dialog({ open, title, children, footer, onClose, dismissible = true, size = "md" }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && dismissible && onClose?.();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div className="a-dialog" onMouseDown={() => dismissible && onClose?.()}>
      <div
        className={`a-dialog__panel a-dialog__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="a-dialog__title">
          {title}
        </h2>
        <div className="a-dialog__body">{children}</div>
        {footer && <div className="a-dialog__footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Dialog;
