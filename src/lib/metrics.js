// Производные рекламные метрики.

export const ctr = (c) =>
  c.impressions ? (c.clicks / c.impressions) * 100 : 0

export const cvr = (c) => (c.clicks ? (c.conversions / c.clicks) * 100 : 0)

export const cpa = (c) => (c.conversions ? c.spent / c.conversions : 0)

export const cpm = (c) =>
  c.impressions ? (c.spent / c.impressions) * 1000 : 0

export const pacing = (c) => (c.budget ? (c.spent / c.budget) * 100 : 0)

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

export const OBJECTIVES = {
  awareness: 'Узнаваемость',
  reach: 'Охват',
  traffic: 'Трафик',
  conversions: 'Конверсии',
}

export const STATUS = {
  active: { label: 'Активна', tone: 'success' },
  paused: { label: 'На паузе', tone: 'warning' },
  draft: { label: 'Черновик', tone: 'muted' },
  completed: { label: 'Завершена', tone: 'indigo' },
  archived: { label: 'В архиве', tone: 'muted' },
}

export const ADV_STATUS = {
  active: { label: 'Активен', tone: 'success' },
  paused: { label: 'На паузе', tone: 'warning' },
}

export const CH_STATUS = {
  active: { label: 'Активен', tone: 'success' },
  inactive: { label: 'Отключён', tone: 'muted' },
}
