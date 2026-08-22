import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { LIVE_SPOT_SEED } from '@/lib/liveSpotSeed.js'
import { uid } from '@/lib/id.js'
import { cn } from '@/lib/cn.js'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card.jsx'
import { useAuth } from '@/features/auth/useAuth'
import { useConfirm } from '@/components/ui/Confirm.jsx'
import { useToast } from '@/components/ui/Toast.jsx'

const STORAGE_KEY = 'setanta.campaign.live-spots.v5'
const LEGACY_STORAGE_KEY = 'setanta.campaign.live-spots.v1'
// Предыдущая версия ключа: из неё переносим то, что уже наработали в таблицах.
const PREV_STORAGE_KEY = 'setanta.campaign.live-spots.v4'
// Категории и каналы, которые завёл пользователь: свой набор у каждого договора.
const TABS_STORAGE_KEY = 'setanta.campaign.custom-tabs.v2'

// Постоянные вкладки: сводки по отчёту. Всё остальное собирается руками.
const CAMPAIGN_TABS = [
  { value: 'stats', label: 'Total', group: 'Statistic' },
  { value: 'channels', label: 'Spot', group: 'Statistic' },
]

// Что за таблица открывается на вкладке канала.
export const CHANNEL_KINDS = [
  {
    value: 'plan',
    label: 'Медиаплан',
    hint: 'Расписание прямых эфиров с хронометражом',
  },
  {
    value: 'log',
    label: 'Лог выходов',
    hint: 'Список выходов роликов из отчёта',
  },
  {
    value: 'social',
    label: 'Соцсеть',
    hint: 'Публикации и показы в Instagram или Telegram',
  },
]

// Категории не придумывают и не наполняют вручную: выбирают из готового
// списка, и внутри сразу два своих канала. id каналов совпадают с ключами
// таблиц, поэтому к ним подтягиваются готовые медиапланы и логи.
export const CATEGORY_PRESETS = [
  {
    name: 'Live spot',
    kind: 'plan',
    hint: 'Медиапланы Setanta Sports 1 и 2',
    channels: [
      { id: 'spot1', label: 'Setanta Sports 1' },
      { id: 'spot2', label: 'Setanta Sports 2' },
    ],
  },
  {
    name: 'Standart spot',
    kind: 'log',
    hint: 'Логи выходов SS1 и SS2',
    channels: [
      { id: 'ss1uzb', label: 'SS1' },
      { id: 'ss2uzb', label: 'SS2' },
    ],
  },
  {
    name: 'Event promo',
    kind: 'log',
    hint: 'Логи промо SS1 и SS2',
    channels: [
      { id: 'promo1', label: 'SS1' },
      { id: 'promo2', label: 'SS2' },
    ],
  },
  {
    name: 'Social media',
    kind: 'social',
    hint: 'Отчёты Instagram и Telegram',
    channels: [
      { id: 'social_ig', label: 'Instagram' },
      { id: 'social_tg', label: 'Telegram' },
    ],
  },
  {
    name: 'OTT',
    kind: 'log',
    hint: 'Логи выходов Live spot и Preroll',
    channels: [
      { id: 'ott_live', label: 'Live spot' },
      { id: 'ott_preroll', label: 'Preroll' },
    ],
  },
]

/** Категория с её каналами — из пресета по названию. */
function categoryFromPreset(name, categoryId) {
  const preset = CATEGORY_PRESETS.find((item) => item.name === name)
  if (!preset) return null
  return {
    category: { id: categoryId, name: preset.name },
    channels: preset.channels.map((channel) => ({
      id: channel.id,
      categoryId,
      label: channel.label,
      // У канала может быть свой тип таблицы: в OTT это план и лог.
      kind: channel.kind ?? preset.kind,
    })),
  }
}

/** Набор вкладок из списка категорий — им же собран демо-договор. */
function buildScope(names) {
  return names.reduce(
    (scope, name, index) => {
      const built = categoryFromPreset(name, `cat_${index + 1}`)
      if (!built) return scope
      return {
        categories: [...scope.categories, built.category],
        channels: [...scope.channels, ...built.channels],
      }
    },
    { categories: [], channels: [] },
  )
}

// Договор из демо-данных открывается с прежним набором вкладок.
const DEMO_CATEGORIES = [
  'Live spot',
  'Standart spot',
  'Event promo',
  'Social media',
]

const DEMO_SCOPES = {
  ctr_artel_02: () => buildScope(DEMO_CATEGORIES),
  'Д-2026/102': () => buildScope(DEMO_CATEGORIES),
}

const emptyScope = (scopeId) =>
  DEMO_SCOPES[scopeId]?.() ?? { categories: [], channels: [] }

function loadCustomTabs(scopeId) {
  try {
    const saved = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY) || '{}')
    const scope = saved[scopeId]
    if (!scope) return emptyScope(scopeId)
    return {
      categories: Array.isArray(scope.categories) ? scope.categories : [],
      channels: Array.isArray(scope.channels) ? scope.channels : [],
    }
  } catch {
    return emptyScope(scopeId)
  }
}

function saveCustomTabs(scopeId, scope) {
  try {
    const saved = JSON.parse(localStorage.getItem(TABS_STORAGE_KEY) || '{}')
    localStorage.setItem(
      TABS_STORAGE_KEY,
      JSON.stringify({ ...saved, [scopeId]: scope }),
    )
  } catch {
    // Переполнилось хранилище — состав вкладок останется до перезагрузки.
  }
}

/**
 * Состав вкладок отчёта: постоянные сводки плюс категории и каналы, которые
 * завёл пользователь. Набор свой у каждого договора (scopeId).
 *
 * groups: [{ name, id?, items: [tab] }] — в том числе пустые категории.
 * tabs: плоский список вкладок, чтобы найти открытую.
 */
export function useCampaignTabs(scopeId = 'default') {
  const [scope, setScope] = useState(() => loadCustomTabs(scopeId))

  // Сменили договор — подтягиваем его набор вкладок.
  useEffect(() => {
    setScope(loadCustomTabs(scopeId))
  }, [scopeId])

  const update = (next) => {
    setScope(next)
    saveCustomTabs(scopeId, next)
  }

  const addCategory = (name) => {
    const built = categoryFromPreset(name, uid('cat'))
    if (!built) return null
    update({
      categories: [...scope.categories, built.category],
      channels: [...scope.channels, ...built.channels],
    })
    return { ...built.category, channels: built.channels }
  }

  const removeCategory = (categoryId) =>
    update({
      categories: scope.categories.filter((c) => c.id !== categoryId),
      channels: scope.channels.filter((c) => c.categoryId !== categoryId),
    })

  const customGroups = scope.categories.map((category) => ({
    id: category.id,
    name: category.name,
    items: scope.channels
      .filter((channel) => channel.categoryId === category.id)
      .map((channel) => ({
        value: channel.id,
        label: channel.label,
        kind: channel.kind,
        group: category.name,
        categoryId: category.id,
        custom: true,
      })),
  }))

  const groups = [{ name: 'Statistic', items: CAMPAIGN_TABS }, ...customGroups]

  return {
    groups,
    categories: scope.categories,
    tabs: groups.flatMap((group) => group.items),
    addCategory,
    removeCategory,
  }
}

/** Соседние вкладки с одинаковым group собираем в одну секцию.
 *  Вкладки без группы тоже идут одной секцией — общей сводкой. */

const TABLE_META = {
  spot1: {
    title: 'LIVE SPOT — SETANTA SPORTS 1',
    subtitle: 'Канал S1 · все размещения и расписание прямых эфиров',
  },
  spot2: {
    title: 'LIVE SPOT — SETANTA SPORTS 2',
    subtitle: 'Канал S2 · расписание прямых эфиров',
  },
}

const COLUMNS = [
  { key: 'date', label: 'Дата', className: 'min-w-[112px]' },
  { key: 'time', label: 'Время GMT+4', className: 'min-w-[90px]' },
  {
    key: 'tournament',
    label: 'Турнир',
    className: 'w-[140px] min-w-[140px] max-w-[140px]',
  },
  {
    key: 'event',
    label: 'Событие',
    className: 'w-[240px] min-w-[240px] max-w-[240px]',
  },
  { key: 'channel', label: 'Канал', className: 'min-w-[70px]' },
  { key: 'pre', label: 'Pre', className: 'min-w-[62px]', live: true },
  { key: 'mid1', label: 'Mid 1', className: 'min-w-[62px]', live: true },
  { key: 'mid2', label: 'Mid 2', className: 'min-w-[62px]', live: true },
  { key: 'post', label: 'Post', className: 'min-w-[62px]', live: true },
  { key: 'views', label: 'Просмотры', className: 'min-w-[112px]', live: true },
]

/** Из ячейки достаём число: там строка, иногда с пробелами и запятой. */
const toNumber = (value) => {
  const digits = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  const number = Number(digits)
  return Number.isFinite(number) ? number : 0
}

// Заголовки, которые узнаём в загружаемом файле.
const HEADER_ALIASES = {
  date: ['дата', 'date'],
  time: ['время', 'время gmt+4', 'time'],
  tournament: ['турнир', 'лига', 'tournament', 'league'],
  event: ['событие', 'матч', 'event', 'match'],
  channel: ['канал', 'channel'],
  pre: ['pre', 'пре'],
  mid1: ['mid 1', 'mid1'],
  mid2: ['mid 2', 'mid2'],
  post: ['post', 'пост'],
  views: ['просмотры', 'views'],
}

const pad = (n) => String(n).padStart(2, '0')

/** Ячейку приводим к строке: даты и время Excel отдаёт объектами Date. */
function cellText(value, key) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    return key === 'time'
      ? `${pad(value.getHours())}:${pad(value.getMinutes())}`
      : `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`
  }
  return String(value).trim()
}

/** Ищем строку заголовков; если её нет — читаем колонки по порядку. */
function columnMap(sheet) {
  for (const [index, row] of sheet.slice(0, 5).entries()) {
    const map = {}
    row.forEach((cell, column) => {
      const text = String(cell ?? '')
        .trim()
        .toLowerCase()
      if (!text) return
      const found = Object.entries(HEADER_ALIASES).find(([, aliases]) =>
        aliases.includes(text),
      )
      if (found && map[found[0]] === undefined) map[found[0]] = column
    })
    if (Object.keys(map).length >= 2) return { map, headerIndex: index }
  }
  const map = {}
  COLUMNS.forEach((column, index) => {
    map[column.key] = index
  })
  return { map, headerIndex: -1 }
}

/** Строки таблицы из листа Excel. */
function rowsFromSheet(sheet, tableKey) {
  const { map, headerIndex } = columnMap(sheet)
  const fallbackChannel = tableKey === 'spot2' ? 'S2' : 'S1'

  return sheet
    .slice(headerIndex + 1)
    .map((row) => {
      const value = (key) =>
        map[key] === undefined ? '' : cellText(row[map[key]], key)
      return {
        id: uid('spot'),
        date: value('date'),
        time: value('time'),
        tournament: value('tournament'),
        event: value('event'),
        channel: value('channel') || fallbackChannel,
        pre: value('pre') || '30',
        mid1: value('mid1') || '15',
        mid2: value('mid2') || '15',
        post: value('post') || '30',
        views: value('views'),
      }
    })
    .filter((row) => row.date || row.time || row.tournament || row.event)
}

function cloneSeed(tableKey) {
  return (LIVE_SPOT_SEED[tableKey] ?? []).map((row) => ({ ...row }))
}

function loadRows(tableKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (Array.isArray(saved[tableKey])) return saved[tableKey]

    // Из прошлой версии забираем только непустые таблицы: пустая вторая
    // таблица там означала «сида ещё нет», а теперь он есть.
    const prev = JSON.parse(localStorage.getItem(PREV_STORAGE_KEY) || '{}')
    if (Array.isArray(prev[tableKey]) && prev[tableKey].length) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...saved, [tableKey]: prev[tableKey] }),
      )
      return prev[tableKey]
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}')
    let migratedRows

    if (tableKey === 'spot1') {
      const seedRows = cloneSeed('spot1')
      const campaignRows = Array.isArray(legacy.campaign)
        ? legacy.campaign
        : seedRows.filter((row) => row.id.startsWith('campaign-'))
      const spotRows = Array.isArray(legacy.spot1)
        ? legacy.spot1
        : seedRows.filter((row) => !row.id.startsWith('campaign-'))
      migratedRows = [...campaignRows, ...spotRows]
    } else {
      migratedRows = Array.isArray(legacy[tableKey])
        ? legacy[tableKey]
        : cloneSeed(tableKey)
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...saved, [tableKey]: migratedRows }),
    )
    return migratedRows
  } catch {
    return cloneSeed(tableKey)
  }
}

function persistRows(tableKey, rows) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...saved, [tableKey]: rows }),
    )
  } catch {
    // При переполнении хранилища изменения останутся в текущей сессии.
  }
}

export function CampaignTabs({
  value,
  onChange,
  groups = [],
  onAddCategory,
  onRemoveCategory,
}) {
  const { canEdit, isAdvertiser } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  // Собирать отчёт может только площадка.
  const canAdd = Boolean(onAddCategory) && canEdit && !isAdvertiser
  // Крестики у категорий показываем только в режиме правки — по карандашу.
  const [editing, setEditing] = useState(false)

  const removeCategory = async (group) => {
    const ok = await confirm({
      title: 'Убрать категорию?',
      description: group.name,
      body: 'Вкладки категории исчезнут из отчёта. Загруженные таблицы останутся и вернутся, если добавить категорию снова.',
    })
    if (!ok) return
    onRemoveCategory(group.id)
    toast.info(`Категория «${group.name}» убрана из отчёта`)
  }

  // Убрали последнюю категорию — из режима правки выходим сами.
  useEffect(() => {
    if (editing && !groups.some((group) => group.id)) setEditing(false)
  }, [editing, groups])
  // anchor — прямоугольник кнопки: меню рисуется порталом, лента прокручивается.
  const [anchor, setAnchor] = useState(null)
  const addRef = useRef(null)

  const open = Boolean(anchor)
  const close = () => setAnchor(null)

  // Меню закрываем кликом вне и по Escape.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (addRef.current?.contains(e.target)) return
      if (e.target.closest?.('[data-add-menu]')) return
      close()
    }
    const onKey = (e) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Категории, которых ещё нет в отчёте.
  const freePresets = CATEGORY_PRESETS.filter(
    (preset) => !groups.some((group) => group.name === preset.name),
  )

  const renderTab = (tab) => (
    <button
      key={tab.value}
      type="button"
      onClick={() => onChange(tab.value)}
      className={cn(
        'rounded-xl px-4 h-[29px] text-[13px] font-medium transition-colors focus-ring',
        value === tab.value
          ? 'bg-indigo-500 text-ink shadow-soft'
          : 'text-ink-muted hover:bg-paper hover:text-ink',
      )}
    >
      {tab.label}
    </button>
  )

  const hasCustom = groups.some((group) => group.id)

  const actionButtons = (
    <div className="flex shrink-0 items-center gap-1.5">
      <div ref={addRef}>
        <button
          type="button"
          onClick={(e) =>
            setAnchor(open ? null : e.currentTarget.getBoundingClientRect())
          }
          aria-label="Добавить категорию"
          aria-expanded={open}
          title="Добавить категорию"
          className={cn(
            'flex h-[45px] w-[45px] items-center justify-center rounded-xl bg-indigo-500 text-ink shadow-soft transition-all hover:bg-indigo-400 hover:shadow-pop active:scale-[0.97] focus-ring',
            open && 'bg-indigo-400 shadow-pop',
          )}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Карандаш включает правку: у категорий появляются крестики. */}
      {hasCustom && (
        <button
          type="button"
          onClick={() => setEditing((on) => !on)}
          aria-pressed={editing}
          aria-label={editing ? 'Выйти из режима правки' : 'Править категории'}
          title={editing ? 'Готово' : 'Править категории'}
          className={cn(
            'flex h-[45px] w-[45px] items-center justify-center rounded-xl border transition-colors focus-ring',
            editing
              ? 'border-ink bg-ink text-paper'
              : 'border-line bg-surface text-ink-soft hover:border-indigo-300 hover:text-ink',
          )}
        >
          {editing ? <Check size={18} /> : <Pencil size={16} />}
        </button>
      )}
    </div>
  )

  const addMenu =
    open &&
    createPortal(
      <div
        data-add-menu
        style={{
          left: Math.min(anchor.left, window.innerWidth - 288),
          top: anchor.bottom + 8,
        }}
        className="fixed z-50 w-72 rounded-2xl border border-line bg-surface p-4 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Добавить категорию
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="shrink-0 rounded-lg p-1 text-ink-muted transition-colors hover:bg-ink/[0.06] hover:text-ink focus-ring"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mt-3 grid gap-1.5">
          {freePresets.length ? (
            freePresets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  close()
                  onAddCategory(preset.name)
                }}
                className="rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50 focus-ring"
              >
                <span className="block text-[13px] font-medium text-ink">
                  {preset.name}
                </span>
                <span className="block text-[11px] text-ink-muted">
                  {preset.hint}
                </span>
              </button>
            ))
          ) : (
            <p className="rounded-xl bg-paper/70 px-3 py-3 text-center text-[12px] text-ink-muted">
              Все категории уже добавлены.
            </p>
          )}
        </div>
      </div>,
      document.body,
    )

  return (
    <div className="mb-4 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
      <div className="flex min-w-max items-center gap-1.5">
        {groups.map((group, index) => {
          // Группа с открытой вкладкой подсвечивается целиком — сразу видно,
          // в каком блоке находишься.
          const opened = group.items.some((tab) => tab.value === value)
          return (
            <Fragment key={group.id ?? group.name}>
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-xl border p-2 transition-colors',
                  opened
                    ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_3px_rgba(255,209,6,0.28)]'
                    : 'border-ink/15 bg-paper',
                )}
              >
                {/* Название категории — тёмной плашкой: активная вкладка
                    жёлтая, поэтому группу метим контрастом, а не цветом. */}
                <span className="whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-paper">
                  {group.name}
                </span>
                {group.items.map(renderTab)}
                {/* В режиме правки свои категории можно убрать —
                    постоянная Statistic остаётся. */}
                {canAdd && editing && group.id && (
                  <button
                    type="button"
                    onClick={() => removeCategory(group)}
                    aria-label={`Убрать категорию ${group.name}`}
                    title="Убрать категорию"
                    className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger transition-colors hover:bg-danger hover:text-white focus-ring"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {canAdd && index === 0 && actionButtons}
            </Fragment>
          )
        })}
      </div>
      {addMenu}
    </div>
  )
}

export function EditableSpotTable({ tableKey, title, subtitle }) {
  const { isAdvertiser, isViewer, canEdit } = useAuth()
  // Рекламодателю и наблюдателю таблица доступна только на просмотр.
  const readOnly = isAdvertiser || !canEdit
  const toast = useToast()
  const [rows, setRows] = useState(() => loadRows(tableKey))
  const [pendingScrollRowId, setPendingScrollRowId] = useState(null)
  const [highlightedRowId, setHighlightedRowId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saveState, setSaveState] = useState('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef(null)
  const rowRefs = useRef(new Map())
  const originalRowsRef = useRef(null)
  const saveFeedbackTimeoutRef = useRef(null)
  // У добавленных вкладок своей записи в TABLE_META нет — подписи приходят
  // из самой вкладки.
  const meta = TABLE_META[tableKey] ?? {
    title: title ?? 'LIVE SPOT',
    subtitle: subtitle ?? 'Медиаплан канала',
  }

  useEffect(() => {
    if (!pendingScrollRowId) return

    const frame = requestAnimationFrame(() => {
      const row = rowRefs.current.get(pendingScrollRowId)
      if (!row) return
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedRowId(pendingScrollRowId)
      setPendingScrollRowId(null)
    })

    return () => cancelAnimationFrame(frame)
  }, [pendingScrollRowId, rows])

  useEffect(() => {
    if (!highlightedRowId) return
    const timeout = window.setTimeout(() => setHighlightedRowId(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [highlightedRowId])

  useEffect(() => () => window.clearTimeout(saveFeedbackTimeoutRef.current), [])

  const commit = (nextRows) => {
    setRows(nextRows)
    setIsDirty(true)
    setSaveState('idle')
  }

  const updateCell = (rowId, field, value) => {
    commit(
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    )
  }

  const createRow = () => {
    const channel = tableKey === 'spot2' ? 'S2' : 'S1'
    return {
      id: uid('spot'),
      date: '',
      time: '',
      tournament: '',
      event: '',
      channel,
      pre: '30',
      mid1: '15',
      mid2: '15',
      post: '30',
      views: '',
    }
  }

  const addRow = () => {
    const newRow = createRow()
    commit([...rows, newRow])
    setPendingScrollRowId(newRow.id)
  }

  const insertRowAfter = (rowIndex) => {
    const newRow = createRow()
    const nextRows = [...rows]
    nextRows.splice(rowIndex + 1, 0, newRow)
    commit(nextRows)
    setPendingScrollRowId(newRow.id)
  }

  const beginEditing = () => {
    originalRowsRef.current = rows.map((row) => ({ ...row }))
    setIsEditing(true)
    setSaveState('idle')
  }

  const cancelEditing = () => {
    if (originalRowsRef.current) {
      setRows(originalRowsRef.current.map((row) => ({ ...row })))
    }
    originalRowsRef.current = null
    setIsEditing(false)
    setIsDirty(false)
    setSaveState('idle')
  }

  const showSavedState = () => {
    window.clearTimeout(saveFeedbackTimeoutRef.current)
    setSaveState('saved')
    saveFeedbackTimeoutRef.current = window.setTimeout(
      () => setSaveState('idle'),
      1800,
    )
  }

  const saveChanges = () => {
    persistRows(tableKey, rows)
    originalRowsRef.current = null
    setIsEditing(false)
    setIsDirty(false)
    showSavedState()
  }

  const removeRow = (rowId) => {
    commit(rows.filter((row) => row.id !== rowId))
  }

  /** Excel из проводника: читаем лист и подставляем строки в таблицу. */
  const importFile = async (file) => {
    if (!file) return
    if (!/\.xlsx$/i.test(file.name)) {
      toast.error('Нужен файл .xlsx')
      return
    }
    setIsImporting(true)
    try {
      // Парсер тянем только когда он реально нужен.
      const { parseXlsx } = await import('@/lib/xlsx.js')
      const sheet = await parseXlsx(file)
      const imported = rowsFromSheet(sheet, tableKey)
      if (!imported.length) {
        toast.error('В файле не нашлось строк с данными')
        return
      }
      if (!isEditing) originalRowsRef.current = rows.map((row) => ({ ...row }))
      setRows(imported)
      setIsEditing(true)
      setIsDirty(true)
      setSaveState('idle')
      toast.success(`Загружено строк: ${imported.length}`)
    } catch {
      toast.error('Не удалось прочитать файл')
    } finally {
      setIsImporting(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (readOnly) return
    importFile(e.dataTransfer.files?.[0])
  }

  // Наблюдателю просмотры не показываем — колонки нет ни в таблице,
  // ни в итогах, ни в выгрузке.
  const columns = isViewer
    ? COLUMNS.filter((column) => column.key !== 'views')
    : COLUMNS
  const sumColumns = columns.filter((column) => column.live)

  /** Выгрузка текущего медиаплана в .xlsx. */
  const download = async () => {
    const { buildXlsx, downloadBlob } = await import('@/lib/xlsx.js')
    const blob = buildXlsx({
      sheetName: tableKey === 'spot2' ? 'Live spot S2' : 'Live spot S1',
      rows: [
        columns.map((column) => column.label),
        ...rows.map((row) => columns.map((column) => row[column.key])),
      ],
    })
    downloadBlob(blob, `${meta.title}.xlsx`)
  }

  const onDragOver = (e) => {
    if (readOnly) return
    e.preventDefault()
    setIsDragging(true)
  }

  // Секундные колонки — всё, кроме просмотров: их сумма идёт отдельной строкой.
  const secondColumns = sumColumns.filter((column) => column.key !== 'views')

  // Итоги по числовым колонкам — считаем по текущим строкам.
  const totals = sumColumns.reduce((acc, column) => {
    acc[column.key] = rows.reduce(
      (sum, row) => sum + toNumber(row[column.key]),
      0,
    )
    return acc
  }, {})

  return (
    <Card
      className="relative overflow-hidden"
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false)
      }}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          importFile(file)
        }}
      />
      {isDragging && !readOnly && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/85 backdrop-blur-[1px]">
          <p className="flex items-center gap-2 text-sm font-medium text-indigo-900">
            <FileSpreadsheet size={18} />
            Отпустите файл — заполним таблицу
          </p>
        </div>
      )}
      <div className="flex flex-col gap-4 border-b border-line bg-gradient-to-br from-surface via-indigo-50 to-indigo-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-800">
            Media plan
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink">
            {meta.title}
          </h3>
          <p className="mt-1 text-[13px] text-ink-muted">{meta.subtitle}</p>
        </div>
        {/* Рекламодатель и наблюдатель видят медиаплан только для чтения,
            но выгрузка отчёта доступна наблюдателю — это не правка. */}
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={isEditing ? cancelEditing : beginEditing}
              >
                {isEditing ? <X size={15} /> : <Settings2 size={15} />}
                {isEditing ? 'Отменить' : 'Редактировать'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                <Upload size={15} />
                {isImporting ? 'Загружаем…' : 'Импорт Excel'}
              </Button>
            </>
          )}
          {(!readOnly || isViewer) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={download}
              disabled={!rows.length}
            >
              <Download size={15} />
              Скачать
            </Button>
          )}
          {!readOnly && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={addRow}
                disabled={!isEditing}
              >
                <Plus size={15} />
                Добавить строку
              </Button>
              <Button
                size="sm"
                onClick={saveChanges}
                disabled={!isEditing || !isDirty}
              >
                {saveState === 'saved' ? (
                  <Check size={15} />
                ) : (
                  <Save size={15} />
                )}
                {saveState === 'saved'
                  ? 'Изменения сохранены'
                  : 'Сохранить изменения'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full border-collapse text-sm',
            isEditing ? 'min-w-[1090px]' : 'min-w-[998px]',
          )}
        >
          <thead>
            <tr className="bg-indigo-500 text-[11px] font-semibold uppercase tracking-wider text-ink">
              <th className="w-12 px-2 py-3 text-center">№</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'border-l border-black/10 px-2 py-3 text-left',
                    column.className,
                    column.live && 'bg-[#ff665f]/90 text-center',
                  )}
                >
                  {column.label}
                </th>
              ))}
              {isEditing && (
                <th className="sticky right-0 z-20 w-[92px] min-w-[92px] border-l border-black/10 bg-indigo-500 px-2 py-3 text-center shadow-[-8px_0_16px_rgba(22,22,28,0.08)]">
                  Действия
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!rows.length && (
              <tr>
                <td
                  colSpan={columns.length + (isEditing ? 2 : 1)}
                  className="px-4 py-12 text-center"
                >
                  <FileSpreadsheet
                    size={26}
                    className="mx-auto text-ink-muted"
                  />
                  <p className="mt-3 text-sm font-medium text-ink-soft">
                    Таблица пустая
                  </p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {readOnly
                      ? 'Размещения появятся после загрузки медиаплана.'
                      : 'Перетащите сюда файл .xlsx — строки подставятся автоматически.'}
                  </p>
                </td>
              </tr>
            )}
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                ref={(node) => {
                  if (node) rowRefs.current.set(row.id, node)
                  else rowRefs.current.delete(row.id)
                }}
                className={cn(
                  'group transition-all duration-500 hover:bg-paper/70',
                  highlightedRowId === row.id &&
                    'bg-indigo-100 shadow-[inset_4px_0_0_#FFD106]',
                )}
              >
                <td className="relative px-2 py-1.5 text-center text-[11px] text-ink-muted tnum">
                  {rowIndex + 1}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => insertRowAfter(rowIndex)}
                      aria-label={`Добавить строку после ${rowIndex + 1}`}
                      title={`Добавить строку после ${rowIndex + 1}`}
                      className="absolute -bottom-3 left-1/2 z-20 inline-flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-surface bg-indigo-500 text-ink opacity-0 shadow-soft transition-all hover:scale-110 group-hover:opacity-100 focus:opacity-100 focus-ring"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'border-l border-line px-1.5 py-1',
                      column.live && 'bg-danger/[0.045]',
                    )}
                  >
                    <input
                      value={row[column.key]}
                      readOnly={!isEditing}
                      onChange={(event) =>
                        updateCell(row.id, column.key, event.target.value)
                      }
                      aria-label={`${column.label}, строка ${rowIndex + 1}`}
                      className={cn(
                        'h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[12px] text-ink outline-none transition-colors',
                        isEditing
                          ? 'hover:border-line hover:bg-surface focus:border-indigo-400 focus:bg-surface focus:ring-2 focus:ring-indigo-200'
                          : 'cursor-default',
                        column.live && 'text-center font-semibold tnum',
                      )}
                    />
                  </td>
                ))}
                {isEditing && (
                  <td
                    className={cn(
                      'sticky right-0 z-10 w-[92px] min-w-[92px] border-l border-line bg-surface px-2 py-1 text-center shadow-[-8px_0_16px_rgba(22,22,28,0.05)] transition-colors group-hover:bg-paper',
                      highlightedRowId === row.id && 'bg-indigo-100',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Удалить строку ${rowIndex + 1}`}
                      title="Удалить"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger opacity-60 transition hover:bg-danger hover:text-white group-hover:opacity-100 focus:opacity-100 focus-ring"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-paper/70 font-semibold text-ink">
              <td colSpan={6} className="px-4 py-3 text-right text-[12px]">
                Итого: {rows.length} спотов · {rows.length * 4} вставок
              </td>
              {/* Под каждой числовой колонкой — её сумма. */}
              {sumColumns.map((column) => (
                <td
                  key={column.key}
                  className="border-l border-line px-2 py-3 text-center tnum"
                >
                  {totals[column.key].toLocaleString('ru-RU')}
                  {/* Просмотры — не хронометраж, подписываем отдельно. */}
                  {column.key === 'views' && (
                    <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                      Итого просмотров
                    </span>
                  )}
                </td>
              ))}
              {isEditing && <td />}
            </tr>

            {/* Хронометраж целиком: Pre + Mid 1 + Mid 2 + Post.
                Значение встаёт под итогом просмотров — правой колонкой. */}
            <tr className="border-t border-line bg-paper/70 font-semibold text-ink">
              {/* Подпись занимает те же шесть ячеек, что и строка «Итого». */}
              <td colSpan={6} className="px-4 py-3 text-right text-[12px]">
                Итоговая сумма секунд
              </td>
              {/* Пустое место между подписью и суммой — без разделителя. */}
              <td colSpan={secondColumns.length} />
              <td className="border-l border-line px-2 py-3 text-center tnum">
                {secondColumns
                  .reduce((sum, column) => sum + totals[column.key], 0)
                  .toLocaleString('ru-RU')}
                <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                  Сумма, сек.
                </span>
              </td>
              {isEditing && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
