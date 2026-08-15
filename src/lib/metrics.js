// Производные рекламные метрики.

export const ctr = (c) =>
  c.impressions ? (c.clicks / c.impressions) * 100 : 0

export const cvr = (c) => (c.clicks ? (c.conversions / c.clicks) * 100 : 0)

export const cpa = (c) => (c.conversions ? c.spent / c.conversions : 0)

export const cpm = (c) =>
  c.impressions ? (c.spent / c.impressions) * 1000 : 0

export const pacing = (c) => (c.budget ? (c.spent / c.budget) * 100 : 0)

/**
 * Сколько срока кампании прошло: от даты старта до даты окончания.
 * По нему показываем процент в статусе — он про ход кампании, а не про деньги.
 */
export function timeProgress(c) {
  if (!c?.startDate || !c?.endDate) return 0
  const start = new Date(c.startDate).getTime()
  const end = new Date(c.endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  const passed = ((Date.now() - start) / (end - start)) * 100
  return Math.min(100, Math.max(0, passed))
}

/** Суммарные показатели по списку кампаний. */
export function aggregate(campaigns) {
  const t = campaigns.reduce(
    (acc, c) => {
      acc.budget += c.budget || 0
      acc.spent += c.spent || 0
      acc.impressions += c.impressions || 0
      acc.clicks += c.clicks || 0
      acc.conversions += c.conversions || 0
      return acc
    },
    { budget: 0, spent: 0, impressions: 0, clicks: 0, conversions: 0 },
  )
  t.ctr = t.impressions ? (t.clicks / t.impressions) * 100 : 0
  t.cvr = t.clicks ? (t.conversions / t.clicks) * 100 : 0
  t.cpa = t.conversions ? t.spent / t.conversions : 0
  t.active = campaigns.filter((c) => c.status === 'active').length
  t.count = campaigns.length
  return t
}





export const STATUS = {
  // Заявка от рекламодателя: сначала «Отправлен», в «Получен» её переводит админ.
  sent: { label: 'Отправлен', tone: 'warning' },
  received: { label: 'Получен', tone: 'warning' },
  reviewing: { label: 'Рассматривается', tone: 'warning' },
  active: { label: 'Активен', tone: 'success' },
  completed: { label: 'Завершен', tone: 'danger' },
  // Кампания отработала, но деньги ещё не пришли.
  awaiting_payment: { label: 'Ожидает оплату', tone: 'danger' },
  // Деньги пришли — кампания закрыта полностью.
  paid: { label: 'Оплачен', tone: 'success' },
  archived: { label: 'В архиве', tone: 'muted' },
}

/** Рекламный пакет кампании. */
export const PACKAGES = {
  partner: { label: 'Партнёр' },
  general: { label: 'Генеральный спонсор' },
  presenter: { label: 'Презентер' },
}

/** Лиги и турниры, доступные для размещения. */
export const LEAGUES = [
  { id: 'epl', label: 'EPL' },
  { id: 'laliga', label: 'LaLiga' },
  { id: 'bundesliga', label: 'Bundesliga' },
  { id: 'ligue1', label: 'Ligue 1' },
  { id: 'seriea', label: 'Serie A' },
  { id: 'ufc', label: 'UFC' },
  { id: 'f1', label: 'F1' },
  { id: 'atp', label: 'ATP' },
  { id: 'wta', label: 'WTA' },
  { id: 'zuffa', label: 'Zuffa Boxing' },
  { id: 'nba', label: 'NBA' },
  { id: 'nhl', label: 'NHL' },
]

export const leagueLabel = (id) =>
  LEAGUES.find((l) => l.id === id)?.label || id

export const statusLabel = (status) => STATUS[status]?.label || status

export const ADV_STATUS = {
  active: { label: 'Активен', tone: 'success' },
  paused: { label: 'На паузе', tone: 'warning' },
}

export const CH_STATUS = {
  active: { label: 'Активен', tone: 'success' },
  inactive: { label: 'Отключён', tone: 'muted' },
}
