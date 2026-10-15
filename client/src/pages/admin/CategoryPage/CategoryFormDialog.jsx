import { useState } from "react";
import * as adminApi from "../../../api/admin";
import Dialog from "../../../components/admin/Dialog";
import FormField from "../../../components/admin/FormField";
import Toggle from "../../../components/admin/Toggle";
import { SLUG_PATTERN, slugify } from "../../../utils/slug";

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "카테고리 이름을 입력해 주세요";
  if (!form.slug) errors.slug = "slug를 입력해 주세요";
  else if (!SLUG_PATTERN.test(form.slug)) errors.slug = "영소문자, 숫자, 하이픈(-)만 사용할 수 있어요";
  return errors;
}

/**
 * 카테고리 추가/수정 모달 (열릴 때마다 새로 마운트되므로 props로 초기값 설정)
 * - category가 없으면 추가, 있으면 수정
 * - slug는 이름을 입력하면 자동 생성, 직접 고치면 그때부터는 자동 생성 중단
 */
function CategoryFormDialog({ category, onClose, onSaved }) {
  const isEdit = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    isActive: category?.isActive ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState({});
  const [saving, setSaving] = useState(false);

  const errors = submitted ? { ...validate(form), ...serverError } : serverError;

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
    setServerError({});
  };

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
    setServerError({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(form)).length || saving) return;

    setSaving(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug, isActive: form.isActive };
      const saved = isEdit
        ? await adminApi.updateCategory(category._id, payload)
        : await adminApi.createCategory(payload);
      onSaved(saved, isEdit);
    } catch (err) {
      // slug 중복은 slug 칸 아래에, 나머지는 하단에 표시
      setServerError(err.message.includes("slug") ? { slug: err.message } : { form: err.message });
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      title={isEdit ? "카테고리 수정" : "카테고리 추가"}
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <button type="button" className="a-btn" onClick={onClose} disabled={saving}>
            취소
          </button>
          <button type="submit" form="category-form" className="a-btn a-btn--primary" disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </>
      }
    >
      <form id="category-form" className="category-form" onSubmit={handleSubmit} noValidate>
        <FormField label="이름" htmlFor="category-name" required error={errors.name}>
          <input
            id="category-name"
            className="a-input"
            value={form.name}
            onChange={handleNameChange}
            placeholder="예: 턱받이"
            aria-invalid={Boolean(errors.name)}
            autoFocus
          />
        </FormField>
        <FormField
          label="slug (주소에 쓰이는 이름)"
          htmlFor="category-slug"
          required
          error={errors.slug}
          hint={slugTouched ? "영소문자, 숫자, 하이픈(-)만 사용" : "이름을 입력하면 자동으로 만들어져요. 직접 고칠 수도 있어요."}
        >
          <input
            id="category-slug"
            className="a-input"
            value={form.slug}
            onChange={handleSlugChange}
            placeholder="예: bibs"
            aria-invalid={Boolean(errors.slug)}
          />
        </FormField>
        <Toggle
          checked={form.isActive}
          onChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
          label="쇼핑몰에 노출"
        >
          {form.isActive ? "쇼핑몰에 노출" : "숨김"}
        </Toggle>
        {errors.form && (
          <p className="a-field__error" role="alert">
            {errors.form}
          </p>
        )}
      </form>
    </Dialog>
  );
}

export default CategoryFormDialog;
