import { useState } from 'react'
import { Download, LineChart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { useToast } from '@/components/ui/Toast.jsx'
import { aggregate, ctr, cvr, cpa } from '@/lib/metrics.js'
import { seededSeries } from '@/lib/id.js'
import {
  formatCompact,
  formatMoney,
  formatMoneyCompact,
  formatPct,
  lastNDates,
} from '@/lib/format.js'
import { PageHeader } from '@/components/PageHeader.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { AreaChart } from '@/components/charts/AreaChart.jsx'

const METRIC_COLOR = { spent: '#4F46E5', impressions: '#0EA5E9', clicks: '#12A150' }

export default function Reports() {
  const { user } = useAuth()
  const { advertiserById } = useData()
  const campaigns = useScopedCampaigns()
  const toast = useToast()
  const [period, setPeriod] = useState(14)
  const [metric, setMetric] = useState('spent')

  const t = aggregate(campaigns)
  const scope = user.advertiserId || 'all'
  const labels = lastNDates(period)
  const base = {
    spent: Math.max(t.spent / period, 1000),
    impressions: Math.max(t.impressions / period, 1000),
    clicks: Math.max(t.clicks / period, 100),
  }[metric]
  const series = seededSeries(`rep-${metric}-${scope}-${period}`, period, base, 0.3)

  const summary = [
    { label: 'Расход', value: formatMoneyCompact(t.spent) },
    { label: 'CTR', value: formatPct(t.ctr) },
    { label: 'CVR', value: formatPct(t.cvr) },
    { label: 'CPA', value: formatMoney(t.cpa) },
  ]

  const exportCsv = () => {
    const head = [
      'Кампания',
      'Показы',
      'Клики',
      'CTR %',
      'Конверсии',
      'CVR %',
      'CPA',
      'Расход',
    ]
    const rows = campaigns.map((c) => [
      c.name,
      c.impressions,
      c.clicks,
      ctr(c).toFixed(2),
      c.conversions,
      cvr(c).toFixed(2),
      Math.round(cpa(c)),
      c.spent,
    ])
    const csv = [head, ...rows]
      .map((r) => r.map((x) => `"${x}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bloom-report.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Отчёт выгружен в CSV')
  }

  return (
    <div>
      <PageHeader
        title="Отчёты"
        subtitle="Эффективность кампаний и динамика ключевых метрик."
      >
        <SegmentTabs
          value={period}
          onChange={setPeriod}
          items={[
            { value: 7, label: '7 дней' },
            { value: 14, label: '14 дней' },
            { value: 30, label: '30 дней' },
          ]}
        />
        <Button variant="secondary" onClick={exportCsv}>
          <Download size={17} />
          CSV
        </Button>
      </PageHeader>

      {/* Сводка */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] font-medium text-ink-muted">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ink tnum">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* График */}
      <Card className="mt-4">
        <div className="flex flex-col gap-3 p-5 pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Динамика за {period} дней
            </h3>
            <p className="text-[13px] text-ink-muted">
              Наведите на график для точных значений
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
            data={series}
            labels={labels}
            color={METRIC_COLOR[metric]}
            height={280}
            formatValue={metric === 'spent' ? formatMoneyCompact : formatCompact}
          />
        </div>
      </Card>

      {/* Таблица эффективности */}
      <Card className="mt-4">
        <div className="p-5 pb-3">
          <h3 className="font-display text-base font-semibold text-ink">
            Эффективность кампаний
          </h3>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState icon={LineChart} title="Нет данных" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-2.5 text-left font-semibold">Кампания</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Показы</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Клики</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CTR</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Конв.</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CVR</th>
                  <th className="px-3 py-2.5 text-right font-semibold">CPA</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Расход</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-ink/[0.015]">
                    <td className="max-w-[220px] truncate px-5 py-3 font-medium text-ink">
                      {c.name}
                      {user.role === 'admin' && (
                        <span className="block text-[11px] font-normal text-ink-muted">
                          {advertiserById(c.advertiserId)?.name}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {formatCompact(c.impressions)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {formatCompact(c.clicks)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {formatPct(ctr(c))}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {formatCompact(c.conversions)}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {formatPct(cvr(c))}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-soft tnum">
                      {c.conversions ? formatMoney(cpa(c)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink tnum">
                      {formatMoneyCompact(c.spent)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-paper/40 font-semibold text-ink">
                  <td className="px-5 py-3">Итого</td>
                  <td className="px-3 py-3 text-right tnum">
                    {formatCompact(t.impressions)}
                  </td>
                  <td className="px-3 py-3 text-right tnum">
                    {formatCompact(t.clicks)}
                  </td>
                  <td className="px-3 py-3 text-right tnum">{formatPct(t.ctr)}</td>
                  <td className="px-3 py-3 text-right tnum">
                    {formatCompact(t.conversions)}
                  </td>
                  <td className="px-3 py-3 text-right tnum">{formatPct(t.cvr)}</td>
                  <td className="px-3 py-3 text-right tnum">
                    {formatMoney(t.cpa)}
                  </td>
                  <td className="px-5 py-3 text-right tnum">
                    {formatMoneyCompact(t.spent)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
