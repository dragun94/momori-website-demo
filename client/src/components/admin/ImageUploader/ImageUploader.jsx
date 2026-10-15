import { useRef, useState } from "react";
import { uploadImages } from "../../../api/admin";
import { useToast } from "../../../contexts/ToastContext";
import "./ImageUploader.css";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * 상품 이미지 업로드 + 미리보기 + 삭제 + 순서 변경 + 대표 이미지 지정
 * - images: 이미지 주소 배열 (순서 = 상세 페이지 노출 순서)
 * - thumbnail: 대표 이미지 주소 (항상 images 중 하나)
 * - onChange({ images, thumbnail })
 */
function ImageUploader({ images, thumbnail, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const remaining = MAX_IMAGES - images.length;

  // 서버에 보내기 전에 형식/용량/개수 먼저 확인 (서버에서도 한 번 더 검사)
  const handleFiles = async (fileList) => {
    const files = [...fileList];
    if (!files.length || uploading) return;
    if (files.some((f) => !ACCEPT_TYPES.includes(f.type))) return toast.error("jpg, png, webp 이미지만 올릴 수 있어요");
    if (files.some((f) => f.size > MAX_FILE_SIZE)) return toast.error("이미지는 1장당 5MB 이하만 올릴 수 있어요");
    if (files.length > remaining) return toast.error(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있어요 (${remaining}장 더 가능)`);

    setUploading(true);
    try {
      const urls = await uploadImages(files);
      onChange({ images: [...images, ...urls], thumbnail: thumbnail || urls[0] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = ""; // 같은 파일 다시 선택 가능하게
    }
  };

  const remove = (url) => {
    const next = images.filter((u) => u !== url);
    onChange({ images: next, thumbnail: url === thumbnail ? (next[0] ?? "") : thumbnail });
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ images: next, thumbnail });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="a-uploader">
      <ul className="a-uploader__grid">
        {images.map((url, index) => (
          <li key={url} className={`a-uploader__item ${url === thumbnail ? "is-thumbnail" : ""}`}>
            <img src={url} alt={`상품 이미지 ${index + 1}`} className="a-uploader__img" />
            {url === thumbnail && <span className="a-uploader__badge">대표</span>}
            <div className="a-uploader__actions">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="앞으로 이동">
                ←
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === images.length - 1}
                aria-label="뒤로 이동"
              >
                →
              </button>
              {url !== thumbnail && (
                <button type="button" onClick={() => onChange({ images, thumbnail: url })}>
                  대표로
                </button>
              )}
              <button type="button" className="is-danger" onClick={() => remove(url)} aria-label="이미지 삭제">
                삭제
              </button>
            </div>
          </li>
        ))}

        {remaining > 0 && (
          <li>
            <button
              type="button"
              className={`a-uploader__add ${dragOver ? "is-dragover" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              disabled={uploading}
            >
              {uploading ? (
                <span>올리는 중…</span>
              ) : (
                <>
                  <span className="a-uploader__plus" aria-hidden="true">
                    +
                  </span>
                  <span>이미지 추가</span>
                  <span className="a-uploader__count">
                    {images.length}/{MAX_IMAGES}
                  </span>
                </>
              )}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="a-uploader__hint">
        jpg, png, webp · 1장당 5MB 이하 · 최대 {MAX_IMAGES}장 · 끌어다 놓아도 돼요. 첫 이미지가 기본 대표 이미지예요.
      </p>
    </div>
  );
}

export default ImageUploader;
