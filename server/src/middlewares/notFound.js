export function notFound(req, res) {
  res.status(404).json({ success: false, message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}` });
}
