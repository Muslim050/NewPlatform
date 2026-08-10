import {
  BarChart3,
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ExternalLink,
  Gauge,
  FileText,
  Film,
  FolderOpen,
  Package,
  Trophy,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { PACKAGES, STATUS, leagueLabel, statusLabel } from '@/lib/metrics.js'
import {
  formatDate,
  formatDateTime,
  formatPct,
} from '@/lib/format.js'
import { Modal } from '@/components/ui/Modal.jsx'
import { Tooltip } from '@/components/ui/Tooltip.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'

const STATUS_UI = {
  sent: {
    shell: 'border-sky-200 bg-sky-50/80 text-sky-700',
    dot: 'bg-sky-500',
    value: 'border-sky-200 bg-surface text-sky-700',
  },
  received: {
    shell: 'border-violet-200 bg-violet-50/80 text-violet-700',
    dot: 'bg-violet-500',
    value: 'border-violet-200 bg-surface text-violet-700',
  },
  reviewing: {
    shell: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    dot: 'bg-yellow-400',
    value: 'border-yellow-200 bg-surface text-yellow-700',
  },
  active: {
    shell: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
    dot: 'bg-emerald-500',
    value: 'border-emerald-200 bg-surface text-emerald-700',
  },
  completed: {
    shell: 'border-red-200 bg-red-50 text-red-700',
    dot: 'bg-red-500',
    value: 'border-red-200 bg-surface text-red-700',
  },
}

export function CampaignStatusPill({ status, pacing, createdAt }) {
  const ui = STATUS_UI[status] || STATUS_UI.completed
  const percent = Math.min(100, Math.max(0, Math.round(pacing)))
  const label = STATUS[status] ? statusLabel(status) : STATUS.active.label

  // Пока заявку не взяли в работу — по наведению показываем время отправки.
  const sentAt =
    (status === 'sent' || status === 'received') && createdAt
      ? `Отправлено: ${formatDateTime(createdAt)}`
      : null

  return (
    <Tooltip label={sentAt} className="max-w-full">
      <span
        className={`inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold ${ui.shell}`}
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${ui.dot}`} />
        <span className="truncate">{label}</span>
        {status === 'active' && (
          <span
            className={`shrink-0 rounded-lg border px-1.5 py-0.5 text-[11px] font-bold leading-none tnum ${ui.value}`}
          >
            {percent}%
          </span>
        )}
      </span>
    </Tooltip>
  )
}

/** Плитка ролика — по клику видео открывается в новой вкладке. */
function CreativeTile({ url }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Ролик
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/[0.06] text-ink-muted">
            <Film size={16} />
          </span>
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">Не добавлен</p>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title="Открыть ролик в новой вкладке"
      className="group rounded-2xl border border-line bg-paper/55 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          Ролик
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900 transition-transform group-hover:scale-105">
          <Film size={16} />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 font-display text-xl font-semibold text-ink">
        Смотреть
        <ExternalLink size={15} className="text-ink-muted" />
      </p>
    </a>
  )
}

/** Плитка договора — тот же формат, что у метрик, но текст поменьше. */
function ContractTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 break-words text-[15px] font-semibold leading-snug text-ink">
        {value}
      </p>
    </div>
  )
}

/** Плитки с условиями договора — встают в общую сетку карточки. */
function ContractTiles({ campaign }) {
  const { isAdvertiser } = useAuth()
  const tiles = [
    { label: 'Пакет', icon: Package, value: PACKAGES[campaign.package]?.label },
    {
      label: 'Лиги',
      icon: Trophy,
      value: campaign.leagues?.length
        ? campaign.leagues.map(leagueLabel).join(', ')
        : null,
    },
    {
      label: 'Номер договора',
      icon: FileText,
      value: campaign.contractNumber,
    },
    // Юр. лицо и освоение бюджета — внутренняя кухня, рекламодателю не нужны.
    {
      label: 'Юр. лицо',
      icon: Building2,
      value: isAdvertiser ? null : campaign.legalName,
    },
    {
      label: 'Срок договора',
      icon: CalendarRange,
      value:
        campaign.contractStart && campaign.contractEnd
          ? `${formatDate(campaign.contractStart)} — ${formatDate(campaign.contractEnd)}`
          : null,
    },
    {
      label: 'Сроки оплаты',
      icon: CalendarClock,
      value: campaign.paymentDate ? formatDate(campaign.paymentDate) : null,
    },
  ].filter((tile) => tile.value)

  return (
    <>
      {tiles.map((tile) => (
        <ContractTile key={tile.label} {...tile} />
      ))}
      {campaign.contractFile && (
        <a
          href={campaign.contractFile.url}
          download={campaign.contractFile.name}
          title={campaign.contractFile.name}
          className="group rounded-2xl border border-line bg-paper/55 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              Файл договора
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900 transition-transform group-hover:scale-105">
              <FileText size={16} />
            </span>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[15px] font-semibold text-ink">
            <span className="truncate">Скачать</span>
            <ExternalLink size={14} className="shrink-0 text-ink-muted" />
          </p>
        </a>
      )}
    </>
  )
}

export function CampaignPreviewModal({
  campaign,
  advertiser,
  channels,
  onClose,
  onOpenStats,
}) {
  const { isAdvertiser } = useAuth()
  const pacing = campaign?.budget
    ? (campaign.spent / campaign.budget) * 100
    : 0

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      icon={FolderOpen}
      logo={advertiser?.logo}
      title={campaign?.name || 'Кампания'}
      description={advertiser?.name || 'Карточка кампании'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
          {/* Статистика есть только у запущенных и завершённых кампаний. */}
          {(campaign?.status === 'active' ||
            campaign?.status === 'completed') && (
            <Button variant="primary" onClick={onOpenStats}>
              <BarChart3 size={16} />
              Открыть статистику
            </Button>
          )}
        </>
      }
    >
      {campaign && (
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-surface via-indigo-50 to-indigo-100 p-5">
            <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full border border-indigo-300/60" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-900">
                  Карточка кампании
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                  <CalendarDays size={16} className="text-indigo-800" />
                  {formatDate(campaign.startDate)} —{' '}
                  {formatDate(campaign.endDate)}
                </div>
              </div>
              <CampaignStatusPill
                status={campaign.status}
                pacing={pacing}
                createdAt={campaign.createdAt}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <CreativeTile url={campaign.creativeUrl} />
            <ContractTiles campaign={campaign} />

            {/* Освоение бюджета шире остальных — занимает две плитки. */}
            {!isAdvertiser && (
            <div className="col-span-2 rounded-2xl border border-line bg-paper/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  Освоение бюджета
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900">
                  <Gauge size={16} />
                </span>
              </div>
              <p className="mt-3 text-[15px] font-semibold text-ink tnum">
                {formatPct(pacing, 0)}
              </p>
              <Progress value={pacing} className="mt-2 h-2" />
            </div>
            )}
          </div>


        </div>
      )}
    </Modal>
  )
}
