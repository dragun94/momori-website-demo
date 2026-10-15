// 관리자 API (/api/admin — 서버에서 관리자만 허용)
import { request } from "./client";

const BASE_URL = "/api/admin";

/* ===== 카테고리 ===== */

/** 전체 카테고리 (정렬 순서대로, productCount 포함) */
export function getCategories() {
  return request(`${BASE_URL}/categories`);
}

/** @param {{ name: string, slug: string, isActive: boolean }} payload */
export function createCategory(payload) {
  return request(`${BASE_URL}/categories`, { method: "POST", body: payload });
}

export function updateCategory(id, payload) {
  return request(`${BASE_URL}/categories/${id}`, { method: "PATCH", body: payload });
}

/** @param {string[]} ids 원하는 순서대로 나열한 카테고리 id → 정렬된 전체 목록 반환 */
export function reorderCategories(ids) {
  return request(`${BASE_URL}/categories/reorder`, { method: "PATCH", body: { ids } });
}

export function deleteCategory(id) {
  return request(`${BASE_URL}/categories/${id}`, { method: "DELETE" });
}

/* ===== 상품 ===== */

/**
 * @param {{ q?: string, category?: string, status?: "active" | "inactive", page?: number }} query
 * @returns {{ data: object[], pagination: { page, limit, total, totalPages } }}
 */
export function getProducts(query) {
  return request(`${BASE_URL}/products`, { query: { limit: 20, ...query }, raw: true });
}

export function getProduct(id) {
  return request(`${BASE_URL}/products/${id}`);
}

export function createProduct(payload) {
  return request(`${BASE_URL}/products`, { method: "POST", body: payload });
}

/** 일부 필드만 보내도 됨 (예: { isActive: false }) */
export function updateProduct(id, payload) {
  return request(`${BASE_URL}/products/${id}`, { method: "PATCH", body: payload });
}

/* ===== 이미지 업로드 ===== */

/**
 * @param {File[]} files jpg/png/webp, 1장당 5MB, 최대 10장
 * @returns {Promise<string[]>} 저장된 이미지 주소 (올린 순서대로)
 */
export function uploadImages(files) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return request(`${BASE_URL}/uploads`, { method: "POST", body: form });
}
