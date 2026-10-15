import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as adminApi from "../../../api/admin";
import Badge from "../../../components/admin/Badge";
import Pagination from "../../../components/admin/Pagination";
import SearchInput from "../../../components/admin/SearchInput";
import Table from "../../../components/admin/Table";
import Toggle from "../../../components/admin/Toggle";
import { useToast } from "../../../contexts/ToastContext";
import { formatPrice } from "../../../utils/format";
import { resizeImage } from "../../../utils/image";
import "./ProductListPage.css";

const LOW_STOCK = 5;
const PAGE_SIZE = 2; // 한 페이지에 보여줄 상품 수

function StockCell({ total }) {
  return (
    <span className="product-stock">
      {total.toLocaleString("ko-KR")}
      {total === 0 && <Badge tone="danger">품절</Badge>}
      {total > 0 && total <= LOW_STOCK && <Badge tone="warning">재고 부족</Badge>}
    </span>
  );
}

function PriceCell({ price, salePrice }) {
  if (salePrice == null) return formatPrice(price);
  return (
    <span className="product-price">
      <s className="a-muted">{formatPrice(price)}</s>
      <strong>{formatPrice(salePrice)}</strong>
    </span>
  );
}

function ProductListPage() {
  const toast = useToast();
  // 검색 조건은 주소(?q=&category=&status=&page=)에 저장 → 새로고침/뒤로 가기에도 유지
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page")) || 1;

  const [result, setResult] = useState({ data: [], pagination: null });
  const [categories, setCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);
  // 마지막으로 불러온 조건과 지금 조건이 다르면 로딩 중
  const queryKey = JSON.stringify({ q, category, status, page });
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let ignore = false;
    adminApi
      .getProducts({ ...JSON.parse(queryKey), limit: PAGE_SIZE })
      .then((res) => !ignore && setResult(res))
      .catch((err) => !ignore && toast.error(err.message))
      .finally(() => !ignore && setLoadedKey(queryKey));
    return () => {
      ignore = true;
    };
  }, [queryKey, toast]);

  // 조건이 바뀌면 1페이지부터
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: undefined, ...changes }).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const toggleActive = async (product, isActive) => {
    setBusyId(product._id);
    try {
      await adminApi.updateProduct(product._id, { isActive });
      setResult((prev) => ({
        ...prev,
        data: prev.data.map((p) => (p._id === product._id ? { ...p, isActive } : p)),
      }));
      toast.success(isActive ? `'${product.name}' 판매를 시작했어요` : `'${product.name}'을(를) 판매중지했어요`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: "thumbnail",
      header: "이미지",
      width: 72,
      render: (row) => {
        const src = row.thumbnail || row.images?.[0];
        return src ? (
          <img src={resizeImage(src, 96)} alt="" className="product-thumb" loading="lazy" />
        ) : (
          <span className="product-thumb product-thumb--empty">없음</span>
        );
      },
    },
    {
      key: "name",
      header: "상품명",
      render: (row) => (
        <div className="product-name">
          <Link to={`/admin/products/${row._id}/edit`}>{row.name}</Link>
          <span className="a-sub">{row.slug}</span>
        </div>
      ),
    },
    { key: "category", header: "카테고리", width: 110, render: (row) => row.category?.name ?? <span className="a-muted">없음</span> },
    { key: "price", header: "가격", width: 130, align: "right", render: (row) => <PriceCell {...row} /> },
    { key: "totalStock", header: "총 재고", width: 140, align: "right", render: (row) => <StockCell total={row.totalStock} /> },
    {
      key: "isActive",
      header: "판매",
      width: 120,
      render: (row) => (
        <Toggle
          checked={row.isActive}
          onChange={(checked) => toggleActive(row, checked)}
          disabled={busyId === row._id}
          label={`${row.name} 판매 여부`}
        >
          {row.isActive ? "판매중" : "판매중지"}
        </Toggle>
      ),
    },
    {
      key: "actions",
      header: "관리",
      width: 80,
      align: "right",
      render: (row) => (
        <Link to={`/admin/products/${row._id}/edit`} className="a-btn a-btn--sm">
          수정
        </Link>
      ),
    },
  ];

  const total = result.pagination?.total ?? 0;
  const hasFilter = Boolean(q || category || status);

  return (
    <div className="a-page">
      <div className="a-page__head">
        <div>
          <h1 className="a-page__title">상품 관리</h1>
          <p className="a-page__desc">상품은 삭제하지 않고 판매중지로 관리해요 (주문 기록 보호).</p>
        </div>
        <Link to="/admin/products/new" className="a-btn a-btn--primary">
          + 상품 등록
        </Link>
      </div>

      <div className="a-card">
        <div className="a-toolbar">
          <SearchInput
            key={q}
            defaultValue={q}
            onSearch={(value) => updateParams({ q: value })}
            placeholder="상품명으로 검색"
            label="상품명 검색"
          />
          <select
            className="a-select product-filter"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            aria-label="카테고리 필터"
          >
            <option value="">전체 카테고리</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="a-select product-filter"
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            aria-label="판매 여부 필터"
          >
            <option value="">전체 상태</option>
            <option value="active">판매중</option>
            <option value="inactive">판매중지</option>
          </select>
          <span className="a-toolbar__spacer" />
          <span className="a-muted">총 {total.toLocaleString("ko-KR")}개</span>
        </div>

        <Table
          columns={columns}
          rows={result.data}
          loading={loading}
          emptyMessage={hasFilter ? "조건에 맞는 상품이 없어요." : "아직 등록된 상품이 없어요."}
        />
        <Pagination
          page={page}
          totalPages={result.pagination?.totalPages}
          onChange={(p) => {
            updateParams({ page: p > 1 ? p : undefined });
            window.scrollTo({ top: 0 });
          }}
        />
      </div>
    </div>
  );
}

export default ProductListPage;
