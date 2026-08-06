import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Megaphone,
  BarChart3,
  FolderOpen,
  CalendarPlus,
  CalendarCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import { ctr } from '@/lib/metrics.js'
import {
  formatCompact,
  formatDateNumeric,
  formatMoneyCompact,
  formatPct,
} from '@/lib/format.js'
import { PageHeader } from '@/components/PageHeader.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { CampaignForm } from '@/components/forms/CampaignForm.jsx'
import { cn } from '@/lib/cn.js'
import {
  CampaignPreviewModal,
  CampaignStatusPill,
} from '@/components/campaigns/CampaignPreviewModal.jsx'

// Раскладка строки: у рекламодателя нет колонок бюджета и действий.
const GRID_ADMIN =
  'md:grid-cols-[minmax(168px,1fr)_164px_140px_145px_108px_116px] 2xl:grid-cols-[minmax(195px,320px)_164px_145px_155px_86px_58px_108px_116px]'
const GRID_ADVERTISER =
  'md:grid-cols-[minmax(168px,1fr)_164px_200px_108px] 2xl:grid-cols-[minmax(195px,320px)_164px_200px_86px_58px_108px]'

// Порядок группировки строк — как в фильтрах над таблицей.
const STATUS_ORDER = {
  received: 0,
  reviewing: 1,
  active: 2,
  completed: 3,
}

export default function Campaigns() {
  const { isAdmin, isAdvertiser } = useAuth()
  const navigate = useNavigate()
  const { advertiserById, channelById, remove } = useData()
  const campaigns = useScopedCampaigns()
  const toast = useToast()
  const confirm = useConfirm()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [modal, setModal] = useState({ open: false, initial: null })
  const [preview, setPreview] = useState(null)

  // Рекламодатель не видит бюджет и не управляет кампаниями из таблицы.
  const showBudget = !isAdvertiser
  const showActions = !isAdvertiser

  const counts = {
    all: campaigns.length,
    received: campaigns.filter((c) => c.status === 'received').length,
    reviewing: campaigns.filter((c) => c.status === 'reviewing').length,
    active: campaigns.filter((c) => c.status === 'active').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
  }

  const query = q.trim().toLowerCase()
  const filtered = campaigns
    .filter(
      (c) =>
        (status === 'all' || c.status === status) &&
        c.name.toLowerCase().includes(query),
    )
    .sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99) ||
        a.name.localeCompare(b.name, 'ru'),
    )
  const previewAdvertiser = preview
    ? advertiserById(preview.advertiserId)
    : null
  const previewChannels = preview
    ? preview.channelIds.flatMap((id) => {
        const channel = channelById(id)
        return channel ? [channel] : []
      })
    : []

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

  return (
    <div>
      <PageHeader
      >
        {isAdvertiser && (
          <Button
            variant="primary"
            onClick={() => setModal({ open: true, initial: null })}
          >
            <Plus size={18} />
            Новая кампания
          </Button>
        )}
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
            aria-label="Поиск кампании"
            placeholder="Поиск по названию…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus-ring focus-visible:border-indigo-300"
          />
        </div>
        <SegmentTabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: 'Все', count: counts.all },
            ...(isAdvertiser
              ? []
              : [
                  {
                    value: 'received',
                    label: 'Полученные',
                    count: counts.received,
                  },
                  {
                    value: 'reviewing',
                    label: 'Рассматриваются',
                    count: counts.reviewing,
                  },
                ]),
            { value: 'active', label: 'Активные', count: counts.active },
            {
              value: 'completed',
              label: 'Завершенные',
              count: counts.completed,
            },
          ]}
        />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Кампаний нет"
            description={
              isAdvertiser
                ? 'Измените фильтры или создайте новую кампанию.'
                : 'По выбранным фильтрам кампаний нет.'
            }
            action={isAdvertiser ? (
              <Button
                variant="secondary"
                onClick={() => setModal({ open: true, initial: null })}
              >
                <Plus size={16} />
                Создать
              </Button>
            ) : null}
          />
        ) : (
          <>
            {/* Заголовки колонок */}
            <div
              className={cn(
                'hidden items-center gap-4 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted md:grid',
                showBudget ? GRID_ADMIN : GRID_ADVERTISER,
              )}
            >
              <span>Кампания</span>
              <span >Статус</span>
              <span >Период</span>
              {showBudget && (
                <span className="flex justify-center">Бюджет / Прибыль</span>
              )}
              <span className="hidden text-right 2xl:block">Показы</span>
              <span className="hidden text-right 2xl:block">CTR</span>
              <span className='flex justify-center'>Статистика</span>
              {showActions && <span className="text-center">Действия</span>}
            </div>

            <div className="divide-y divide-line">
              {filtered.map((c) => {
                const adv = advertiserById(c.advertiserId)
                const pacing = c.budget ? (c.spent / c.budget) * 100 : 0
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink/[0.015] md:grid md:gap-4',
                      showBudget ? GRID_ADMIN : GRID_ADVERTISER,
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {isAdmin && adv && (
                        <Avatar name={adv.name} color={adv.color} size="sm" />
                      )}
                      <div className="min-w-0">
                        {c.creativeUrl ? (
                          <a
                            href={c.creativeUrl}
                            download
                            className="block truncate text-sm font-medium text-black underline-offset-2 hover:text-indigo-400 hover:underline focus-ring"
                          >
                            {c.name}
                          </a>
                        ) : (
                          <p className="truncate text-sm font-medium text-ink">
                            {c.name}
                          </p>
                        )}
                        <p className="truncate text-[12px] text-ink-muted">
                          {showBudget && (
                            <span className="md:hidden">
                              {' · '}
                              {formatMoneyCompact(c.spent)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block md:w-auto">
                      <CampaignStatusPill status={c.status} pacing={pacing} />
                    </div>

                    <div className="hidden min-w-0 md:block">
                      {isAdvertiser ? (
                        <p
                          className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                          title={`Период: ${formatDateNumeric(c.startDate)} — ${formatDateNumeric(c.endDate)}`}
                        >
                          <CalendarPlus
                            size={13}
                            className="shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                          {formatDateNumeric(c.startDate)}
                          <span className="text-ink-muted">—</span>
                          {formatDateNumeric(c.endDate)}
                        </p>
                      ) : (
                        <>
                          <p
                            className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                            title={`Старт: ${formatDateNumeric(c.startDate)}`}
                          >
                            <CalendarPlus
                              size={13}
                              className="shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                            {formatDateNumeric(c.startDate)}
                          </p>
                          <p
                            className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                            title={`Финиш: ${formatDateNumeric(c.endDate)}`}
                          >
                            <CalendarCheck
                              size={13}
                              className="shrink-0 text-ink-muted"
                              aria-hidden="true"
                            />
                            {formatDateNumeric(c.endDate)}
                          </p>
                        </>
                      )}
                    </div>

                    {showBudget && (
                      <div className="hidden md:block">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-ink-muted tnum">
                            {formatMoneyCompact(c.budget)}
                          </span>
                          <span className="font-medium text-ink tnum">
                            {formatMoneyCompact(c.spent)}
                          </span>
                        </div>
                        <Progress value={pacing} className="mt-1.5" />
                      </div>
                    )}

                    <span className="hidden text-right text-sm text-ink-soft tnum 2xl:block">
                      {formatCompact(c.impressions)}
                    </span>
                    <span className="hidden text-right text-sm text-ink-soft tnum 2xl:block">
                      {formatPct(ctr(c))}
                    </span>

                    <div className="flex justify-center">
                      {c.status === 'active' || c.status === 'completed' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-fit shrink-0 border-indigo-200 bg-indigo-50 px-2.5 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-100"
                          onClick={() => navigate(`/app/campaigns/${c.id}`)}
                          aria-label={`Статистика кампании ${c.name}`}
                          title="Статистика"
                        >
                          <BarChart3 size={15} />
                        </Button>
                      ) : (
                        <span
                          className="text-sm text-ink-muted"
                          aria-hidden="true"
                        >
                          —
                        </span>
                      )}
                    </div>

                    {showActions && (
                      <div className="flex items-center justify-start gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 shrink-0 px-0"
                          onClick={() => setPreview(c)}
                          aria-label={`Открыть кампанию ${c.name}`}
                          title="Открыть"
                        >
                          <FolderOpen size={16} />
                        </Button>
                        {/* Запущенную и завершённую кампанию править нельзя. */}
                        {c.status !== 'active' && c.status !== 'completed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-9 w-9 shrink-0 px-0"
                            onClick={() => setModal({ open: true, initial: c })}
                            aria-label={`Редактировать кампанию ${c.name}`}
                            title="Редактировать"
                          >
                            <Pencil size={16} />
                          </Button>
                        )}
                        {/* Запущенную и завершённую кампанию удалять нельзя. */}
                        {c.status !== 'active' && c.status !== 'completed' && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="h-9 w-9 shrink-0 px-0"
                            onClick={() => del(c)}
                            aria-label={`Удалить кампанию ${c.name}`}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    )}
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

      <CampaignPreviewModal
        campaign={preview}
        advertiser={previewAdvertiser}
        channels={previewChannels}
        onClose={() => setPreview(null)}
        onOpenStats={() => navigate(`/app/campaigns/${preview.id}`)}
      />

    </div>
  )
}
