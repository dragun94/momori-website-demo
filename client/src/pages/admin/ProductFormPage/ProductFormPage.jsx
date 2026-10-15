import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router-dom";
import * as adminApi from "../../../api/admin";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import FormField from "../../../components/admin/FormField";
import ImageUploader from "../../../components/admin/ImageUploader";
import Toggle from "../../../components/admin/Toggle";
import { useToast } from "../../../contexts/ToastContext";
import { formatPrice } from "../../../utils/format";
import { SKU_PATTERN, SLUG_PATTERN, slugify, toSku } from "../../../utils/slug";
import "./ProductFormPage.css";

const LIST_PATH = "/admin/products";

// 입력칸 값은 문자열로 관리하고 저장할 때 숫자로 변환
function newOption(slug = "") {
  return { key: crypto.randomUUID(), name: "", sku: toSku(slug), stock: "", extraPrice: "0", skuTouched: false };
}

function emptyForm() {
  return {
    name: "",
    slug: "",
    category: "",
    description: "",
    price: "",
    salePrice: "",
    isActive: true,
    images: [],
    thumbnail: "",
    options: [newOption()],
  };
}

function formFromProduct(product) {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category ?? "",
    description: product.description ?? "",
    price: String(product.price),
    salePrice: product.salePrice == null ? "" : String(product.salePrice),
    isActive: product.isActive,
    images: product.images ?? [],
    thumbnail: product.thumbnail ?? "",
    // 기존 SKU는 자동으로 바뀌지 않게 skuTouched: true
    options: product.options.map((o) => ({
      key: o._id,
      name: o.name,
      sku: o.sku,
      stock: String(o.stock),
      extraPrice: String(o.extraPrice ?? 0),
      skuTouched: true,
    })),
  };
}

// 수정 여부 비교용 (화면 전용 값인 key, skuTouched는 제외)
function snapshot(form) {
  const options = form.options.map(({ name, sku, stock, extraPrice }) => ({ name, sku, stock, extraPrice }));
  return JSON.stringify({ ...form, options });
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    slug: form.slug,
    category: form.category,
    description: form.description,
    price: Number(form.price),
    salePrice: form.salePrice === "" ? null : Number(form.salePrice),
    isActive: form.isActive,
    images: form.images,
    thumbnail: form.thumbnail || null,
    options: form.options.map((o) => ({
      name: o.name.trim(),
      sku: o.sku,
      stock: Number(o.stock),
      extraPrice: Number(o.extraPrice || 0),
    })),
  };
}

const isWholeNumber = (value) => value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "상품명을 입력해 주세요";
  if (!form.slug) errors.slug = "slug를 입력해 주세요";
  else if (!SLUG_PATTERN.test(form.slug)) errors.slug = "영소문자, 숫자, 하이픈(-)만 사용할 수 있어요";
  if (!form.category) errors.category = "카테고리를 선택해 주세요";

  if (form.price === "") errors.price = "가격을 입력해 주세요";
  else if (!isWholeNumber(form.price)) errors.price = "가격은 0 이상의 정수(원)로 입력해 주세요";
  if (form.salePrice !== "") {
    if (!isWholeNumber(form.salePrice)) errors.salePrice = "할인가는 0 이상의 정수(원)로 입력해 주세요";
    else if (!errors.price && Number(form.salePrice) > Number(form.price)) errors.salePrice = "할인가는 가격보다 클 수 없어요";
  }

  if (!form.options.length) errors.options = "옵션은 최소 1개 필요해요";
  const skuCount = {};
  form.options.forEach((o) => (skuCount[o.sku] = (skuCount[o.sku] ?? 0) + 1));
  const optionErrors = {};
  form.options.forEach((o) => {
    const e = {};
    if (!o.name.trim()) e.name = "옵션명을 입력해 주세요";
    if (!o.sku) e.sku = "SKU를 입력해 주세요";
    else if (!SKU_PATTERN.test(o.sku)) e.sku = "영대문자, 숫자, 하이픈(-)만 사용할 수 있어요";
    else if (skuCount[o.sku] > 1) e.sku = "같은 SKU가 이미 있어요";
    if (!isWholeNumber(o.stock)) e.stock = "0 이상의 정수";
    if (o.extraPrice !== "" && !isWholeNumber(o.extraPrice)) e.extraPrice = "0 이상의 정수";
    if (Object.keys(e).length) optionErrors[o.key] = e;
  });
  if (Object.keys(optionErrors).length) errors.optionRows = optionErrors;
  return errors;
}

/** 상품 등록(/admin/products/new)과 수정(/admin/products/:id/edit)에 함께 쓰는 폼 */
function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  // 처음 불러온 값 (수정 중 이탈 확인용). 수정 화면은 상품을 불러온 뒤 채움
  const [initialSnapshot, setInitialSnapshot] = useState(() => (isEdit ? null : snapshot(emptyForm())));
  const [categories, setCategories] = useState([]);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const allowLeaveRef = useRef(false); // 저장 성공 후 이동은 확인 없이

  const loading = initialSnapshot === null;
  const isDirty = !loading && snapshot(form) !== initialSnapshot;
  const errors = { ...(submitted ? validate(form) : {}), ...serverErrors };
  const optionErrors = errors.optionRows ?? {};

  useEffect(() => {
    let ignore = false;
    Promise.all([adminApi.getCategories(), isEdit ? adminApi.getProduct(id) : null])
      .then(([categoryList, product]) => {
        if (ignore) return;
        setCategories(categoryList);
        if (product) {
          const loaded = formFromProduct(product);
          setForm(loaded);
          setInitialSnapshot(snapshot(loaded));
        }
      })
      .catch((err) => {
        if (ignore) return;
        toast.error(err.message);
        if (isEdit) navigate(LIST_PATH, { replace: true });
      });
    return () => {
      ignore = true;
    };
  }, [id, isEdit, navigate, toast]);

  // 수정 중 페이지 이탈 확인: 앱 안 이동(메뉴, 뒤로 가기)은 모달, 새로고침/창 닫기는 브라우저 기본 확인창
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !allowLeaveRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const update = (changes) => {
    setForm((prev) => ({ ...prev, ...changes }));
    setServerErrors({});
  };

  // 직접 고치지 않은 SKU는 slug + 옵션명으로 자동 갱신
  const syncSkus = (options, slug) => options.map((o) => (o.skuTouched ? o : { ...o, sku: toSku(slug, o.name) }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((prev) => {
      const slug = slugTouched ? prev.slug : slugify(name);
      return { ...prev, name, slug, options: syncSkus(prev.options, slug) };
    });
    setServerErrors({});
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value.toLowerCase();
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug, options: syncSkus(prev.options, slug) }));
    setServerErrors({});
  };

  const updateOption = (key, changes) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) => {
        if (o.key !== key) return o;
        const next = { ...o, ...changes };
        if ("sku" in changes) {
          next.sku = changes.sku.toUpperCase();
          next.skuTouched = true;
        } else if ("name" in changes && !o.skuTouched) {
          next.sku = toSku(prev.slug, changes.name);
        }
        return next;
      }),
    }));
    setServerErrors({});
  };

  const addOption = () => setForm((prev) => ({ ...prev, options: [...prev.options, newOption(prev.slug)] }));

  const removeOption = (key) =>
    setForm((prev) => (prev.options.length > 1 ? { ...prev, options: prev.options.filter((o) => o.key !== key) } : prev));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    if (Object.keys(validate(form)).length) {
      toast.error("입력 내용을 확인해 주세요");
      // 첫 번째 오류 위치로 스크롤
      requestAnimationFrame(() =>
        document.querySelector(".a-field--error, .option-row.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(form);
      const saved = isEdit ? await adminApi.updateProduct(id, payload) : await adminApi.createProduct(payload);
      allowLeaveRef.current = true;
      toast.success(isEdit ? `'${saved.name}' 상품을 수정했어요` : `'${saved.name}' 상품을 등록했어요`);
      navigate(LIST_PATH);
    } catch (err) {
      setSaving(false);
      toast.error(err.message);
      if (err.message.includes("slug")) setServerErrors({ slug: err.message });
      else if (err.message.includes("SKU")) setServerErrors({ options: err.message });
    }
  };

  if (loading) return <p className="a-muted">상품 정보를 불러오는 중…</p>;

  const discountRate =
    !errors.price && !errors.salePrice && form.salePrice !== "" && Number(form.price) > 0
      ? Math.round((1 - Number(form.salePrice) / Number(form.price)) * 100)
      : null;
  const totalStock = form.options.reduce((sum, o) => sum + (isWholeNumber(o.stock) ? Number(o.stock) : 0), 0);

  return (
    <div className="a-page product-form-page">
      <div className="a-page__head">
        <div>
          <Link to={LIST_PATH} className="product-form__back">
            ← 상품 목록
          </Link>
          <h1 className="a-page__title">{isEdit ? "상품 수정" : "상품 등록"}</h1>
        </div>
      </div>

      <form className="product-form" onSubmit={handleSubmit} noValidate>
        <section className="a-card product-section">
          <h2 className="product-section__title">기본 정보</h2>
          <div className="product-grid">
            <FormField label="상품명" htmlFor="product-name" required error={errors.name}>
              <input
                id="product-name"
                className="a-input"
                value={form.name}
                onChange={handleNameChange}
                placeholder="예: 모모리 방수 턱받이"
                aria-invalid={Boolean(errors.name)}
              />
            </FormField>
            <FormField
              label="slug (상품 주소)"
              htmlFor="product-slug"
              required
              error={errors.slug}
              hint={slugTouched ? "영소문자, 숫자, 하이픈(-)만 사용" : "상품명을 입력하면 자동으로 만들어져요"}
            >
              <input
                id="product-slug"
                className="a-input"
                value={form.slug}
                onChange={handleSlugChange}
                placeholder="예: momori-waterproof-bib"
                aria-invalid={Boolean(errors.slug)}
              />
            </FormField>
            <FormField
              label="카테고리"
              htmlFor="product-category"
              required
              error={errors.category}
              hint={categories.length === 0 ? "카테고리가 없어요. 카테고리 관리에서 먼저 추가해 주세요." : undefined}
            >
              <select
                id="product-category"
                className="a-select"
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
                aria-invalid={Boolean(errors.category)}
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.isActive ? "" : " (숨김)"}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="상품 설명" htmlFor="product-description">
            <textarea
              id="product-description"
              className="a-textarea"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="소재, 사이즈, 세탁 방법 등을 적어 주세요"
              rows={6}
            />
          </FormField>
        </section>

        <section className="a-card product-section">
          <h2 className="product-section__title">가격</h2>
          <div className="product-grid">
            <FormField label="가격 (원)" htmlFor="product-price" required error={errors.price}>
              <input
                id="product-price"
                className="a-input"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
                placeholder="15000"
                aria-invalid={Boolean(errors.price)}
              />
            </FormField>
            <FormField
              label="할인가 (원, 선택)"
              htmlFor="product-sale-price"
              error={errors.salePrice}
              hint={discountRate !== null ? `${discountRate}% 할인 · 판매가 ${formatPrice(form.salePrice)}` : "비워 두면 할인 없음"}
            >
              <input
                id="product-sale-price"
                className="a-input"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.salePrice}
                onChange={(e) => update({ salePrice: e.target.value })}
                placeholder="12000"
                aria-invalid={Boolean(errors.salePrice)}
              />
            </FormField>
          </div>
        </section>

        <section className="a-card product-section">
          <div className="product-section__head">
            <h2 className="product-section__title">
              옵션 <span className="a-muted">· 재고는 옵션별로 관리해요 (총 {totalStock.toLocaleString("ko-KR")}개)</span>
            </h2>
            <button type="button" className="a-btn a-btn--sm" onClick={addOption}>
              + 옵션 추가
            </button>
          </div>
          {errors.options && (
            <p className="a-field__error" role="alert">
              {errors.options}
            </p>
          )}

          <div className="option-head" aria-hidden="true">
            <span>옵션명 *</span>
            <span>SKU (재고 관리 코드) *</span>
            <span>재고 *</span>
            <span>추가금액 (원)</span>
            <span />
          </div>
          <ul className="option-list">
            {form.options.map((option, index) => {
              const e = optionErrors[option.key] ?? {};
              return (
                <li key={option.key} className={`option-row ${Object.keys(e).length ? "has-error" : ""}`}>
                  <div className="option-cell">
                    <input
                      className="a-input"
                      value={option.name}
                      onChange={(ev) => updateOption(option.key, { name: ev.target.value })}
                      placeholder="예: 핑크"
                      aria-label={`옵션 ${index + 1} 옵션명`}
                      aria-invalid={Boolean(e.name)}
                    />
                    {e.name && <p className="a-field__error">{e.name}</p>}
                  </div>
                  <div className="option-cell">
                    <input
                      className="a-input option-sku"
                      value={option.sku}
                      onChange={(ev) => updateOption(option.key, { sku: ev.target.value })}
                      placeholder="자동 생성"
                      aria-label={`옵션 ${index + 1} SKU`}
                      aria-invalid={Boolean(e.sku)}
                    />
                    {e.sku && <p className="a-field__error">{e.sku}</p>}
                  </div>
                  <div className="option-cell">
                    <input
                      className="a-input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={option.stock}
                      onChange={(ev) => updateOption(option.key, { stock: ev.target.value })}
                      placeholder="0"
                      aria-label={`옵션 ${index + 1} 재고`}
                      aria-invalid={Boolean(e.stock)}
                    />
                    {e.stock && <p className="a-field__error">{e.stock}</p>}
                  </div>
                  <div className="option-cell">
                    <input
                      className="a-input"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="100"
                      value={option.extraPrice}
                      onChange={(ev) => updateOption(option.key, { extraPrice: ev.target.value })}
                      placeholder="0"
                      aria-label={`옵션 ${index + 1} 추가금액`}
                      aria-invalid={Boolean(e.extraPrice)}
                    />
                    {e.extraPrice && <p className="a-field__error">{e.extraPrice}</p>}
                  </div>
                  <button
                    type="button"
                    className="a-btn a-btn--sm a-btn--ghost option-remove"
                    onClick={() => removeOption(option.key)}
                    disabled={form.options.length === 1}
                    aria-label={`옵션 ${index + 1} 삭제`}
                    title={form.options.length === 1 ? "옵션은 최소 1개 필요해요" : "옵션 삭제"}
                  >
                    삭제
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="a-card product-section">
          <h2 className="product-section__title">이미지</h2>
          <ImageUploader
            images={form.images}
            thumbnail={form.thumbnail}
            onChange={({ images, thumbnail }) => update({ images, thumbnail })}
          />
        </section>

        <section className="a-card product-section">
          <h2 className="product-section__title">판매 설정</h2>
          <Toggle checked={form.isActive} onChange={(isActive) => update({ isActive })} label="판매 여부">
            {form.isActive ? "판매중 — 쇼핑몰에 노출돼요" : "판매중지 — 쇼핑몰에 보이지 않아요"}
          </Toggle>
        </section>

        <div className="product-form__actions">
          {isDirty && <span className="a-muted">저장하지 않은 변경사항이 있어요</span>}
          <Link to={LIST_PATH} className="a-btn">
            취소
          </Link>
          <button type="submit" className="a-btn a-btn--primary" disabled={saving}>
            {saving ? "저장 중…" : isEdit ? "수정 내용 저장" : "상품 등록"}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={blocker.state === "blocked"}
        title="페이지를 나갈까요?"
        message="저장하지 않은 변경사항은 사라져요."
        confirmText="나가기"
        cancelText="계속 작성"
        danger
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </div>
  );
}

export default ProductFormPage;
