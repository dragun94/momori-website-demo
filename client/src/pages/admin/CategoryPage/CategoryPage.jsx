import { useCallback, useEffect, useState } from "react";
import * as adminApi from "../../../api/admin";
import Badge from "../../../components/admin/Badge";
import ConfirmModal from "../../../components/admin/ConfirmModal";
import Table from "../../../components/admin/Table";
import Toggle from "../../../components/admin/Toggle";
import { useToast } from "../../../contexts/ToastContext";
import CategoryFormDialog from "./CategoryFormDialog";
import "./CategoryPage.css";

function CategoryPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  // undefined: 닫힘 / null: 새로 추가 / 객체: 수정
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const reload = useCallback(
    () =>
      adminApi
        .getCategories()
        .then(setCategories)
        .catch((err) => toast.error(err.message)),
    [toast],
  );

  useEffect(() => {
    let ignore = false;
    adminApi
      .getCategories()
      .then((data) => !ignore && setCategories(data))
      .catch((err) => !ignore && toast.error(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [toast]);

  // 위/아래 버튼: 화면을 먼저 바꾸고(낙관적 업데이트) 서버에 저장, 실패하면 다시 불러옴
  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
    try {
      setCategories(await adminApi.reorderCategories(next.map((c) => c._id)));
    } catch (err) {
      toast.error(err.message);
      reload();
    }
  };

  const toggleActive = async (category, isActive) => {
    setBusyId(category._id);
    try {
      await adminApi.updateCategory(category._id, { isActive });
      setCategories((prev) => prev.map((c) => (c._id === category._id ? { ...c, isActive } : c)));
      toast.success(isActive ? `'${category.name}'을(를) 쇼핑몰에 노출해요` : `'${category.name}'을(를) 숨겼어요`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (category) => {
    if (category.productCount > 0) {
      toast.error(`상품 ${category.productCount}개가 등록되어 있어 삭제할 수 없어요. 숨기려면 노출을 꺼 주세요.`);
      return;
    }
    setDeleting(category);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await adminApi.deleteCategory(deleting._id);
      toast.success(`'${deleting.name}' 카테고리를 삭제했어요`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaved = (saved, isEdit) => {
    setEditing(undefined);
    toast.success(isEdit ? `'${saved.name}' 카테고리를 수정했어요` : `'${saved.name}' 카테고리를 추가했어요`);
    reload();
  };

  const columns = [
    {
      key: "order",
      header: "순서",
      width: 90,
      render: (row, index) => (
        <div className="category-order">
          <button
            type="button"
            className="a-btn a-btn--sm a-btn--icon"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            aria-label={`${row.name} 위로`}
          >
            ▲
          </button>
          <button
            type="button"
            className="a-btn a-btn--sm a-btn--icon"
            onClick={() => move(index, 1)}
            disabled={index === categories.length - 1}
            aria-label={`${row.name} 아래로`}
          >
            ▼
          </button>
        </div>
      ),
    },
    { key: "name", header: "이름", render: (row) => <strong>{row.name}</strong> },
    { key: "slug", header: "slug", render: (row) => <code className="category-slug">{row.slug}</code> },
    {
      key: "isActive",
      header: "노출",
      width: 130,
      render: (row) => (
        <Toggle
          checked={row.isActive}
          onChange={(checked) => toggleActive(row, checked)}
          disabled={busyId === row._id}
          label={`${row.name} 쇼핑몰 노출`}
        >
          {row.isActive ? "노출" : "숨김"}
        </Toggle>
      ),
    },
    {
      key: "productCount",
      header: "상품 수",
      width: 90,
      align: "right",
      render: (row) => (row.productCount > 0 ? `${row.productCount}개` : <Badge>없음</Badge>),
    },
    {
      key: "actions",
      header: "관리",
      width: 130,
      align: "right",
      render: (row) => (
        <div className="category-actions">
          <button type="button" className="a-btn a-btn--sm" onClick={() => setEditing(row)}>
            수정
          </button>
          <button type="button" className="a-btn a-btn--sm a-btn--ghost category-delete" onClick={() => requestDelete(row)}>
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="a-page">
      <div className="a-page__head">
        <div>
          <h1 className="a-page__title">카테고리 관리</h1>
          <p className="a-page__desc">쇼핑몰 메뉴에 보이는 순서대로 정렬돼요.</p>
        </div>
        <button type="button" className="a-btn a-btn--primary" onClick={() => setEditing(null)}>
          + 카테고리 추가
        </button>
      </div>

      <div className="a-card">
        <Table columns={columns} rows={categories} loading={loading} emptyMessage="아직 카테고리가 없어요. 첫 카테고리를 추가해 보세요." />
      </div>

      {editing !== undefined && (
        <CategoryFormDialog category={editing} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title="카테고리 삭제"
        message={`'${deleting?.name}' 카테고리를 삭제할까요? 삭제하면 되돌릴 수 없어요.`}
        confirmText="삭제"
        danger
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default CategoryPage;
