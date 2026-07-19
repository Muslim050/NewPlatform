import { useState } from 'react'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Pause,
  Play,
  Megaphone,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import { OBJECTIVES, STATUS, ctr } from '@/lib/metrics.js'
import { formatCompact, formatMoneyCompact, formatPct } from '@/lib/format.js'
import { PageHeader } from '@/components/PageHeader.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { DropdownMenu } from '@/components/ui/DropdownMenu.jsx'
import { CampaignForm } from '@/components/forms/CampaignForm.jsx'

export default function Campaigns() {
  const { isAdmin } = useAuth()
  const { advertiserById, update, remove } = useData()
  const campaigns = useScopedCampaigns()
  const toast = useToast()
  const confirm = useConfirm()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [modal, setModal] = useState({ open: false, initial: null })

  const counts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    paused: campaigns.filter((c) => c.status === 'paused').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
  }

  const filtered = campaigns
    .filter((c) => status === 'all' || c.status === status)
    .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))

  const del = async (c) => {
    const ok = await confirm({
      title: 'Удалить кампанию?',
      description: c.name,
      body: 'Кампания и её показатели будут удалены безвозвратно.',
    })
    if (ok) {
      remove('campaigns', c.id)
      toast.info('Кампания удалена')
    }
  }

  const toggle = (c) => {
    const next = c.status === 'active' ? 'paused' : 'active'
    update('campaigns', c.id, { status: next })
    toast.success(next === 'active' ? 'Кампания запущена' : 'Кампания на паузе')
  }

  return (
    <div>
      <PageHeader
        title="Кампании"
        subtitle="Создавайте кампании, управляйте бюджетами и площадками."
      >
        <Button
          variant="primary"
          onClick={() => setModal({ open: true, initial: null })}
        >
          <Plus size={18} />
          Новая кампания
        </Button>
      </PageHeader>

      {/* Панель фильтров */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus-ring focus-visible:border-indigo-300"
          />
        </div>
        <SegmentTabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: 'Все', count: counts.all },
            { value: 'active', label: 'Активные', count: counts.active },
            { value: 'paused', label: 'Пауза', count: counts.paused },
            { value: 'draft', label: 'Черновики', count: counts.draft },
          ]}
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Кампаний нет"
            description="Измените фильтры или создайте новую кампанию."
            action={
              <Button
                variant="secondary"
                onClick={() => setModal({ open: true, initial: null })}
              >
                <Plus size={16} />
                Создать
              </Button>
            }
          />
        ) : (
          <>
            {/* Заголовки колонок */}
            <div className="hidden items-center gap-4 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted md:flex">
              <span className="flex-1">Кампания</span>
              <span className="w-24">Статус</span>
              <span className="hidden w-28 lg:block">Цель</span>
              <span className="w-44">Бюджет / расход</span>
              <span className="hidden w-24 text-right xl:block">Показы</span>
              <span className="hidden w-16 text-right xl:block">CTR</span>
              <span className="w-9" />
            </div>

            <div className="divide-y divide-line">
              {filtered.map((c) => {
                const adv = advertiserById(c.advertiserId)
                const st = STATUS[c.status]
                const pacing = c.budget ? (c.spent / c.budget) * 100 : 0
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-ink/[0.015]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {isAdmin && adv && (
                        <Avatar name={adv.name} color={adv.color} size="sm" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {c.name}
                        </p>
                        <p className="truncate text-[12px] text-ink-muted">
                          {isAdmin && adv ? adv.name : OBJECTIVES[c.objective]}
                          <span className="md:hidden">
                            {' · '}
                            {formatMoneyCompact(c.spent)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="w-24">
                      <Badge tone={st.tone} dot>
                        {st.label}
                      </Badge>
                    </div>

                    <span className="hidden w-28 text-sm text-ink-soft lg:block">
                      {OBJECTIVES[c.objective]}
                    </span>

                    <div className="hidden w-44 md:block">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-medium text-ink tnum">
                          {formatMoneyCompact(c.spent)}
                        </span>
                        <span className="text-ink-muted tnum">
                          {formatMoneyCompact(c.budget)}
                        </span>
                      </div>
                      <Progress value={pacing} className="mt-1.5" />
                    </div>

                    <span className="hidden w-24 text-right text-sm text-ink-soft tnum xl:block">
                      {formatCompact(c.impressions)}
                    </span>
                    <span className="hidden w-16 text-right text-sm text-ink-soft tnum xl:block">
                      {formatPct(ctr(c))}
                    </span>

                    <DropdownMenu
                      items={[
                        {
                          label: 'Изменить',
                          icon: Pencil,
                          onClick: () => setModal({ open: true, initial: c }),
                        },
                        {
                          label: c.status === 'active' ? 'На паузу' : 'Запустить',
                          icon: c.status === 'active' ? Pause : Play,
                          onClick: () => toggle(c),
                        },
                        {
                          label: 'Удалить',
                          icon: Trash2,
                          tone: 'danger',
                          onClick: () => del(c),
                        },
                      ]}
                    />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <CampaignForm
        open={modal.open}
        initial={modal.initial}
        onClose={() => setModal({ open: false, initial: null })}
      />
    </div>
  )
}
