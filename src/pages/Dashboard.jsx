import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Eye,
  MousePointerClick,
  Target,
  ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { aggregate, OBJECTIVES } from '@/lib/metrics.js'
import { seededSeries } from '@/lib/id.js'
import {
  formatCompact,
  formatMoneyCompact,
  formatMoney,
  formatPct,
  lastNDates,
} from '@/lib/format.js'
import { PageHeader } from '@/components/PageHeader.jsx'
import { StatCard } from '@/components/StatCard.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { AreaChart } from '@/components/charts/AreaChart.jsx'
import { DonutChart } from '@/components/charts/DonutChart.jsx'
import { BarChart } from '@/components/charts/BarChart.jsx'

const OBJ_COLORS = {
  awareness: '#FFD106',
  reach: '#0EA5E9',
  traffic: '#F59E0B',
  conversions: '#12A150',
}
const METRIC_COLOR = { spent: '#FFD106', impressions: '#0EA5E9', clicks: '#12A150' }

function delta(arr) {
  const a = arr[0] || 1
  const b = arr[arr.length - 1]
  const p = ((b - a) / a) * 100
  return { txt: `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`, tone: p >= 0 ? 'success' : 'danger' }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { advertisers, channelById } = useData()
  const campaigns = useScopedCampaigns()
  const t = aggregate(campaigns)
  const [metric, setMetric] = useState('spent')

  const scope = user.advertiserId || 'all'
  const labels = lastNDates(14)
  const series = {
    spent: seededSeries(`sp-${scope}`, 14, Math.max(t.spent / 14, 1000), 0.3),
    impressions: seededSeries(`im-${scope}`, 14, Math.max(t.impressions / 14, 1000), 0.35),
    clicks: seededSeries(`cl-${scope}`, 14, Math.max(t.clicks / 14, 100), 0.4),
  }

  const byObjective = Object.keys(OBJECTIVES)
    .map((o) => ({
      label: OBJECTIVES[o],
      value: campaigns
        .filter((c) => c.objective === o)
        .reduce((s, c) => s + c.spent, 0),
      color: OBJ_COLORS[o],
    }))
    .filter((d) => d.value > 0)

  const topCampaigns = [...campaigns]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)

  const advSpend = advertisers
    .map((a) => ({
      ...a,
      spent: campaigns
        .filter((c) => c.advertiserId === a.id)
        .reduce((s, c) => s + c.spent, 0),
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5)

  // Распределение расхода по площадкам (равномерно между каналами кампании).
  const channelSpend = {}
  campaigns.forEach((c) => {
    const per = c.spent / Math.max(c.channelIds.length, 1)
    c.channelIds.forEach((id) => {
      channelSpend[id] = (channelSpend[id] || 0) + per
    })
  })
  const channelBars = Object.entries(channelSpend)
    .map(([id, value]) => {
      const ch = channelById(id)
      return { label: ch?.name || id, value, color: ch?.color }
    })
    .sort((a, b) => b.value - a.value)

  const firstName = user.name.split(' ')[0]

  const cards = [
    {
      label: 'Расход',
      value: formatMoneyCompact(t.spent),
      icon: Wallet,
      key: 'spent',
    },
    {
      label: 'Показы',
      value: formatCompact(t.impressions),
      icon: Eye,
      key: 'impressions',
    },
    {
      label: 'Клики',
      value: formatCompact(t.clicks),
      icon: MousePointerClick,
      key: 'clicks',
    },
    {
      label: 'Конверсии',
      value: formatCompact(t.conversions),
      icon: Target,
      key: 'clicks',
    },
  ]

  return (
    <div>
      <PageHeader
        title={`Здравствуйте, ${firstName}`}
        subtitle={
          user.role === 'admin'
            ? 'Сводка по всем рекламодателям и кампаниям платформы.'
            : 'Сводка по вашим кампаниям и площадкам.'
        }
      >
        <Badge tone="indigo" dot>
          Данные за 14 дней
        </Badge>
      </PageHeader>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => {
          const d = delta(series[c.key])
          return (
            <StatCard
              key={c.label}
              index={i}
              label={c.label}
              value={c.value}
              delta={d.txt}
              deltaTone={d.tone}
              spark={series[c.key]}
              sparkColor={METRIC_COLOR[c.key]}
              icon={c.icon}
            />
          )
        })}
      </div>

      {/* График + распределение */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col gap-3 p-5 pb-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-ink">
                Динамика
              </h3>
              <p className="text-[13px] text-ink-muted">
                Ежедневные показатели за две недели
              </p>
            </div>
            <SegmentTabs
              value={metric}
              onChange={setMetric}
              items={[
                { value: 'spent', label: 'Расход' },
                { value: 'impressions', label: 'Показы' },
                { value: 'clicks', label: 'Клики' },
              ]}
            />
          </div>
          <div className="p-3 sm:p-4">
            <AreaChart
              data={series[metric]}
              labels={labels}
              color={METRIC_COLOR[metric]}
              height={260}
              formatValue={
                metric === 'spent' ? formatMoneyCompact : formatCompact
              }
            />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-base font-semibold text-ink">
            Расход по целям
          </h3>
          <div className="mt-4 flex flex-col items-center gap-5">
            <DonutChart
              data={byObjective}
              centerValue={formatMoneyCompact(t.spent)}
              centerLabel="всего"
            />
            <div className="w-full space-y-2">
              {byObjective.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-ink-soft">{d.label}</span>
                  <span className="ml-auto font-medium text-ink tnum">
                    {formatMoneyCompact(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Топ-кампании + правый блок */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="font-display text-base font-semibold text-ink">
              Топ кампаний
            </h3>
            <Link
              to="/app/campaigns"
              className="flex items-center gap-1 text-[13px] font-medium text-indigo-800 hover:text-indigo-900"
            >
              Все <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {topCampaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {c.name}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress
                      value={(c.spent / c.budget) * 100}
                      className="max-w-[140px]"
                    />
                    <span className="text-[11px] text-ink-muted tnum">
                      {formatPct((c.spent / c.budget) * 100, 0)}
                    </span>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink tnum">
                  {formatMoneyCompact(c.spent)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {user.role === 'admin' ? (
          <Card>
            <div className="p-5 pb-3">
              <h3 className="font-display text-base font-semibold text-ink">
                Топ рекламодателей
              </h3>
            </div>
            <div className="divide-y divide-line">
              {advSpend.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={a.name} color={a.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {a.name}
                    </p>
                    <p className="text-[12px] text-ink-muted">{a.category}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink tnum">
                    {formatMoneyCompact(a.spent)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              Расход по площадкам
            </h3>
            <div className="mt-6 h-[220px]">
              <BarChart data={channelBars} formatValue={formatMoney} />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
