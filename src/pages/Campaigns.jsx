import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Megaphone,
  BarChart3,
  FileText,
  FolderOpen,
  Download,
  CalendarPlus,
  CalendarCheck,
  CalendarClock,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { statusLabel, timeProgress } from '@/lib/metrics.js'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import {
  formatDateNumeric,
  formatDateTime,
  formatMoneyCompact,
  formatPct,
} from '@/lib/format.js'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Tooltip } from '@/components/ui/Tooltip.jsx'
import { CampaignForm } from '@/components/forms/CampaignForm.jsx'
import { BrandTabs } from '@/components/campaigns/BrandTabs.jsx'
import { MonthTabs, MONTHS_FULL } from '@/components/campaigns/MonthTabs.jsx'
import { MediaReport } from '@/components/campaigns/MediaReport.jsx'
import { MoneyPopover } from '@/components/campaigns/MoneyPopover.jsx'
import { ContractModal } from '@/components/campaigns/ContractModal.jsx'
import {
  StatusPopover,
  periodKey,
} from '@/components/campaigns/StatusPopover.jsx'
import { cn } from '@/lib/cn.js'
import { uid } from '@/lib/id.js'
import {
  CampaignPreviewModal,
  CampaignStatusPill,
} from '@/components/campaigns/CampaignPreviewModal.jsx'

// Раскладка строки: у рекламодателя нет колонок бюджета и статистики, а из
// действий — только «Открыть». У админа колонок больше, поэтому промежутки уже.
// Колонки «Статистика» и «Номер договора» временно скрыты, поэтому их ширины
// убраны из шаблона — при возврате колонки вернуть их перед «Действиями».
// Первая колонка тянется — иначе справа от «Действий» остаётся пустое поле.
const GRID_ADMIN =
  'md:gap-2.5 md:grid-cols-[minmax(180px,1fr)_146px_112px_88px] 2xl:grid-cols-[minmax(200px,1fr)_150px_132px_96px]'
const GRID_ADVERTISER =
  'md:gap-3 md:grid-cols-[minmax(180px,1fr)_150px_112px_56px] 2xl:grid-cols-[minmax(200px,1fr)_164px_132px_56px]'

// Порядок группировки строк — как в фильтрах над таблицей.
const STATUS_ORDER = {
  sent: 0,
  received: 1,
  reviewing: 2,
  active: 3,
  completed: 4,
  awaiting_payment: 5,
  paid: 6,
}

// Метка статуса перед названием: цветная полоска у кампаний, по которым
// ждут действия. Пульсирует, чтобы такие строки было видно сразу.
const STATUS_MARKS = {
  sent: 'bg-sky-500',
  reviewing: 'bg-orange-500',
  awaiting_payment: 'bg-red-500',
}

const ALL_BRANDS = 'all'
// Статус оплаты договора: денег ждём или они уже пришли. Неоплаченный
// договор красный и пульсирует — его видно в потоке карточек.
const CONTRACT_PAYMENT = {
  awaiting: {
    label: 'Ожидает оплату',
    card: 'border-danger/60 bg-danger/[0.1] hover:border-danger/70 hover:bg-danger/10 animate-pulse-ring',
    badge: 'bg-danger/20 text-danger',
    caption: 'text-danger',
    pencil: 'text-danger',
    pulse: true,
  },
  paid: {
    label: 'Оплачено',
    card: 'border-success/35 bg-success/[0.07] hover:border-success/60 hover:bg-success/10',
    badge: 'bg-success/10 text-success',
    caption: 'text-success',
    pencil: 'text-success',
    pulse: false,
  },
}
const PAYMENT_OPTIONS = [
  {
    value: 'awaiting',
    label: CONTRACT_PAYMENT.awaiting.label,
    badge: CONTRACT_PAYMENT.awaiting.badge,
  },
  {
    value: 'paid',
    label: CONTRACT_PAYMENT.paid.label,
    badge: CONTRACT_PAYMENT.paid.badge,
  },
]

const ALL_CONTRACTS = 'all'
const MONTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

/** Границы месяца в ISO — с ними и сравниваем период кампании. */
function monthBounds(year, month) {
  const mm = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return [`${year}-${mm}-01`, `${year}-${mm}-${lastDay}`]
}

/** Кампания попадает в месяц, если её период пересекается с ним. */
function inMonth(campaign, year, month) {
  const from = campaign.startDate || campaign.endDate
  const to = campaign.endDate || campaign.startDate
  if (!from || !to) return false
  const [start, end] = monthBounds(year, month)
  return from <= end && to >= start
}

/** Месяц наступил? По будущим месяцам кампаний не показываем. */
function isPassedMonth(year, month) {
  const now = new Date()
  return (
    year < now.getFullYear() ||
    (year === now.getFullYear() && month <= now.getMonth())
  )
}

/** Текущий месяц ещё идёт: по нему показываем список кампаний, а не отчёт. */
function isCurrentMonth(year, month) {
  const now = new Date()
  return year === now.getFullYear() && month === now.getMonth()
}

/** Годы, которые задевают кампании, плюс текущий — по ним листаем месяцы. */
function yearsOf(campaigns, currentYear) {
  const years = new Set([currentYear])
  for (const c of campaigns) {
    for (const date of [c.startDate, c.endDate]) {
      if (date) years.add(Number(date.slice(0, 4)))
    }
  }
  return [...years].sort((a, b) => a - b)
}

/**
 * Договоры бренда со счётчиком кампаний. Отдельной вкладки «Все» нет —
 * повторный клик по выбранному договору снимает фильтр.
 */
function contractsOf(advertiser, campaigns) {
  return (advertiser?.contracts ?? []).map((contract) => ({
    value: contract.number,
    label: contract.number,
    count: campaigns.filter((c) => c.contractNumber === contract.number).length,
  }))
}

/**
 * Вкладка «Все» плюс бренды, у которых есть кампании, со счётчиками.
 * sent — сколько заявок пришло и ещё не разобрано; по ним рисуем метку.
 * active — сколько кампаний идёт прямо сейчас.
 */
function brandsOf(campaigns, advertiserById) {
  const byId = new Map()
  for (const c of campaigns) {
    const isNew = c.status === 'sent'
    const isActive = c.status === 'active'
    const found = byId.get(c.advertiserId)
    if (found) {
      found.count += 1
      found.sent += isNew ? 1 : 0
      found.active += isActive ? 1 : 0
      continue
    }
    const adv = advertiserById(c.advertiserId)
    if (adv) {
      byId.set(adv.id, {
        id: adv.id,
        name: adv.name,
        color: adv.color,
        count: 1,
        sent: isNew ? 1 : 0,
        active: isActive ? 1 : 0,
      })
    }
  }
  const list = [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'ru'),
  )
  if (!list.length) return []
  return [
    {
      id: ALL_BRANDS,
      name: 'Все',
      count: campaigns.length,
      sent: campaigns.filter((c) => c.status === 'sent').length,
      active: campaigns.filter((c) => c.status === 'active').length,
    },
    ...list,
  ]
}

export default function Campaigns() {
  const { user, isAdmin, isAdvertiser, canEdit } = useAuth()
  const navigate = useNavigate()
  const { advertiserById, channelById, remove, update } = useData()
  const campaigns = useScopedCampaigns()
  const toast = useToast()
  const confirm = useConfirm()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [brandId, setBrandId] = useState(ALL_BRANDS)
  const [contract, setContract] = useState(ALL_CONTRACTS)
  const [year, setYear] = useState(() => new Date().getFullYear())
  // Месяц не выбран — таблица показывает кампании за все периоды.
  const [month, setMonth] = useState(null)
  const [contractModal, setContractModal] = useState(null)
  const [modal, setModal] = useState({ open: false, initial: null })
  const [preview, setPreview] = useState(null)
  // Правка сумм в поповере у ячейки «Бюджет / Прибыль» (только админ).
  const [money, setMoney] = useState(null)
  // Карточка, у которой открыт поповер со сменой статуса оплаты.
  const [statusAnchor, setStatusAnchor] = useState(null)

  // Суммы переехали на договор — в таблице кампаний колонки бюджета нет.
  const showBudget = false
  const canEditMoney = canEdit && !isAdvertiser
  // Колонка «Статистика» временно скрыта и у админа.
  // const showStats = !isAdvertiser
  const showStats = false
  // Наблюдателю таблица доступна целиком, но без кнопок правки.
  const showActions = !isAdvertiser && canEdit

  // Вкладки брендов: только те, у кого есть кампании. Рекламодателю не нужны —
  // он и так видит лишь свой бренд.
  const brands = isAdvertiser ? [] : brandsOf(campaigns, advertiserById)
  // Если выбранный бренд пропал из списка — возвращаемся ко «Всем».
  const activeBrand = brands.some((b) => b.id === brandId)
    ? brandId
    : ALL_BRANDS

  // Внутри вкладки бренда — только его кампании.
  const brandCampaigns =
    activeBrand === ALL_BRANDS
      ? campaigns
      : campaigns.filter((c) => c.advertiserId === activeBrand)

  // Второй уровень: договоры выбранного бренда. У рекламодателя бренд один,
  // поэтому его договоры показываем сразу.
  const contractBrandId = isAdvertiser
    ? user?.advertiserId
    : activeBrand === ALL_BRANDS
      ? null
      : activeBrand
  const contractBrand = contractBrandId ? advertiserById(contractBrandId) : null
  const contracts = contractsOf(contractBrand, brandCampaigns)
  // Договор мог пропасть вместе со сменой бренда — тогда показываем все.
  const activeContract = contracts.some((c) => c.value === contract)
    ? contract
    : ALL_CONTRACTS

  const contractCampaigns =
    activeContract === ALL_CONTRACTS
      ? brandCampaigns
      : brandCampaigns.filter((c) => c.contractNumber === activeContract)

  // Третий уровень: период. Появляется вместе с выбранным договором; год
  // задаёт, за какой год показаны 12 месяцев, фильтр включается с выбором
  // месяца. Без договора выбранный месяц не действует.
  const showMonths = activeContract !== ALL_CONTRACTS
  const currentYear = new Date().getFullYear()
  const years = yearsOf(contractCampaigns, currentYear)
  // Год мог пропасть вместе со сменой бренда или договора.
  const activeYear = years.includes(year)
    ? year
    : years.includes(currentYear)
      ? currentYear
      : years[years.length - 1]
  // Счётчик заказов есть только у текущего месяца: в закрытых открывается
  // отчёт, а не список, в будущих кампаний ещё нет.
  const monthCounts = MONTHS.map((m) =>
    isCurrentMonth(activeYear, m)
      ? contractCampaigns.filter((c) => inMonth(c, activeYear, m)).length
      : 0,
  )
  const activeMonth =
    showMonths && month != null && isPassedMonth(activeYear, month)
      ? month
      : null
  // Отчёт открываем только по закрытым месяцам; за текущий — список кампаний.
  const showMonthReport =
    activeMonth != null && !isCurrentMonth(activeYear, activeMonth)

  // Договор, открытый сейчас: по нему ведутся суммы и выплаты.
  const selectedContract =
    activeContract === ALL_CONTRACTS
      ? null
      : (contractBrand?.contracts ?? []).find(
          (c) => c.number === activeContract,
        ) ?? null
  const contractPacing = selectedContract?.budget
    ? ((selectedContract.spent ?? 0) / selectedContract.budget) * 100
    : 0

  const scoped =
    activeMonth == null
      ? contractCampaigns
      : contractCampaigns.filter((c) => inMonth(c, activeYear, activeMonth))

  const counts = {
    all: scoped.length,
    sent: scoped.filter((c) => c.status === 'sent').length,
    received: scoped.filter((c) => c.status === 'received').length,
    reviewing: scoped.filter((c) => c.status === 'reviewing').length,
    active: scoped.filter((c) => c.status === 'active').length,
    completed: scoped.filter((c) => c.status === 'completed').length,
    awaiting_payment: scoped.filter((c) => c.status === 'awaiting_payment')
      .length,
    paid: scoped.filter((c) => c.status === 'paid').length,
  }

  // Пустые статусы в фильтрах не показываем — только «Все» остаётся всегда.
  const statusItems = [
    { value: 'all', label: 'Все', count: counts.all },
    ...(isAdvertiser
      ? []
      : [
          { value: 'sent', label: 'Отправленные', count: counts.sent },
          { value: 'received', label: 'Полученные', count: counts.received },
          {
            value: 'reviewing',
            label: 'Рассматриваются',
            count: counts.reviewing,
          },
        ]),
    { value: 'active', label: 'Активные', count: counts.active },
    { value: 'completed', label: 'Завершенные', count: counts.completed },
    {
      value: 'awaiting_payment',
      label: 'Ожидают оплату',
      count: counts.awaiting_payment,
    },
    { value: 'paid', label: 'Оплаченные', count: counts.paid },
  ].filter((item) => item.value === 'all' || item.count > 0)
  // Выбранный статус мог обнулиться после смены фильтров — тогда «Все».
  const activeStatus = statusItems.some((item) => item.value === status)
    ? status
    : 'all'

  const query = q.trim().toLowerCase()
  const filtered = scoped
    .filter(
      (c) =>
        (activeStatus === 'all' || c.status === activeStatus) &&
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

  // Договор для поповера берём из актуального бренда: поповер остаётся
  // открытым после сохранения и должен показывать свежие суммы и историю.
  const moneyContract = money
    ? (contractBrand?.contracts ?? []).find((c) => c.id === money.id) ?? null
    : null

  /**
   * Смена бренда — это новый контекст: договоры у него свои, а период
   * возвращаем к текущему месяцу, чтобы не смотреть чужой отчёт.
   */
  const selectBrand = (id) => {
    setBrandId(id)
    setContract(ALL_CONTRACTS)
    setYear(new Date().getFullYear())
    setMonth(new Date().getMonth())
  }

  /** Сохраняем суммы договора внутри карточки бренда. */
  const patchContract = (contractId, patch) => {
    const next = (contractBrand.contracts ?? []).map((c) =>
      c.id === contractId ? { ...c, ...patch } : c,
    )
    update('advertisers', contractBrand.id, { contracts: next })
  }

  // История выплат идёт от первой к последней. Внутри одной минуты порядок
  // держит seq — номер внесения: без него платежи, вбитые подряд, встают
  // в случайном порядке.
  const byPaymentDate = (a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
    return (a.seq ?? 0) - (b.seq ?? 0)
  }

  const saveMoney = ({ budget, spent, amount, paidAt }) => {
    const history = moneyContract.payments ?? []
    // В историю пишем весь прирост оплаченного, а не только поле
    // «Поступление»: первую оплату часто вбивают прямо в «Оплачено»,
    // и это тоже платёж.
    const gained = spent - (moneyContract.spent ?? 0)
    const nextSeq =
      history.reduce((max, payment) => Math.max(max, payment.seq ?? 0), 0) + 1
    const payments =
      gained > 0
        ? [
            ...history,
            { id: uid('pay'), amount: gained, createdAt: paidAt, seq: nextSeq },
          ].sort(byPaymentDate)
        : history
    patchContract(moneyContract.id, { budget, spent, payments })
    // Поповер намеренно не закрываем — можно внести следующее поступление.
    toast.success(
      gained > 0
        ? `Поступление по договору ${moneyContract.number} внесено`
        : `Суммы договора ${moneyContract.number} обновлены`,
    )
  }

  /** Статус оплаты договора ведётся по месяцам: ключ вида 2026-08. */
  const statusByPeriod = selectedContract?.paymentStatusByPeriod ?? {}
  // Карточка показывает статус выбранного месяца, а без месяца — последний.
  const activePeriod =
    activeMonth != null ? periodKey(activeYear, activeMonth) : null
  const periodEntry = activePeriod ? statusByPeriod[activePeriod] : null
  const paymentStatus =
    (periodEntry?.status ?? selectedContract?.paymentStatus) === 'paid'
      ? 'paid'
      : 'awaiting'
  // Когда поставили этот статус. У договоров без даты берём свежую запись
  // истории с тем же статусом: смену могли оформить задним числом, и наверху
  // списка окажется чужая.
  const paymentChangedAt =
    periodEntry?.changedAt ??
    (periodEntry
      ? null
      : (selectedContract?.paymentStatusAt ??
        selectedContract?.paymentLog?.find((e) => e.status === paymentStatus)
          ?.createdAt ??
        null))

  // Раскраска вкладок месяцев за показанный год.
  const monthStatuses = MONTHS.reduce((acc, month) => {
    const entry = statusByPeriod[periodKey(activeYear, month)]
    if (entry?.status) acc[month] = entry.status
    return acc
  }, {})

  const savePaymentStatus = (next, changedAt, period) => {
    // Каждую смену статуса записываем: кто, когда, за какой месяц и на что.
    // Дату выбирают в поповере — смену можно оформить и задним числом.
    const createdAt = changedAt ?? new Date().toISOString()
    const entry = {
      id: uid('st'),
      status: next,
      period,
      createdAt,
      by: user?.name ?? null,
    }
    const log = [entry, ...(selectedContract.paymentLog ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    )
    patchContract(selectedContract.id, {
      // Последний по времени статус держим и на самом договоре — им
      // подписана карточка, когда месяц не выбран.
      paymentStatus: next,
      paymentStatusAt: createdAt,
      paymentStatusByPeriod: {
        ...statusByPeriod,
        [period]: { status: next, changedAt: createdAt },
      },
      paymentLog: log,
    })
    setStatusAnchor(null)
    const [year, month] = period.split('-')
    toast.success(
      `Договор ${selectedContract.number}, ${MONTHS_FULL[
        Number(month) - 1
      ].toLowerCase()} ${year}: ${CONTRACT_PAYMENT[next].label}`,
    )
  }

  /** Правка даты и времени уже внесённой выплаты. */
  const editPayment = (paymentId, localValue) => {
    if (!localValue) return
    const createdAt = new Date(localValue)
    if (Number.isNaN(createdAt.getTime())) return
    const payments = (moneyContract.payments ?? [])
      .map((payment) =>
        payment.id === paymentId
          ? { ...payment, createdAt: createdAt.toISOString() }
          : payment,
      )
      .sort(byPaymentDate)
    patchContract(moneyContract.id, { payments })
  }

  /** Удаление выплаты: сумма вычитается из оплаченного по договору. */
  const removePayment = async (paymentId) => {
    const payment = (moneyContract.payments ?? []).find(
      (item) => item.id === paymentId,
    )
    if (!payment) return
    const ok = await confirm({
      title: 'Удалить поступление?',
      description: `${formatMoneyCompact(payment.amount)} · ${formatDateTime(payment.createdAt)}`,
      body: 'Сумма вычтется из оплаченного по договору.',
    })
    if (!ok) return
    const payments = (moneyContract.payments ?? []).filter(
      (item) => item.id !== paymentId,
    )
    patchContract(moneyContract.id, {
      payments,
      spent: Math.max(0, (moneyContract.spent ?? 0) - payment.amount),
    })
    toast.info('Поступление удалено')
  }

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
      {/* Поиск, фильтр статусов и создание кампании — одной строкой */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Поиск всегда на виду: поле открыто, крестик очищает запрос. */}
        <div className="relative w-full shrink-0 sm:w-[210px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            aria-label="Поиск кампании"
            placeholder="Поиск по названию…"
            className={cn(
              'h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-9 text-sm text-ink transition-colors placeholder:text-ink-muted hover:border-indigo-300 focus-ring focus-visible:border-indigo-300',
              query && 'border-indigo-300',
            )}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-ring"
            >
              <X size={14} />
            </button>
          )}
          {/* Сколько кампаний осталось после поиска — подписью под полем. */}
          {query && (
            <p className="absolute left-1 top-full mt-1 text-[12px] text-ink-muted">
              Найдено: {filtered.length}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <SegmentTabs
            value={activeStatus}
            onChange={setStatus}
            items={statusItems}
          />
          {isAdvertiser && (
            <Button
              variant="primary"
              // Высота под сегментные табы: их 42px против дефолтных 44px кнопки.
              className="h-[42px] shrink-0"
              onClick={() => setModal({ open: true, initial: null })}
            >
              <Plus size={18} />
              Новая кампания
            </Button>
          )}
        </div>
      </div>

      {/* Вкладки брендов */}
      {brands.length > 0 && (
        <BrandTabs
          items={brands}
          value={activeBrand}
          onChange={selectBrand}
          className="mb-4"
        />
      )}

      {/* Договоры выбранного бренда — фильтр, файл, просмотр и добавление.
          Кнопки без подписей, поэтому у каждой своя подсказка. */}
      {contractBrand && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {contracts.length > 0 && (
            <SegmentTabs
              tone="soft"
              value={activeContract}
              onChange={(value) =>
                setContract(value === activeContract ? ALL_CONTRACTS : value)
              }
              items={contracts}
            />
          )}
          {activeContract !== ALL_CONTRACTS && (
            <Tooltip label="Открыть договор">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Открыть договор"
                onClick={() =>
                  setContractModal({
                    contract: contractBrand.contracts.find(
                      (c) => c.number === activeContract,
                    ),
                  })
                }
              >
                <FileText size={15} />
              </Button>
            </Tooltip>
          )}
          {/* Файл договора качаем прямо из строки — без захода в карточку. */}
          {selectedContract?.file?.url && (
            <Tooltip label={`Скачать договор — ${selectedContract.file.name}`}>
              <a
                href={selectedContract.file.url}
                download={selectedContract.file.name}
                aria-label="Скачать договор"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-surface px-3.5 text-ink transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.98] focus-ring"
              >
                <Download size={15} />
              </a>
            </Tooltip>
          )}
          {!isAdvertiser && canEdit && (
            <Tooltip label="Добавить договор">
              <Button
                size="sm"
                variant="secondary"
                aria-label="Добавить договор"
                onClick={() => setContractModal({ contract: null })}
              >
                <Plus size={15} />
              </Button>
            </Tooltip>
          )}
        </div>
      )}

      {/* Деньги договора, статус оплаты и период — одной строкой. */}
      {showMonths && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {selectedContract && (
            <div className="flex shrink-0 items-stretch gap-2">
              <button
                type="button"
                onClick={(e) =>
                  setMoney({ id: selectedContract.id, el: e.currentTarget })
                }
                title={
                  canEditMoney
                    ? 'Изменить суммы договора и внести поступление'
                    : 'История выплат по договору'
                }
                className="group w-[210px] shrink-0 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-left transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-ring"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-900">
                    {/* Прибыль — внутренняя цифра площадки. */}
                    {isAdvertiser ? 'Бюджет / Оплачено' : 'Бюджет / Прибыль'}
                  </span>
                  {canEditMoney && (
                    <Pencil
                      size={12}
                      aria-hidden="true"
                      className="ml-auto shrink-0 text-indigo-800 opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                  <span className="text-ink-muted tnum">
                    {formatMoneyCompact(selectedContract.budget ?? 0)}
                  </span>
                  <span className="ml-auto font-medium text-ink tnum">
                    {formatMoneyCompact(selectedContract.spent ?? 0)}
                  </span>
                </span>
                <Progress
                  value={contractPacing}
                  label={formatPct(contractPacing, 0)}
                  className="mt-1"
                />
              </button>

              {/* Статус оплаты договора: площадка меняет, остальные смотрят
                  историю смен. */}
              <button
                type="button"
                onClick={(e) => setStatusAnchor(e.currentTarget)}
                title={
                  canEditMoney
                    ? 'Изменить статус оплаты'
                    : 'История статуса оплаты'
                }
                className={cn(
                  'group flex shrink-0 flex-col justify-center rounded-xl border px-3 py-1.5 text-left transition-colors focus-ring',
                  CONTRACT_PAYMENT[paymentStatus].card,
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      CONTRACT_PAYMENT[paymentStatus].caption,
                    )}
                  >
                    Статус
                  </span>
                  {/* Дата последней смены — рекламодателю карточка нужна
                      именно как справка. */}
                  {paymentChangedAt && (
                    <span
                      className="shrink-0 text-[10px] text-black tnum"
                      title="Дата и время последней смены статуса"
                    >
                      {formatDateTime(paymentChangedAt)}
                    </span>
                  )}
                  {canEditMoney && (
                    <Pencil
                      size={12}
                      aria-hidden="true"
                      className={cn(
                        'ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                        CONTRACT_PAYMENT[paymentStatus].pencil,
                      )}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'mt-1 inline-flex w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium',
                    CONTRACT_PAYMENT[paymentStatus].badge,
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {CONTRACT_PAYMENT[paymentStatus].pulse && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
                    )}
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  </span>
                  {CONTRACT_PAYMENT[paymentStatus].label}
                </span>
              </button>
            </div>
          )}

          <MonthTabs
            year={activeYear}
            years={years}
            onYearChange={setYear}
            value={activeMonth}
            onChange={setMonth}
            counts={monthCounts}
            statuses={monthStatuses}
          />
        </div>
      )}

      {/* Выбран закрытый месяц — вместо списка кампаний показываем статистику */}
      {!showMonthReport && (
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
                'hidden items-center border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted md:grid',
                isAdvertiser ? GRID_ADVERTISER : GRID_ADMIN,
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="w-5 shrink-0">№</span>
                Кампания
              </span>
              <span >Статус</span>
              <span >Период</span>
              {showBudget && (
                <span className="flex justify-center">
                  {isAdvertiser ? 'Бюджет / Оплачено' : 'Бюджет / Прибыль'}
                </span>
              )}
              <span className="text-center">Действия</span>
            </div>

            <div className="divide-y divide-line">
              {filtered.map((c, index) => {
                const adv = advertiserById(c.advertiserId)
                const pacing = c.budget ? (c.spent / c.budget) * 100 : 0
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-3.5 transition-colors hover:bg-ink/[0.015] md:grid',
                      isAdvertiser ? GRID_ADVERTISER : GRID_ADMIN,
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="relative w-5 shrink-0 text-[12px] text-ink-muted tnum">
                        {index + 1}
                        {/* Точка над номером — статус кампании. */}
                        {STATUS_MARKS[c.status] && (
                          <span
                            className={cn(
                              'absolute -top-[6px] right-[1px] h-2.5 w-2.5 animate-pulse rounded-full',
                              STATUS_MARKS[c.status],
                            )}
                            title={statusLabel(c.status)}
                          />
                        )}
                      </span>
                      {isAdmin && adv && (
                        <Avatar
                          name={adv.name}
                          color={adv.color}
                          src={adv.logo}
                          size="sm"
                        />
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
                      <CampaignStatusPill
                        status={c.status}
                        pacing={timeProgress(c)}
                        createdAt={c.createdAt}
                      />
                    </div>

                    {/* Период — дата под датой: так колонка остаётся узкой. */}
                    <div className="hidden min-w-0 md:block">
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
                    </div>

                    {showBudget && (
                      <div className="hidden md:block">
                        <button
                          type="button"
                          onClick={(e) =>
                            setMoney({ id: c.id, el: e.currentTarget })
                          }
                          title={
                            !canEditMoney
                              ? 'История выплат'
                              : c.status === 'completed'
                                ? 'Завершённая кампания — только история выплат'
                                : 'Изменить суммы и внести поступление'
                          }
                          className="group w-full rounded-lg px-1 py-0.5 text-left transition-colors enabled:hover:bg-ink/[0.04] disabled:cursor-default focus-ring"
                        >
                          <span className="flex items-center gap-1.5 text-[12px]">
                            <span className="text-ink-muted tnum">
                              {formatMoneyCompact(c.budget)}
                            </span>
                            <span className="ml-auto font-medium text-ink tnum">
                              {formatMoneyCompact(c.spent)}
                            </span>
                            {canEditMoney && c.status !== 'completed' && (
                              <Pencil
                                size={12}
                                aria-hidden="true"
                                className="shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            )}
                          </span>
                          {/* Полоса про деньги: сколько из суммы уже оплачено. */}
                          <Progress
                            value={pacing}
                            label={formatPct(pacing, 0)}
                            className="mt-1.5"
                          />
                        </button>
                      </div>
                    )}

                    {showStats && (
                      <div className="flex justify-center">
                        {c.status === 'active' ||
                        c.status === 'completed' ||
                        c.status === 'awaiting_payment' ||
                        c.status === 'paid' ? (
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
                    )}

                    <div className="flex items-center justify-center gap-1.5">
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
                      {showActions && (
                        <>
                        {/* Админ правит кампанию в любом статусе. */}
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
                        {/* Удаление кампании временно скрыто.
                            Запущенную и завершённую кампанию удалять нельзя.
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
                        */}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
      )}

      {showMonthReport && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-800" />
            <h2 className="font-display text-base font-semibold text-ink">
              Статистика за {MONTHS_FULL[activeMonth].toLowerCase()} {activeYear}
            </h2>
          </div>
          {/* Состав вкладок отчёта свой у каждого договора. */}
          <MediaReport
            key={`${selectedContract?.id ?? 'all'}-${activeYear}-${activeMonth}`}
            scopeId={selectedContract?.id}
          />
        </section>
      )}

      <ContractModal
        open={!!contractModal}
        contract={contractModal?.contract ?? null}
        advertiser={contractBrand}
        onClose={() => setContractModal(null)}
      />

      {moneyContract && (
        <MoneyPopover
          anchorEl={money.el}
          title={`Договор ${moneyContract.number}`}
          budget={moneyContract.budget ?? 0}
          spent={moneyContract.spent ?? 0}
          payments={moneyContract.payments ?? []}
          onRemovePayment={removePayment}
          onSave={saveMoney}
          onEditPayment={editPayment}
          onClose={() => setMoney(null)}
        />
      )}

      {statusAnchor && selectedContract && (
        <StatusPopover
          anchorEl={statusAnchor}
          title={`Договор ${selectedContract.number}`}
          value={paymentStatus}
          options={PAYMENT_OPTIONS}
          history={selectedContract.paymentLog ?? []}
          statusByPeriod={statusByPeriod}
          period={activePeriod ?? periodKey(activeYear, new Date().getMonth())}
          years={years}
          readOnly={!canEditMoney}
          onSave={savePaymentStatus}
          onClose={() => setStatusAnchor(null)}
        />
      )}

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
