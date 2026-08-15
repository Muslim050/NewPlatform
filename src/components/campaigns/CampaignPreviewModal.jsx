import { useEffect, useState } from 'react'
import {
  BarChart3,
  Building2,
  Download,
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
import {
  PACKAGES,
  STATUS,
  leagueLabel,
  statusLabel,
  timeProgress,
} from '@/lib/metrics.js'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatPct,
} from '@/lib/format.js'
import { Modal } from '@/components/ui/Modal.jsx'
import { Tooltip } from '@/components/ui/Tooltip.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { cn } from '@/lib/cn.js'

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
  // Ждём оплату — заливка красная, текст светлый.
  awaiting_payment: {
    shell: 'border-red-500 bg-red-500 text-red-50',
    dot: 'bg-red-100',
    value: 'border-red-300/60 bg-red-400/40 text-red-50',
  },
  paid: {
    shell: 'border-emerald-500 bg-emerald-500 text-emerald-50',
    dot: 'bg-emerald-100',
    value: 'border-emerald-300/60 bg-emerald-400/40 text-emerald-50',
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

  // Ожидание оплаты подсвечиваем пульсацией — на неё нужно среагировать.
  const awaiting = status === 'awaiting_payment'

  return (
    <Tooltip label={sentAt} className="max-w-full">
      <span
        className={cn(
          'inline-flex max-w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[12px] font-semibold',
          ui.shell,
          awaiting && 'animate-pulse',
        )}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {awaiting && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-70',
                ui.dot,
              )}
            />
          )}
          <span
            className={cn('relative inline-flex h-2 w-2 rounded-full', ui.dot)}
          />
        </span>
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

/**
 * Плитка договора — тот же формат, что у метрик, но текст поменьше.
 * file — скан договора: тогда плитка становится ссылкой на скачивание.
 */
function ContractTile({ icon: Icon, label, value, file }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </span>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900',
            file && 'transition-transform group-hover:scale-105',
          )}
        >
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 break-words text-[15px] font-semibold leading-snug text-ink">
        {value}
      </p>
      {file && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-indigo-800">
          <Download size={13} className="shrink-0" />
          Скачать договор
        </p>
      )}
    </>
  )

  if (file) {
    return (
      <a
        href={file.url}
        download={file.name}
        title={file.name}
        className="group rounded-2xl border border-line bg-paper/55 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
      >
        {body}
      </a>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-paper/55 p-4">{body}</div>
  )
}

/** Плитки с условиями договора — встают в общую сетку карточки. */
function ContractTiles({ campaign, advertiser }) {
  const { isAdvertiser } = useAuth()
  // Скан договора: у кампании свой либо общий из карточки бренда.
  const contractFile =
    campaign.contractFile ||
    advertiser?.contracts?.find((c) => c.number === campaign.contractNumber)
      ?.file ||
    null
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
      // Есть скан — по клику скачивается прямо отсюда.
      file: contractFile,
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
      // Рекламодателю вместо сроков оплаты показываем прогресс оплаты.
      label: 'Сроки оплаты',
      icon: CalendarClock,
      value:
        !isAdvertiser && campaign.paymentDate
          ? formatDate(campaign.paymentDate)
          : null,
    },
  ].filter((tile) => tile.value)

  return (
    <>
      {tiles.map((tile) => (
        <ContractTile key={tile.label} {...tile} />
      ))}
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
  const [showPayments, setShowPayments] = useState(false)
  const pacing = campaign?.budget
    ? (campaign.spent / campaign.budget) * 100
    : 0
  const payments = campaign?.payments ?? []

  // Открыли другую кампанию — историю снова прячем.
  useEffect(() => {
    setShowPayments(false)
  }, [campaign?.id])

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
            campaign?.status === 'completed' ||
            campaign?.status === 'awaiting_payment') && (
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
                pacing={timeProgress(campaign)}
                createdAt={campaign.createdAt}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <CreativeTile url={campaign.creativeUrl} />
            <ContractTiles campaign={campaign} advertiser={advertiser} />

            {/* Плитка оплаты: по клику раскрывается история выплат. */}
            <button
              type="button"
              onClick={() => setShowPayments((v) => !v)}
              title="История выплат"
              className="group rounded-2xl border border-line bg-paper/55 p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                  {isAdvertiser ? 'Бюджет / Оплачено' : 'Освоение бюджета'}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900 transition-transform group-hover:scale-105">
                  <Gauge size={16} />
                </span>
              </div>
              <p className="mt-3 flex items-baseline gap-1.5 text-[15px] font-semibold text-ink tnum">
                {formatMoneyCompact(campaign.spent)}
                <span className="text-[12px] font-medium text-ink-muted">
                  из {formatMoneyCompact(campaign.budget)}
                </span>
              </p>
              <Progress
                value={pacing}
                label={formatPct(pacing, 0)}
                className="mt-2"
              />
            </button>
          </div>

          {showPayments && (
            <div className="mt-3 rounded-2xl border border-line bg-paper/55 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                История выплат
              </p>
              <div className="mt-3 max-h-[220px] space-y-1.5 overflow-y-auto">
                {payments.length === 0 ? (
                  <p className="rounded-xl bg-surface px-3 py-3 text-center text-[12px] text-ink-muted">
                    Поступлений пока не было.
                  </p>
                ) : (
                  payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2"
                    >
                      <span className="text-[12px] text-ink-muted tnum">
                        {formatDateTime(payment.createdAt)}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-emerald-700 tnum">
                        + {formatMoney(payment.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
