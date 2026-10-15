// req.body에서 허용된 필드만 꺼냄 (role, status 등 임의 필드 주입 방지)
export function pick(source, keys) {
  const result = {};
  for (const key of keys) {
    if (source?.[key] !== undefined) result[key] = source[key];
  }
  return result;
}

// ?page=1&limit=20 → skip/limit 계산 (limit 최대 100)
export function getPagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
