import Dialog from "../Dialog";

/**
 * 확인 / 취소 모달
 * - danger: 확인 버튼을 빨간색으로 (삭제, 이탈 등 되돌리기 어려운 동작)
 * - loading: 확인 처리 중에는 버튼 비활성 + ESC/바깥 클릭 무시
 */
function ConfirmModal({
  open,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      title={title}
      size="sm"
      onClose={onCancel}
      dismissible={!loading}
      footer={
        <>
          <button type="button" className="a-btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`a-btn ${danger ? "a-btn--danger" : "a-btn--primary"}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? "처리 중…" : confirmText}
          </button>
        </>
      }
    >
      {message}
    </Dialog>
  );
}

export default ConfirmModal;
