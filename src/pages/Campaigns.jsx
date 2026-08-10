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
  CalendarPlus,
  CalendarCheck,
  CalendarClock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext.jsx'
import { useData } from '@/context/DataContext.jsx'
import { useScopedCampaigns } from '@/lib/useScope.js'
import { useToast } from '@/components/ui/Toast.jsx'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import {
  formatDateNumeric,
  formatMoneyCompact,
} from '@/lib/format.js'
import { Card } from '@/components/ui/Card.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Progress } from '@/components/ui/Progress.jsx'
import { Avatar } from '@/components/ui/Avatar.jsx'
import { SegmentTabs } from '@/components/ui/Tabs.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { CampaignForm } from '@/components/forms/CampaignForm.jsx'
import { BrandTabs } from '@/components/campaigns/BrandTabs.jsx'
import { MonthTabs } from '@/components/campaigns/MonthTabs.jsx'
import { MoneyPopover } from '@/components/campaigns/MoneyPopover.jsx'
import { ContractModal } from '@/components/campaigns/ContractModal.jsx'
import { cn } from '@/lib/cn.js'
import {
  CampaignPreviewModal,
  CampaignStatusPill,
} from '@/components/campaigns/CampaignPreviewModal.jsx'

// Раскладка строки: у рекламодателя нет колонок бюджета и статистики, а из
// действий — только «Открыть». У админа колонок больше, поэтому промежутки уже.
// Колонка «Статистика» временно скрыта, поэтому её ширины (76px и 88px)
// убраны из шаблона — при возврате колонки вернуть их перед «Действиями».
const GRID_ADMIN =
  'md:gap-2.5 md:grid-cols-[minmax(180px,1fr)_146px_112px_96px_124px_96px_88px] 2xl:grid-cols-[minmax(200px,360px)_150px_132px_104px_140px_100px_96px]'
const GRID_ADVERTISER =
  'md:gap-3 md:grid-cols-[minmax(180px,1fr)_150px_212px_110px_100px_56px] 2xl:grid-cols-[minmax(200px,340px)_164px_212px_120px_110px_56px]'

// Порядок группировки строк — как в фильтрах над таблицей.
const STATUS_ORDER = {
  sent: 0,
  received: 1,
  reviewing: 2,
  active: 3,
  completed: 4,
}

const ALL_BRANDS = 'all'
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
  const { user, isAdmin, isAdvertiser } = useAuth()
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

  // Рекламодатель не видит бюджет со статистикой и не управляет кампаниями
  // из таблицы.
  const showBudget = !isAdvertiser
  // Колонка «Статистика» временно скрыта и у админа.
  // const showStats = !isAdvertiser
  const showStats = false
  const showActions = !isAdvertiser

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
  // Ненаступившие месяцы пустые: ни счётчика, ни фильтра.
  const monthCounts = MONTHS.map((m) =>
    isPassedMonth(activeYear, m)
      ? contractCampaigns.filter((c) => inMonth(c, activeYear, m)).length
      : 0,
  )
  const activeMonth =
    showMonths && month != null && isPassedMonth(activeYear, month)
      ? month
      : null

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
  }

  const query = q.trim().toLowerCase()
  const filtered = scoped
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

  const saveMoney = ({ budget, spent }) => {
    update('campaigns', money.campaign.id, { budget, spent })
    setMoney(null)
    toast.success('Суммы обновлены')
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
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <SegmentTabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'all', label: 'Все', count: counts.all },
            ...(isAdvertiser
              ? []
              : [
                  {
                    value: 'sent',
                    label: 'Отправленные',
                    count: counts.sent,
                  },
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
          onChange={setBrandId}
          className="mb-4"
        />
      )}

      {/* Договоры выбранного бренда — фильтр, просмотр и добавление */}
      {contractBrand && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {contracts.length > 0 && (
            <SegmentTabs
              value={activeContract}
              onChange={(value) =>
                setContract(value === activeContract ? ALL_CONTRACTS : value)
              }
              items={contracts}
            />
          )}
          {activeContract !== ALL_CONTRACTS && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setContractModal({
                  contract: contractBrand.contracts.find(
                    (c) => c.number === activeContract,
                  ),
                })
              }
            >
              <FileText size={15} />
              Открыть договор
            </Button>
          )}
          {!isAdvertiser && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setContractModal({ contract: null })}
            >
              <Plus size={15} />
              Договор
            </Button>
          )}
        </div>
      )}

      {/* Период выбранного договора: год слева, 12 месяцев */}
      {showMonths && (
        <MonthTabs
          className="mb-4"
          year={activeYear}
          years={years}
          onYearChange={setYear}
          value={activeMonth}
          onChange={setMonth}
          counts={monthCounts}
        />
      )}

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
                showBudget ? GRID_ADMIN : GRID_ADVERTISER,
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className="w-5 shrink-0">№</span>
                Кампания
              </span>
              <span >Статус</span>
              <span >Период</span>
              <span>Номер договора</span>
              {showBudget && (
                <span className="flex justify-center">Бюджет / Прибыль</span>
              )}
              <span>Сроки оплаты</span>
              {showStats && (
                <span className="flex justify-center">Статистика</span>
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
                      showBudget ? GRID_ADMIN : GRID_ADVERTISER,
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="w-5 shrink-0 text-[12px] text-ink-muted tnum">
                        {index + 1}
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
                        pacing={pacing}
                        createdAt={c.createdAt}
                      />
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

                    <div className="hidden min-w-0 md:block">
                      {c.contractNumber ? (
                        <p
                          className="truncate text-[12px] font-medium text-ink-soft tnum"
                          title={`Договор ${c.contractNumber}`}
                        >
                          {c.contractNumber}
                        </p>
                      ) : (
                        <span className="text-sm text-ink-muted" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>

                    {showBudget && (
                      <div className="hidden md:block">
                        <button
                          type="button"
                          disabled={c.status === 'completed'}
                          onClick={(e) =>
                            setMoney({
                              campaign: c,
                              anchor: e.currentTarget.getBoundingClientRect(),
                            })
                          }
                          title={
                            c.status === 'completed'
                              ? 'Завершённую кампанию менять нельзя'
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
                            {c.status !== 'completed' && (
                              <Pencil
                                size={12}
                                aria-hidden="true"
                                className="shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100"
                              />
                            )}
                          </span>
                          <Progress value={pacing} className="mt-1.5" />
                        </button>
                      </div>
                    )}

                    <div className="hidden min-w-0 md:block">
                      {c.paymentDate ? (
                        <p
                          className="flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-ink-soft tnum"
                          title={`Оплата до ${formatDateNumeric(c.paymentDate)}`}
                        >
                          <CalendarClock
                            size={13}
                            className="shrink-0 text-indigo-800"
                            aria-hidden="true"
                          />
                          {formatDateNumeric(c.paymentDate)}
                        </p>
                      ) : (
                        <span className="text-sm text-ink-muted" aria-hidden="true">
                          —
                        </span>
                      )}
                    </div>

                    {showStats && (
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

      <ContractModal
        open={!!contractModal}
        contract={contractModal?.contract ?? null}
        advertiser={contractBrand}
        onClose={() => setContractModal(null)}
      />

      {money && (
        <MoneyPopover
          anchor={money.anchor}
          campaign={money.campaign}
          onSave={saveMoney}
          onClose={() => setMoney(null)}
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
