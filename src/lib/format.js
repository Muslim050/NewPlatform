const nf = new Intl.NumberFormat('ru-RU')
const nfCompact = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const cf = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 0,
})

export const formatNumber = (v) => nf.format(Number(v) || 0)
export const formatCompact = (v) => nfCompact.format(Number(v) || 0)
export const formatMoney = (v) => cf.format(Number(v) || 0)

export const formatMoneyCompact = (v) => nfCompact.format(Number(v) || 0)

export const formatPct = (v, digits = 1) =>
  `${(Number(v) || 0).toFixed(digits)}%`

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Дата со временем: 05.09.2026 14:20. Если времени в записи нет — только дата. */
export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const date = d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  if (typeof value === 'string' && !value.includes('T')) return date
  const time = d.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} ${time}`
}

export function formatDateShort(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

/** Дата в формате дд-мм-гггг. */
export function formatDateNumeric(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

/** Метки последних N дней в формате дд.мм. */
export function lastNDates(n) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(
      d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
    )
  }
  return out
}

/** Инициалы для аватара из имени/названия. */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}
