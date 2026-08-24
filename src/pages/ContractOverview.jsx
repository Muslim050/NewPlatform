import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  CalendarPlus,
  Check,
  ChevronDown,
  FileText,
  FolderOpen,
  Pencil,
  Search,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'
// Договоры переехали на сервер. Мок остаётся для разделов, которые ещё
// не подключены: import { useData } from '@/context/DataContext.jsx'
import { useContracts, useUpdateContract } from '@/features/contracts/queries'
import { useToast } from '@/components/ui/Toast.jsx'
import { CONTRACT_STATUS } from '@/lib/metrics.js'
import {
  formatDateNumeric,
  formatDateTime,
  formatMoney,
  formatMoneyCompact,
  formatPct,
} from '@/lib/format.js'
import { Card } from '@/components/ui/Card.jsx'
import { Badge } from '@/components/ui/Badge.jsx'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { Skeleton } from '@/components/ui/Skeleton'
import { Progress } from '@/components/ui/Progress.jsx'
import { ContractPreviewModal } from '@/components/campaigns/ContractPreviewModal.jsx'
import { MonthTabs, MONTHS_FULL } from '@/components/campaigns/MonthTabs.jsx'
import { periodKey } from '@/components/campaigns/StatusPopover.jsx'

const MONTHS = Array.from({ length: 12 }, (_, i) => i)

/** Границы месяца в ISO — с ними и сравниваем срок договора. */
function monthBounds(year, month) {
  const mm = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()
  return [`${year}-${mm}-01`, `${year}-${mm}-${lastDay}`]
}

/** Договор попадает в месяц, если его срок пересекается с ним. */
function inMonth(contract, year, month) {
  const from = contract.start || contract.end
  const to = contract.end || contract.start
  if (!from || !to) return false
  const [start, end] = monthBounds(year, month)
  return from <= end && to >= start
}

/** Месяц наступил? Будущие месяцы в фильтре недоступны. */
function isPassedMonth(year, month) {
  const now = new Date()
  return (
    year < now.getFullYear() ||
    (year === now.getFullYear() && month <= now.getMonth())
  )
}

/** Годы, которые задевают договоры, плюс текущий — по ним листаем месяцы. */
function yearsOf(rows, currentYear) {
  const years = new Set([currentYear])
  for (const { contract } of rows) {
    for (const date of [contract.start, contract.end]) {
      if (date) years.add(Number(date.slice(0, 4)))
    }
  }
  return [...years].sort((a, b) => a - b)
}

/**
 * Статус оплаты договора за месяц: за период — из истории, иначе общий.
 * Сервер отдаёт пустую строку, если статус ещё не ставили.
 */
function statusAt(contract, period) {
  if (!period) return contract.paymentStatus || null
  return contract.paymentStatusByPeriod?.[period]?.status || null
}

/** Суммы приходят decimal-строками — в расчётах они нужны числами. */
const toNumber = (value) => Number(value) || 0

export default function ContractOverview() {
  const { user, canEdit, isAdvertiser } = useAuth()
  // const { advertisers, update } = useData()
  const { rows: allRows, isPending, isError, error, refetch } = useContracts()
  const { mutate: updateContract } = useUpdateContract()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [year, setYear] = useState(() => new Date().getFullYear())
  // Открываемся на текущем месяце; «все месяцы» — крестик у вкладок.
  const [month, setMonth] = useState(() => new Date().getMonth())
  // Папочка открывает карточку договора, карандаш — форму правок. Держим
  // только номер строки: сам договор берём из свежей выдачи, иначе карточка
  // показывала бы состояние на момент открытия.
  const [previewId, setPreviewId] = useState(null)
  const [showPayments, setShowPayments] = useState(false)

  // Рекламодатель видит только свои договоры, площадка — все.
  const rows = isAdvertiser
    ? allRows.filter(({ advertiser }) => advertiser.id === user.advertiserId)
    : allRows

  const preview = rows.find(({ contract }) => contract.id === previewId)

  const currentYear = new Date().getFullYear()
  const years = yearsOf(rows, currentYear)
  const activeYear = years.includes(year) ? year : years[years.length - 1]
  const activeMonth =
    month != null && isPassedMonth(activeYear, month) ? month : null
  const activePeriod =
    activeMonth != null ? periodKey(activeYear, activeMonth) : null

  // Счётчики на вкладках — сколько договоров действует в каждом месяце.
  const monthCounts = MONTHS.map(
    (m) =>
      rows.filter(({ contract }) => inMonth(contract, activeYear, m)).length,
  )

  // Цвет месяца: красный, если хоть один договор за него не оплачен.
  const monthStatuses = MONTHS.reduce((acc, m) => {
    const period = periodKey(activeYear, m)
    const statuses = rows
      .filter(({ contract }) => inMonth(contract, activeYear, m))
      .map(({ contract }) => contract.paymentStatusByPeriod?.[period]?.status)
      .filter(Boolean)
    if (statuses.length) {
      acc[m] = statuses.includes('awaiting') ? 'awaiting' : 'paid'
    }
    return acc
  }, {})

  // Выбран месяц — и таблица, и сводка считаются только по нему.
  const scoped =
    activeMonth == null
      ? rows
      : rows.filter(({ contract }) =>
          inMonth(contract, activeYear, activeMonth),
        )

  const query = q.trim().toLowerCase()
  const filtered = scoped.filter(({ contract, advertiser }) =>
    `${contract.number} ${advertiser.name} ${contract.legalName ?? ''} ${
      contract.campaignName ?? ''
    }`
      .toLowerCase()
      .includes(query),
  )

  const paid = scoped.filter(
    ({ contract }) => statusAt(contract, activePeriod) === 'paid',
  ).length
  // Все поступления по видимым договорам — от свежих к старым.
  const payments = scoped
    .flatMap(({ contract, advertiser }) =>
      (contract.payments ?? []).map((payment) => ({
        ...payment,
        contractNumber: contract.number,
        brand: advertiser.name,
      })),
    )
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))

  // Суммы ведутся по договорам — здесь складываем их по всем видимым.
  // Месяц закрыт по договору — значит он оплачен полностью: показываем 100%
  // и нулевой остаток, даже если в самой записи освоено меньше.
  const spentOf = (contract) =>
    activePeriod && statusAt(contract, activePeriod) === 'paid'
      ? toNumber(contract.budget)
      : toNumber(contract.spent)

  const money = scoped.reduce(
    (acc, { contract }) => ({
      budget: acc.budget + toNumber(contract.budget),
      spent: acc.spent + spentOf(contract),
    }),
    { budget: 0, spent: 0 },
  )

  /** Правка из таблицы — только статус договора. */
  const setStatus = (contract, next) => {
    if (next === (contract.status ?? 'active')) return
    updateContract(
      { id: contract.id, input: { status: next } },
      {
        onSuccess: () =>
          toast.success(
            `Договор ${contract.number} — ${CONTRACT_STATUS[next].label.toLowerCase()}`,
          ),
        onError: (err) =>
          toast.error(err.message || 'Не удалось изменить статус договора'),
      },
    )
  }

  return (
    <div>
      {/* Сводка по договорам — сразу видно, сколько ждёт оплату. */}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Tile
          label={
            activeMonth == null
              ? 'Всего договоров'
              : `Договоров за ${MONTHS_FULL[activeMonth].toLowerCase()}`
          }
          value={scoped.length}
        />
        {/* Прибыль — внутренняя цифра площадки, рекламодателю показываем оплату. */}
        <MoneyTile
          label={`${isAdvertiser ? 'Бюджет / Оплачено' : 'Бюджет / Прибыль'}${
            activeMonth == null
              ? ''
              : ` · ${MONTHS_FULL[activeMonth].toLowerCase()} ${activeYear}`
          }`}
          budget={money.budget}
          spent={money.spent}
          hint={`Оплачено договоров: ${paid}. Нажмите — история выплат`}
          open={showPayments}
          onToggle={() => setShowPayments((v) => !v)}
        />
        {/* Остаток — сколько по договорам ещё не закрыто деньгами. */}
        <Tile
          label="Остаток по оплатам"
          value={formatMoneyCompact(money.budget - money.spent)}
          tone={money.budget - money.spent > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* История выплат по всем договорам сводки — раскрывается с плитки. */}
      {showPayments && (
        <Card className="mb-5 p-5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            История выплат
          </p>
          <div className="mt-3 max-h-[260px] space-y-1.5 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="rounded-xl bg-paper px-3 py-3 text-center text-[12px] text-ink-muted">
                Поступлений пока не было.
              </p>
            ) : (
              payments.map((payment, i) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2"
                >
                  <span className="w-5 shrink-0 text-[12px] text-ink-muted tnum">
                    {i + 1}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-muted tnum">
                    {formatDateTime(payment.paidAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">
                    {payment.brand} · {payment.contractNumber}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-emerald-700 tnum">
                    + {formatMoney(payment.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Поиск договора"
            placeholder="Поиск по договору"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted focus-ring focus-visible:border-indigo-300"
          />
        </div>
      </div>

      {/* Месяцы — тот же фильтр периода, что в кампаниях. */}
      <div className="mb-5 overflow-x-auto">
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

      {isPending ? (
        <ContractTableSkeleton />
      ) : isError ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Не удалось загрузить договоры"
            description={error?.message ?? 'Попробуйте ещё раз.'}
            action={
              <Button variant="secondary" onClick={() => refetch()}>
                Повторить
              </Button>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={rows.length ? 'Ничего не нашлось' : 'Договоров нет'}
            description={
              activeMonth != null
                ? `За ${MONTHS_FULL[activeMonth].toLowerCase()} ${activeYear} договоров нет — снимите фильтр месяца.`
                : rows.length
                  ? 'Попробуйте изменить запрос.'
                  : 'Договоры появятся здесь, как только их заведут в карточке бренда.'
            }
          />
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <Th className="w-10">№</Th>
                <Th>Организация</Th>
                <Th>Договор</Th>
                <Th className="text-center">
                  {isAdvertiser ? 'Бюджет / Оплачено' : 'Бюджет / Прибыль'}
                </Th>
                <Th className="text-right">Остаток</Th>
                <Th>Срок договора</Th>
                <Th>Статус</Th>
                <Th className="text-center">Действия</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ contract, advertiser }, i) => {
                const budget = toNumber(contract.budget)
                const spent = spentOf(contract)
                const pacing = budget ? (spent / budget) * 100 : 0
                // Остаток — сколько по договору ещё не закрыто деньгами.
                const rest = budget - spent
                const status = CONTRACT_STATUS[contract.status ?? 'active']
                return (
                  <motion.tr
                    key={contract.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i, 12) * 0.03,
                      duration: 0.3,
                    }}
                    className="border-b border-line/20 transition-colors last:border-0 hover:bg-paper"
                  >
                    <Td className="w-10 text-[12px] text-ink-muted tnum">
                      {i + 1}
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={advertiser.name}
                          color={advertiser.color}
                          src={advertiser.logo}
                          size="sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">
                            {advertiser.name}
                          </span>
                          {contract.legalName && (
                            <span className="block truncate text-[11px] text-ink-muted">
                              {contract.legalName}
                            </span>
                          )}
                        </span>
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap font-semibold text-ink tnum">
                      {contract.number}
                    </Td>
                    {/* Суммы договора — как в кампаниях: бюджет, освоено, полоса. */}
                    <Td className="w-[200px]">
                      <span className="flex items-center gap-1.5 text-[12px]">
                        <span className="text-ink-muted tnum">
                          {formatMoneyCompact(budget)}
                        </span>
                        <span className="ml-auto font-medium text-ink tnum">
                          {formatMoneyCompact(spent)}
                        </span>
                      </span>
                      <Progress
                        value={pacing}
                        label={formatPct(pacing, 0)}
                        className="mt-1.5"
                      />
                    </Td>
                    <Td className="whitespace-nowrap text-right font-medium text-ink tnum">
                      {formatMoneyCompact(rest)}
                    </Td>
                    {/* Срок договора — дата под датой с иконками, как в кампаниях. */}
                    <Td>
                      {contract.start || contract.end ? (
                        <span className="block">
                          <span
                            className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                            title={`Начало: ${formatDateNumeric(contract.start)}`}
                          >
                            <CalendarPlus
                              size={13}
                              className="shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                            {formatDateNumeric(contract.start)}
                          </span>
                          <span
                            className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                            title={`Окончание: ${formatDateNumeric(contract.end)}`}
                          >
                            <CalendarCheck
                              size={13}
                              className="shrink-0 text-ink-muted"
                              aria-hidden="true"
                            />
                            {formatDateNumeric(contract.end)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="flex justify-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 shrink-0 px-0 hover:border-indigo-400 hover:bg-indigo-100 hover:text-ink"
                          onClick={() => setPreviewId(contract.id)}
                          aria-label={`Открыть договор ${contract.number}`}
                          title="Открыть"
                        >
                          <FolderOpen size={16} />
                        </Button>
                        {canEdit && !isAdvertiser && (
                          <StatusMenu
                            contract={contract}
                            value={contract.status ?? 'active'}
                            onPick={(next) => setStatus(contract, next)}
                          />
                        )}
                      </span>
                    </Td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <ContractPreviewModal
        contract={preview?.contract ?? null}
        advertiser={preview?.advertiser ?? null}
        onClose={() => setPreviewId(null)}
      />
    </div>
  )
}

// Точка статуса в меню — тон тот же, что у бейджа в таблице.
const DOTS = {
  success: 'bg-success',
  muted: 'bg-ink-muted',
  danger: 'bg-danger',
}

/** Карандаш в строке: меняет только статус договора. */
function StatusMenu({ contract, value, onPick }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <span className="relative" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        className={`h-9 w-9 shrink-0 px-0 hover:border-indigo-400 hover:bg-indigo-100 hover:text-ink ${
          open ? 'border-indigo-400 bg-indigo-100' : ''
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Изменить статус договора ${contract.number}`}
        title="Изменить статус"
      >
        <Pencil size={16} />
      </Button>

      {open && (
        <span className="absolute right-0 top-full z-20 mt-1 flex w-48 flex-col overflow-hidden rounded-xl border border-line bg-surface p-1.5 text-left shadow-lift">
          {Object.entries(CONTRACT_STATUS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false)
                onPick(key)
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                key === value
                  ? 'bg-ink/5 text-ink'
                  : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOTS[meta.tone]}`}
              />
              {meta.label}
              {key === value && (
                <Check size={14} className="ml-auto shrink-0" />
              )}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

/** Повторяет геометрию таблицы, чтобы страница не прыгала при загрузке. */
function ContractTableSkeleton() {
  return (
    <Card className="overflow-hidden p-4">
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton circle className="h-8 w-8 shrink-0" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-1/6" />
            <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  )
}

function Th({ children, className }) {
  return (
    <th className={`px-4 py-3 font-semibold ${className ?? ''}`}>{children}</th>
  )
}

function Td({ children, className }) {
  return (
    <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>
  )
}

/** Сумма по всем договорам — как карточка «Бюджет / Прибыль» в кампаниях. */
function MoneyTile({ label, budget, spent, hint, open, onToggle }) {
  const pacing = budget ? (spent / budget) * 100 : 0
  return (
    <button
      type="button"
      onClick={onToggle}
      title={hint}
      aria-expanded={open}
      className={`w-full rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 text-left shadow-soft transition-colors hover:border-indigo-400 hover:bg-indigo-100 focus-ring ${
        open ? 'border-indigo-400 bg-indigo-100' : ''
      }`}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-900">
        {label}
        <ChevronDown
          size={13}
          className={`ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </p>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="text-[22px] text-ink-muted tnum">
          {formatMoneyCompact(budget)}
        </span>
        <span className="ml-auto font-display text-[22px] font-semibold leading-none text-ink tnum">
          {formatMoneyCompact(spent)}
        </span>
      </p>
      <Progress value={pacing} label={formatPct(pacing, 0)} className="mt-2" />
    </button>
  )
}

function Tile({ label, value, tone }) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-ink-muted">{label}</p>
      <p
        className={`mt-3 font-display text-[25px] font-semibold leading-none tnum ${
          tone === 'success'
            ? 'text-success'
            : tone === 'danger'
              ? 'text-danger'
              : 'text-ink'
        }`}
      >
        {value}
      </p>
    </Card>
  )
}
