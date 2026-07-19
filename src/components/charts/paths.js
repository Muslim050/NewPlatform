// Утилиты построения SVG-путей для графиков.

/** Плавная кривая (Catmull-Rom → cubic bezier) по точкам [{x,y}]. */
export function smoothLine(points) {
  if (points.length < 2) return ''
  const d = [`M ${points[0].x} ${points[0].y}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`)
  }
  return d.join(' ')
}

/**
 * Готовит точки и пути для area-графика.
 * Возвращает { line, area, points } в координатах вьюпорта w×h.
 */
export function buildArea(values, w, h, pad = 6) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1)
  const points = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (h - pad * 2) * (1 - (v - min) / range),
  }))
  const line = smoothLine(points)
  const area = `${line} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`
  return { line, area, points }
}
