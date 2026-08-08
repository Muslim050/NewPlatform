import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Eye,
  FileText,
  Film,
  FolderOpen,
  MousePointerClick,
  Target,
} from 'lucide-react'
import { PACKAGES, STATUS, ctr, leagueLabel, statusLabel } from '@/lib/metrics.js'
import {
  formatCompact,
  formatDate,
  formatDateTime,
  formatMoneyCompact,
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

/** Условия договора — показываем только то, что заполнил админ. */
function ContractBlock({ campaign }) {
  const rows = [
    ['Пакет', PACKAGES[campaign.package]?.label],
    ['Лиги', campaign.leagues?.length
      ? campaign.leagues.map(leagueLabel).join(', ')
      : null],
    ['Номер договора', campaign.contractNumber],
    ['Юр. лицо', campaign.legalName],
    ['Срок договора', campaign.contractStart && campaign.contractEnd
      ? `${formatDate(campaign.contractStart)} — ${formatDate(campaign.contractEnd)}`
      : null],
    ['Сроки оплаты', campaign.paymentDate ? formatDate(campaign.paymentDate) : null],
  ].filter(([, value]) => value)

  if (!rows.length && !campaign.contractFile) return null

  return (
    <div className="mt-4 rounded-2xl border border-line p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        Договор
      </p>
      <dl className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-0.5 text-[13px] sm:flex-row sm:items-baseline sm:gap-4"
          >
            <dt className="shrink-0 text-ink-muted sm:w-40">{label}</dt>
            <dd className="min-w-0 font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {campaign.contractFile && (
        <a
          href={campaign.contractFile.url}
          download={campaign.contractFile.name}
          className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-paper/55 px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
        >
          <FileText size={16} className="shrink-0 text-indigo-800" />
          <span className="truncate">{campaign.contractFile.name}</span>
          <ExternalLink size={13} className="ml-auto shrink-0 text-ink-muted" />
        </a>
      )}
    </div>
  )
}

function PreviewMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/55 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-xl font-semibold text-ink tnum">
        {value}
      </p>
    </div>
  )
}

export function CampaignPreviewModal({
  campaign,
  advertiser,
  channels,
  onClose,
  onOpenStats,
}) {
  const pacing = campaign?.budget
    ? (campaign.spent / campaign.budget) * 100
    : 0

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      icon={FolderOpen}
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
            <PreviewMetric
              icon={CircleDollarSign}
              label="Бюджет"
              value={formatMoneyCompact(campaign.budget)}
            />
            <PreviewMetric
              icon={CircleDollarSign}
              label="Расход"
              value={formatMoneyCompact(campaign.spent)}
            />
            <PreviewMetric
              icon={Eye}
              label="Показы"
              value={formatCompact(campaign.impressions)}
            />
            <PreviewMetric
              icon={MousePointerClick}
              label="Клики"
              value={formatCompact(campaign.clicks)}
            />

            <PreviewMetric
              icon={BarChart3}
              label="CTR"
              value={formatPct(ctr(campaign))}
            />

            <CreativeTile url={campaign.creativeUrl} />
          </div>

          <div className="mt-4 rounded-2xl border border-line p-4">
            <div className="flex items-center justify-between gap-4 text-[12px]">
              <span className="font-medium text-ink-soft">
                Освоение бюджета
              </span>
              <span className="font-semibold text-ink tnum">
                {formatPct(pacing, 0)}
              </span>
            </div>
            <Progress value={pacing} className="mt-2.5 h-2" />
          </div>

          <ContractBlock campaign={campaign} />
        </div>
      )}
    </Modal>
  )
}
